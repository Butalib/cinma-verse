import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { MovieFiltersComponent } from '../movie-filters/movie-filters';
import { MovieCardComponent } from '../movie-card/movie-card';
import { MoviesService } from '../../../../../user-core/user-services/user-movie/user-movie';

@Component({
  selector: 'app-now-showing',
  standalone: true,
  imports: [MovieFiltersComponent, MovieCardComponent, AsyncPipe],
  templateUrl: './now-showing.html',
  styleUrl: './now-showing.css'
})
export class NowShowingComponent {
  private readonly moviesService = inject(MoviesService);

  readonly movies$ = this.moviesService.getMovies().pipe(
    catchError(() => of([]))
  );
}
