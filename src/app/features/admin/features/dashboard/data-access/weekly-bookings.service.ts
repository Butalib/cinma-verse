import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WeeklyBookingsData {
  labels: string[];
  data: number[];
}

@Injectable({
  providedIn: 'root'
})
export class WeeklyBookingsService {
  private readonly http = inject(HttpClient);

  getWeeklyBookings(): Observable<WeeklyBookingsData> {
    return this.http.get<WeeklyBookingsData>('/api/admin/dashboard/weekly-bookings');
  }
}
