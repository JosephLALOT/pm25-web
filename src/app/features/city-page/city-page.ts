import { Component, computed, inject, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MockData } from '../../core/mock-data';
import { categoryOf } from '../../core/models';

@Component({
  imports: [RouterLink, RouterLinkActive, DecimalPipe, DatePipe],
  selector: 'app-city-page',
  styleUrl: './city-page.scss',
  templateUrl: './city-page.html',
})
export class CityPage {
  private data = inject(MockData);

  // rempli par le router : /city/hanoi → id() === 'hanoi'
  readonly id = input.required<string>();

  readonly cities = this.data.cities;
  readonly updatedAt = this.data.updatedAt;

  readonly city = computed(() => this.data.city(this.id()));
  readonly details = computed(() => this.data.details(this.id()));
  readonly category = computed(() => {
    const c = this.city();
    return c ? categoryOf(c.pm25) : undefined;
  });

  // moyenne / min / max des 24 dernières heures
  readonly last24 = computed(() => {
    const values = (this.details()?.history ?? []).slice(-24).map(p => p.pm25);
    if (values.length === 0) return undefined;
    const sum = values.reduce((total, v) => total + v, 0);
    return { avg: sum / values.length, min: Math.min(...values), max: Math.max(...values) };
  });

  // les 24 prochaines heures de prévision
  readonly next24 = computed(() => (this.details()?.forecast ?? []).slice(0, 24));

  // l'heure où la prévision est la plus haute
  readonly peak = computed(() => {
    const points = this.next24();
    if (points.length === 0) return undefined;
    const top = points.reduce((best, p) => (p.model > best.model ? p : best));
    return { value: top.model, time: top.time, cat: categoryOf(top.model) };
  });

  // nombre d'heures au-dessus du seuil « sensible » (35.4)
  readonly hoursAbove = computed(() => this.next24().filter(p => p.model > 35.4).length);
}