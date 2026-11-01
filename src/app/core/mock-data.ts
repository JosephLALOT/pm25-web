import { Injectable, signal } from '@angular/core';
import { City } from './models';

@Injectable({ providedIn: 'root' })
export class MockData {
  readonly updatedAt = '07:00';

  readonly cities = signal<City[]>([
    { id: 'hanoi',        name: 'Hanoi',        country: 'Vietnam',  lat: 21.03, lon: 105.85, group: 'vietnam',  pm25: 48.2 },
    { id: 'vientiane',    name: 'Vientiane',    country: 'Laos',     lat: 17.97, lon: 102.63, group: 'other',    pm25: 61.3 },
    { id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.14,  lon: 101.69, group: 'other',    pm25: 14.5 },
  ]);

  city(id: string): City | undefined {
    return this.cities().find(c => c.id === id);
  }
}
