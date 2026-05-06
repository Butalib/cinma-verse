import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';

@Component({
  standalone: true,
  imports: [CommonModule, SectionCardComponent],
  templateUrl: './user-dashboard.page.html',
  styleUrl: './user-dashboard.page.scss'
})
export class UserDashboardPage {
  readonly upcomingBookings$: Observable<number> = of(0);
}
