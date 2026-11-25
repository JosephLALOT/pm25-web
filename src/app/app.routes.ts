import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin-guard';
import { AboutPage } from './features/about-page/about-page';
import { CityPage } from './features/city-page/city-page';
import { MapPage } from './features/map-page/map-page';

export const routes: Routes = [
    { path: '', component: MapPage },
    { path: 'about', component: AboutPage },
    { path: 'city/:id', component: CityPage },
    { path: 'map', component: MapPage },
    { path: 'login', loadComponent: () => import('./features/login-page/login-page').then(m => m.LoginPage) },
    {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin-page/admin-page').then(m => m.AdminPage),
    },
    { path: '**', redirectTo: '' }
];
