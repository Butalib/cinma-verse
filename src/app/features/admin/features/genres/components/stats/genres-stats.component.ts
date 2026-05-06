import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Genre } from '../../models/genre.model';

@Component({
  selector: 'app-genres-stats',
  imports: [],
  templateUrl: './genres-stats.component.html',
  styleUrl: './genres-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenresStatsComponent {
  readonly totalGenres = input(0);
  readonly mostPopular = input<Genre | null>(null);
  readonly recentlyAdded = input<Genre | null>(null);
}
