import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE_URL } from '../../../../../core/config/api.config';
import { IMovie } from './movie-interface';
import { IMoviesResponse } from './movie-response';

@Injectable({
  providedIn: 'root'
})
export class MoviesService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${API_BASE_URL}/api/movies`;
  

  getMovies(): Observable<IMovie[]> {
    return this.http.get<IMoviesResponse>(this.apiUrl).pipe(
      map((response: IMoviesResponse) => response.movies)
    );
  }

  getMoviesWithPagination(): Observable<IMoviesResponse> {
    return this.http.get<IMoviesResponse>(this.apiUrl);
  }
}