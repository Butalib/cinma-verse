import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Genre } from '../../models/genre.model';

@Component({
  selector: 'app-genre-row',
  imports: [],
  templateUrl: './genre-row.component.html',
  styleUrl: './genre-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenreRowComponent {
  readonly genre = input.required<Genre>();
}
