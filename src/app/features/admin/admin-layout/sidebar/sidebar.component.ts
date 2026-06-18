import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly open = input(false);
  readonly closeRequested = output<void>();

  navItems = signal<NavItem[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'grid_view',
      route: '/admin/dashboard',
    },
    {
      id: 'users',
      label: 'Users',
      icon: 'people',
      route: '/admin/users',
    },
    {
      id: 'branches',
      label: 'Branches',
      icon: 'theaters',
      route: '/admin/branches',
    },
    {
      id: 'movies',
      label: 'Movies',
      icon: 'movie',
      route: '/admin/movies',
    },
    {
      id: 'genres',
      label: 'Genres',
      icon: 'category',
      route: '/admin/genres',
    },
    {
      id: 'showtimes',
      label: 'Showtimes',
      icon: 'schedule',
      route: '/admin/showtimes',
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: 'book_online',
      route: '/admin/bookings',
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: 'payments',
      route: '/admin/payments',
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: 'local_activity',
      route: '/admin/tickets',
    },
  ]);
}
