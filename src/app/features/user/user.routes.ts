import { Routes } from '@angular/router';
import { UserShellComponent } from '../../shared/layout/user/user-shell.component';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: UserShellComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/pages/user-dashboard.page').then((m) => m.UserDashboardPage)
      },
      {
        path: 'movies',
        children: [
          {
            path: '',
            loadComponent: () => import('./movies/pages/movies-list.page').then((m) => m.MoviesListPage)
          },
          {
            path: ':id',
            loadComponent: () => import('./movies/pages/movie-details.page').then((m) => m.MovieDetailsPage)
          }
        ]
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/pages/profile.page').then((m) => m.ProfilePage)
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  }
];
