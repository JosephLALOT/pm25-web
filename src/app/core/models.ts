// ============================================= MAP =============================================
export interface City {
  id: string;                    // used in the URL, e.g. 'hanoi' → /city/hanoi
  name: string;                  // e.g. 'Hanoi'
  country: string;               // e.g. 'Vietnam'
  lat: number;                   // e.g. 21.03
  lon: number;                   // e.g. 105.85
  group: 'vietnam' | 'other';    // e.g. 'vietnam'
  pm25: number;                  // current value in µg/m³, e.g. 48.2
}

export interface Category {
  label: string;   // full label, e.g. 'Unhealthy for sensitive groups'
  short: string;   // short label for the legend, e.g. 'USG'
  max: number;     // upper bound (included), e.g. 55.4
  color: string;   // e.g. '#FF7E00'
}

export const CATEGORIES: Category[] = [
  { label: 'Good',                           short: 'Good',      max: 9.0,      color: '#00E400' },
  { label: 'Moderate',                       short: 'Moderate',  max: 35.4,     color: '#FFFF00' },
  { label: 'Unhealthy for sensitive groups', short: 'USG',       max: 55.4,     color: '#FF7E00' },
  { label: 'Unhealthy',                      short: 'Unhealthy', max: 125.4,    color: '#FF0000' },
  { label: 'Very unhealthy',                 short: 'V. unh.',   max: 225.4,    color: '#8F3F97' },
  { label: 'Hazardous',                      short: 'Hazardous', max: Infinity, color: '#7E0023' },
];

// First category whose max is not exceeded. e.g. categoryOf(48.2) → USG
export function categoryOf(pm25: number): Category {
  return CATEGORIES.find(c => pm25 <= c.max)!;
}

// ============================================= CITY =============================================

export interface Weather {
  condition: 'Sunny' | 'Cloudy' | 'Rainy';  // e.g. 'Sunny'
  temperature: number;                      // °C, e.g. 27
  humidity: number;                         // %, e.g. 78
  windKmh: number;                          // e.g. 6
  windDir: string;                          // e.g. 'NE'
}

// One past measurement. e.g. { time: '2026-11-01T00:00:00.000Z', pm25: 48.2 }
export interface HistoryPoint {
  time: string;          // ISO date
  pm25: number;          // µg/m³
}

// One forecast hour
export interface ForecastPoint {
  time: string;          // ISO date
  model: number;         // our model's forecast, e.g. 51.0
  lower: number;         // uncertainty low bound, e.g. 48.9
  upper: number;         // uncertainty high bound, e.g. 53.1
  cams: number;          // CAMS forecast (baseline), e.g. 47.2
}

// Everything the city page shows on top of City
export interface CityDetails {
  usAqi: number;                // e.g. 132
  advice: string;               // e.g. 'Sensitive groups: limit outdoor activity.'
  modelVersion: string;         // e.g. '1.0.0'
  weather: Weather;
  history: HistoryPoint[];      // last 72 hours
  forecast: ForecastPoint[];    // next 7 days (168 hours)
}

// ============================================= ABOUT =============================================
// Model info, from GET /model/info
export interface ModelInfo {
  version: string;     // e.g. '1.0.0'
  trainedOn: string;   // e.g. '2026-10-12'
  maeModel: number;    // mean error of our model at 24 h, µg/m³, e.g. 6.1
  maeCams: number;     // same for CAMS, e.g. 8.4
}