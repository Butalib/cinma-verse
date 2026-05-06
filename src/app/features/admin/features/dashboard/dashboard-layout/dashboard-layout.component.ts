import { Component, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { KpiCardComponent, KpiData } from '../components/kpi-card/kpi-card.component';
import { AdminDashboardService } from '../data-access/admin-dashboard.service';
import { MonthlyRevenueChartComponent } from '../components/monthly-revenue-chart/monthly-revenue-chart.component';
import { WeeklyBookingsChartComponent } from '../components/weekly-bookings-chart/weekly-bookings-chart.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [KpiCardComponent, MonthlyRevenueChartComponent, WeeklyBookingsChartComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent {
  private readonly adminDashboardService = inject(AdminDashboardService);
  readonly kpis: Signal<KpiData[]> = toSignal(this.adminDashboardService.getDashboardKpis(), {
    initialValue: [] as KpiData[]
  });
}
