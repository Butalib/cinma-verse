import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ShowtimeKpiItem, ShowtimeKpiService } from '../services/showtime-kpi.service';

@Component({
  selector: 'app-showtime-kpi',
  standalone: true,
  templateUrl: './showtime-kpi.component.html',
  styleUrl: './showtime-kpi.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowtimeKpiComponent {
  private readonly kpiService = inject(ShowtimeKpiService);

  readonly kpiItems: ShowtimeKpiItem[] = this.kpiService.getShowtimeKpis();
}
