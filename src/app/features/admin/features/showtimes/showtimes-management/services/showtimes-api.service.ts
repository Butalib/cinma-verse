import { Injectable, inject } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { ApiClientService } from '../../../../../../core/http/api-client.service';
import type { ShowtimesTableRow } from '../components/showtimes-table/showtimes-table.component';
import { AdminPagedResponse, AdminShowtimeDto } from '../../../../admin-api.models';

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

  getShowtimes(query?: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    movieId?: number;
    hallId?: number;
    branchId?: number;
  }): Observable<ShowtimesTableRow[]> {
    const page = this.normalizePage(query?.page);
    const pageSize = this.normalizePageSize(query?.pageSize);

    const params: Record<string, string | number | boolean> = {
      Page: page,
      PageSize: pageSize,
    };

    const searchTerm = query?.searchTerm?.trim();
    if (searchTerm) {
      params['SearchTerm'] = searchTerm;
    }

    if (query?.movieId && query.movieId > 0) {
      params['MovieId'] = query.movieId;
    }

    if (query?.hallId && query.hallId > 0) {
      params['HallId'] = query.hallId;
    }

    if (query?.branchId && query.branchId > 0) {
      params['BranchId'] = query.branchId;
    }

    return this.api
      .get<AdminPagedResponse<AdminShowtimeDto>>('/api/admin/showtimes', params)
      .pipe(
        map((response) =>
          (response.items ?? response.data ?? response.results ?? []).map((item) =>
            this.mapRow(item),
          ),
        ),
      );
  }

  createShowtime(payload: CreateShowtimePayload): Observable<ShowtimesTableRow> {
    const showStartTime = `${payload.date}T${payload.startTime}:00`;
    const movieId = this.extractNumericId(payload.movieTitle);
    const hallId = this.extractNumericId(payload.hallName);
    const branchId = this.extractNumericId(payload.branchName) ?? undefined;

    if (!movieId || !hallId) {
      return throwError(
        () =>
          new Error(
            'Create showtime requires numeric movieId and hallId. Current form values are display labels.',
          ),
      );
    }

    return this.api
      .post<
        AdminShowtimeDto,
        { movieId: number; hallId: number; branchId?: number; showStartTime: string; price: number }
      >('/api/admin/showtimes', {
        movieId,
        hallId,
        branchId,
        showStartTime,
        price: payload.price,
      })
      .pipe(map((dto) => this.mapRow(dto)));
  }

  private mapRow(dto: AdminShowtimeDto): ShowtimesTableRow {
    const start = dto.showStartTime ? new Date(dto.showStartTime) : null;
    const end = dto.showEndTime ? new Date(dto.showEndTime) : null;
    const createdAt = dto.createdAt ? new Date(dto.createdAt) : null;

    return {
      id: dto.id ? `SHW-${dto.id}` : `SHW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      movieTitle: dto.movieName ?? dto.movieTitle ?? 'Unknown movie',
      branchName: dto.branchName ?? '—',
      hallName: dto.hallNumber ? `Hall ${dto.hallNumber}` : '—',
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
      status: this.mapStatus(start),
      createdAt:
        createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toISOString().slice(0, 10) : '',
    };
  }

  private mapStatus(start: Date | null): ShowtimesTableRow['status'] {
    if (!start || Number.isNaN(start.getTime())) {
      return 'SCHEDULED';
    }

    const now = Date.now();
    const startMs = start.getTime();
    if (startMs < now) {
      return 'NOW_SHOWING';
    }

    return 'SCHEDULED';
  }

  private extractNumericId(value: string): number | null {
    const match = value.match(/\d+/);
    if (!match) {
      return null;
    }

    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizePage(page?: number): number {
    if (!page || !Number.isFinite(page)) {
      return 1;
    }

    return Math.max(1, Math.floor(page));
  }

  private normalizePageSize(pageSize?: number): number {
    if (!pageSize || !Number.isFinite(pageSize)) {
      return 100;
    }

    return Math.min(100, Math.max(1, Math.floor(pageSize)));
  }
}
