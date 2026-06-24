import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { GenreMultiSelectComponent, GenreOption } from '../genre-multi-select/genre-multi-select.component';
import { PosterUploadComponent } from '../poster-upload/poster-upload.component';
import { GalleryUploadComponent } from '../gallery-upload/gallery-upload.component';
import { CastMembersComponent } from '../cast-members/cast-members.component';

@Component({
  selector: 'app-movie-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GenreMultiSelectComponent,
    PosterUploadComponent,
    GalleryUploadComponent,
    CastMembersComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="movieForm()" (ngSubmit)="onSubmit()" novalidate>
      <div class="add-movie-modal-body">

        <div class="poster-col">
          <app-poster-upload
            [posterUrl]="posterUrl()"
            (posterUrlChange)="onPosterUploaded($event)">
          </app-poster-upload>

          <app-gallery-upload
            [imageUrls]="imageUrls()"
            (imageUrlsChange)="onGalleryUploaded($event)">
          </app-gallery-upload>
        </div>

        <div class="fields-col">

          <div class="form-group field-full">
            <label>MOVIE TITLE <span class="field-api-hint">(movieTitle)</span></label>
            <input class="form-control" formControlName="title" type="text" placeholder="Enter movie title..." />
          </div>

          <div class="form-group">
            <label>AGE RATING <span class="field-api-hint">(ageRating)</span></label>
            <select class="form-control" formControlName="ageRating">
              @for (r of ageRatings; track r) {
                <option [value]="r">{{ r }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label>DURATION (min) <span class="field-api-hint">(duration)</span></label>
            <input class="form-control" formControlName="duration" type="number" min="1" placeholder="e.g. 120" />
          </div>

          <div class="form-group">
            <label>INTERNAL RATING <span class="field-api-hint">(internalRating)</span></label>
            <input class="form-control" formControlName="internalRating" type="number" min="0" max="10" step="0.1"
              placeholder="0.0 – 10.0" />
          </div>

          <div class="form-group">
            <label>LANGUAGE <span class="field-api-hint">(language)</span></label>
            <select class="form-control" formControlName="language">
              @for (l of languages; track l) {
                <option [value]="l">{{ l }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label>STATUS <span class="field-api-hint">(status)</span></label>
            <select class="form-control" formControlName="status">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="COMING_SOON">Coming Soon</option>
            </select>
          </div>

          <div class="form-group">
            <label>RELEASE DATE <span class="field-api-hint">(releaseDate)</span></label>
            <input class="form-control" formControlName="releaseDate" type="date" />
          </div>

          <div class="form-group field-full">
            <label>TRAILER URL <span class="field-api-hint">(trailerUrl)</span></label>
            <input class="form-control" formControlName="trailerUrl" type="url"
              placeholder="https://youtube.com/watch?v=..." />
          </div>

          <app-genre-multi-select
            [genres]="genres()"
            [selectedIds]="genreIds()"
            (genreChange)="onGenreChange($event)">
          </app-genre-multi-select>

          <app-cast-members
            [castForm]="movieForm()"
            (castChange)="onCastChange()">
          </app-cast-members>

          <div class="form-group field-full">
            <label>DESCRIPTION / SYNOPSIS
              <span class="field-api-hint">(movieDescription)</span>
            </label>
            <textarea class="form-control" formControlName="description" rows="4"
              placeholder="Write a brief synopsis of the movie..."></textarea>
          </div>

        </div>
      </div>

      <div class="modal-footer">
        <ng-content select="[modal-footer]"></ng-content>
      </div>
    </form>
  `,
  styles: [`
    .field-full { grid-column: 1 / -1; }
  `],
})
export class MovieFormComponent {
  readonly movieForm = input.required<FormGroup>();
  readonly genres = input.required<GenreOption[]>();
  readonly submitLabel = input('Add Film');
  readonly formSubmitted = output<FormGroup>();

  readonly ageRatings = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
  readonly languages = ['English', 'Arabic', 'French', 'Spanish', 'Latvian'];

  posterUrl = input<string>('');
  imageUrls = input<string[]>([]);

  onSubmit(): void {
    this.formSubmitted.emit(this.movieForm());
  }

  onPosterUploaded(url: string): void {
    const form = this.movieForm();
    form.patchValue({ moviePoster: url });
    const currentUrls = form.get('imageUrls')?.value ?? [];
    form.patchValue({ imageUrls: [...currentUrls, url] });
  }

  onGalleryUploaded(urls: string[]): void {
    this.movieForm().patchValue({ imageUrls: urls });
  }

  onGenreChange(ids: number[]): void {
    this.movieForm().get('genreIds')?.setValue(ids);
  }

  get genreIds(): () => number[] {
    return () => this.movieForm().get('genreIds')?.value ?? [];
  }

  onCastChange(): void {
    // Trigger change detection for cast updates
  }
}
