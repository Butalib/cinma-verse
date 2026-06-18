import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
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
  selector: 'app-add-movie-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-movie-modal.component.html',
  styleUrl: './add-movie-modal.component.scss',
})
export class AddMovieModalComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiClientService);

  readonly closeModal = output<void>();
  readonly addMovie = output<MovieRow>();

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

  getGenreName(id: number): string {
    return this.genres().find((g) => g.id === id)?.name || '';
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
    const now = new Date();

    const selectedGenreIds = (formValue.genreIds ?? [])
      .map((genreId) => Number(genreId))
      .filter((genreId) => Number.isFinite(genreId));

    const selectedGenres = this.genres()
      .filter((genre) => selectedGenreIds.includes(genre.id))
      .map((genre) => genre.name);

    const movie: MovieRow = {
      id: `MOV-${now.getTime()}`,
      title: formValue.title.trim() || 'Untitled',
      genres: selectedGenres,
      genreIds: selectedGenreIds,
      ageRating: formValue.ageRating || 'PG',
      duration: Number(formValue.duration) || 0,
      language: formValue.language || 'English',
      status: (formValue.status || 'ACTIVE') as MovieRow['status'],
      releaseDate: formValue.releaseDate || now.toISOString().slice(0, 10),
      internalRating: Number(formValue.internalRating) || 0,
      trailerUrl: formValue.trailerUrl || '',
      posterUrl: '',
      description: formValue.description || '',
      cast: this.castMembers(),
    };

    this.addMovie.emit(movie);
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
      });
  }
}
