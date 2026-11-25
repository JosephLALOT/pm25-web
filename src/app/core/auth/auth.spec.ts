import { TestBed } from '@angular/core/testing';
import { Auth, FAKE_ADMIN } from './auth';

describe('Auth (fake)', () => {
  beforeEach(() => sessionStorage.clear());

  it('accepts the fake admin and becomes admin', async () => {
    const auth = TestBed.inject(Auth);
    expect(await auth.login(FAKE_ADMIN.email, FAKE_ADMIN.password)).toBe(true);
    expect(auth.isAdmin()).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const auth = TestBed.inject(Auth);
    expect(await auth.login(FAKE_ADMIN.email, 'wrong')).toBe(false);
    expect(auth.user()).toBeNull();
  });

  it('forgets the user on logout', async () => {
    const auth = TestBed.inject(Auth);
    await auth.login(FAKE_ADMIN.email, FAKE_ADMIN.password);
    auth.logout();
    expect(auth.isAdmin()).toBe(false);
    expect(sessionStorage.length).toBe(0);
  });
});
