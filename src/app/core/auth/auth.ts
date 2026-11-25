import { Injectable, computed, signal } from '@angular/core';

// Signed-in user, as pm25-auth will describe it (claims sub and role of the access token).
export interface AuthUser {
  id: string;              // sub of the token, e.g. 'b3f1…'
  email: string;           // e.g. 'admin@pm25.local'
  role: 'user' | 'admin';
}

// FAKE authentication, until pm25-auth runs.
// Accepts one hard-coded admin account and keeps the user in sessionStorage
// (lost when the tab is closed). Nothing here is secure: the real protection
// is the 401/403 of the back end.
//
// To replace later with the real service (same public surface):
// - login(): POST {authBaseUrl}/auth/login, access token in memory,
//   refresh token in localStorage (ARCHITECTURE.md, section 14);
// - logout(): POST {authBaseUrl}/auth/logout;
// - restore(): POST {authBaseUrl}/auth/refresh with the stored refresh token.
export const FAKE_ADMIN = { email: 'admin@pm25.local', password: 'admin' };

const STORAGE_KEY = 'fake-auth-user';

@Injectable({ providedIn: 'root' })
export class Auth {
  readonly user = signal<AuthUser | null>(null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  constructor() {
    this.restore();
  }

  // Resolves to true when the credentials are accepted.
  async login(email: string, password: string): Promise<boolean> {
    const ok = email.trim().toLowerCase() === FAKE_ADMIN.email && password === FAKE_ADMIN.password;
    if (!ok) return false;
    const user: AuthUser = { id: '00000000-0000-0000-0000-000000000001', email: FAKE_ADMIN.email, role: 'admin' };
    this.user.set(user);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return true;
  }

  logout(): void {
    this.user.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  // After a page reload, the user is read back from sessionStorage.
  private restore(): void {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      this.user.set(JSON.parse(raw) as AuthUser);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}
