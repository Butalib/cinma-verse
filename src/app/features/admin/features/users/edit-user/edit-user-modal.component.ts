import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UpdateUserPayload } from '../users-managemen/services/users.service';

export interface EditUserDetails {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  city: string;
  address: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailConfirmed: boolean;
}

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-user-modal.component.html',
  styleUrl: './edit-user-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditUserModalComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly user = input<EditUserDetails | null>(null);
  readonly isSaving = input(false);

  readonly closeModal = output<void>();
  readonly saveChanges = output<UpdateUserPayload>();

  readonly form = this.fb.group({
    role: this.fb.control<'user' | 'admin'>('user', [Validators.required]),
    isActive: this.fb.control(true),
    emailConfirmed: this.fb.control(false),
  });

  constructor() {
    effect(() => {
      const currentUser = this.user();
      if (!currentUser) {
        return;
      }

      this.form.setValue({
        role: currentUser.role,
        isActive: currentUser.isActive,
        emailConfirmed: currentUser.emailConfirmed,
      });
    });
  }

  onBackdropClick(): void {
    this.onCancel();
  }

  onCancel(): void {
    if (this.isSaving()) {
      return;
    }
    this.closeModal.emit();
  }

  onSave(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saveChanges.emit({
      role: value.role,
      isActive: value.isActive,
      emailConfirmed: value.emailConfirmed,
    });
  }
}
