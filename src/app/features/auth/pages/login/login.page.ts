import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    this.errorMessage.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          const destination = this.authService.isAdmin()
            ? '/admin/dashboard'
            : this.authService.isUser()
              ? '/user/dashboard'
              : '/unauthorized';

          void this.router.navigateByUrl(destination);
        },
        error: (error: unknown) =>
          this.errorMessage.set(this.getErrorMessage(error, 'Invalid email or password')),
      });
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  hasError(controlName: 'email' | 'password', errorName: string): boolean {
    const control = this.form.controls[controlName];
    return control.hasError(errorName) && (control.dirty || control.touched);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    const apiError: unknown = (error as HttpErrorResponse).error;
    if (typeof apiError === 'string') {
      return apiError;
    }

    if (this.isRecord(apiError)) {
      const message = apiError['message'] ?? apiError['error'] ?? apiError['title'];
      if (typeof message === 'string') {
        return message;
      }

      const errors = apiError['errors'];
      if (this.isRecord(errors)) {
        const firstError = Object.values(errors)
          .flat()
          .find((value) => typeof value === 'string');
        if (typeof firstError === 'string') {
          return firstError;
        }
      }
    }

    return fallback;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
