import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { UserIntelligenceTab } from '../user-intelligence.types';

@Component({
  selector: 'app-user-intelligence-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-intelligence-header.component.html',
  styleUrl: './user-intelligence-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserIntelligenceHeaderComponent {
  readonly activeTab = input.required<UserIntelligenceTab>();

  readonly tabChange = output<UserIntelligenceTab>();
  readonly closeClick = output<void>();

  readonly tabs: ReadonlyArray<{ id: UserIntelligenceTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'payments', label: 'Payments' },
  ];

  onTabClick(tab: UserIntelligenceTab): void {
    this.tabChange.emit(tab);
  }
}
