import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'user',
    canActivate: [authGuard, roleGuard(['User', 'RegularUser'])],
    loadChildren: () =>
      import('./features/user/user-mangment/user-mangment-module').then(
        (m) => m.UserMangmentModule,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/auth/pages/unauthorized').then((m) => m.UnauthorizedPage),
  },
  {
    path: 'auth/login',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'auth/register',
    redirectTo: 'register',
    pathMatch: 'full',
  },
  {
    path: 'movies',
    canActivate: [authGuard, roleGuard(['User', 'RegularUser'])],
    loadComponent: () =>
      import('./features/user/user-mangment/feature/home/home').then((m) => m.Home),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: 'login' },
];
