import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../core/auth/auth';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-app-header',
  styleUrl: './app-header.scss',
  templateUrl: './app-header.html',
})
export class AppHeader {
  readonly auth = inject(Auth);  // le lien Admin n'apparaît que pour un admin connecté

  // thème de départ : celui choisi la dernière fois, sinon celui du système
  dark = signal(
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && matchMedia('(prefers-color-scheme: dark)').matches)
  );

  constructor() {
    this.apply();
  }

  toggleTheme() {
    this.dark.update(v => !v);   // inverse la valeur
    this.apply();
  }

  private apply() {
    const theme = this.dark() ? 'dark' : 'light';
    document.documentElement.dataset['theme'] = theme;  // pose data-theme="dark" sur <html>
    localStorage.setItem('theme', theme);               // retient le choix
  }
}