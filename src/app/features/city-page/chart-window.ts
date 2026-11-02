import { CityDetails, ForecastPoint, HistoryPoint } from '../../core/models';

const HOUR = 3_600_000;

export interface ChartWindow {
  forecast: ForecastPoint[];  // h+1 → h+hours
  history: HistoryPoint[];    // the same number of hours before the last observation
  start: number;              // left edge of the chart, in ms
}

// What the chart shows for a horizon: the forecast up to h+hours and as much history as forecast.
// The shorter the horizon, the shorter the window, so the forecast fills more of the chart.
// e.g. chartWindow(details, 6) → 6 forecast points + 7 history points (-6 h → last observation)
export function chartWindow(d: CityDetails, hours: number): ChartWindow {
  const lastObservation = Date.parse(d.history[d.history.length - 1].time);
  const start = lastObservation - hours * HOUR;
  return {
    forecast: d.forecast.slice(0, hours),
    history: d.history.filter(p => Date.parse(p.time) >= start),
    start,
  };
}
