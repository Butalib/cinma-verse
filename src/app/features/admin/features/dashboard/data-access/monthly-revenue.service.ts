import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminDashboardService } from './admin-dashboard.service';

export interface MonthlyRevenueData {
  labels: string[];
  data: number[];
}

@Injectable({
  providedIn: 'root'
})
export class MonthlyRevenueService {
  private readonly adminDashboardService = inject(AdminDashboardService);

  getMonthlyRevenue(): Observable<MonthlyRevenueData> {
    return this.adminDashboardService.getMonthlyRevenue();
  }
}
