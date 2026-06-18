import { Injectable, inject } from '@angular/core';
import { TokenService } from './services/token.service';

@Injectable({ providedIn: 'root' })
export class TokenStoreService {
  private readonly tokenService = inject(TokenService);

  getAccessToken(): string | null {
    return this.tokenService.getToken();
  }

  setAccessToken(token: string): void {
    this.tokenService.saveToken(token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('cv_refresh_token') ?? localStorage.getItem('refresh_token');
  }

  setRefreshToken(token: string): void {
    localStorage.setItem('cv_refresh_token', token);
  }

  getRole(): string | null {
    return localStorage.getItem('cv_role') ?? localStorage.getItem('role');
  }

  setRole(role: string): void {
    localStorage.setItem('cv_role', role);
  }

  clear(): void {
    this.tokenService.removeToken();
    localStorage.removeItem('cv_refresh_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('cv_role');
    localStorage.removeItem('role');
  }
}
