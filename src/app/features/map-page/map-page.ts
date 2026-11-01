import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { MockData } from '../../core/mock-data';
import { CATEGORIES, categoryOf } from '../../core/models';

@Component({
  imports: [RouterLink],
  selector: 'app-map-page',
  styleUrl: './map-page.scss',
  templateUrl: './map-page.html',
})
export class MapPage {
  private data = inject(MockData);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // la <div #map> du HTML
  private mapEl = viewChild.required<ElementRef<HTMLDivElement>>('map');

  readonly categories = CATEGORIES;
  readonly updatedAt = this.data.updatedAt;

  // villes triées de la pire à la meilleure, avec leur catégorie
  readonly sorted = computed(() =>
    [...this.data.cities()]
      .sort((a, b) => b.pm25 - a.pm25)
      .map(c => ({ ...c, cat: categoryOf(c.pm25) }))
  );
  readonly vietnam = computed(() => this.sorted().filter(c => c.group === 'vietnam'));
  readonly others  = computed(() => this.sorted().filter(c => c.group === 'other'));

  constructor() {
    // la carte ne peut être créée qu'une fois la <div> affichée à l'écran
    afterNextRender(() => this.initMap());
  }

  private initMap() {
    const map = L.map(this.mapEl().nativeElement).setView([14, 106], 5);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    for (const c of this.sorted()) {
      L.circleMarker([c.lat, c.lon], {
        radius: 10,
        color: '#212121',
        weight: 2,
        fillColor: c.cat.color,
        fillOpacity: 0.9,
      })
        .bindTooltip(`${c.name}: ${c.pm25} µg/m³ (${c.cat.label})`)
        .on('click', () => this.router.navigate(['/city', c.id]))
        .addTo(map);
    }

    // quand on quitte la page, on détruit la carte proprement
    this.destroyRef.onDestroy(() => map.remove());
  }
}