import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';

// Lets only admins open /admin; anybody else is sent to /login?returnUrl=…
// The guard only hides pages: the back end still answers 401/403 to a request
// without a valid admin token.
export const adminGuard: CanActivateFn = (_route, state) => {
  if (inject(Auth).isAdmin()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
