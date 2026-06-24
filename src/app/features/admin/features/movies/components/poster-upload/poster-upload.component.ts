import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieMediaService } from '../../services/movie-media.service';

@Component({
  selector: 'app-poster-upload',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="poster-upload-area" (click)="posterInput.click()" [class.uploading]="isUploading()">
      <input #posterInput type="file" accept="image/*" hidden (change)="onFileSelected($event)" />
      @if (isUploading()) {
        <span class="material-symbols-outlined poster-upload-icon">hourglass_empty</span>
        <p class="poster-upload-text">Uploading...</p>
      } @else if (posterUrl()) {
        <img [src]="posterUrl()" alt="Poster" class="poster-preview-img" />
      } @else {
        <span class="material-symbols-outlined poster-upload-icon">movie</span>
        <p class="poster-upload-text">Click to upload poster</p>
        <p class="poster-upload-hint">PNG, JPG up to 5MB</p>
      }
    </div>
  `,
  styles: [`
    .poster-upload-area {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; height: 200px; border: 2px dashed var(--ghost-border);
      border-radius: var(--radius-lg); background: var(--surface-container);
      cursor: pointer; transition: border-color var(--transition), background var(--transition); overflow: hidden;
    }
    .poster-upload-area:hover { border-color: var(--primary-container); background: var(--primary-dim); }
    .poster-upload-area.uploading { opacity: 0.6; pointer-events: none; }
    .poster-upload-icon { font-size: 36px; color: var(--on-surface-muted); }
    .poster-upload-text { font-size: var(--text-body-sm); color: var(--on-surface-variant); margin: 0; font-weight: 500; }
    .poster-upload-hint { font-size: var(--text-label); color: var(--on-surface-muted); margin: 0; }
    .poster-preview-img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-md); }
  `],
})
export class PosterUploadComponent {
  private readonly mediaService = inject(MovieMediaService);

  readonly posterUrl = input<string>('');
  readonly posterUrlChange = output<string>();

  readonly isUploading = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    this.mediaService.upload(file).subscribe({
      next: (url: string) => {
        this.posterUrlChange.emit(url);
        this.isUploading.set(false);
      },
      error: () => {
        this.isUploading.set(false);
      },
    });
    input.value = '';
  }
}
