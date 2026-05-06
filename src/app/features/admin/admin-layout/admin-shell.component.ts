import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, PRIMARY_OUTLET, Router, RouterOutlet } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { AdminHeaderComponent } from './admin-header/admin-header.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent, AdminHeaderComponent],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss'
})
export class AdminShellComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly sidebarOpen = signal(false);
  readonly pageTitle = signal('Admin');

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.pageTitle.set(this.resolvePageTitle());
        this.sidebarOpen.set(false);
      });
  }

  openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  private resolvePageTitle(): string {
    let route = this.activatedRoute;

    while (route.firstChild) {
      route = route.firstChild;
    }

    if (route.outlet !== PRIMARY_OUTLET) {
      return 'Admin';
    }

    return (route.snapshot.data['title'] as string) ?? 'Admin';
  }
}
