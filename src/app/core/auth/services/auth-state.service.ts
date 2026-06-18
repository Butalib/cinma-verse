import { Injectable, signal } from '@angular/core';
import { AuthUser } from '../models/auth-response';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly isAuthenticatedSignal = signal(false);
  private readonly currentUserSignal = signal<AuthUser | null>(null);

  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();

  setAuthenticated(isAuthenticated: boolean): void {
    this.isAuthenticatedSignal.set(isAuthenticated);
  }

  setCurrentUser(user: AuthUser | null): void {
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(!!user || this.isAuthenticatedSignal());
  }

  clear(): void {
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
  }
}
