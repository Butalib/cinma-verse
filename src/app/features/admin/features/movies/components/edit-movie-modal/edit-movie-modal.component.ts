import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { catchError, map, of } from 'rxjs';
import { MovieRow } from '../movies-management/movies-table/movies-table.component';
import { ApiClientService } from '../../../../../../core/http/api-client.service';
import { AdminGenreDto, AdminPagedResponse } from '../../../../admin-api.models';
import { MoviePayloadMapper } from '../../services/movie-payload-mapper.service';
import { MovieFormComponent } from '../movie-form/movie-form.component';
import { GenreOption } from '../genre-multi-select/genre-multi-select.component';

@Component({
  selector: 'app-edit-movie-modal',
  standalone: true,
  imports: [ReactiveFormsModule, MovieFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-movie-modal.component.html',
  styleUrl: './edit-movie-modal.component.scss',
})
export class EditMovieModalComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiClientService);
  private readonly payloadMapper = inject(MoviePayloadMapper);

  readonly movie = input.required<MovieRow>();
  readonly closeModal = output<void>();
  readonly saveChanges = output<MovieRow>();

  readonly genres = signal<GenreOption[]>([]);

  readonly movieForm = this.buildForm();

  ngOnInit(): void {
    this.initializeForm();
    this.loadGenres();
  }

  onFormSubmitted(form: FormGroup): void {
    const formValue = form.getRawValue();
    const existing = this.movie();
    const genreNames = this.getSelectedGenreNames(formValue.genreIds);

    const updated = this.payloadMapper.toMovieRow(formValue, genreNames, existing);

    console.log('Update payload:', {
      movieName: updated.title,
      movieDescription: updated.description,
      movieDuration: updated.duration,
      releaseDate: updated.releaseDate,
      castMembers: updated.castMembers,
      movieAgeRating: updated.ageRating,
      movieRating: updated.internalRating,
      trailerUrl: updated.trailerUrl,
      moviePoster: updated.posterUrl,
      genreIds: updated.genreIds,
      imageUrls: updated.imageUrls,
      language: updated.language,
      status: updated.status,
    });

    this.saveChanges.emit(updated);
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

  private initializeForm(): void {
    const movie = this.movie();
    this.payloadMapper.patchFormFromMovie(this.movieForm, movie);
    this.payloadMapper.populateCastMembers(
      this.movieForm.get('castMembers') as any,
      this.fb,
      movie,
    );
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
      .subscribe((items) => {
        this.genres.set(items);

        const movie = this.movie();
        const existingGenreIds = this.movieForm.get('genreIds')?.value ?? [];
        if (existingGenreIds.length === 0 && movie.genres.length > 0) {
          const idsFromNames = this.payloadMapper.resolveGenreIdsFromNames(items, movie.genres);
          this.movieForm.get('genreIds')?.setValue(idsFromNames);
        }
      });
  }
}
