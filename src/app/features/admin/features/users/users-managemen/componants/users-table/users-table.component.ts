import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UserRole = 'Customer' | 'Admin';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type EmailConfirmation = 'CONFIRMED' | 'NOT CONFIRMED';
export type UserGender = 'Male' | 'Female';

export interface UsersTableRow {
  id: string;
  name: string;
  joinedDate: string;
  contact: string;
  city: string;
  gender: UserGender;
  role: UserRole;
  status: UserStatus;
  emailConfirmed: EmailConfirmation;
  createdAt: string;
  dateOfBirth?: string;
}

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersTableComponent {
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  readonly users = input.required<UsersTableRow[]>();

  readonly viewUser = output<string>();
  readonly editUser = output<UsersTableRow>();
  readonly deleteUser = output<string>();

  onView(id: string): void {
    this.viewUser.emit(id);
  }

  onEdit(user: UsersTableRow): void {
    this.editUser.emit(user);
  }

  onDelete(id: string): void {
    this.deleteUser.emit(id);
  }

  onMenuView(event: Event, id: string): void {
    this.closeMenu(event);
    this.onView(id);
  }

  onMenuEdit(event: Event, user: UsersTableRow): void {
    this.closeMenu(event);
    this.onEdit(user);
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
    if (!(target instanceof HTMLDetailsElement) || !target.classList.contains('users-table__actions-menu')) {
      return;
    }

    if (!target.open) {
      target.classList.remove('users-table__actions-menu--drop-up');
      return;
    }

    const openMenus = this.hostRef.nativeElement.querySelectorAll('.users-table__actions-menu[open]');
    for (const node of openMenus) {
      if (node instanceof HTMLDetailsElement && node !== target) {
        node.removeAttribute('open');
      }
    }

    requestAnimationFrame(() => {
      const menu = target.querySelector('.users-table__menu-list');
      if (!menu) {
        return;
      }
      const rect = menu.getBoundingClientRect();
      const margin = 8;
      if (rect.bottom > window.innerHeight - margin) {
        target.classList.add('users-table__actions-menu--drop-up');
      } else {
        target.classList.remove('users-table__actions-menu--drop-up');
      }
    });
  }
}
