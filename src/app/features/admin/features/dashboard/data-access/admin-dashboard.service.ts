import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { ApiClientService } from '../../../../../core/http/api-client.service';
import { KpiData } from '../components/kpi-card/kpi-card.component';

export type TimeseriesMetrics = Record<string, number>;

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  constructor(private readonly apiClient: ApiClientService) {}

  getDashboardKpis(): Observable<KpiData[]> {
    return forkJoin({
      totalRevenue: this.getTotalRevenue().pipe(catchError(() => of(0))),
      totalBookings: this.getTotalBookings().pipe(catchError(() => of(0))),
      activeUsers: this.getActiveUsers().pipe(catchError(() => of(0))),
      occupancyRate: this.getOccupancyRate().pipe(catchError(() => of(0)))
    }).pipe(
      map(({ totalRevenue, totalBookings, activeUsers, occupancyRate }): KpiData[] => [
        {
          title: 'Total Revenue',
          value: this.formatCurrency(totalRevenue),
          apiSource: 'Admin API · /api/admin/dashboard/total-revenue',
          // trendValue: '0.0%',
          // trendType: 'neutral' as const,
          icon: 'payments'
        },
        {
          title: 'Total Bookings',
          value: this.formatCount(totalBookings),
          apiSource: 'Admin API · /api/admin/dashboard/total-bookings',
          // trendValue: '0.0%',
          // trendType: 'neutral' as const,
          icon: 'confirmation_number'
        },
        {
          title: 'Active Users',
          value: this.formatCount(activeUsers),
          apiSource: 'Admin API · /api/admin/dashboard/active-users',
          // trendValue: '0.0%',
          // trendType: 'neutral' as const,
          icon: 'group'
        },
        {
          title: 'Occupancy Rate',
          value: this.formatPercentage(occupancyRate),
          apiSource: 'Admin API · /api/admin/dashboard/occupancy-rate',
          // trendValue: '0.0%',
          // trendType: 'neutral' as const,
          icon: 'theaters'
        }
      ])
    );
  }

  getTotalRevenue(): Observable<number> {
    return this.apiClient.get<number>('/api/admin/dashboard/total-revenue');
  }

  getTotalBookings(): Observable<number> {
    return this.apiClient.get<number>('/api/admin/dashboard/total-bookings');
  }

  getActiveUsers(): Observable<number> {
    return this.apiClient.get<number>('/api/admin/dashboard/active-users');
  }

  getOccupancyRate(): Observable<number> {
    return this.apiClient.get<number>('/api/admin/dashboard/occupancy-rate');
  }

  getMonthlyRevenue(): Observable<TimeseriesMetrics> {
    return this.apiClient.get<TimeseriesMetrics>('/api/admin/dashboard/monthly-revenue');
  }

  getWeeklyBookings(): Observable<TimeseriesMetrics> {
    return this.apiClient.get<TimeseriesMetrics>('/api/admin/dashboard/weekly-bookings');
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  private formatCount(value: number): string {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  }

  private formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
