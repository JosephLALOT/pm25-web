import { Injectable, signal } from '@angular/core';

// A city as GET /admin/cities returns it (pm25-platform contracts/openapi.yaml, AdminCity).
export interface AdminCity {
  slug: string;        // e.g. 'hanoi', cannot be changed
  name: string;        // e.g. 'Hanoi'
  country: string;     // ISO code, e.g. 'VN'
  latitude: number;    // e.g. 21.0285
  longitude: number;   // e.g. 105.8542
  timezone: string;    // e.g. 'Asia/Ho_Chi_Minh'
  is_active: boolean;  // inactive cities are no longer collected nor listed publicly
  created_at: string;  // ISO date
}

// Body of POST /admin/cities (CityCreate)
export type CityCreate = Omit<AdminCity, 'is_active' | 'created_at'>;

// FAKE back-office data, kept in memory until the admin endpoints are called
// for real. Same rules as the API: unique slug (409), slug a-z 0-9 -, country
// two capital letters, latitude -90..90, longitude -180..180 (400).
//
// To replace later with HttpClient calls on environment.apiBaseUrl:
//   GET /admin/cities, POST /admin/cities, PATCH /admin/cities/{slug},
//   DELETE /admin/cities/{slug} (soft delete).
@Injectable({ providedIn: 'root' })
export class AdminData {
  readonly cities = signal<AdminCity[]>([
    { slug: 'hanoi',     name: 'Hanoi',     country: 'VN', latitude: 21.03, longitude: 105.85, timezone: 'Asia/Ho_Chi_Minh', is_active: true,  created_at: '2026-11-01T10:00:00Z' },
    { slug: 'bangkok',   name: 'Bangkok',   country: 'TH', latitude: 13.76, longitude: 100.5,  timezone: 'Asia/Bangkok',     is_active: true,  created_at: '2026-11-01T10:00:00Z' },
    { slug: 'jakarta',   name: 'Jakarta',   country: 'ID', latitude: -6.18, longitude: 106.83, timezone: 'Asia/Jakarta',     is_active: true,  created_at: '2026-11-01T10:00:00Z' },
    { slug: 'vientiane', name: 'Vientiane', country: 'LA', latitude: 17.97, longitude: 102.63, timezone: 'Asia/Vientiane',   is_active: true,  created_at: '2026-11-01T10:00:00Z' },
    { slug: 'yangon',    name: 'Yangon',    country: 'MM', latitude: 16.84, longitude: 96.17,  timezone: 'Asia/Yangon',      is_active: false, created_at: '2026-11-01T10:00:00Z' },
  ]);

  // Returns an error message, or null when the city was created.
  create(c: CityCreate): string | null {
    if (!/^[a-z0-9-]+$/.test(c.slug)) return 'Slug: lowercase letters, digits and "-" only.';
    if (!c.name.trim()) return 'Name is required.';
    if (!/^[A-Z]{2}$/.test(c.country)) return 'Country: two capital letters, e.g. VN.';
    if (!(c.latitude >= -90 && c.latitude <= 90)) return 'Latitude must be between -90 and 90.';
    if (!(c.longitude >= -180 && c.longitude <= 180)) return 'Longitude must be between -180 and 180.';
    if (!c.timezone.trim()) return 'Time zone is required.';
    if (this.cities().some(x => x.slug === c.slug)) return `A city with the slug "${c.slug}" already exists.`;

    const city: AdminCity = { ...c, name: c.name.trim(), is_active: true, created_at: new Date().toISOString() };
    this.cities.update(list => [...list, city]);
    return null;
  }

  // DELETE (false) or PATCH { is_active: true } (true)
  setActive(slug: string, active: boolean): void {
    this.cities.update(list => list.map(c => (c.slug === slug ? { ...c, is_active: active } : c)));
  }
}
