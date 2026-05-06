import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserKpiItem, UserKpiService } from '../services/user-kpi.service';

@Component({
  selector: 'app-user-kpi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-kpi.component.html',
  styleUrl: './user-kpi.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserKpiComponent {
  private readonly userKpiService = inject(UserKpiService);

  readonly kpiItems: UserKpiItem[] = this.userKpiService.getUserKpis();
}
