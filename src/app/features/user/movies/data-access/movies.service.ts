import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../../core/http/api-client.service';

export interface MovieDto {
  id: number;
  title: string;
  genre?: string;
}

@Injectable({ providedIn: 'root' })
export class MoviesService {
  constructor(private readonly apiClient: ApiClientService) {}

  getMovies(): Observable<MovieDto[]> {
    return this.apiClient.get<MovieDto[]>('/api/movies');
  }

  getMovieById(id: string): Observable<MovieDto> {
    return this.apiClient.get<MovieDto>(`/api/movies/${id}`);
  }
}
