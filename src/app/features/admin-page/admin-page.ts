import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminData, CityCreate } from '../../core/admin-data';
import { Auth } from '../../core/auth/auth';

// Back-office, first tab: cities (ARCHITECTURE.md, section 5, /admin/cities).
// Users, collection runs and model versions will come as other tabs.
@Component({
  imports: [FormsModule, DatePipe],
  selector: 'app-admin-page',
  styleUrl: './admin-page.scss',
  templateUrl: './admin-page.html',
})
export class AdminPage {
  private data = inject(AdminData);
  private router = inject(Router);
  readonly auth = inject(Auth);

  readonly cities = this.data.cities;
  readonly activeCount = computed(() => this.cities().filter(c => c.is_active).length);

  // "Add a city" form
  form: CityCreate = AdminPage.emptyForm();
  readonly error = signal('');

  add() {
    const error = this.data.create({
      ...this.form,
      slug: this.form.slug.trim(),
      country: this.form.country.trim().toUpperCase(),
      latitude: Number(this.form.latitude),
      longitude: Number(this.form.longitude),
    });
    this.error.set(error ?? '');
    if (!error) this.form = AdminPage.emptyForm();
  }

  setActive(slug: string, active: boolean) {
    this.data.setActive(slug, active);
  }

  async logout() {
    this.auth.logout();
    await this.router.navigateByUrl('/');
  }

  private static emptyForm(): CityCreate {
    return { slug: '', name: '', country: '', latitude: 0, longitude: 0, timezone: '' };
  }
}
