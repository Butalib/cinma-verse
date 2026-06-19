import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthUser } from '../models/auth-response';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(null);

  readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  readonly currentUser$ = this.currentUserSubject.asObservable();

  get isAuthenticatedValue(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get currentUserValue(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  setAuthenticated(isAuthenticated: boolean): void {
    this.isAuthenticatedSubject.next(isAuthenticated);
  }

  setCurrentUser(user: AuthUser | null): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(!!user || this.isAuthenticatedSubject.value);
  }

  clear(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
