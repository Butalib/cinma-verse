import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export interface CreateShowtimePayload {
  movieTitle: string;
  branchName: string;
  hallName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  totalSeats: number;
}

@Component({
  selector: 'app-create-showtime-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-showtime-modal.component.html',
  styleUrls: ['./create-showtime-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateShowtimeModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly closeModal = output<void>();
  readonly createShowtime = output<CreateShowtimePayload>();

  readonly form = this.fb.group({
    movieTitle: ['', Validators.required],
    branchName: ['', Validators.required],
    hallName: ['', Validators.required],
    date: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    totalSeats: [null as number | null, [Validators.required, Validators.min(1)]]
  });

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
    this.createShowtime.emit({
      movieTitle: value.movieTitle!,
      branchName: value.branchName!,
      hallName: value.hallName!,
      date: value.date!,
      startTime: value.startTime!,
      endTime: value.endTime!,
      price: value.price!,
      totalSeats: value.totalSeats!
    });
  }
}
