import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  title: string;
  dateOfBirth: string;
  password: string;
  city: string;
  gender: '' | 'Male' | 'Female';
  address: string;
}

@Component({
  selector: 'app-create-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-user-modal.component.html',
  styleUrl: './create-user-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateUserModalComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly createUser = output<CreateUserPayload>();
  readonly closeModal = output<void>();

  readonly form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    title: [''],
    dateOfBirth: [''],
    password: ['', [Validators.required]],
    city: [''],
    gender: ['' as '' | 'Male' | 'Female'],
    address: [''],
  });

  onCancel(): void {
    this.closeModal.emit();
  }

  onBackdropClick(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.createUser.emit(this.form.getRawValue());
  }

  isInvalid(controlName: keyof CreateUserPayload): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
