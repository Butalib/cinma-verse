import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TicketStatus,
  TicketsTableRow as TicketsTableRowModel,
} from '../../../models/ticket.models';

export type { TicketStatus };
export type TicketsTableRow = TicketsTableRowModel;

@Component({
  selector: 'app-tickets-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tickets-table.component.html',
  styleUrl: './tickets-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketsTableComponent {
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  readonly tickets = input.required<TicketsTableRow[]>();

  readonly viewTicket = output<string>();
  readonly deleteTicket = output<string>();

  onView(id: string): void {
    this.viewTicket.emit(id);
  }

  onDelete(id: string): void {
    this.deleteTicket.emit(id);
  }

  onMenuView(event: Event, id: string): void {
    this.closeMenu(event);
    this.onView(id);
  }

  onMenuDelete(event: Event, id: string): void {
    this.closeMenu(event);
    this.onDelete(id);
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
    if (
      !(target instanceof HTMLDetailsElement) ||
      !target.classList.contains('tickets-table__actions-menu')
    ) {
      return;
    }

    if (!target.open) {
      target.classList.remove('tickets-table__actions-menu--drop-up');
      return;
    }

    const openMenus = this.hostRef.nativeElement.querySelectorAll(
      '.tickets-table__actions-menu[open]',
    );
    for (const node of openMenus) {
      if (node instanceof HTMLDetailsElement && node !== target) {
        node.removeAttribute('open');
      }
    }

    requestAnimationFrame(() => {
      const menu = target.querySelector('.tickets-table__menu-list');
      if (!menu) {
        return;
      }
      const rect = menu.getBoundingClientRect();
      const margin = 8;
      if (rect.bottom > window.innerHeight - margin) {
        target.classList.add('tickets-table__actions-menu--drop-up');
      } else {
        target.classList.remove('tickets-table__actions-menu--drop-up');
      }
    });
  }
}
