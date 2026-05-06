import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-users-search-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users-search-toolbar.component.html',
  styleUrls: ['./users-search-toolbar.component.css']
})
export class UsersSearchToolbarComponent {
  readonly searchChange = output<string>();
  readonly filterClicked = output<void>();
  readonly exportClicked = output<void>();
  readonly addClicked = output<void>();

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchChange.emit(target?.value ?? '');
  }
}
