import { TestBed } from '@angular/core/testing';
import { MockData } from './mock-data';
import { FORECAST_HOURS } from './models';

describe('MockData', () => {
  let data: MockData;

  beforeEach(() => {
    data = TestBed.inject(MockData);
  });

  it('tracks the five stations', () => {
    const stations = data.cities().map(c => [c.name, c.station]);
    expect(stations).toEqual([
      ['Hanoi', 'Hanoi'],
      ['Bangkok', 'The Government Public Relations Department'],
      ['Jakarta', 'Jakarta Central'],
      ['Vientiane', 'Vientiane'],
      ['Yangon', 'Rangoon'],
    ]);
  });

  it('gives every station an observation timestamp and a freshness', () => {
    for (const c of data.cities()) {
      expect(Number.isNaN(Date.parse(c.observationTimestamp))).toBe(false);
      expect(['fresh', 'stale']).toContain(c.dataFreshness);
    }
  });

  it('forecasts h+1 to h+30, hour by hour, without an uncertainty range', () => {
    for (const c of data.cities()) {
      const { forecast, history } = data.details(c.id)!;
      expect(forecast.length).toBe(FORECAST_HOURS);
      expect(FORECAST_HOURS).toBe(30);

      const lastRun = Date.parse(forecast[0].time) - 3_600_000;
      forecast.forEach((p, k) => expect(Date.parse(p.time)).toBe(lastRun + (k + 1) * 3_600_000));
      expect(Object.keys(forecast[0]).sort()).toEqual(['cams', 'model', 'time']);

      // the history ends with the latest observation
      expect(history[history.length - 1].time).toBe(c.observationTimestamp);
      expect(history[history.length - 1].pm25).toBe(c.pm25);
    }
  });
});
