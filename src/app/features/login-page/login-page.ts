import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, FAKE_ADMIN } from '../../core/auth/auth';

@Component({
  imports: [FormsModule],
  selector: 'app-login-page',
  styleUrl: './login-page.scss',
  templateUrl: './login-page.html',
})
export class LoginPage {
  private auth = inject(Auth);
  private router = inject(Router);

  // ?returnUrl=/admin, set by the guard (withComponentInputBinding)
  readonly returnUrl = input<string>();

  readonly fake = FAKE_ADMIN; // shown on the page while the authentication is fake
  email = '';
  password = '';
  readonly error = signal('');
  readonly busy = signal(false);

  async submit() {
    this.busy.set(true);
    this.error.set('');
    const ok = await this.auth.login(this.email, this.password);
    this.busy.set(false);
    if (!ok) {
      this.error.set('Wrong e-mail or password.');
      return;
    }
    // only an internal path, never an external URL
    const target = this.returnUrl()?.startsWith('/') ? this.returnUrl()! : '/admin';
    await this.router.navigateByUrl(target);
  }
}
