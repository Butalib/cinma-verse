import { Injectable, inject, signal } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { ApiClientService } from '../../../../../../../core/http/api-client.service';
import {
  AdminMovieDto,
  AdminMovieSummaryDto,
  AdminPagedResponse,
} from '../../../../../admin-api.models';
import { CastMember, MovieRow } from '../movies-table/movies-table.component';

@Injectable({
  providedIn: 'root',
})
export class MoviesService {
  private readonly api = inject(ApiClientService);
  private readonly movies = signal<MovieRow[]>([]);

  constructor() {
    this.loadFromApi();
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
        this.movies.set(items);
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

    const payload = this.toCreatePayload(movie);

    console.log('payload', payload);
    console.log('json', JSON.stringify(payload, null, 2));

    if (payload === null || payload === undefined) {
      console.error('Aborting POST /api/admin/movies: payload is null or undefined');
      return localId;
    }

    if (typeof payload !== 'object' || Array.isArray(payload)) {
      console.error('Aborting POST /api/admin/movies: payload root is not a plain object', payload);
      return localId;
    }

    this.api
      .post<unknown, Record<string, unknown>>('/api/admin/movies', payload)
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
      const payload = this.toUpdatePayload(updatedMovie);

      console.log('payload', payload);
      console.log('json', JSON.stringify(payload, null, 2));

      if (payload === null || payload === undefined) {
        console.error(`Aborting PUT /api/admin/movies/${numericId}: payload is null or undefined`);
      } else if (typeof payload !== 'object' || Array.isArray(payload)) {
        console.error(`Aborting PUT /api/admin/movies/${numericId}: payload root is not a plain object`, payload);
      } else {
        this.api
          .put<void, Record<string, unknown>>(
            `/api/admin/movies/${numericId}`,
            payload,
          )
          .pipe(catchError(() => of(null)))
          .subscribe();
      }
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
      imageUrls: (dto.images ?? []).map((img) => img.imageUrl ?? '').filter(Boolean),
      castMembers: (dto.castMembers ?? []).map((member) => ({
        personName: member.personName ?? '',
        imageUrl: member.imageUrl ?? '',
        roleType: member.roleType ?? 'Actor',
        characterName: member.characterName ?? '',
        displayOrder: member.displayOrder ?? 0,
        isLead: member.isLead ?? false,
      })),
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
    const castMembers = (movie.castMembers?.length ? movie.castMembers : movie.cast ?? []).map(
      (member, index) => {
        const isStringMember = typeof member === 'string';
        const personName = isStringMember ? member : member.personName || '';
        const imageUrl = isStringMember ? '' : member.imageUrl || '';
        const validImageUrl = this.toAbsoluteUrl(imageUrl);
        return {
          personName,
          imageUrl: validImageUrl,
          roleType: isStringMember ? 'Actor' : member.roleType || 'Actor',
          characterName: isStringMember ? '' : member.characterName || '',
          displayOrder: isStringMember ? index : member.displayOrder ?? index,
          isLead: isStringMember ? index === 0 : member.isLead ?? false,
        };
      },
    );

    const trailerUrl = this.toAbsoluteUrl(movie.trailerUrl);
    const moviePoster = this.toAbsoluteUrl(movie.posterUrl);
    const imageUrls = (movie.imageUrls ?? [])
      .map((url) => this.toAbsoluteUrl(url))
      .filter((url): url is string => url !== null);

    this.logUrlValues('CreateMovie', {
      trailerUrl,
      moviePoster,
      castImageUrls: castMembers.map((m) => m.imageUrl),
      rawImageUrls: imageUrls,
    });

    const payload = {
      movieName: movie.title,
      movieDescription: movie.description || 'No description provided.',
      movieDuration: this.toTimeSpanString(movie.duration),
      releaseDate: movie.releaseDate,
      castMembers,
      movieAgeRating: this.toApiAgeRating(movie.ageRating),
      movieRating: movie.internalRating,
      trailerUrl,
      moviePoster,
      genreIds: movie.genreIds ?? [],
      imageUrls,
      language: movie.language,
      status: this.toApiCreateStatus(movie.status),
    };

    return payload;
  }

  private toUpdatePayload(movie: MovieRow): Record<string, unknown> {
    const castMembers = (movie.castMembers?.length ? movie.castMembers : movie.cast ?? []).map(
      (member, index) => {
        const isStringMember = typeof member === 'string';
        const personName = isStringMember ? member : member.personName || '';
        const imageUrl = isStringMember ? '' : member.imageUrl || '';
        const validImageUrl = this.toAbsoluteUrl(imageUrl);
        return {
          personName,
          imageUrl: validImageUrl,
          roleType: isStringMember ? 'Actor' : member.roleType || 'Actor',
          characterName: isStringMember ? '' : member.characterName || '',
          displayOrder: isStringMember ? index : member.displayOrder ?? index,
          isLead: isStringMember ? index === 0 : member.isLead ?? false,
        };
      },
    );

    const trailerUrl = this.toAbsoluteUrl(movie.trailerUrl);
    const moviePoster = this.toAbsoluteUrl(movie.posterUrl);
    const imageUrls = (movie.imageUrls ?? [])
      .map((url) => this.toAbsoluteUrl(url))
      .filter((url): url is string => url !== null);

    this.logUrlValues('UpdateMovie', {
      trailerUrl,
      moviePoster,
      castImageUrls: castMembers.map((m) => m.imageUrl),
      rawImageUrls: imageUrls,
    });

    const payload = {
      movieName: movie.title,
      movieDescription: movie.description,
      movieDuration: this.toTimeSpanString(movie.duration),
      releaseDate: movie.releaseDate,
      castMembers,
      movieAgeRating: this.toApiAgeRating(movie.ageRating),
      movieRating: movie.internalRating,
      trailerUrl,
      moviePoster,
      genreIds: movie.genreIds ?? [],
      imageUrls,
      language: movie.language,
      status: this.toApiStatus(movie.status),
    };

    return payload;
  }

  private toAbsoluteUrl(value: string | null | undefined): string | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const lower = trimmed.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      return trimmed;
    }

    return null;
  }

  private logUrlValues(
    context: string,
    values: {
      trailerUrl: string | null;
      moviePoster: string | null;
      castImageUrls: (string | null)[];
      rawImageUrls: string[];
    },
  ): void {
    console.log(`[${context}] URL values before POST/PUT:`);
    console.log('  trailerUrl:', values.trailerUrl);
    console.log('  moviePoster:', values.moviePoster);
    console.log('  castMembers[].imageUrl:', values.castImageUrls);
    console.log('  imageUrls:', values.rawImageUrls);
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
