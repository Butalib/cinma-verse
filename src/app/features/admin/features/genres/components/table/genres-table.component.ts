import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { GenreActionsComponent } from '../actions/genre-actions.component';
import type { Genre } from '../../models/genre.model';

@Component({
  selector: 'app-genres-table',
  imports: [GenreActionsComponent],
  templateUrl: './genres-table.component.html',
  styleUrl: './genres-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenresTableComponent {
  readonly genres = input.required<Genre[]>();

  readonly viewGenre = output<string>();
  readonly editGenre = output<string>();
  readonly deleteGenre = output<string>();

  trackByGenreId(_: number, item: Genre): string {
    return item.id;
  }
}
