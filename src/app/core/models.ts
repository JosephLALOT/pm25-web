// Stack of data
export interface City {
  id: string; // Used in the URL (city/Hanoi)
  name: string;
  country: string;
  lat: number;
  lon: number;
  group: 'vietnam' | 'other';
  pm25: number;
}

export interface Category {
  label: string;   // libellé complet
  short: string;   // libellé court pour la légende
  max: number;     // valeur maximale incluse
  color: string;
}

export const CATEGORIES: Category[] = [
  { label: 'Good',                           short: 'Good',      max: 9.0,      color: '#00E400' },
  { label: 'Moderate',                       short: 'Moderate',  max: 35.4,     color: '#FFFF00' },
  { label: 'Unhealthy for sensitive groups', short: 'USG',       max: 55.4,     color: '#FF7E00' },
  { label: 'Unhealthy',                      short: 'Unhealthy', max: 125.4,    color: '#FF0000' },
  { label: 'Very unhealthy',                 short: 'V. unh.',   max: 225.4,    color: '#8F3F97' },
  { label: 'Hazardous',                      short: 'Hazardous', max: Infinity, color: '#7E0023' },
];

// renvoie la première catégorie dont le max n'est pas dépassé
export function categoryOf(pm25: number): Category {
  return CATEGORIES.find(c => pm25 <= c.max)!;
}