import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminDashboardService } from './admin-dashboard.service';

export interface WeeklyBookingsData {
  labels: string[];
  data: number[];
}

@Injectable({
  providedIn: 'root'
})
export class WeeklyBookingsService {
  private readonly adminDashboardService = inject(AdminDashboardService);

  getWeeklyBookings(): Observable<WeeklyBookingsData> {
    return this.adminDashboardService.getWeeklyBookings();
  }
}
