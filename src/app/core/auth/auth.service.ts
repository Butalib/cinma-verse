import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { ApiClientService } from '../http/api-client.service';
import { AuthResponse, CurrentUser, LoginRequest } from './auth.models';
import { TokenStoreService } from './token-store.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly apiClient: ApiClientService,
    private readonly tokenStore: TokenStoreService
  ) {}

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.apiClient.post<AuthResponse, LoginRequest>('/api/auth/login', payload).pipe(
      tap((response: AuthResponse) => this.persistSession(response))
    );
  }

  loadMe(): Observable<CurrentUser | null> {
    return this.apiClient.get<CurrentUser>('/api/me').pipe(
      tap((user: CurrentUser) => this.currentUserSubject.next(user)),
      catchError(() => {
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }

  logout(): void {
    this.tokenStore.clear();
    this.currentUserSubject.next(null);
  }

  isAuthenticated$(): Observable<boolean> {
    return this.currentUser$.pipe(map((user: CurrentUser | null) => !!user || !!this.tokenStore.getAccessToken()));
  }

  private persistSession(response: AuthResponse): void {
    const token = response.accessToken ?? response.token;
    if (token) {
      this.tokenStore.setAccessToken(token);
    }
    if (response.refreshToken) {
      this.tokenStore.setRefreshToken(response.refreshToken);
    }
    if (response.role) {
      this.tokenStore.setRole(response.role);
    }
  }
}
