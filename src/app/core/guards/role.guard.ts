import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStoreService } from '../auth/token-store.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const tokenStore = inject(TokenStoreService);
    const router = inject(Router);
    const role = tokenStore.getRole();

    if (!role || !allowedRoles.includes(role)) {
      return router.createUrlTree(['/']);
    }

    return true;
  };
};
