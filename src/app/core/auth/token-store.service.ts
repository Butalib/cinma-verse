import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'cv_access_token';
const REFRESH_TOKEN_KEY = 'cv_refresh_token';
const ROLE_KEY = 'cv_role';
const LEGACY_ACCESS_TOKEN_KEY = 'access_token';
const LEGACY_REFRESH_TOKEN_KEY = 'refresh_token';
const LEGACY_ROLE_KEY = 'role';

@Injectable({ 
  providedIn: 'root' 
})
export class TokenStoreService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY) ?? localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  getRole(): string | null {
    return localStorage.getItem(ROLE_KEY) ?? localStorage.getItem(LEGACY_ROLE_KEY);
  }

  setRole(role: string): void {
    localStorage.setItem(ROLE_KEY, role);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  }
}
