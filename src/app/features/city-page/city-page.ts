import { Component, DestroyRef, ElementRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import * as echarts from 'echarts';
import { MockData } from '../../core/mock-data';
import { CATEGORIES, CityDetails, categoryOf } from '../../core/models';

@Component({
  imports: [RouterLink, RouterLinkActive, DecimalPipe, DatePipe],
  selector: 'app-city-page',
  styleUrl: './city-page.scss',
  templateUrl: './city-page.html',
})
export class CityPage {
  private data = inject(MockData);

  // filled by the router: /city/hanoi → id() === 'hanoi'
  readonly id = input.required<string>();

  readonly cities = this.data.cities;
  readonly updatedAt = this.data.updatedAt;

  readonly city = computed(() => this.data.city(this.id()));
  readonly details = computed(() => this.data.details(this.id()));
  readonly category = computed(() => {
    const c = this.city();
    return c ? categoryOf(c.pm25) : undefined;
  });

  readonly last24 = computed(() => {
    const values = (this.details()?.history ?? []).slice(-24).map(p => p.pm25);
    if (values.length === 0) return undefined;
    const sum = values.reduce((total, v) => total + v, 0);
    return { avg: sum / values.length, min: Math.min(...values), max: Math.max(...values) };
  });

  readonly next24 = computed(() => (this.details()?.forecast ?? []).slice(0, 24));

  readonly peak = computed(() => {
    const points = this.next24();
    if (points.length === 0) return undefined;
    const top = points.reduce((best, p) => (p.model > best.model ? p : best));
    return { value: top.model, time: top.time, cat: categoryOf(top.model) };
  });

  readonly hoursAbove = computed(() => this.next24().filter(p => p.model > 35.4).length);

  // ---------------------------------------------------------------- NEW: chart

  // horizon buttons. e.g. { hours: 72, label: '72 h' }
  readonly horizons = [
    { hours: 24, label: '24 h' },
    { hours: 72, label: '72 h' },
    { hours: 168, label: '7 days' },
  ];
  readonly horizon = signal(24); // selected horizon, in hours

  // the <div #chart> of the HTML (may not exist if the city is unknown)
  private chartEl = viewChild<ElementRef<HTMLDivElement>>('chart');
  private chart?: echarts.ECharts;

  constructor() {
    // redraw every time the div, the city or the horizon changes
    effect(() => {
      const el = this.chartEl()?.nativeElement;
      const d = this.details();
      const hours = this.horizon();
      if (!el || !d) return;

      // the div changed (e.g. after a "not found" page): start over
      if (this.chart && this.chart.getDom() !== el) {
        this.chart.dispose();
        this.chart = undefined;
      }
      this.chart ??= echarts.init(el);
      this.chart.setOption(this.buildOption(d, hours), true);
    });

    // follow the window size, and clean up when leaving the page
    const onResize = () => this.chart?.resize();
    window.addEventListener('resize', onResize);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('resize', onResize);
      this.chart?.dispose();
    });
  }

  private buildOption(d: CityDetails, hours: number): echarts.EChartsOption {
    // colors from the CSS variables, so the chart follows light / dark mode
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue('--ink').trim();
    const muted = css.getPropertyValue('--muted').trim();
    const line = css.getPropertyValue('--line').trim();

    const forecast = d.forecast.slice(0, hours);
    const now = d.history[d.history.length - 1].time;

    // [time, value] pairs, the format ECharts expects on a time axis
    const measured = d.history.map(p => [p.time, p.pm25]);
    const model = forecast.map(p => [p.time, p.model]);
    const cams = forecast.map(p => [p.time, p.cams]);
    const lower = forecast.map(p => [p.time, p.lower]);
    const range = forecast.map(p => [p.time, Math.round((p.upper - p.lower) * 10) / 10]);

    // top of the y axis: highest value + 15 %, rounded to 10
    const top = Math.max(...d.history.map(p => p.pm25), ...forecast.map(p => p.upper));
    const yMax = Math.ceil((top * 1.15) / 10) * 10;

    return {
      animation: false,
      grid: { left: 48, right: 16, top: 24, bottom: 56 },
      xAxis: {
        type: 'time',
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: line } },
      },
      yAxis: {
        type: 'value',
        name: 'µg/m³',
        max: yMax,
        nameTextStyle: { color: muted },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: line } },
      },
      legend: {
        bottom: 0,
        data: ['Measured', 'Our model', 'Model range', 'CAMS forecast'],
        textStyle: { color: ink },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const list = Array.isArray(params) ? params : [params];
          const time = list[0].value[0] as string;
          const lines = list
            .filter(p => p.seriesName !== 'lower' && p.seriesName !== 'Model range')
            .map(p => `${p.marker} ${p.seriesName}: <b>${p.value[1]}</b> µg/m³`);
          const f = forecast.find(x => x.time === time);
          if (f) lines.push(`Range: ${f.lower} – ${f.upper} µg/m³`);
          const label = new Date(time).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
          return [`<b>${label}</b>`, ...lines].join('<br>');
        },
      },
      series: [
        {
          name: 'Measured',
          type: 'line',
          data: measured,
          showSymbol: false,
          lineStyle: { width: 2.5, color: ink },
          itemStyle: { color: ink },
          // vertical "now" line
          markLine: {
            symbol: 'none',
            label: { formatter: 'now', color: ink },
            lineStyle: { color: ink, type: 'solid' },
            data: [{ xAxis: now }],
          },
          // category bands in the background
          markArea: {
            silent: true,
            data: CATEGORIES
              .map((c, i) => ({ from: i === 0 ? 0 : CATEGORIES[i - 1].max, to: Math.min(c.max, yMax), color: c.color }))
              .filter(b => b.from < yMax) // only the bands visible on the chart
              .map(b => [
                { yAxis: b.from, itemStyle: { color: b.color, opacity: 0.08 } },
                { yAxis: b.to },
              ]) as any,
          },
        },
        // uncertainty band = an invisible "lower" line + the height of the band stacked on top
        {
          name: 'lower',
          type: 'line',
          data: lower,
          stack: 'band',
          showSymbol: false,
          lineStyle: { opacity: 0 },
        },
        {
          name: 'Model range',
          type: 'line',
          data: range,
          stack: 'band',
          showSymbol: false,
          lineStyle: { opacity: 0 },
          areaStyle: { color: muted, opacity: 0.25 },
          itemStyle: { color: muted },
        },
        {
          name: 'Our model',
          type: 'line',
          data: model,
          showSymbol: false,
          lineStyle: { width: 2.5, type: 'dashed', color: ink },
          itemStyle: { color: ink },
        },
        {
          name: 'CAMS forecast',
          type: 'line',
          data: cams,
          showSymbol: false,
          lineStyle: { width: 2, type: 'dotted', color: muted },
          itemStyle: { color: muted },
        },
      ],
    };
  }
}