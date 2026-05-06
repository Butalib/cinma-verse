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
}

export interface GenresApiResponse {
  items?: GenreApiDto[];
  data?: GenreApiDto[];
  results?: GenreApiDto[];
  total?: number;
  count?: number;
}

@Injectable({ providedIn: 'root' })
export class GenresService {
  private readonly api = inject(ApiClientService);

  getGenres(params: {
    search: string;
    sort: string;
    page: number;
    pageSize: number;
  }): Observable<GenresApiResponse | GenreApiDto[]> {
    return this.api.get<GenresApiResponse | GenreApiDto[]>('/genres', params);
  }

  getGenreById(id: string): Observable<GenreApiDto> {
    return this.api.get<GenreApiDto>(`/genres/${id}`);
  }

  createGenre(payload: CreateGenrePayload): Observable<GenreApiDto> {
    return this.api.post<GenreApiDto, CreateGenrePayload>('/genres', payload);
  }

  updateGenre(id: string, payload: UpdateGenrePayload): Observable<GenreApiDto> {
    return this.api.put<GenreApiDto, UpdateGenrePayload>(`/genres/${id}`, payload);
  }

  deleteGenre(id: string): Observable<void> {
    return this.api.delete<void>(`/genres/${id}`);
  }
}
