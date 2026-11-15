import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import { City, CityDetails, ModelInfo, Weather } from './models';

// ---- API responses (snake_case, see pm25-platform ARCHITECTURE.md section 10)

interface ApiCity {
  slug: string;
  name: string;
  country: string; // ISO code, e.g. 'VN'
  latitude: number;
  longitude: number;
}

interface ApiOverview {
  items: (ApiCity & { time: string | null; pm2_5: number | null; stale: boolean })[];
}

interface ApiCurrent {
  us_aqi: number | null;
  advice: string | null;
  weather: {
    temperature_2m: number | null;
    relative_humidity_2m: number | null;
    wind_speed_10m: number | null;
    wind_direction_10m: number | null;
    weather_code: number | null;
  } | null;
}

interface ApiHistory {
  points: { time: string; pm2_5: number | null }[];
}

// Same public surface as MockData, filled from the API (pm25-platform).
// The forecast and the model info come from the forecasts module, not built yet:
// until then, forecast is empty and modelInfo keeps its placeholder values.
@Injectable({ providedIn: 'root' })
export class ApiData {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  readonly cities = signal<City[]>([]);
  updatedAt = ''; // local time of the latest observation, e.g. '07:00'

  // placeholder until GET /model/info exists
  readonly modelInfo: ModelInfo = { version: '1.0.0', trainedOn: '2026-10-12', maeModel: 6.1, maeCams: 8.4 };

  private readonly detailsById = signal<Record<string, CityDetails>>({});
  private readonly loading = new Set<string>();

  // Called once before the first page is shown (provideAppInitializer), so the
  // map and the city bar get their cities on the first render.
  async load(): Promise<void> {
    try {
      const res = await firstValueFrom(this.http.get<ApiOverview>(`${this.base}/overview`));
      const cities = res.items
        .filter(c => c.pm2_5 !== null && c.time !== null) // no data yet: not shown
        .map(c => toCity(c, c.pm2_5!, c.time!, c.stale));
      this.cities.set(cities);
      const latest = Math.max(...cities.map(c => Date.parse(c.observationTimestamp)));
      this.updatedAt = Number.isFinite(latest)
        ? new Date(latest).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';
    } catch (err) {
      console.error('Cannot reach the API', err); // the pages show no city
    }
  }

  // e.g. city('hanoi') → { id: 'hanoi', name: 'Hanoi', … }   city('paris') → undefined
  city(id: string): City | undefined {
    return this.cities().find(c => c.id === id);
  }

  // undefined until loadDetails(id) has answered
  details(id: string): CityDetails | undefined {
    return this.detailsById()[id];
  }

  // Fetches current + history for a city, once.
  loadDetails(id: string): void {
    if (this.detailsById()[id] || this.loading.has(id)) return;
    this.loading.add(id);
    const city = `${this.base}/cities/${encodeURIComponent(id)}`;
    forkJoin({
      current: this.http.get<ApiCurrent>(`${city}/current`),
      history: this.http.get<ApiHistory>(`${city}/history?hours=72`),
    }).subscribe({
      next: ({ current, history }) => {
        this.detailsById.update(all => ({ ...all, [id]: toDetails(current, history) }));
        this.loading.delete(id);
      },
      error: err => {
        console.error(`Cannot load ${id}`, err);
        this.loading.delete(id);
      },
    });
  }
}

// ---- API → models.ts

export function toCity(c: ApiCity, pm25: number, time: string, stale: boolean): City {
  return {
    id: c.slug,
    name: c.name,
    station: c.name, // the API has no station name yet: the grid point of the city
    country: c.country,
    lat: c.latitude,
    lon: c.longitude,
    group: c.country === 'VN' ? 'vietnam' : 'other',
    pm25,
    observationTimestamp: time,
    dataFreshness: stale ? 'stale' : 'fresh',
  };
}

export function toDetails(current: ApiCurrent, history: ApiHistory): CityDetails {
  const w = current.weather;
  return {
    usAqi: current.us_aqi ?? 0,
    advice: current.advice ?? '',
    modelVersion: '—', // no model forecast yet
    weather: {
      condition: condition(w?.weather_code ?? null),
      temperature: Math.round(w?.temperature_2m ?? 0),
      humidity: Math.round(w?.relative_humidity_2m ?? 0),
      windKmh: Math.round(w?.wind_speed_10m ?? 0),
      windDir: compass(w?.wind_direction_10m ?? null),
    },
    history: history.points
      .filter(p => p.pm2_5 !== null)
      .map(p => ({ time: p.time, pm25: p.pm2_5! })),
    forecast: [],
  };
}

// WMO weather code → the three conditions the page knows. e.g. 0 → 'Sunny', 3 → 'Cloudy', 61 → 'Rainy'
export function condition(code: number | null): Weather['condition'] {
  if (code === null || code <= 1) return 'Sunny';
  if (code < 51) return 'Cloudy';
  return 'Rainy';
}

// Degrees → 8-point compass. e.g. 0 → 'N', 124 → 'SE', 350 → 'N'
export function compass(deg: number | null): string {
  if (deg === null) return '';
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}
