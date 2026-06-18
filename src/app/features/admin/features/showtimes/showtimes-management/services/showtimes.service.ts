import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClientService } from '../../../../../../core/http/api-client.service';
import { AdminShowtimeDto } from '../../../../admin-api.models';

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
    return this.api
      .get<AdminShowtimeDto>(`/api/admin/showtimes/${this.extractNumericId(id) ?? id}`)
      .pipe(map((dto) => this.mapDetails(dto, id)));
  }

  updateShowtime(id: string, payload: UpdateShowtimePayload): Observable<ShowtimeDetailsResponse> {
    const showStartTime = `${payload.date}T${payload.startTime}:00`;

    return this.api
      .put<void, { showStartTime?: string; price?: number }>(
        `/api/admin/showtimes/${this.extractNumericId(id) ?? id}`,
        {
          showStartTime,
          price: payload.price,
        },
      )
      .pipe(
        map(() => ({
          id,
          date: payload.date,
          startTime: payload.startTime,
          endTime: payload.endTime,
          price: payload.price,
          totalSeats: payload.totalSeats,
          status: payload.status,
        })),
      );
  }

  deleteShowtime(id: string): Observable<void> {
    return this.api.delete<void>(`/api/admin/showtimes/${this.extractNumericId(id) ?? id}`);
  }

  private mapDetails(dto: AdminShowtimeDto, fallbackId: string): ShowtimeDetailsResponse {
    const start = dto.showStartTime ? new Date(dto.showStartTime) : null;
    const end = dto.showEndTime ? new Date(dto.showEndTime) : null;

    return {
      id: dto.id ? `SHW-${dto.id}` : fallbackId,
      movieTitle: dto.movieName ?? dto.movieTitle ?? '',
      branchName: dto.branchName ?? '',
      hallName: dto.hallNumber ? `Hall ${dto.hallNumber}` : '',
      date: start && !Number.isNaN(start.getTime()) ? start.toISOString().slice(0, 10) : '',
      startTime:
        start && !Number.isNaN(start.getTime())
          ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          : '',
      endTime:
        end && !Number.isNaN(end.getTime())
          ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          : '',
      price: dto.price ?? 0,
      availableSeats: dto.availableSeats ?? 0,
      totalSeats: dto.totalSeats ?? dto.totalTickets ?? 0,
      status: 'SCHEDULED',
      createdAt: dto.createdAt ? dto.createdAt.slice(0, 10) : '',
    };
  }

  private extractNumericId(value: string): number | null {
    const match = value.match(/\d+/);
    if (!match) {
      return null;
    }

    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
