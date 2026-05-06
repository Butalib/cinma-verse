import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { CreateGenrePayload } from '../../models/genre.model';

@Component({
  selector: 'app-create-genre-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './create-genre-modal.component.html',
  styleUrl: './create-genre-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateGenreModalComponent {
  private readonly fb = inject(FormBuilder);
  private lastSeenSuccessTick: number | null = null;

  readonly isSaving = input(false);
  readonly successTick = input(0);

  readonly title = input('Add New Genre');
  readonly subtitle = input('Create a new catalog genre');
  readonly submitLabel = input('Create Genre');
  readonly savingLabel = input('Saving...');
  readonly initialName = input('');

  readonly closeModal = output<void>();
  readonly submitGenre = output<CreateGenrePayload>();

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor() {
    effect(() => {
      const name = this.initialName();
      this.form.patchValue({ name }, { emitEvent: false });
    });

    effect(() => {
      const tick = this.successTick();

      if (this.lastSeenSuccessTick === null) {
        this.lastSeenSuccessTick = tick;
        return;
      }

      if (tick === this.lastSeenSuccessTick) {
        return;
      }

      this.lastSeenSuccessTick = tick;
      this.form.reset();
      this.closeModal.emit();
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitGenre.emit({
      name: value.name?.trim() ?? '',
    });
  }
}
