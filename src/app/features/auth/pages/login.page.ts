import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss' 
})
export class LoginPage implements OnInit {
  readonly loading$ = new BehaviorSubject(false);
  form!: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly _authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading$.next(true);
    this._authService.login(this.form.getRawValue()).pipe(
      finalize(() => this.loading$.next(false))
    ).subscribe({
      next: () => void this.router.navigate(['/user/dashboard']),
      error: () => void 0
    });
  }
}
