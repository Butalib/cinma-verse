import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-showtimes-search-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './showtimes-search-toolbar.component.html',
  styleUrls: ['./showtimes-search-toolbar.component.css']
})
export class ShowtimesSearchToolbarComponent {
  readonly searchChange = output<string>();
  readonly filterClicked = output<void>();
  readonly exportClicked = output<void>();
  readonly addClicked = output<void>();

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchChange.emit(target?.value ?? '');
  }
}
