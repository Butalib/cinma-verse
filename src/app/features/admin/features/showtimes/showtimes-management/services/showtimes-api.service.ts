import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../../../../core/http/api-client.service';
import type { ShowtimesTableRow } from '../components/showtimes-table/showtimes-table.component';

export interface CreateShowtimePayload {
  movieTitle: string;
  branchName: string;
  hallName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  totalSeats: number;
}

@Injectable({ providedIn: 'root' })
export class ShowtimesApiService {
  private readonly api = inject(ApiClientService);

  createShowtime(payload: CreateShowtimePayload): Observable<ShowtimesTableRow> {
    return this.api.post<ShowtimesTableRow, CreateShowtimePayload>('/showtimes', payload);
  }
}
