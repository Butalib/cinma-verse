import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const role = authService.getCurrentRole();
    const normalizedAllowedRoles = allowedRoles.map((value) => value.toLowerCase());
    const normalizedRole = role?.toLowerCase();

    if (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole)) {
      return router.createUrlTree(['/unauthorized']);
    }

    return true;
  };
};
