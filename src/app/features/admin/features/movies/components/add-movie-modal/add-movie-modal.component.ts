import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  output,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { catchError, map, of } from 'rxjs';
import { MovieRow } from '../movies-management/movies-table/movies-table.component';
import { ApiClientService } from '../../../../../../core/http/api-client.service';
import { AdminGenreDto, AdminPagedResponse } from '../../../../admin-api.models';
import { MovieMediaService } from '../../services/movie-media.service';
import { MoviePayloadMapper } from '../../services/movie-payload-mapper.service';
import { MovieFormComponent } from '../movie-form/movie-form.component';
import { GenreOption } from '../genre-multi-select/genre-multi-select.component';

@Component({
  selector: 'app-add-movie-modal',
  standalone: true,
  imports: [ReactiveFormsModule, MovieFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-movie-modal.component.html',
  styleUrl: './add-movie-modal.component.scss',
})
export class AddMovieModalComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiClientService);
  private readonly payloadMapper = inject(MoviePayloadMapper);

  readonly closeModal = output<void>();
  readonly addMovie = output<MovieRow>();

  readonly genres = signal<GenreOption[]>([]);

  readonly movieForm = this.buildForm();

  ngOnInit(): void {
    this.loadGenres();
  }

  onFormSubmitted(form: FormGroup): void {
    const formValue = form.getRawValue();
    const genreNames = this.getSelectedGenreNames(formValue.genreIds);

    const movie = this.payloadMapper.toMovieRow(formValue, genreNames);

    console.log('Movie payload:', {
      movieName: movie.title,
      movieDescription: movie.description,
      movieDuration: movie.duration,
      releaseDate: movie.releaseDate,
      castMembers: movie.castMembers,
      movieAgeRating: movie.ageRating,
      movieRating: movie.internalRating,
      trailerUrl: movie.trailerUrl,
      moviePoster: movie.posterUrl,
      genreIds: movie.genreIds,
      imageUrls: movie.imageUrls,
      language: movie.language,
      status: movie.status,
    });

    this.addMovie.emit(movie);
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      title: this.fb.control(''),
      ageRating: this.fb.control('PG-13'),
      duration: this.fb.control(0),
      internalRating: this.fb.control(0),
      language: this.fb.control('English'),
      status: this.fb.control<MovieRow['status']>('ACTIVE'),
      releaseDate: this.fb.control(''),
      trailerUrl: this.fb.control(''),
      description: this.fb.control(''),
      genreIds: this.fb.control<number[]>([]),
      moviePoster: this.fb.control(''),
      imageUrls: this.fb.control<string[]>([]),
      castMembers: this.fb.array([]),
    });
  }

  private getSelectedGenreNames(genreIds: number[]): string[] {
    return this.genres()
      .filter((genre) => genreIds.includes(genre.id))
      .map((genre) => genre.name);
  }

  private loadGenres(): void {
    this.api
      .get<AdminPagedResponse<AdminGenreDto> | AdminGenreDto[]>('/api/admin/genres')
      .pipe(
        map((response) =>
          Array.isArray(response)
            ? response
            : (response.items ?? response.data ?? response.results ?? []),
        ),
        map((items) =>
          items
            .map((item) => ({
              id: Number(item.genreId),
              name: (item.genreName ?? '').trim(),
            }))
            .filter((item) => Number.isFinite(item.id) && item.name.length > 0),
        ),
        catchError(() => of([] as GenreOption[])),
      )
      .subscribe((genres) => {
        this.genres.set(genres);
      });
  }
}
