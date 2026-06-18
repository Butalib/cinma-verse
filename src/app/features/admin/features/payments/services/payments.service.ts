import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../../../core/http/api-client.service';
import {
  AdminPagedResponse,
  AdminPaymentDto,
  AdminPaymentSummaryDto,
  AdminPaymentStatus,
} from '../../../admin-api.models';

export interface PaymentsQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  bookingId?: number;
  userId?: number;
  status?: AdminPaymentStatus;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly api = inject(ApiClientService);

  getPayments(query?: PaymentsQuery): Observable<AdminPagedResponse<AdminPaymentDto>> {
    return this.api.get<AdminPagedResponse<AdminPaymentDto>>(
      '/api/admin/payments',
      this.toPascalParams(this.normalizeQuery(query)),
    );
  }

  getPaymentById(id: string | number): Observable<AdminPaymentDto> {
    return this.api.get<AdminPaymentDto>(`/api/admin/payments/${id}`);
  }

  getSummary(): Observable<AdminPaymentSummaryDto> {
    return this.api.get<AdminPaymentSummaryDto>('/api/admin/payments/summary');
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

  private normalizeQuery(query?: PaymentsQuery): PaymentsQuery | undefined {
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
