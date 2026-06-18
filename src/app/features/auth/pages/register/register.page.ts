import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { RegisterRequest } from '../../../../core/auth/models/register-request';
import { AuthService } from '../../../../core/auth/services/auth.service';

type RegisterControlName =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'password'
  | 'phoneNumber'
  | 'address'
  | 'city'
  | 'dateOfBirth'
  | 'gender';

@Component({
  selector: 'app-register-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phoneNumber: ['', [Validators.required]],
    address: ['', [Validators.required]],
    city: ['', [Validators.required]],
    dateOfBirth: ['', [Validators.required]],
    gender: ['', [Validators.required]],
  });

  submit(): void {
    this.errorMessage.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isLoading()) {
      return;
    }

    const request = this.toRegisterRequest();
    this.isLoading.set(true);
    this.authService
      .register(request)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/login']),
        error: (error: unknown) => this.errorMessage.set(this.getErrorMessage(error, 'Registration failed')),
      });
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  hasError(controlName: RegisterControlName, errorName: string): boolean {
    const control = this.form.controls[controlName];
    return control.hasError(errorName) && (control.dirty || control.touched);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    const apiError: unknown = error.error;
    if (typeof apiError === 'string') {
      return apiError;
    }

    if (this.isRecord(apiError)) {
      const errors = apiError['errors'] ?? apiError['Errors'];
      if (this.isRecord(errors)) {
        const validationErrors = this.extractValidationErrors(errors);
        if (validationErrors.length > 0) {
          return validationErrors.join(' ');
        }
      }

      const message = apiError['message'] ?? apiError['error'] ?? apiError['detail'] ?? apiError['title'];
      if (typeof message === 'string') {
        return message;
      }
    }

    return fallback;
  }

  private toRegisterRequest(): RegisterRequest {
    const rawValue = this.form.getRawValue();

    return {
      ...rawValue,
      dateOfBirth: this.toIsoDate(rawValue.dateOfBirth),
    };
  }

  private toIsoDate(value: string): string {
    if (!value) {
      return value;
    }

    const normalized = value.includes('T') ? value : `${value}T00:00:00.000Z`;
    const parsedDate = new Date(normalized);
    return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toISOString();
  }

  private extractValidationErrors(errors: Record<string, unknown>): string[] {
    return Object.values(errors).flatMap((value) => {
      if (typeof value === 'string') {
        return [value];
      }

      if (Array.isArray(value)) {
        return value.filter((entry): entry is string => typeof entry === 'string');
      }

      return [];
    });
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
