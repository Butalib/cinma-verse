import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import type { GenreSortOption } from '../../models/genre.model';

@Component({
  selector: 'app-genres-toolbar',
  imports: [],
  templateUrl: './genres-toolbar.component.html',
  styleUrl: './genres-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenresToolbarComponent {
  readonly searchChange = output<string>();
  readonly sortChange = output<GenreSortOption>();
  readonly addClicked = output<void>();

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchChange.emit(target?.value ?? '');
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const value = (target?.value ?? 'name_asc') as GenreSortOption;
    this.sortChange.emit(value);
  }
}
