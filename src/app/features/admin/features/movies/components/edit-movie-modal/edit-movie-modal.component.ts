import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { catchError, map, of } from 'rxjs';
import { ApiClientService } from '../../../../../../core/http/api-client.service';
import { AdminGenreDto, AdminPagedResponse } from '../../../../admin-api.models';
import { MovieRow } from '../movies-management/movies-table/movies-table.component';

interface GenreOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-edit-movie-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-movie-modal.component.html',
  styleUrl: './edit-movie-modal.component.scss',
})
export class EditMovieModalComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiClientService);

  readonly movie = input.required<MovieRow>();
  readonly closeModal = output<void>();
  readonly saveChanges = output<MovieRow>();

  readonly genres = signal<GenreOption[]>([]);
  readonly isGenreMenuOpen = signal(false);

  readonly selectedGenreNames = computed(() => {
    const selectedIds = this.movieForm.controls.genreIds.value ?? [];
    const names = this.genres()
      .filter((genre) => selectedIds.includes(genre.id))
      .map((genre) => genre.name);

    if (names.length === 0) {
      return 'Select genres';
    }

    if (names.length <= 2) {
      return names.join(', ');
    }

    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  });

  // Cast tags
  readonly castMembers = signal<string[]>([]);
  readonly castInput = signal('');

  readonly movieForm = this.fb.group({
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
    cast: this.fb.control<string[]>([]),
  });

  ngOnInit(): void {
    this.initializeForm();
    this.loadGenres();
  }

  addCast(): void {
    const value = this.castInput().trim().replace(/,$/, '');
    if (!value || this.castMembers().includes(value)) {
      this.castInput.set('');
      return;
    }

    this.castMembers.update((arr) => [...arr, value]);
    this.movieForm.controls.cast.setValue(this.castMembers());
    this.castInput.set('');
  }

  removeCast(member: string): void {
    this.castMembers.update((arr) => arr.filter((m) => m !== member));
    this.movieForm.controls.cast.setValue(this.castMembers());
  }

  toggleGenreMenu(): void {
    this.isGenreMenuOpen.update((value) => !value);
  }

  closeGenreMenu(): void {
    this.isGenreMenuOpen.set(false);
  }

  isGenreSelected(genreId: number): boolean {
    return (this.movieForm.controls.genreIds.value ?? []).includes(genreId);
  }

  toggleGenreSelection(genreId: number): void {
    const current = this.movieForm.controls.genreIds.value ?? [];
    const next = current.includes(genreId)
      ? current.filter((id) => id !== genreId)
      : [...current, genreId];

    this.movieForm.controls.genreIds.setValue(next);
  }

  onSubmit(): void {
    const formValue = this.movieForm.getRawValue();
    const selectedGenreIds = (formValue.genreIds ?? [])
      .map((genreId) => Number(genreId))
      .filter((genreId) => Number.isFinite(genreId));

    const selectedGenres = this.genres()
      .filter((genre) => selectedGenreIds.includes(genre.id))
      .map((genre) => genre.name);

    const updated: MovieRow = {
      ...this.movie(),
      title: formValue.title.trim() || this.movie().title,
      genres: selectedGenres,
      genreIds: selectedGenreIds,
      ageRating: formValue.ageRating || this.movie().ageRating,
      duration: Number(formValue.duration) || this.movie().duration,
      language: formValue.language || this.movie().language,
      status: (formValue.status || this.movie().status) as MovieRow['status'],
      releaseDate: formValue.releaseDate || this.movie().releaseDate,
      internalRating: Number(formValue.internalRating) || this.movie().internalRating,
      trailerUrl: formValue.trailerUrl || this.movie().trailerUrl,
      description: formValue.description || this.movie().description,
      cast: this.castMembers(),
    };

    this.saveChanges.emit(updated);
  }

  private initializeForm(): void {
    const movie = this.movie();
    this.castMembers.set([...movie.cast]);

    this.movieForm.patchValue({
      title: movie.title,
      ageRating: movie.ageRating,
      duration: movie.duration,
      internalRating: movie.internalRating,
      language: movie.language,
      status: movie.status,
      releaseDate: movie.releaseDate,
      trailerUrl: movie.trailerUrl,
      description: movie.description,
      genreIds: movie.genreIds ?? [],
      cast: [...movie.cast],
    });
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
        const existingGenreIds = this.movieForm.controls.genreIds.value ?? [];
        if (existingGenreIds.length > 0) {
          return;
        }

        if (!movie.genres.length) {
          return;
        }

        const idsFromNames = items
          .filter((genre) => movie.genres.includes(genre.name))
          .map((genre) => genre.id);

        this.movieForm.controls.genreIds.setValue(idsFromNames);
      });
  }
}
