import { Routes } from '@angular/router';
import { AboutPage } from './features/about-page/about-page';
import { CityPage } from './features/city-page/city-page';
import { MapPage } from './features/map-page/map-page';

export const routes: Routes = [
    { path: '', component: MapPage },
    { path: 'about', component: AboutPage },
    { path: 'city/:id', component: CityPage },
    { path: 'map', component: MapPage },
    { path: '**', redirectTo: '' }
];
