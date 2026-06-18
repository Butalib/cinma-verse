import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../../../core/http/api-client.service';

import type { CreateGenrePayload, UpdateGenrePayload } from '../models/genre.model';

export interface GenreApiDto {
  id?: string;
  name?: string;
  moviesCount?: number;
  movieCount?: number;
  totalMovies?: number;
  createdAt?: string;
  created_at?: string;
  genreId?: number;
  genreName?: string;
}

export interface GenresApiResponse {
  items?: GenreApiDto[];
  data?: GenreApiDto[];
  results?: GenreApiDto[];
  total?: number;
  count?: number;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

@Injectable({ providedIn: 'root' })
export class GenresService {
  private readonly api = inject(ApiClientService);

  getGenres(params: {
    search: string;
    sort: string;
    page: number;
    pageSize: number;
  }): Observable<GenresApiResponse> {
    return this.api.get<GenresApiResponse>('/api/admin/genres', {
      SearchTerm: params.search,
      SortBy: this.mapSortBy(params.sort),
      SortOrder: this.mapSortOrder(params.sort),
      Page: params.page,
      PageSize: params.pageSize,
    });
  }

  getGenreById(id: string): Observable<GenreApiDto> {
    return this.api.get<GenreApiDto>(`/api/admin/genres/${this.extractNumericId(id) ?? id}`);
  }

  createGenre(payload: CreateGenrePayload): Observable<GenreApiDto> {
    return this.api.post<GenreApiDto, { genreName: string }>('/api/admin/genres', {
      genreName: payload.name,
    });
  }

  updateGenre(id: string, payload: UpdateGenrePayload): Observable<void> {
    return this.api.put<void, { genreName: string }>(
      `/api/admin/genres/${this.extractNumericId(id) ?? id}`,
      {
        genreName: payload.name,
      },
    );
  }

  deleteGenre(id: string): Observable<void> {
    return this.api.delete<void>(`/api/admin/genres/${this.extractNumericId(id) ?? id}`);
  }

  private mapSortBy(sort: string): string {
    return sort.includes('name') ? 'GenreName' : 'GenreName';
  }

  private mapSortOrder(sort: string): string {
    return sort.endsWith('desc') ? 'desc' : 'asc';
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
