import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-showtime-actions',
  standalone: true,
  templateUrl: './showtime-actions.component.html',
  styleUrl: './showtime-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowtimeActionsComponent {
  readonly editClicked = output<void>();
  readonly backClicked = output<void>();
}
