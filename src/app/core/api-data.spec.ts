import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { ApiData, compass, condition } from './api-data';

describe('ApiData', () => {
  let data: ApiData;
  let http: HttpTestingController;
  const base = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    data = TestBed.inject(ApiData);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps /overview to cities and skips cities without data', async () => {
    const done = data.load();
    http.expectOne(`${base}/overview`).flush({
      items: [
        { slug: 'hanoi', name: 'Hanoi', country: 'VN', latitude: 21.03, longitude: 105.85,
          time: '2026-11-15T09:00:00Z', pm2_5: 27.8, stale: false },
        { slug: 'bangkok', name: 'Bangkok', country: 'TH', latitude: 13.76, longitude: 100.5,
          time: '2026-11-15T06:00:00Z', pm2_5: 20.1, stale: true },
        // no data yet: the contract omits time and pm2_5
        { slug: 'manila', name: 'Manila', country: 'PH', latitude: 14.6, longitude: 120.98, stale: true },
      ],
    });
    await done;

    expect(data.cities().map(c => c.id)).toEqual(['hanoi', 'bangkok']);
    expect(data.city('hanoi')).toMatchObject({ group: 'vietnam', pm25: 27.8, dataFreshness: 'fresh' });
    expect(data.city('bangkok')).toMatchObject({ group: 'other', dataFreshness: 'stale' });
  });

  it('loads current + history once per city', () => {
    data.loadDetails('hanoi');
    data.loadDetails('hanoi'); // already loading: no second request
    http.expectOne(`${base}/cities/hanoi/current`).flush({
      city_slug: 'hanoi', us_aqi: 139, advice: 'Sensitive groups: limit outdoor activity.', stale: false,
      weather: { time: '2026-11-15T09:00:00Z', temperature_c: 28.6, relative_humidity_pct: 64,
                 wind_speed_kmh: 10.4, wind_direction_deg: 124, weather_code: 3 },
    });
    http.expectOne(`${base}/cities/hanoi/history?hours=72`).flush({
      city_slug: 'hanoi',
      points: [
        { time: '2026-11-15T08:00:00Z', pm2_5: 29.9 },
        { time: '2026-11-15T09:00:00Z', pm2_5: 31.2, us_aqi: 92 },
      ],
    });

    const d = data.details('hanoi')!;
    expect(d.usAqi).toBe(139);
    expect(d.weather).toEqual({ condition: 'Cloudy', temperature: 29, humidity: 64, windKmh: 10, windDir: 'SE' });
    expect(d.history).toEqual([
      { time: '2026-11-15T08:00:00Z', pm25: 29.9 },
      { time: '2026-11-15T09:00:00Z', pm25: 31.2 },
    ]);
    expect(d.forecast).toEqual([]);

    data.loadDetails('hanoi'); // loaded: no request
  });

  it('maps a city without data or weather', () => {
    data.loadDetails('manila');
    http.expectOne(`${base}/cities/manila/current`).flush({ city_slug: 'manila', stale: true });
    http.expectOne(`${base}/cities/manila/history?hours=72`).flush({ city_slug: 'manila', points: [] });

    const d = data.details('manila')!;
    expect(d.history).toEqual([]);
    expect(d.advice).toBe('');
  });

  it('has no model info until the API serves /model/info', () => {
    expect(data.modelInfo).toBeNull();
  });

  it('converts weather codes and wind directions', () => {
    expect([0, 2, 45, 61, 95].map(condition)).toEqual(['Sunny', 'Cloudy', 'Cloudy', 'Rainy', 'Rainy']);
    expect([0, 44, 124, 180, 350].map(compass)).toEqual(['N', 'NE', 'SE', 'S', 'N']);
  });
});
