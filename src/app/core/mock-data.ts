import { Injectable, signal } from '@angular/core';
import { City, CityDetails, FORECAST_HOURS, ForecastPoint, HistoryPoint ,ModelInfo } from './models';

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

// 72 past hours, the last one being the last observation (lagHours before NOW).
// e.g. { time: '2026-11-01T00:00:00.000Z', pm25: 48.2 }
function makeHistory(current: number, seed: number, lagHours = 0): HistoryPoint[] {
  return Array.from({ length: 72 }, (_, k) => {
    const h = k - 71 - lagHours;
    return { time: hoursFrom(h), pm25: k === 71 ? current : wave(current, k, seed) };
  });
}

// h+1 → h+30 after NOW. e.g. { time: '…', model: 51.0, cams: 47.2 }
function makeForecast(current: number, seed: number): ForecastPoint[] {
  return Array.from({ length: FORECAST_HOURS }, (_, k) => ({
    time: hoursFrom(k + 1),
    model: wave(current, 72 + k, seed),
    cams: wave(current * 0.95, 72 + k, seed + 2),
  }));
}

@Injectable({ providedIn: 'root' })
export class MockData {
  readonly updatedAt = '07:00'; // e.g. '07:00'

    // e.g. { version: '1.0.0', trainedOn: '2026-10-12', maeModel: 6.1, maeCams: 8.4 }
  readonly modelInfo: ModelInfo = { version: '1.0.0', trainedOn: '2026-10-12', maeModel: 6.1, maeCams: 8.4 };

  // One entry per station. The observation values are hard-coded until the API is connected.
  // e.g. { id: 'hanoi', name: 'Hanoi', station: 'Hanoi', country: 'Vietnam', lat: 21.03, lon: 105.85, group: 'vietnam',
  //        pm25: 48.2, observationTimestamp: '2026-11-01T00:00:00.000Z', dataFreshness: 'fresh' }
  readonly cities = signal<City[]>([
    { id: 'hanoi',     name: 'Hanoi',     station: 'Hanoi',                                  country: 'Vietnam',   lat: 21.03, lon: 105.85, group: 'vietnam', pm25: 48.2, observationTimestamp: hoursFrom(0),  dataFreshness: 'fresh' },
    { id: 'bangkok',   name: 'Bangkok',   station: 'The Government Public Relations Department', country: 'Thailand',  lat: 13.76, lon: 100.50, group: 'other',   pm25: 38.7, observationTimestamp: hoursFrom(0),  dataFreshness: 'fresh' },
    { id: 'jakarta',   name: 'Jakarta',   station: 'Jakarta Central',                        country: 'Indonesia', lat: -6.18, lon: 106.83, group: 'other',   pm25: 72.4, observationTimestamp: hoursFrom(0),  dataFreshness: 'fresh' },
    { id: 'vientiane', name: 'Vientiane', station: 'Vientiane',                              country: 'Laos',      lat: 17.97, lon: 102.63, group: 'other',   pm25: 61.3, observationTimestamp: hoursFrom(0),  dataFreshness: 'fresh' },
    { id: 'yangon',    name: 'Yangon',    station: 'Rangoon',                                country: 'Myanmar',   lat: 16.84, lon: 96.17,  group: 'other',   pm25: 21.6, observationTimestamp: hoursFrom(-3), dataFreshness: 'stale' },
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
    bangkok: {
      usAqi: 109,
      modelVersion: '1.0.0',
      advice: 'Sensitive groups: limit outdoor activity.',
      weather: { condition: 'Cloudy', temperature: 32, humidity: 70, windKmh: 8, windDir: 'SW' },
      history: makeHistory(38.7, 6),
      forecast: makeForecast(38.7, 6),
    },
    jakarta: {
      usAqi: 163,
      modelVersion: '1.0.0',
      advice: 'Everyone: limit outdoor activity.',
      weather: { condition: 'Cloudy', temperature: 30, humidity: 75, windKmh: 7, windDir: 'E' },
      history: makeHistory(72.4, 9),
      forecast: makeForecast(72.4, 9),
    },
    vientiane: {
      usAqi: 154,
      modelVersion: '1.0.0',
      advice: 'Everyone: limit outdoor activity.',
      weather: { condition: 'Cloudy', temperature: 29, humidity: 65, windKmh: 4, windDir: 'S' },
      history: makeHistory(61.3, 3),
      forecast: makeForecast(61.3, 3),
    },
    yangon: {
      usAqi: 74,
      modelVersion: '1.0.0',
      advice: 'Air quality is acceptable.',
      weather: { condition: 'Sunny', temperature: 31, humidity: 60, windKmh: 5, windDir: 'S' },
      history: makeHistory(21.6, 12, 3), // last observation is 3 h old (stale)
      forecast: makeForecast(21.6, 12),
    },
  };

  // e.g. city('hanoi') → { id: 'hanoi', name: 'Hanoi', … }   city('paris') → undefined
  city(id: string): City | undefined {
    return this.cities().find(c => c.id === id);
  }

  // e.g. details('hanoi') → { usAqi: 132, advice: '…', weather: {…}, history: [72], forecast: [30] }
  details(id: string): CityDetails | undefined {
    return this.detailsById[id];
  }
}
