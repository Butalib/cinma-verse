import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../../../core/http/api-client.service';
import {
  AdminPagedResponse,
  AdminTicketCheckInResultDto,
  AdminTicketCheckResultDto,
  AdminTicketDetailsDto,
  AdminTicketListItemDto,
  AdminTicketStatus,
} from '../../../admin-api.models';

export interface TicketsQuery {
  status?: AdminTicketStatus;
  bookingId?: number;
  showtimeId?: number;
  userId?: number;
  startDate?: string;
  endDate?: string;
  ticketNumber?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class TicketsApiService {
  private readonly api = inject(ApiClientService);

  getTickets(query?: TicketsQuery): Observable<AdminPagedResponse<AdminTicketListItemDto>> {
    return this.api.get<AdminPagedResponse<AdminTicketListItemDto>>(
      '/api/admin/tickets',
      this.toPascalParams(this.normalizeQuery(query)),
    );
  }

  getTicketById(id: string | number): Observable<AdminTicketDetailsDto> {
    return this.api.get<AdminTicketDetailsDto>(`/api/admin/tickets/${id}`);
  }

  deleteTicket(id: string | number): Observable<void> {
    return this.api.delete<void>(`/api/admin/tickets/${id}`);
  }

  checkQr(qrToken: string): Observable<AdminTicketCheckResultDto> {
    return this.api.get<AdminTicketCheckResultDto>('/api/admin/tickets/check-qr', { qrToken });
  }

  checkIn(qrToken: string): Observable<AdminTicketCheckInResultDto> {
    return this.api.post<AdminTicketCheckInResultDto, Record<string, never>>(
      `/api/admin/tickets/check-in?qrToken=${encodeURIComponent(qrToken)}`,
      {},
    );
  }

  private toPascalParams<T extends object>(
    params?: T,
  ): Record<string, string | number | boolean> | undefined {
    if (!params) {
      return undefined;
    }

    const source = params as Record<string, unknown>;
    const mapped = Object.entries(source).reduce<Record<string, string | number | boolean>>(
      (acc, [key, value]) => {
        if (value === undefined || value === null || value === '') {
          return acc;
        }

        if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
          return acc;
        }

        const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
        acc[pascalKey] = value;
        return acc;
      },
      {},
    );

    return Object.keys(mapped).length ? mapped : undefined;
  }

  private normalizeQuery(query?: TicketsQuery): TicketsQuery | undefined {
    if (!query) {
      return undefined;
    }

    return {
      ...query,
      page: this.normalizePage(query.page),
      pageSize: this.normalizePageSize(query.pageSize),
    };
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
