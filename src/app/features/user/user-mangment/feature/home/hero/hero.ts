import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../../../../../../core/config/api.config';
import { IMovie } from '../../../../user-core/user-services/user-movie/movie-interface';
import { MoviesService } from '../../../../user-core/user-services/user-movie/user-movie';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './hero.html',
  styleUrl: './hero.css'
})
export class HeroBannerComponent {

  private readonly moviesService = inject(MoviesService);

  readonly movie$ = this.moviesService.getMovies().pipe(
    map((movies) => {
      if (!movies.length) {
        return null;
      }

      return {
        ...movies[0],
        moviePosterImageUrl: this.resolvePosterUrl(movies[0].moviePosterImageUrl)
      } satisfies IMovie;
    }),
    catchError((error) => {
      console.error('Hero movie load failed:', error);
      return of(null);
    })
  );

  private resolvePosterUrl(posterUrl: string): string {
    if (posterUrl.startsWith('http://') || posterUrl.startsWith('https://')) {
      return posterUrl;
    }

    return `${API_BASE_URL}${posterUrl}`;
  }
}
