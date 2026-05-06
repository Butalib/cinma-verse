import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateUserPayload } from '../../add-user/create-user-modal.component';
import { UsersTableRow } from '../componants/users-table/users-table.component';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/users';

  createUser(payload: CreateUserPayload): Observable<UsersTableRow> {
    return this.http.post<UsersTableRow>(`${this.baseUrl}`, payload);
  }
}
