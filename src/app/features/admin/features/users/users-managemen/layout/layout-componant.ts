import { Component, computed, inject, signal } from '@angular/core';
import { UsersSearchToolbarComponent } from '../componants/users-search-toolbar/users-search-toolbar.component';
import { UsersFilterPanelComponent, UsersFilter } from '../componants/users-filter-panel/users-filter-panel.component';
import { UserKpiComponent } from '../componants/userKpi/components/user-kpi.component';
import { UsersTableComponent, UsersTableRow } from '../componants/users-table/users-table.component';
import { PaginationComponent } from '../componants/pagination/pagination.component';
import { CreateUserModalComponent, CreateUserPayload } from '../../add-user/create-user-modal.component';
import { UsersApiService } from '../services/users-api.service';
import { EditUserModalComponent, EditUserDetails } from '../../edit-user/edit-user-modal.component';
import { UpdateUserPayload, UserDetailsResponse, UsersService } from '../services/users.service';
import { UserIntelligenceModalComponent } from '../../user-intelligence-modal/user-intelligence-modal.component';
import type { UserIntelligenceSelectedUser } from '../../user-intelligence-modal/user-intelligence.types';
import type { UserOverview } from '../../user-intelligence-modal/user-overview/user-overview.model';
import {
  mapUsersTableRowToSelectedUser,
  mapUsersTableRowToUserOverview,
} from '../map-users-table-to-intelligence';

const MOCK_USERS: UsersTableRow[] = [
  {
    id: 'USR-1001',
    name: 'Liam Carter',
    joinedDate: '2025-01-15',
    contact: '+1 (415) 555-0141',
    city: 'San Francisco',
    gender: 'Male',
    role: 'Customer',
    status: 'ACTIVE',
    emailConfirmed: 'CONFIRMED',
    createdAt: '2025-01-15',
    dateOfBirth: '1996-04-22'
  },
  {
    id: 'USR-1002',
    name: 'Nora Salem',
    joinedDate: '2025-02-02',
    contact: '+20 100 223 7788',
    city: 'Cairo',
    gender: 'Female',
    role: 'Customer',
    status: 'ACTIVE',
    emailConfirmed: 'CONFIRMED',
    createdAt: '2025-02-02',
    dateOfBirth: '1992-11-08'
  },
  {
    id: 'USR-1003',
    name: 'Adam Blake',
    joinedDate: '2025-02-10',
    contact: '+44 7700 900101',
    city: 'London',
    gender: 'Male',
    role: 'Customer',
    status: 'SUSPENDED',
    emailConfirmed: 'NOT CONFIRMED',
    createdAt: '2025-02-10',
    dateOfBirth: '1989-06-15'
  },
  {
    id: 'USR-1004',
    name: 'Maya Chen',
    joinedDate: '2025-02-24',
    contact: '+86 138 0013 1122',
    city: 'Shanghai',
    gender: 'Female',
    role: 'Customer',
    status: 'ACTIVE',
    emailConfirmed: 'CONFIRMED',
    createdAt: '2025-02-24',
    dateOfBirth: '1998-01-03'
  },
  {
    id: 'USR-1005',
    name: 'Omar Khaled',
    joinedDate: '2025-03-04',
    contact: '+20 101 118 3344',
    city: 'Alexandria',
    gender: 'Male',
    role: 'Admin',
    status: 'ACTIVE',
    emailConfirmed: 'CONFIRMED',
    createdAt: '2025-03-04',
    dateOfBirth: '1987-09-11'
  },
  {
    id: 'USR-1006',
    name: 'Sofia Rossi',
    joinedDate: '2025-03-08',
    contact: '+39 347 555 0192',
    city: 'Milan',
    gender: 'Female',
    role: 'Customer',
    status: 'ACTIVE',
    emailConfirmed: 'CONFIRMED',
    createdAt: '2025-03-08',
    dateOfBirth: '1995-02-27'
  },
  {
    id: 'USR-1007',
    name: 'Yousef Adel',
    joinedDate: '2025-03-15',
    contact: '+20 122 300 8877',
    city: 'Giza',
    gender: 'Male',
    role: 'Customer',
    status: 'SUSPENDED',
    emailConfirmed: 'NOT CONFIRMED',
    createdAt: '2025-03-15',
    dateOfBirth: '1999-05-13'
  },
  {
    id: 'USR-1008',
    name: 'Julia Martin',
    joinedDate: '2025-03-25',
    contact: '+33 6 12 34 56 78',
    city: 'Paris',
    gender: 'Female',
    role: 'Customer',
    status: 'ACTIVE',
    emailConfirmed: 'CONFIRMED',
    createdAt: '2025-03-25',
    dateOfBirth: '1993-10-29'
  },
  {
    id: 'USR-1009',
    name: 'Hassan Nabil',
    joinedDate: '2025-04-01',
    contact: '+20 127 900 2211',
    city: 'Mansoura',
    gender: 'Male',
    role: 'Customer',
    status: 'ACTIVE',
    emailConfirmed: 'CONFIRMED',
    createdAt: '2025-04-01',
    dateOfBirth: '1991-12-05'
  },
  {
    id: 'USR-1010',
    name: 'Rania Tarek',
    joinedDate: '2025-04-03',
    contact: '+20 115 470 9922',
    city: 'Cairo',
    gender: 'Female',
    role: 'Customer',
    status: 'ACTIVE',
    emailConfirmed: 'NOT CONFIRMED',
    createdAt: '2025-04-03',
    dateOfBirth: '2000-03-19'
  },
  {
    id: 'USR-1011',
    name: 'Peter Novak',
    joinedDate: '2025-04-06',
    contact: '+420 777 555 201',
    city: 'Prague',
    gender: 'Male',
    role: 'Customer',
    status: 'SUSPENDED',
    emailConfirmed: 'CONFIRMED',
    createdAt: '2025-04-06',
    dateOfBirth: '1988-08-01'
  },
  {
    id: 'USR-1012',
    name: 'Dana Ibrahim',
    joinedDate: '2025-04-07',
    contact: '+20 109 580 8833',
    city: 'Tanta',
    gender: 'Female',
    role: 'Admin',
    status: 'ACTIVE',
    emailConfirmed: 'CONFIRMED',
    createdAt: '2025-04-07',
    dateOfBirth: '1994-07-09'
  }
];

@Component({
  selector: 'app-layout-componant',
  standalone: true,
  imports: [
    UserKpiComponent,
    UsersSearchToolbarComponent,
    UsersFilterPanelComponent,
    UsersTableComponent,
    PaginationComponent,
    CreateUserModalComponent,
    EditUserModalComponent,
    UserIntelligenceModalComponent,
  ],
  templateUrl: './layout-componant.html',
  styleUrl: './layout-componant.css',
})
export class LayoutComponant {
  readonly pageSize = signal(10);

  readonly isFilterOpen = signal(false);
  readonly isCreateUserModalOpen = signal(false);
  readonly isEditUserModalOpen = signal(false);
  readonly isUserIntelligenceModalOpen = signal(false);
  readonly intelligenceSelectedUser = signal<UserIntelligenceSelectedUser | null>(null);
  readonly intelligenceOverview = signal<UserOverview | null>(null);
  readonly selectedUserDetails = signal<EditUserDetails | null>(null);
  readonly isEditSaving = signal(false);
  private readonly usersApi = inject(UsersApiService);
  private readonly usersService = inject(UsersService);
  readonly allUsers = signal<UsersTableRow[]>(MOCK_USERS);
  readonly searchTerm = signal('');
  readonly activeFilters = signal<UsersFilter>({});
  readonly currentPage = signal(1);

  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const filters = this.activeFilters();

    return this.allUsers().filter((user) => {
      if (term) {
        const searchTarget = `${user.id} ${user.name} ${user.contact} ${user.city}`.toLowerCase();
        if (!searchTarget.includes(term)) {
          return false;
        }
      }

      if (filters.isActive !== undefined) {
        const isActive = user.status === 'ACTIVE';
        if (isActive !== filters.isActive) {
          return false;
        }
      }

      if (filters.emailConfirmed !== undefined) {
        const isConfirmed = user.emailConfirmed === 'CONFIRMED';
        if (isConfirmed !== filters.emailConfirmed) {
          return false;
        }
      }

      if (filters.gender) {
        if (user.gender.toLowerCase() !== filters.gender.toLowerCase()) {
          return false;
        }
      }

      if (filters.city) {
        if (!user.city.toLowerCase().includes(filters.city.toLowerCase())) {
          return false;
        }
      }

      const createdDate = this.parseDateValue(user.createdAt);
      const birthDate = this.parseDateValue(user.dateOfBirth ?? '');

      if (filters.createdFrom && (!createdDate || createdDate < filters.createdFrom)) {
        return false;
      }

      if (filters.createdTo && (!createdDate || createdDate > filters.createdTo)) {
        return false;
      }

      if (filters.dateOfBirthFrom && (!birthDate || birthDate < filters.dateOfBirthFrom)) {
        return false;
      }

      if (filters.dateOfBirthTo && (!birthDate || birthDate > filters.dateOfBirthTo)) {
        return false;
      }

      return true;
    });
  });

  readonly totalPages = computed(() => {
    const pages = Math.ceil(this.filteredUsers().length / this.pageSize());
    return Math.max(pages, 1);
  });

  readonly pagedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredUsers().slice(start, end);
  });

  toggleFilter() {
    this.isFilterOpen.update((v) => !v);
  }

  openCreateUserModal() {
    this.isCreateUserModalOpen.set(true);
  }

  closeCreateUserModal() {
    this.isCreateUserModalOpen.set(false);
  }

  onCreateUser(payload: CreateUserPayload) {
    // Call backend API; on failure fall back to local add
    this.usersApi.createUser(payload).subscribe({
      next: (created) => {
        this.allUsers.update((users) => [created, ...users]);
        this.currentPage.set(1);
        this.isCreateUserModalOpen.set(false);
      },
      error: (err) => {
        console.error('Create user API failed, falling back to local add', err);
        const now = new Date();
        const today = now.toISOString().slice(0, 10);

        const newUser: UsersTableRow = {
          id: this.generateNextUserId(),
          name: `${payload.firstName} ${payload.lastName}`.trim(),
          joinedDate: today,
          contact: payload.phoneNumber,
          city: payload.city,
          gender: payload.gender || 'Male',
          role: 'Customer',
          status: 'ACTIVE',
          emailConfirmed: 'CONFIRMED',
          createdAt: today,
          dateOfBirth: payload.dateOfBirth || undefined
        };

        this.allUsers.update((users) => [newUser, ...users]);
        this.currentPage.set(1);
        this.isCreateUserModalOpen.set(false);
      }
    });
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  onApplyFilters(filters: UsersFilter) {
    this.activeFilters.set(filters);
    this.currentPage.set(1);
  }

  onResetFilters() {
    this.activeFilters.set({});
    this.currentPage.set(1);
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  onPageSizeChange(page: number) {
    this.pageSize.set(page);
    this.currentPage.set(1);
  }

  onViewUser(userId: string) {
    const row = this.allUsers().find((u) => u.id === userId);
    if (!row) {
      return;
    }
    this.intelligenceSelectedUser.set(mapUsersTableRowToSelectedUser(row));
    this.intelligenceOverview.set(mapUsersTableRowToUserOverview(row));
    this.isUserIntelligenceModalOpen.set(true);
  }

  closeUserIntelligenceModal() {
    this.isUserIntelligenceModalOpen.set(false);
    this.intelligenceSelectedUser.set(null);
    this.intelligenceOverview.set(null);
  }

  onEditUser(user: UsersTableRow) {
    this.isEditSaving.set(false);

    this.usersService.getUserById(user.id).subscribe({
      next: (details) => {
        this.selectedUserDetails.set(this.mapEditDetailsFromApi(user, details));
        this.isEditUserModalOpen.set(true);
      },
      error: (err) => {
        console.error('Get user details failed, opening with table data', err);
        this.selectedUserDetails.set(this.mapEditDetailsFromRow(user));
        this.isEditUserModalOpen.set(true);
      }
    });
  }

  closeEditUserModal() {
    if (this.isEditSaving()) {
      return;
    }

    this.isEditUserModalOpen.set(false);
    this.selectedUserDetails.set(null);
  }

  onSaveUserChanges(payload: UpdateUserPayload) {
    const selected = this.selectedUserDetails();
    if (!selected) {
      return;
    }

    this.isEditSaving.set(true);

    this.usersService.updateUser(selected.id, payload).subscribe({
      next: (updated) => {
        this.allUsers.update((items) =>
          items.map((user) =>
            user.id === selected.id
              ? this.applyEditResult(user, payload, updated)
              : user
          )
        );

        this.isEditSaving.set(false);
        this.isEditUserModalOpen.set(false);
        this.selectedUserDetails.set(null);
      },
      error: (err) => {
        console.error('Update user failed, applying local update', err);
        this.allUsers.update((items) =>
          items.map((user) =>
            user.id === selected.id
              ? this.applyEditResult(user, payload)
              : user
          )
        );

        this.isEditSaving.set(false);
        this.isEditUserModalOpen.set(false);
        this.selectedUserDetails.set(null);
      }
    });
  }

  onDeleteUser(userId: string) {
    this.allUsers.update((items) => items.filter((user) => user.id !== userId));

    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }

    console.log('Delete user', userId);
  }

  private parseDateValue(value: string): Date | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\s+\d{2}:\d{2}$/, '').trim();
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private generateNextUserId(): string {
    const maxId = this.allUsers().reduce((max, user) => {
      const value = Number(user.id.replace('USR-', ''));
      return Number.isNaN(value) ? max : Math.max(max, value);
    }, 1000);

    return `USR-${String(maxId + 1)}`;
  }

  private mapEditDetailsFromRow(user: UsersTableRow): EditUserDetails {
    return {
      id: user.id,
      fullName: user.name,
      email: '',
      phoneNumber: user.contact,
      dateOfBirth: user.dateOfBirth ?? '',
      gender: user.gender,
      city: user.city,
      address: '',
      role: user.role === 'Admin' ? 'admin' : 'user',
      isActive: user.status === 'ACTIVE',
      emailConfirmed: user.emailConfirmed === 'CONFIRMED'
    };
  }

  private mapEditDetailsFromApi(user: UsersTableRow, details: UserDetailsResponse): EditUserDetails {
    const fallback = this.mapEditDetailsFromRow(user);

    return {
      id: details.id ?? fallback.id,
      fullName: details.fullName ?? details.name ?? fallback.fullName,
      email: details.email ?? fallback.email,
      phoneNumber: details.phoneNumber ?? details.contact ?? fallback.phoneNumber,
      dateOfBirth: details.dateOfBirth ?? fallback.dateOfBirth,
      gender: details.gender ?? fallback.gender,
      city: details.city ?? fallback.city,
      address: details.address ?? fallback.address,
      role: this.normalizeRole(details.role, fallback.role),
      isActive: this.normalizeIsActive(details, fallback.isActive),
      emailConfirmed: this.normalizeEmailConfirmed(details, fallback.emailConfirmed)
    };
  }

  private normalizeRole(role: string | undefined, fallback: 'user' | 'admin'): 'user' | 'admin' {
    if (!role) {
      return fallback;
    }

    return role.toLowerCase() === 'admin' ? 'admin' : 'user';
  }

  private normalizeIsActive(details: UserDetailsResponse, fallback: boolean): boolean {
    if (typeof details.isActive === 'boolean') {
      return details.isActive;
    }

    if (details.status) {
      return details.status.toUpperCase() === 'ACTIVE';
    }

    return fallback;
  }

  private normalizeEmailConfirmed(details: UserDetailsResponse, fallback: boolean): boolean {
    if (typeof details.emailConfirmed === 'boolean') {
      return details.emailConfirmed;
    }

    return fallback;
  }

  private applyEditResult(
    user: UsersTableRow,
    payload: UpdateUserPayload,
    updated?: UserDetailsResponse,
  ): UsersTableRow {
    const role = this.normalizeRole(updated?.role, payload.role === 'admin' ? 'admin' : 'user');
    const isActive = updated ? this.normalizeIsActive(updated, payload.isActive) : payload.isActive;
    const emailConfirmed = updated
      ? this.normalizeEmailConfirmed(updated, payload.emailConfirmed)
      : payload.emailConfirmed;

    return {
      ...user,
      role: role === 'admin' ? 'Admin' : 'Customer',
      status: isActive ? 'ACTIVE' : 'SUSPENDED',
      emailConfirmed: emailConfirmed ? 'CONFIRMED' : 'NOT CONFIRMED'
    };
  }
}
