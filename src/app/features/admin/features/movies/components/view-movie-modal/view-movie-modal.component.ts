import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MovieRow } from '../movies-management/movies-table/movies-table.component';

@Component({
  selector: 'app-view-movie-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-movie-modal.component.html',
  styleUrl: './view-movie-modal.component.scss',
})
export class ViewMovieModalComponent {
  readonly movie         = input.required<MovieRow>();
  readonly closeModal    = output<void>();
  readonly editRequested = output<void>();

  formatDuration(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  getStatusClass(status: string): string {
    return status === 'ACTIVE' ? 'badge-active'
         : status === 'COMING_SOON' ? 'badge-coming-soon'
         : 'badge-inactive';
  }

  getStatusLabel(status: string): string {
    return status === 'ACTIVE' ? 'Active'
         : status === 'COMING_SOON' ? 'Coming Soon'
         : 'Inactive';
  }
}
