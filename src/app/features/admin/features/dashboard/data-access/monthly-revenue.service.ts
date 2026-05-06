import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MonthlyRevenueData {
  labels: string[];
  data: number[];
}

@Injectable({
  providedIn: 'root'
})
export class MonthlyRevenueService {
  private readonly http = inject(HttpClient);

  getMonthlyRevenue(): Observable<MonthlyRevenueData> {
    return this.http.get<MonthlyRevenueData>('/api/admin/dashboard/monthly-revenue');
  }
}
