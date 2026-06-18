import { Injectable } from '@angular/core';

const TOKEN_KEY = 'cinemaverse_token';
const LEGACY_TOKEN_KEYS = ['cv_access_token', 'access_token'];

@Injectable({ providedIn: 'root' })
export class TokenService {
  saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? this.getLegacyToken();
  }

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    for (const key of LEGACY_TOKEN_KEYS) {
      localStorage.removeItem(key);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private getLegacyToken(): string | null {
    for (const key of LEGACY_TOKEN_KEYS) {
      const token = localStorage.getItem(key);
      if (token) {
        return token;
      }
    }

    return null;
  }
}
