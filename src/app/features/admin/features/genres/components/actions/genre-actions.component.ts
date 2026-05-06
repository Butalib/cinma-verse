import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-genre-actions',
  imports: [],
  templateUrl: './genre-actions.component.html',
  styleUrl: './genre-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenreActionsComponent {
  readonly genreId = input.required<string>();

  readonly viewClicked = output<string>();
  readonly editClicked = output<string>();
  readonly deleteClicked = output<string>();
}
