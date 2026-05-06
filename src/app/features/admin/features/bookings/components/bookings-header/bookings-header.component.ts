import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-bookings-header',
  imports: [],
  templateUrl: './bookings-header.component.html',
  styleUrl: './bookings-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingsHeaderComponent {
  readonly searchValue = signal('');

  readonly searchChange = output<string>();
  readonly filterClicked = output<void>();
  readonly exportClicked = output<void>();
  readonly addClicked = output<void>();

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const value = target?.value ?? '';
    this.searchValue.set(value);
    this.searchChange.emit(value);
  }
}
