import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../../../core/http/api-client.service';
import {
  AdminBranchDto,
  AdminBranchSummaryDto,
  AdminHallDto,
  AdminPagedResponse,
} from '../../../admin-api.models';

export interface BranchesQuery {
  searchTerm?: string;
  branchName?: string;
  location?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BranchUpsertPayload {
  branchName: string;
  branchLocation: string;
}

export interface HallsQuery {
  searchTerm?: string;
  branchId?: number;
  hallNumber?: string;
  capacity?: string;
  hallType?: string;
  hallStatus?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface HallUpsertPayload {
  branchId: number;
  hallNumber: string;
  hallStatus: string;
  hallType: string;
}

@Injectable({ providedIn: 'root' })
export class BranchesService {
  private readonly api = inject(ApiClientService);

  getBranches(query?: BranchesQuery): Observable<AdminPagedResponse<AdminBranchDto>> {
    return this.api.get<AdminPagedResponse<AdminBranchDto>>(
      '/api/admin/branches',
      this.toPascalParams(query),
    );
  }

  getBranchSummary(): Observable<AdminBranchSummaryDto> {
    return this.api.get<AdminBranchSummaryDto>('/api/admin/branches/summary');
  }

  createBranch(payload: BranchUpsertPayload): Observable<AdminBranchDto> {
    return this.api.post<AdminBranchDto, BranchUpsertPayload>('/api/admin/branches', payload);
  }

  getBranchById(id: string | number): Observable<AdminBranchDto> {
    return this.api.get<AdminBranchDto>(`/api/admin/branches/${id}`);
  }

  updateBranch(id: string | number, payload: BranchUpsertPayload): Observable<void> {
    return this.api.put<void, BranchUpsertPayload>(`/api/admin/branches/${id}`, payload);
  }

  deleteBranch(id: string | number): Observable<void> {
    return this.api.delete<void>(`/api/admin/branches/${id}`);
  }

  getHalls(query?: HallsQuery): Observable<AdminPagedResponse<AdminHallDto>> {
    return this.api.get<AdminPagedResponse<AdminHallDto>>(
      '/api/admin/halls',
      this.toPascalParams(query),
    );
  }

  createHall(payload: HallUpsertPayload): Observable<AdminHallDto> {
    return this.api.post<AdminHallDto, HallUpsertPayload>('/api/admin/halls', payload);
  }

  getHallById(id: string | number): Observable<AdminHallDto> {
    return this.api.get<AdminHallDto>(`/api/admin/halls/${id}`);
  }

  updateHall(id: string | number, payload: HallUpsertPayload): Observable<void> {
    return this.api.put<void, HallUpsertPayload>(`/api/admin/halls/${id}`, payload);
  }

  deleteHall(id: string | number): Observable<void> {
    return this.api.delete<void>(`/api/admin/halls/${id}`);
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
}
