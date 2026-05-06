import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ShowtimeStatus = 'SCHEDULED' | 'NOW_SHOWING' | 'COMPLETED' | 'CANCELLED';

export interface ShowtimesTableRow {
  id: string;
  movieTitle: string;
  branchName: string;
  hallName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: ShowtimeStatus;
  createdAt: string;
}

@Component({
  selector: 'app-showtimes-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './showtimes-table.component.html',
  styleUrl: './showtimes-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowtimesTableComponent {
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  readonly showtimes = input.required<ShowtimesTableRow[]>();

  readonly viewShowtime = output<string>();
  readonly editShowtime = output<ShowtimesTableRow>();
  readonly deleteShowtime = output<string>();

  onView(id: string): void {
    this.viewShowtime.emit(id);
  }

  onEdit(showtime: ShowtimesTableRow): void {
    this.editShowtime.emit(showtime);
  }

  onDelete(id: string): void {
    this.deleteShowtime.emit(id);
  }

  onMenuView(event: Event, id: string): void {
    this.closeMenu(event);
    this.onView(id);
  }

  onMenuEdit(event: Event, showtime: ShowtimesTableRow): void {
    this.closeMenu(event);
    this.onEdit(showtime);
  }

  onMenuDelete(event: Event, id: string): void {
    this.closeMenu(event);
    this.onDelete(id);
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  getOccupancy(showtime: ShowtimesTableRow): string {
    const occupied = showtime.totalSeats - showtime.availableSeats;
    return `${occupied}/${showtime.totalSeats}`;
  }

  private closeMenu(event: Event): void {
    const target = event.currentTarget as HTMLElement | null;
    const details = target?.closest('details');
    if (details) {
      details.removeAttribute('open');
    }
  }

  onActionsMenuToggle(event: Event): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLDetailsElement) || !target.classList.contains('showtimes-table__actions-menu')) {
      return;
    }

    if (!target.open) {
      target.classList.remove('showtimes-table__actions-menu--drop-up');
      return;
    }

    const openMenus = this.hostRef.nativeElement.querySelectorAll('.showtimes-table__actions-menu[open]');
    for (const node of openMenus) {
      if (node instanceof HTMLDetailsElement && node !== target) {
        node.removeAttribute('open');
      }
    }

    requestAnimationFrame(() => {
      const menu = target.querySelector('.showtimes-table__menu-list');
      if (!menu) {
        return;
      }
      const rect = menu.getBoundingClientRect();
      const margin = 8;
      if (rect.bottom > window.innerHeight - margin) {
        target.classList.add('showtimes-table__actions-menu--drop-up');
      } else {
        target.classList.remove('showtimes-table__actions-menu--drop-up');
      }
    });
  }
}
