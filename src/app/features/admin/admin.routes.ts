import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { AdminShellComponent } from './admin-layout/admin-shell.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [authGuard, roleGuard(['Admin', 'Administrator', 'SuperAdmin'])],
    children: [
      {
        path: 'dashboard',
        data: { title: 'Dashboard' },
        loadComponent: () =>
          import('./features/dashboard/pages/admin-dashboard.page').then(
            (m) => m.AdminDashboardPage,
          ),
      },
      {
        path: 'users',
        data: { title: 'Users Management' },
        loadComponent: () =>
          import('./features/users/users-managemen/layout/layout-componant').then(
            (m) => m.LayoutComponant,
          ),
      },
      {
        path: 'branches',
        data: { title: 'Branches Management' },
        loadComponent: () =>
          import('./features/branches/components/branches-management/branches-management.component').then(
            (m) => m.BranchesManagementComponent,
          ),
      },
      {
        path: 'movies',
        data: { title: 'Movies Management' },
        loadComponent: () =>
          import('./features/movies/components/movies-management/layout/movies-layout.component').then(
            (m) => m.MoviesLayoutComponent,
          ),
      },
      {
        path: 'showtimes',
        children: [
          {
            path: '',
            data: { title: 'Showtimes Management' },
            loadComponent: () =>
              import('./features/showtimes/showtimes-management/layout/showtimes-layout.component').then(
                (m) => m.ShowtimesLayoutComponent,
              ),
          },
          {
            path: ':id',
            data: { title: 'Showtime Details' },
            loadComponent: () =>
              import('./features/showtimes/showtime-details/page/showtime-details-page.component').then(
                (m) => m.ShowtimeDetailsPageComponent,
              ),
          },
        ],
      },
      {
        path: 'genres',
        data: { title: 'Genres Management' },
        loadComponent: () =>
          import('./features/genres/pages/genres-page/genres-page.component').then(
            (m) => m.GenresPageComponent,
          ),
      },
      {
        path: 'bookings',
        data: { title: 'Bookings Management' },
        loadComponent: () =>
          import('./features/bookings/pages/bookings-page/bookings-page.component').then(
            (m) => m.BookingsPageComponent,
          ),
      },
      {
        path: 'payments',
        data: { title: 'Payments Management' },
        loadComponent: () =>
          import('./features/payments/payment.component').then((m) => m.PaymentComponent),
      },
      {
        path: 'tickets',
        children: [
          {
            path: '',
            data: { title: 'Tickets Management' },
            loadComponent: () =>
              import('./features/tickets/tickets-management/tickets-management').then(
                (m) => m.TicketsManagementComponent,
              ),
          },
        ],
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
];
