import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../../../core/config/api.config';
import { CreateUserPayload } from '../../add-user/create-user-modal.component';
import { UsersTableRow } from '../componants/users-table/users-table.component';

export interface UpdateUserFormPayload {
  role: string;
  isActive: boolean;
  emailConfirmed: boolean;
}

export interface UpdateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  dateOfBirth: string;
  isActive: boolean;
  isEmailConfirmed: boolean;
  gender: 'Male' | 'Female';
  role: 'Admin' | 'User';
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

export type UserRelatedCollectionItem = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/admin/users`;

  getUsers(): Observable<UsersTableRow[]> {
    return this.http
      .get<unknown>(this.baseUrl)
      .pipe(
        map((response: unknown) => this.extractCollection(response).map((item) => this.mapTableRow(item))),
      );
  }

  createUser(payload: CreateUserPayload): Observable<UsersTableRow> {
    return this.http
      .post<unknown>(this.baseUrl, this.mapCreateRequest(payload))
      .pipe(map((response: unknown) => this.mapTableRow(response)));
  }

  getUserById(id: string): Observable<UserDetailsResponse> {
    return this.http
      .get<unknown>(`${this.baseUrl}/${this.resolveApiId(id)}`)
      .pipe(map((response: unknown) => this.mapUserDetailsResponse(response)));
  }

  updateUser(id: string, payload: UpdateUserPayload): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${this.resolveApiId(id)}`, payload);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${this.resolveApiId(id)}`);
  }

  activateUser(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${this.resolveApiId(id)}/activate`, {});
  }

  deactivateUser(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${this.resolveApiId(id)}/deactivate`, {});
  }

  getUserBookings(id: string): Observable<UserRelatedCollectionItem[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/${this.resolveApiId(id)}/bookings`)
      .pipe(map((response: unknown) => this.extractCollection(response)));
  }

  getUserTickets(id: string): Observable<UserRelatedCollectionItem[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/${this.resolveApiId(id)}/tickets`)
      .pipe(map((response: unknown) => this.extractCollection(response)));
  }

  getUserPayments(id: string): Observable<UserRelatedCollectionItem[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/${this.resolveApiId(id)}/payments`)
      .pipe(map((response: unknown) => this.extractCollection(response)));
  }

  exportUsers(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export`, { responseType: 'blob' });
  }

  private mapCreateRequest(payload: CreateUserPayload): Record<string, unknown> {
    const request: Record<string, unknown> = {
      email: payload.email,
      title: payload.title,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
      address: payload.address,
      city: payload.city,
      gender: payload.gender || 'Male',
    };

    if (payload.dateOfBirth) {
      request['dateOfBirth'] = payload.dateOfBirth;
    }

    return request;
  }

  private mapTableRow(raw: unknown): UsersTableRow {
    const item = this.asRecord(raw);

    const id =
      this.asString(item?.['id']) ??
      this.asString(item?.['userId']) ??
      this.toIdString(item?.['userId']) ??
      this.generateTempId();
    const firstName = this.asString(item?.['firstName']) ?? '';
    const lastName = this.asString(item?.['lastName']) ?? '';
    const fallbackFullName = this.asString(`${firstName} ${lastName}`) ?? 'Unknown User';
    const fullName =
      this.asString(item?.['fullName']) ?? this.asString(item?.['name']) ?? fallbackFullName;

    const createdAt =
      this.asString(item?.['createdAt']) ??
      this.asString(item?.['joinedDate']) ??
      this.asString(item?.['createdOn']) ??
      this.asString(item?.['created']) ??
      new Date().toISOString().slice(0, 10);

    const role = this.normalizeRole(this.asString(item?.['role']));
    const status = this.normalizeStatus(item?.['isActive'], this.asString(item?.['status']));
    const emailConfirmed = this.normalizeEmailConfirmed(
      item?.['emailConfirmed'],
      this.asString(item?.['emailConfirmationStatus']),
    );
    const gender = this.normalizeGender(this.asString(item?.['gender']));

    return {
      id,
      name: fullName,
      joinedDate: createdAt,
      contact:
        this.asString(item?.['phoneNumber']) ??
        this.asString(item?.['contact']) ??
        this.asString(item?.['phone']) ??
        '—',
      city: this.asString(item?.['city']) ?? '—',
      gender,
      role,
      status,
      emailConfirmed,
      createdAt,
      dateOfBirth: this.asString(item?.['dateOfBirth']) ?? undefined,
    };
  }

  private mapUserDetailsResponse(raw: unknown): UserDetailsResponse {
    const item = this.asRecord(raw);
    const firstName = this.asString(item?.['firstName']) ?? '';
    const lastName = this.asString(item?.['lastName']) ?? '';
    const derivedFullName = `${firstName} ${lastName}`.trim();

    return {
      id:
        this.asString(item?.['id']) ??
        this.asString(item?.['userId']) ??
        this.toIdString(item?.['userId']) ??
        undefined,
      fullName:
        this.asString(item?.['fullName']) ??
        this.asString(item?.['name']) ??
        (derivedFullName || undefined),
      email: this.asString(item?.['email']) ?? undefined,
      phoneNumber:
        this.asString(item?.['phoneNumber']) ??
        this.asString(item?.['contact']) ??
        this.asString(item?.['phone']) ??
        undefined,
      dateOfBirth: this.asString(item?.['dateOfBirth']) ?? undefined,
      gender: this.asString(item?.['gender']) ?? undefined,
      city: this.asString(item?.['city']) ?? undefined,
      address: this.asString(item?.['address']) ?? undefined,
      role: this.asString(item?.['role']) ?? undefined,
      status: this.asString(item?.['status']) ?? undefined,
      isActive: this.asBoolean(item?.['isActive']) ?? undefined,
      emailConfirmed:
        this.asBoolean(item?.['emailConfirmed']) ??
        this.asBoolean(item?.['isEmailConfirmed']) ??
        undefined,
    };
  }

  private extractCollection(raw: unknown): UserRelatedCollectionItem[] {
    if (Array.isArray(raw)) {
      return raw.filter((item): item is UserRelatedCollectionItem => this.asRecord(item) !== null);
    }

    const item = this.asRecord(raw);
    if (!item) {
      return [];
    }

    const candidates = [item['items'], item['data'], item['users'], item['results'], item['value']];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.filter(
          (entry): entry is UserRelatedCollectionItem => this.asRecord(entry) !== null,
        );
      }
    }

    if (this.isUserLikeRecord(item)) {
      return [item];
    }

    return [];
  }

  private isUserLikeRecord(item: UserRelatedCollectionItem): boolean {
    return (
      typeof item['id'] === 'string' ||
      typeof item['userId'] === 'string' ||
      typeof item['email'] === 'string' ||
      typeof item['name'] === 'string'
    );
  }

  private normalizeRole(value: string | null): UsersTableRow['role'] {
    return value?.toLowerCase().includes('admin') ? 'Admin' : 'Customer';
  }

  private normalizeStatus(isActive: unknown, status: string | null): UsersTableRow['status'] {
    const active = this.asBoolean(isActive);
    if (typeof active === 'boolean') {
      return active ? 'ACTIVE' : 'SUSPENDED';
    }

    return status?.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED';
  }

  private normalizeEmailConfirmed(
    value: unknown,
    status: string | null,
  ): UsersTableRow['emailConfirmed'] {
    const confirmed = this.asBoolean(value);
    if (typeof confirmed === 'boolean') {
      return confirmed ? 'CONFIRMED' : 'NOT CONFIRMED';
    }

    if (status?.toUpperCase().includes('CONFIRMED')) {
      return 'CONFIRMED';
    }

    return 'NOT CONFIRMED';
  }

  private normalizeGender(value: string | null): UsersTableRow['gender'] {
    return value?.toLowerCase() === 'female' ? 'Female' : 'Male';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return this.isRecord(value) ? value : null;
  }

  private asString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private asBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') {
        return true;
      }
      if (normalized === 'false') {
        return false;
      }
    }

    return null;
  }

  private resolveApiId(id: string): string {
    return this.extractNumericId(id) ?? id;
  }

  private extractNumericId(value: string): string | null {
    const match = value.match(/\d+/);
    return match ? match[0] : null;
  }

  private toIdString(value: unknown): string | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return null;
  }

  private generateTempId(): string {
    return `USR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
}
