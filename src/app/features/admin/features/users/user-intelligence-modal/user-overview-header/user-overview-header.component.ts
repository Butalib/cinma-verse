import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { UserOverview, UserOverviewActiveDetail, UserOverviewStatCardKind } from '../user-overview/user-overview.model';

@Component({
  selector: 'app-user-overview-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-overview-header.component.html',
  styleUrl: './user-overview-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserOverviewHeaderComponent {
  readonly overview = input.required<UserOverview>();
  readonly activeDetail = input<UserOverviewActiveDetail>('none');

  readonly cardClick = output<UserOverviewStatCardKind>();

  onCardClick(kind: UserOverviewStatCardKind): void {
    this.cardClick.emit(kind);
  }

  isActive(kind: UserOverviewStatCardKind): boolean {
    return this.activeDetail() === kind;
  }
}
