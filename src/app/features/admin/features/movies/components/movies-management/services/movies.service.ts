import { Injectable, inject, signal } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { ApiClientService } from '../../../../../../../core/http/api-client.service';
import {
  AdminMovieDto,
  AdminMovieSummaryDto,
  AdminPagedResponse,
} from '../../../../../admin-api.models';
import { MovieRow } from '../movies-table/movies-table.component';

@Injectable({
  providedIn: 'root',
})
export class MoviesService {
  private readonly api = inject(ApiClientService);
  private readonly movies = signal<MovieRow[]>([]);

  constructor() {
    this.loadMockData();
    this.loadFromApi();
  }

  private loadMockData(): void {
    const mockMovies: MovieRow[] = [
      {
        id: 'MOV-1001',
        title: 'Dune: Part Two',
        genres: ['Sci-Fi', 'Adventure'],
        ageRating: 'PG-13',
        duration: 166,
        language: 'English',
        status: 'ACTIVE',
        releaseDate: '2024-03-01',
        internalRating: 8.8,
        trailerUrl: 'https://youtube.com/watch?v=Way9Dexny3w',
        posterUrl: '',
        description:
          'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Josh Brolin'],
      },
      {
        id: 'MOV-1002',
        title: 'Oppenheimer',
        genres: ['Drama', 'History'],
        ageRating: 'R',
        duration: 180,
        language: 'English',
        status: 'ACTIVE',
        releaseDate: '2023-07-21',
        internalRating: 9.0,
        trailerUrl: 'https://youtube.com/watch?v=uYPbbksJxIg',
        posterUrl: '',
        description: 'The story of J. Robert Oppenheimer and the development of the atomic bomb.',
        cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
      },
      {
        id: 'MOV-1003',
        title: 'Inside Out 2',
        genres: ['Animation', 'Family'],
        ageRating: 'PG',
        duration: 100,
        language: 'English',
        status: 'ACTIVE',
        releaseDate: '2024-06-14',
        internalRating: 7.9,
        trailerUrl: '',
        posterUrl: '',
        description:
          "Riley's mind expands with new emotions as she faces the joys and challenges of teenage life.",
        cast: ['Amy Poehler', 'Maya Hawke', 'Kensington Tallman'],
      },
    ];
    this.movies.set(mockMovies);
  }

  private loadFromApi(): void {
    this.api
      .get<AdminPagedResponse<AdminMovieDto>>('/api/admin/movies', {
        Page: 1,
        PageSize: 100,
      })
      .pipe(
        map((response) =>
          (response.items ?? response.data ?? response.results ?? []).map((item) =>
            this.mapMovie(item),
          ),
        ),
        catchError(() => of([])),
      )
      .subscribe((items) => {
        if (items.length > 0) {
          this.movies.set(items);
        }
      });
  }

  getSummary() {
    return this.api.get<AdminMovieSummaryDto>('/api/admin/movies/summary');
  }

  getAllMovies() {
    return this.movies.asReadonly();
  }

  addMovie(movie: Omit<MovieRow, 'id'>): string {
    const localId = this.generateNextId();
    const newMovie: MovieRow = { ...movie, id: localId };

    this.api
      .post<unknown, Record<string, unknown>>('/api/admin/movies', this.toCreatePayload(movie))
      .pipe(
        catchError((error) => {
          console.error('Create movie API failed', {
            status: error?.status,
            message: error?.message,
            details: error?.error,
          });
          return of(null);
        }),
      )
      .subscribe();

    this.movies.update((movies) => [newMovie, ...movies]);
    return localId;
  }

  updateMovie(updatedMovie: MovieRow): void {
    const numericId = this.extractNumericId(updatedMovie.id);

    if (numericId !== null) {
      this.api
        .put<void, Record<string, unknown>>(
          `/api/admin/movies/${numericId}`,
          this.toUpdatePayload(updatedMovie),
        )
        .pipe(catchError(() => of(null)))
        .subscribe();
    }

    this.movies.update((movies) =>
      movies.map((movie) => (movie.id === updatedMovie.id ? updatedMovie : movie)),
    );
  }

  deleteMovie(id: string): void {
    const numericId = this.extractNumericId(id);

    if (numericId !== null) {
      this.api
        .delete<void>(`/api/admin/movies/${numericId}`)
        .pipe(catchError(() => of(undefined)))
        .subscribe();
    }

    this.movies.update((movies) => movies.filter((movie) => movie.id !== id));
  }

  getMovieById(id: string): MovieRow | undefined {
    return this.movies().find((movie) => movie.id === id);
  }

  getMovieByIdFromApi(id: string): Observable<MovieRow | null> {
    const numericId = this.extractNumericId(id);
    if (numericId === null) {
      return of(null);
    }

    return this.api.get<AdminMovieDto>(`/api/admin/movies/${numericId}`).pipe(
      map((dto) => this.mapMovie(dto)),
      catchError(() => of(null)),
    );
  }

  private mapMovie(dto: AdminMovieDto): MovieRow {
    const duration = this.toDurationMinutes(dto.movieDuration);

    return {
      id: dto.movieId
        ? `MOV-${dto.movieId}`
        : `MOV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      title: dto.movieName ?? 'Untitled',
      genres: (dto.genres ?? [])
        .map((genre) => genre.name ?? '')
        .filter((name): name is string => Boolean(name)),
      genreIds: (dto.genres ?? [])
        .map((genre) => genre.genreId)
        .filter((genreId): genreId is number => typeof genreId === 'number'),
      ageRating: dto.movieAgeRating ?? 'PG',
      duration,
      language: dto.language ?? 'English',
      status: this.mapStatus(dto.status),
      releaseDate: dto.releaseDate ?? new Date().toISOString().slice(0, 10),
      internalRating: dto.movieRating ?? 0,
      trailerUrl: dto.trailerUrl ?? '',
      posterUrl: dto.moviePoster ?? '',
      description: dto.movieDescription ?? '',
      cast: (dto.castMembers ?? []).map((member) => member.personName ?? '').filter(Boolean),
    };
  }

  private mapStatus(status?: string): MovieRow['status'] {
    const normalized = (status ?? '').toLowerCase();
    if (normalized.includes('coming')) {
      return 'COMING_SOON';
    }
    if (
      normalized.includes('draft') ||
      normalized.includes('archived') ||
      normalized.includes('inactive')
    ) {
      return 'INACTIVE';
    }
    return 'ACTIVE';
  }

  private toDurationMinutes(duration: AdminMovieDto['movieDuration']): number {
    if (!duration) {
      return 0;
    }

    if (typeof duration === 'string') {
      const parts = duration.split(':').map((item) => Number(item));
      if (parts.length >= 2 && parts.every((item) => Number.isFinite(item))) {
        return parts[0] * 60 + parts[1];
      }
      return 0;
    }

    if (typeof duration.totalMinutes === 'number' && Number.isFinite(duration.totalMinutes)) {
      return Math.max(0, Math.round(duration.totalMinutes));
    }

    if (typeof duration.ticks === 'number' && Number.isFinite(duration.ticks)) {
      const minutesFromTicks = duration.ticks / (60 * 10_000_000);
      return Math.max(0, Math.round(minutesFromTicks));
    }

    const hours = Number(duration.hours ?? 0);
    const minutes = Number(duration.minutes ?? 0);
    if (Number.isFinite(hours) || Number.isFinite(minutes)) {
      return Math.max(0, hours * 60 + minutes);
    }

    return 0;
  }

  private toCreatePayload(movie: Omit<MovieRow, 'id'>): Record<string, unknown> {
    return {
      movieName: movie.title,
      movieDescription: movie.description || 'No description provided.',
      movieDuration: this.toTimeSpanString(movie.duration),
      releaseDate: movie.releaseDate,
      castMembers: movie.cast.map((name, index) => ({
        personName: name,
        imageUrl: '',
        roleType: 'Actor',
        characterName: '',
        displayOrder: index,
        isLead: index === 0,
      })),
      movieAgeRating: this.toApiAgeRating(movie.ageRating),
      movieRating: movie.internalRating,
      trailerUrl: movie.trailerUrl || '',
      moviePoster: movie.posterUrl || '',
      genreIds: movie.genreIds ?? [],
      imageUrls: [],
      language: movie.language,
      status: this.toApiCreateStatus(movie.status),
    };
  }

  private toUpdatePayload(movie: MovieRow): Record<string, unknown> {
    return {
      movieName: movie.title,
      movieDescription: movie.description,
      movieDuration: this.toTimeSpanString(movie.duration),
      releaseDate: movie.releaseDate,
      castMembers: movie.cast.map((name, index) => ({
        personName: name,
        imageUrl: '',
        roleType: 'Actor',
        characterName: '',
        displayOrder: index,
        isLead: index === 0,
      })),
      movieAgeRating: this.toApiAgeRating(movie.ageRating),
      movieRating: movie.internalRating,
      trailerUrl: movie.trailerUrl || '',
      moviePoster: movie.posterUrl || '',
      genreIds: movie.genreIds ?? [],
      imageUrls: [],
      language: movie.language,
      status: this.toApiStatus(movie.status),
    };
  }

  private toTimeSpanString(totalMinutes: number): string {
    const safeMinutes = Math.max(1, Number.isFinite(totalMinutes) ? Math.round(totalMinutes) : 1);
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  }

  private toApiAgeRating(ageRating: string): string {
    const normalized = ageRating.toUpperCase().replace('-', '');
    if (normalized === 'PG13') {
      return 'PG13';
    }
    if (normalized === 'R') {
      return 'R';
    }
    if (normalized === 'NC17') {
      return 'NC17';
    }
    return normalized === 'G' ? 'G' : 'PG';
  }

  private toApiCreateStatus(status: MovieRow['status']): string {
    if (status === 'COMING_SOON') {
      return 'ComingSoon';
    }

    // Create as Draft to avoid backend validation failures for direct publish.
    return 'Draft';
  }

  private toApiStatus(status: MovieRow['status']): string {
    if (status === 'COMING_SOON') {
      return 'ComingSoon';
    }
    if (status === 'INACTIVE') {
      return 'Draft';
    }
    return 'NowShowing';
  }

  private extractNumericId(value: string): number | null {
    const match = value.match(/\d+/);
    if (!match) {
      return null;
    }

    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private generateNextId(): string {
    const movies = this.movies();
    const max = movies.reduce((maxNum, movie) => {
      const n = Number(movie.id.replace('MOV-', ''));
      return isNaN(n) ? maxNum : Math.max(maxNum, n);
    }, 1000);
    return `MOV-${max + 1}`;
  }
}
