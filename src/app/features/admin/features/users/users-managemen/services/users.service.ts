import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UpdateUserPayload {
  role: string;
  isActive: boolean;
  emailConfirmed: boolean;
}

export interface UserDetailsResponse {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  contact?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  address?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
  emailConfirmed?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/admin/users';

  getUserById(id: string): Observable<UserDetailsResponse> {
    return this.http.get<UserDetailsResponse>(`${this.baseUrl}/${id}`);
  }

  updateUser(id: string, payload: UpdateUserPayload): Observable<UserDetailsResponse> {
    return this.http.put<UserDetailsResponse>(`${this.baseUrl}/${id}`, payload);
  }
}
