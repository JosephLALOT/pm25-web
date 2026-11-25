import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { adminGuard } from './admin-guard';
import { Auth, FAKE_ADMIN } from './auth';

describe('adminGuard', () => {
  const run = () =>
    TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, { url: '/admin' } as RouterStateSnapshot),
    );

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('sends a visitor to /login with the return URL', () => {
    const result = run() as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login?returnUrl=%2Fadmin');
  });

  it('lets an admin in', async () => {
    await TestBed.inject(Auth).login(FAKE_ADMIN.email, FAKE_ADMIN.password);
    expect(run()).toBe(true);
  });
});
