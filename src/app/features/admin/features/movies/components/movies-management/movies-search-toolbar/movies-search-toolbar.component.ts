import { ChangeDetectionStrategy, Component, signal, output } from '@angular/core';

@Component({
  selector: 'app-movies-search-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './movies-search-toolbar.component.html',
  styleUrls: ['./movies-search-toolbar.component.scss']
})
export class MoviesSearchToolbarComponent {
  readonly isFiltersOpen = signal(false);
  readonly searchChange = output<string>();
  readonly genreFilterChange = output<string>();
  readonly ageFilterChange = output<string>();
  readonly statusFilterChange = output<string>();
  readonly languageFilterChange = output<string>();
  readonly dateFromChange = output<string>();
  readonly dateToChange = output<string>();
  readonly sortFieldChange = output<string>();
  readonly sortDirChange = output<string>();
  readonly addMovieClicked = output<void>();

  toggleFilters(): void {
    this.isFiltersOpen.update(v => !v);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchChange.emit(target?.value ?? '');
  }

  onGenreChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.genreFilterChange.emit(target?.value ?? 'all');
  }

  onAgeChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.ageFilterChange.emit(target?.value ?? 'all');
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.statusFilterChange.emit(target?.value ?? 'all');
  }

  onLanguageChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.languageFilterChange.emit(target?.value ?? 'all');
  }

  onDateFromChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.dateFromChange.emit(target?.value ?? '');
  }

  onDateToChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.dateToChange.emit(target?.value ?? '');
  }

  onSortFieldChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.sortFieldChange.emit(target?.value ?? 'release');
  }

  onSortDirChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.sortDirChange.emit(target?.value ?? 'desc');
  }

  onAddMovieClick(): void {
    this.addMovieClicked.emit();
  }
}