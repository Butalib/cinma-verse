import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieMediaService } from '../../services/movie-media.service';

@Component({
  selector: 'app-gallery-upload',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gallery-section">
      <p class="gallery-label">GALLERY</p>
      <div class="gallery-upload-area" (click)="galleryInput.click()" [class.uploading]="isUploading()">
        <input #galleryInput type="file" accept="image/*" multiple hidden (change)="onFilesSelected($event)" />
        @if (isUploading()) {
          <span class="material-symbols-outlined gallery-icon">hourglass_empty</span>
          <span class="gallery-hint">Uploading...</span>
        } @else {
          <span class="material-symbols-outlined gallery-icon">add_photo_alternate</span>
          <span class="gallery-hint">Add screenshots</span>
        }
      </div>
      @if (imageUrls().length) {
        <div class="gallery-grid">
          @for (url of imageUrls(); track $index) {
            <div class="gallery-thumb">
              <img [src]="url" alt="Gallery image" />
              <button type="button" class="gallery-thumb-remove" (click)="removeImage($index)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .gallery-section { display: flex; flex-direction: column; gap: 8px; }
    .gallery-label {
      font-size: var(--text-label); font-weight: 600; letter-spacing: 0.08em;
      color: var(--on-surface-variant); margin: 0;
    }
    .gallery-upload-area {
      display: flex; align-items: center; gap: 8px; padding: 12px;
      border: 1px dashed var(--ghost-border); border-radius: var(--radius-md);
      background: var(--surface-container); cursor: pointer; transition: border-color var(--transition);
    }
    .gallery-upload-area:hover { border-color: var(--primary-container); }
    .gallery-upload-area.uploading { opacity: 0.6; pointer-events: none; }
    .gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
    .gallery-thumb { position: relative; aspect-ratio: 1; border-radius: var(--radius-sm); overflow: hidden; }
    .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .gallery-thumb-remove {
      position: absolute; top: 2px; right: 2px; background: rgba(0, 0, 0, 0.7);
      border: none; border-radius: 50%; width: 20px; height: 20px;
      display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;
    }
    .gallery-thumb-remove span { font-size: 14px; }
    .gallery-icon { font-size: 18px; color: var(--on-surface-muted); }
    .gallery-hint { font-size: var(--text-body-sm); color: var(--on-surface-muted); }
  `],
})
export class GalleryUploadComponent {
  private readonly mediaService = inject(MovieMediaService);

  readonly imageUrls = input<string[]>([]);
  readonly imageUrlsChange = output<string[]>();

  readonly isUploading = signal(false);

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    this.isUploading.set(true);
    this.mediaService.uploadMany(files).subscribe({
      next: (urls: string[]) => {
        const current = this.imageUrls();
        this.imageUrlsChange.emit([...current, ...urls]);
        this.isUploading.set(false);
      },
      error: () => {
        this.isUploading.set(false);
      },
    });
    input.value = '';
  }

  removeImage(index: number): void {
    const current = this.imageUrls();
    this.imageUrlsChange.emit(current.filter((_, i) => i !== index));
  }
}
