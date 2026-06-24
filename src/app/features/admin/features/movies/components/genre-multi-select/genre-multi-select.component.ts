import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

export interface GenreOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-genre-multi-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-group field-full" style="position: relative;">
      <label>GENRES <span class="field-api-hint">(genreIds)</span></label>
      <div
        class="form-control genre-select-trigger"
        (click)="toggleMenu()"
        tabindex="0"
        (keydown.space)="$event.preventDefault(); toggleMenu()"
        (keydown.enter)="$event.preventDefault(); toggleMenu()"
        role="combobox"
        aria-haspopup="listbox"
        [attr.aria-expanded]="isOpen()"
        style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
        <div class="selected-genres-list"
          style="display: flex; gap: 4px; flex-wrap: wrap; flex: 1; overflow: hidden; max-height: 48px;">
          @if (selectedIds().length === 0) {
            <span style="color: var(--on-surface-muted);">Select genres...</span>
          } @else {
            @for (id of selectedIds(); track id) {
              <span class="tag-pill" style="font-size: 11px; padding: 2px 8px;">
                {{ getGenreName(id) }}
              </span>
            }
          }
        </div>
        <span class="material-symbols-outlined dropdown-icon"
          style="font-size: 18px; color: var(--on-surface-variant); transition: transform 0.2s;"
          [style.transform]="isOpen() ? 'rotate(180deg)' : 'rotate(0)'">expand_more</span>
      </div>

      @if (isOpen()) {
        <div class="genre-dropdown-panel"
          style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--surface-container-high); border: 1px solid var(--ghost-border); border-radius: var(--radius-md); box-shadow: var(--shadow-float); z-index: 100; max-height: 200px; overflow-y: auto;">
          @for (genre of genres(); track genre.id) {
            <div class="genre-option" [class.selected]="isSelected(genre.id)"
              (click)="toggleGenre(genre.id)"
              style="padding: 10px 16px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: background 0.2s; color: var(--on-surface);">
              <span class="material-symbols-outlined"
                style="font-size: 18px; color: var(--primary-container);"
                [style.opacity]="isSelected(genre.id) ? 1 : 0">check</span>
              <span>{{ genre.name }}</span>
            </div>
          }
          @if (genres().length === 0) {
            <div style="padding: 12px 16px; color: var(--on-surface-muted);">No genres found.</div>
          }
        </div>
        <div class="dropdown-backdrop" style="position: fixed; inset: 0; z-index: 99;" (click)="closeMenu()"></div>
      }
    </div>
  `,
  styles: [`
    .genre-select-trigger:focus {
      border-color: var(--primary-container);
      box-shadow: var(--accent-glow-soft);
    }
    .genre-option:hover { background: var(--surface-container); }
    .genre-option.selected { background: var(--primary-dim); }
    .tag-pill {
      display: inline-flex; align-items: center; gap: 5px;
      background: var(--primary-dim); color: var(--primary-container);
      border: 1px solid rgba(0, 200, 255, 0.25); border-radius: 20px;
      padding: 3px 10px; font-size: 11px; font-weight: 600;
    }
  `],
})
export class GenreMultiSelectComponent {
  readonly genres = input.required<GenreOption[]>();
  readonly selectedIds = input.required<number[]>();
  readonly genreChange = output<number[]>();

  readonly isOpen = signal(false);

  toggleMenu(): void {
    this.isOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  isSelected(genreId: number): boolean {
    return this.selectedIds().includes(genreId);
  }

  getGenreName(id: number): string {
    return this.genres().find((g) => g.id === id)?.name || '';
  }

  toggleGenre(genreId: number): void {
    const current = this.selectedIds();
    const next = current.includes(genreId)
      ? current.filter((id) => id !== genreId)
      : [...current, genreId];
    this.genreChange.emit(next);
  }
}
