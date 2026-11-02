import { TestBed } from '@angular/core/testing';
import { MockData } from '../../core/mock-data';
import { chartWindow } from './chart-window';

describe('chartWindow', () => {
  const details = () => TestBed.inject(MockData).details('hanoi')!;
  const HOUR = 3_600_000;

  it('shows as much history as forecast', () => {
    const d = details();
    const lastObservation = Date.parse(d.history[d.history.length - 1].time);

    for (const hours of [6, 12, 24, 30]) {
      const w = chartWindow(d, hours);
      expect(w.forecast.length).toBe(hours);
      expect(w.start).toBe(lastObservation - hours * HOUR);
      // one point per hour, the last observation included
      expect(w.history.length).toBe(hours + 1);
      expect(Date.parse(w.history[0].time)).toBe(w.start);
    }
  });

  it('zooms in as the horizon gets shorter', () => {
    const d = details();
    const span = (hours: number) => {
      const w = chartWindow(d, hours);
      return Date.parse(w.forecast[w.forecast.length - 1].time) - w.start;
    };
    expect(span(6)).toBeLessThan(span(12));
    expect(span(12)).toBeLessThan(span(24));
    expect(span(24)).toBeLessThan(span(30));
  });
});
