import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserPayload } from '../../add-user/create-user-modal.component';
import { UsersTableRow } from '../componants/users-table/users-table.component';
import { UpdateUserPayload, UsersService } from './users.service';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly usersService = inject(UsersService);

  createUser(payload: CreateUserPayload): Observable<UsersTableRow> {
    return this.usersService.createUser(payload);
  }

  updateUser(id: string, payload: UpdateUserPayload): Observable<void> {
    return this.usersService.updateUser(id, payload);
  }

  deleteUser(id: string): Observable<void> {
    return this.usersService.deleteUser(id);
  }
}
