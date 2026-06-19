import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Genre, UpdateGenrePayload } from '../models/genre.model';
import { GenreApiDto, GenresService } from '../services/genres.service';

@Injectable()
export class GenreDetailsFacade {
  private readonly genresService = inject(GenresService);
  private readonly router = inject(Router);

  private readonly _genre = signal<Genre | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly genre = this._genre.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();

  readonly headerSubtitle = computed(() => {
    const genre = this._genre();
    if (!genre) {
      return '';
    }

    return `${genre.id} Â· ${genre.moviesCount} movies`;
  });

  loadGenreById(id: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.genresService.getGenreById(id).subscribe({
      next: (response) => {
        this._genre.set(this.mapGenre(response, id));
        this._loading.set(false);
      },
      error: () => {
        this._genre.set(null);
        this._loading.set(false);
        this._error.set('Genre not found.');
      },
    });
  }

  updateGenre(id: string, payload: UpdateGenrePayload): void {
    this._saving.set(true);
    this._error.set(null);

    this.genresService.updateGenre(id, payload).subscribe({
      next: () => {
        this._saving.set(false);

        const current = this._genre();
        if (current) {
          this._genre.set({
            ...current,
            name: payload.name,
          });
        }
      },
      error: () => {
        this._saving.set(false);

        const current = this._genre();
        if (current) {
          this._genre.set({
            ...current,
            name: payload.name,
          });
          return;
        }

        this._error.set('Failed to update genre.');
      },
    });
  }

  deleteGenre(id: string): void {
    const confirmed = window.confirm('Are you sure you want to delete this genre?');
    if (!confirmed) {
      return;
    }

    this._saving.set(true);

    this.genresService.deleteGenre(id).subscribe({
      next: () => {
        this._saving.set(false);
        this.goBack();
      },
      error: () => {
        this._saving.set(false);
        this.goBack();
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/admin', 'genres']);
  }

  navigateToEdit(id: string): void {
    this.router.navigate(['/admin', 'genres', id, 'edit']);
  }

  navigateToView(id: string): void {
    this.router.navigate(['/admin', 'genres', id]);
  }

  private mapGenre(dto: GenreApiDto, fallbackId: string): Genre {
    const numericId = typeof dto.genreId === 'number' ? dto.genreId : null;

    return {
      id: dto.id ?? (numericId !== null ? `GEN-${String(numericId).padStart(3, '0')}` : fallbackId),
      name: dto.genreName ?? dto.name ?? 'Untitled Genre',
      moviesCount: dto.moviesCount ?? dto.movieCount ?? dto.totalMovies ?? 0,
      createdAt: dto.createdAt ?? dto.created_at ?? '',
    };
  }
}
