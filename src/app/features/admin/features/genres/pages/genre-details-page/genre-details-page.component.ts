import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GenreDetailsFacade } from '../../facade/genre-details.facade';

@Component({
  selector: 'app-genre-details-page',
  imports: [ReactiveFormsModule],
  providers: [GenreDetailsFacade],
  templateUrl: './genre-details-page.component.html',
  styleUrl: './genre-details-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenreDetailsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly facade = inject(GenreDetailsFacade);

  readonly isEditMode = signal(false);

  readonly editForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.loadGenreById(id);

      const editMode = this.route.snapshot.routeConfig?.path?.endsWith('/edit') ?? false;
      this.isEditMode.set(editMode);
    }

    effect(() => {
      const genre = this.facade.genre();
      if (!genre) {
        return;
      }

      this.editForm.patchValue({ name: genre.name }, { emitEvent: false });
    });
  }

  openEdit(): void {
    this.isEditMode.set(true);
  }

  cancelEdit(): void {
    this.isEditMode.set(false);

    const genre = this.facade.genre();
    if (!genre) {
      return;
    }

    this.editForm.patchValue({ name: genre.name }, { emitEvent: false });
  }

  saveEdit(): void {
    if (this.editForm.invalid || this.facade.saving()) {
      this.editForm.markAllAsTouched();
      return;
    }

    const genre = this.facade.genre();
    const name = this.editForm.getRawValue().name?.trim();

    if (!genre || !name) {
      return;
    }

    this.facade.updateGenre(genre.id, { name });
    this.isEditMode.set(false);
  }

  deleteGenre(): void {
    const genre = this.facade.genre();
    if (!genre || this.facade.saving()) {
      return;
    }

    this.facade.deleteGenre(genre.id);
  }

  onBack(): void {
    this.facade.goBack();
  }
}
