import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export interface EditShowtimeDetails {
  id: string;
  movieTitle: string;
  branchName: string;
  hallName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  totalSeats: number;
  status: string;
}

export interface UpdateShowtimePayload {
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  totalSeats: number;
  status: string;
}

@Component({
  selector: 'app-edit-showtime-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './edit-showtime-modal.component.html',
  styleUrls: ['./edit-showtime-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditShowtimeModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly showtime = input<EditShowtimeDetails | null>(null);
  readonly isSaving = input(false);

  readonly closeModal = output<void>();
  readonly saveChanges = output<UpdateShowtimePayload>();

  readonly form = this.fb.group({
    date: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    totalSeats: [1, [Validators.required, Validators.min(1)]],
    status: ['SCHEDULED', Validators.required]
  });

  constructor() {
    effect(() => {
      const data = this.showtime();
      if (data) {
        this.form.patchValue({
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          price: data.price,
          totalSeats: data.totalSeats,
          status: data.status
        });
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saveChanges.emit({
      date: value.date!,
      startTime: value.startTime!,
      endTime: value.endTime!,
      price: value.price!,
      totalSeats: value.totalSeats!,
      status: value.status!
    });
  }

  onClose(): void {
    if (this.isSaving()) {
      return;
    }
    this.closeModal.emit();
  }
}
