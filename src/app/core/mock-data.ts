import { Injectable, signal } from '@angular/core';
import { City, CityDetails, ForecastPoint, HistoryPoint } from './models';

// Mock "now": Nov 1st 2026, 07:00 Hanoi time
const NOW = new Date('2026-11-01T07:00:00+07:00');

// ISO date of NOW + h hours. e.g. hoursFrom(-1) → '2026-10-31T23:00:00.000Z'
function hoursFrom(h: number): string {
  return new Date(NOW.getTime() + h * 3_600_000).toISOString();
}

// Value oscillating around base, never below 1. e.g. wave(48.2, 5, 0) → 56.6
function wave(base: number, i: number, seed: number): number {
  const v = base + 8 * Math.sin((i + seed) / 4) + 4 * Math.sin((i + seed) / 1.7);
  return Math.max(1, Math.round(v * 10) / 10);
}

// 72 past hours (-71 h → 0 h). e.g. { time: '2026-11-01T00:00:00.000Z', pm25: 48.2 }
function makeHistory(current: number, seed: number): HistoryPoint[] {
  return Array.from({ length: 72 }, (_, k) => {
    const h = k - 71;
    return { time: hoursFrom(h), pm25: h === 0 ? current : wave(current, k, seed) };
  });
}

// 168 next hours (+1 h → +7 days). e.g. { time: '…', model: 51.0, lower: 48.9, upper: 53.1, cams: 47.2 }
function makeForecast(current: number, seed: number): ForecastPoint[] {
  return Array.from({ length: 168 }, (_, k) => {
    const h = k + 1;
    const model = wave(current, 72 + k, seed);
    const spread = 2 + h * 0.08; // uncertainty grows with time
    return {
      time: hoursFrom(h),
      model,
      lower: Math.max(0, Math.round((model - spread) * 10) / 10),
      upper: Math.round((model + spread) * 10) / 10,
      cams: wave(current * 0.95, 72 + k, seed + 2),
    };
  });
}

@Injectable({ providedIn: 'root' })
export class MockData {
  readonly updatedAt = '07:00'; // e.g. '07:00'

  // e.g. { id: 'hanoi', name: 'Hanoi', country: 'Vietnam', lat: 21.03, lon: 105.85, group: 'vietnam', pm25: 48.2 }
  readonly cities = signal<City[]>([
    { id: 'hanoi',        name: 'Hanoi',        country: 'Vietnam',  lat: 21.03, lon: 105.85, group: 'vietnam', pm25: 48.2 },
    { id: 'vientiane',    name: 'Vientiane',    country: 'Laos',     lat: 17.97, lon: 102.63, group: 'other',   pm25: 61.3 },
    { id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.14,  lon: 101.69, group: 'other',   pm25: 14.5 },
  ]);

  private readonly detailsById: Record<string, CityDetails> = {
    hanoi: {
      usAqi: 132,                                    // e.g. 132
      modelVersion: '1.0.0',                         // e.g. '1.0.0'
      advice: 'Sensitive groups: limit outdoor activity.',
      weather: { condition: 'Sunny', temperature: 27, humidity: 78, windKmh: 6, windDir: 'NE' },
      history: makeHistory(48.2, 0),
      forecast: makeForecast(48.2, 0),
    },
    vientiane: {
      usAqi: 154,
      modelVersion: '1.0.0',
      advice: 'Everyone: limit outdoor activity.',
      weather: { condition: 'Cloudy', temperature: 29, humidity: 65, windKmh: 4, windDir: 'S' },
      history: makeHistory(61.3, 3),
      forecast: makeForecast(61.3, 3),
    },
    'kuala-lumpur': {
      usAqi: 56,
      modelVersion: '1.0.0',
      advice: 'Air quality is acceptable.',
      weather: { condition: 'Rainy', temperature: 31, humidity: 84, windKmh: 9, windDir: 'SW' },
      history: makeHistory(14.5, 6),
      forecast: makeForecast(14.5, 6),
    },
  };

  // e.g. city('hanoi') → { id: 'hanoi', name: 'Hanoi', … }   city('paris') → undefined
  city(id: string): City | undefined {
    return this.cities().find(c => c.id === id);
  }

  // e.g. details('hanoi') → { usAqi: 132, advice: '…', weather: {…}, history: [72], forecast: [168] }
  details(id: string): CityDetails | undefined {
    return this.detailsById[id];
  }
}
