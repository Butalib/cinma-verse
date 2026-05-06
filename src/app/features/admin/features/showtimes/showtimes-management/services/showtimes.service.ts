import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../../../../core/http/api-client.service';

export interface ShowtimeDetailsResponse {
  id?: string;
  movieTitle?: string;
  branchName?: string;
  hallName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  availableSeats?: number;
  totalSeats?: number;
  status?: string;
  createdAt?: string;
}

export interface UpdateShowtimePayload {
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  totalSeats: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ShowtimesService {
  private readonly api = inject(ApiClientService);

  getShowtimeById(id: string): Observable<ShowtimeDetailsResponse> {
    return this.api.get<ShowtimeDetailsResponse>(`/showtimes/${id}`);
  }

  updateShowtime(id: string, payload: UpdateShowtimePayload): Observable<ShowtimeDetailsResponse> {
    return this.api.put<ShowtimeDetailsResponse, UpdateShowtimePayload>(`/showtimes/${id}`, payload);
  }

  deleteShowtime(id: string): Observable<void> {
    return this.api.delete<void>(`/showtimes/${id}`);
  }
}
