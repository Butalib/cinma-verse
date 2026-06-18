import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MovieStatus = 'ACTIVE' | 'INACTIVE' | 'COMING_SOON';

export interface MovieRow {
  id: string;
  title: string;
  genres: string[];
  genreIds?: number[];
  ageRating: string;
  duration: number;
  language: string;
  status: MovieStatus;
  releaseDate: string;
  internalRating: number;
  trailerUrl: string;
  posterUrl: string;
  description: string;
  cast: string[];
}

@Component({
  selector: 'app-movies-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movies-table.component.html',
  styleUrls: ['./movies-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoviesTableComponent {
  readonly movies = input.required<MovieRow[]>();
  readonly formatDurationFn = input<(min: number) => string>();
  readonly getStatusClassFn = input<(s: string) => string>();
  readonly getStatusLabelFn = input<(s: string) => string>();

  readonly viewMovie = output<MovieRow>();
  readonly editMovie = output<MovieRow>();
  readonly deleteMovie = output<string>();

  onView(movie: MovieRow): void {
    this.viewMovie.emit(movie);
  }

  onEdit(movie: MovieRow): void {
    this.editMovie.emit(movie);
  }

  onDelete(id: string): void {
    this.deleteMovie.emit(id);
  }

  getDuration(minutes: number): string {
    const formatFn = this.formatDurationFn();
    if (formatFn) {
      return formatFn(minutes);
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  getStatusClass(status: string): string {
    const classFn = this.getStatusClassFn();
    if (classFn) {
      return classFn(status);
    }
    return status === 'ACTIVE'
      ? 'badge badge-active'
      : status === 'COMING_SOON'
        ? 'badge badge-coming-soon'
        : 'badge badge-inactive';
  }

  getStatusLabel(status: string): string {
    const labelFn = this.getStatusLabelFn();
    if (labelFn) {
      return labelFn(status);
    }
    return status === 'ACTIVE' ? 'Active' : status === 'COMING_SOON' ? 'Coming Soon' : 'Inactive';
  }
}
