import { signal } from '@angular/core';
import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiData } from '../../core/api-data';
import { City, CityDetails } from '../../core/models';
import { CityPage } from './city-page';

// jsdom has no canvas: the chart library is replaced by a no-op chart
vi.mock('echarts', () => ({
  init: () => ({ setOption() {}, getDom() {}, resize() {}, dispose() {} }),
}));

const hanoi: City = {
  id: 'hanoi', name: 'Hanoi', station: 'Hanoi', country: 'VN', lat: 21.03, lon: 105.85,
  group: 'vietnam', pm25: 48.2, observationTimestamp: '2026-11-15T09:00:00Z', dataFreshness: 'fresh',
};

// what the API gives today: history, no model forecast
const details: CityDetails = {
  usAqi: 132, advice: 'Sensitive groups: limit outdoor activity.', modelVersion: '—',
  weather: { condition: 'Cloudy', temperature: 29, humidity: 64, windKmh: 10, windDir: 'SE' },
  history: [{ time: '2026-11-15T08:00:00Z', pm25: 47.1 }, { time: '2026-11-15T09:00:00Z', pm25: 48.2 }],
  forecast: [],
};

class FakeData {
  cities = signal([hanoi]);
  updatedAt = '16:00';
  city = (id: string) => (id === 'hanoi' ? hanoi : undefined);
  details = (id: string) => (id === 'hanoi' ? details : undefined);
  loadDetails() {}
}

describe('CityPage', () => {
  let fixture: ComponentFixture<CityPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CityPage],
      providers: [provideRouter([]), { provide: ApiData, useClass: FakeData }],
    }).compileComponents();

    fixture = TestBed.createComponent(CityPage);
    fixture.componentRef.setInput('id', 'hanoi');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows no model forecast line or forecast cards without a forecast', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Hanoi');
    expect(text).toContain('Sensitive groups: limit outdoor activity.');
    expect(text).not.toContain('by model v');
    expect(text).not.toContain('Forecast peak');
  });
});
