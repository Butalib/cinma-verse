import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { UsersSearchToolbarComponent } from '../componants/users-search-toolbar/users-search-toolbar.component';
import {
  UsersFilterPanelComponent,
  UsersFilter,
} from '../componants/users-filter-panel/users-filter-panel.component';
import { UserKpiComponent } from '../componants/userKpi/components/user-kpi.component';
import {
  UsersTableComponent,
  UsersTableRow,
} from '../componants/users-table/users-table.component';
import { PaginationComponent } from '../componants/pagination/pagination.component';
import {
  CreateUserModalComponent,
  CreateUserPayload,
} from '../../add-user/create-user-modal.component';
import { EditUserModalComponent, EditUserDetails } from '../../edit-user/edit-user-modal.component';
import {
  UpdateUserFormPayload,
  UpdateUserPayload,
  UserDetailsResponse,
  UsersService,
} from '../services/users.service';
import { UserIntelligenceModalComponent } from '../../user-intelligence-modal/user-intelligence-modal.component';
import type { UserIntelligenceSelectedUser } from '../../user-intelligence-modal/user-intelligence.types';
import type { UserOverview } from '../../user-intelligence-modal/user-overview/user-overview.model';
import type { UserBookingRow } from '../../user-intelligence-modal/user-bookings/user-bookings.mock';
import type { UserTicketRow } from '../../user-intelligence-modal/user-tickets/user-tickets.mock';
import type { UserPaymentRow } from '../../user-intelligence-modal/user-payments/user-payments.mock';
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
    dateOfBirth: '1996-04-22',
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
    dateOfBirth: '1992-11-08',
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
    dateOfBirth: '1989-06-15',
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
    dateOfBirth: '1998-01-03',
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
    dateOfBirth: '1987-09-11',
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
    dateOfBirth: '1995-02-27',
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
    dateOfBirth: '1999-05-13',
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
    dateOfBirth: '1993-10-29',
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
    dateOfBirth: '1991-12-05',
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
    dateOfBirth: '2000-03-19',
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
    dateOfBirth: '1988-08-01',
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
    dateOfBirth: '1994-07-09',
  },
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
export class LayoutComponant implements OnInit {
  readonly pageSize = signal(10);

  readonly isFilterOpen = signal(false);
  readonly isCreateUserModalOpen = signal(false);
  readonly isEditUserModalOpen = signal(false);
  readonly isUserIntelligenceModalOpen = signal(false);
  readonly intelligenceSelectedUser = signal<UserIntelligenceSelectedUser | null>(null);
  readonly intelligenceOverview = signal<UserOverview | null>(null);
  readonly intelligenceBookings = signal<UserBookingRow[] | null>(null);
  readonly intelligenceTickets = signal<UserTicketRow[] | null>(null);
  readonly intelligencePayments = signal<UserPaymentRow[] | null>(null);
  readonly selectedUserDetails = signal<EditUserDetails | null>(null);
  readonly isEditSaving = signal(false);
  private readonly usersService = inject(UsersService);
  readonly allUsers = signal<UsersTableRow[]>(MOCK_USERS);
  readonly searchTerm = signal('');
  readonly activeFilters = signal<UsersFilter>({});
  readonly currentPage = signal(1);

  ngOnInit(): void {
    this.loadUsers();
  }

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
    this.usersService.createUser(payload).subscribe({
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
          dateOfBirth: payload.dateOfBirth || undefined,
        };

        this.allUsers.update((users) => [newUser, ...users]);
        this.currentPage.set(1);
        this.isCreateUserModalOpen.set(false);
      },
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
    this.loadUserIntelligenceCollections(userId);
    this.isUserIntelligenceModalOpen.set(true);
  }

  closeUserIntelligenceModal() {
    this.isUserIntelligenceModalOpen.set(false);
    this.intelligenceSelectedUser.set(null);
    this.intelligenceOverview.set(null);
    this.intelligenceBookings.set(null);
    this.intelligenceTickets.set(null);
    this.intelligencePayments.set(null);
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
      },
    });
  }

  closeEditUserModal() {
    if (this.isEditSaving()) {
      return;
    }

    this.isEditUserModalOpen.set(false);
    this.selectedUserDetails.set(null);
  }

  onSaveUserChanges(payload: UpdateUserFormPayload) {
    const selected = this.selectedUserDetails();
    if (!selected) {
      return;
    }

    this.isEditSaving.set(true);

    this.usersService
      .updateUser(selected.id, this.buildUpdatePayload(selected, payload))
      .subscribe({
        next: () => {
          const activationRequest$ = payload.isActive
            ? this.usersService.activateUser(selected.id)
            : this.usersService.deactivateUser(selected.id);

          activationRequest$.subscribe({
            next: () => this.finalizeUserEdit(selected.id, payload),
            error: () => this.finalizeUserEdit(selected.id, payload),
          });
        },
        error: (err) => {
          console.error('Update user failed, applying local update', err);
          this.finalizeUserEdit(selected.id, payload);
        },
      });
  }

  onDeleteUser(userId: string) {
    this.usersService.deleteUser(userId).subscribe({
      next: () => this.removeUserFromList(userId),
      error: (err) => {
        console.error('Delete user API failed, applying local delete', err);
        this.removeUserFromList(userId);
      },
    });
  }

  private loadUsers(): void {
    this.usersService.getUsers().subscribe({
      next: (users) => {
        if (users.length > 0) {
          this.allUsers.set(users);
          this.currentPage.set(1);
        }
      },
      error: (err) => {
        console.error('Load users API failed, using mock data', err);
      },
    });
  }

  private removeUserFromList(userId: string): void {
    this.allUsers.update((items) => items.filter((user) => user.id !== userId));

    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }
  }

  private loadUserIntelligenceCollections(userId: string): void {
    this.usersService.getUserBookings(userId).subscribe({
      next: (items) => this.intelligenceBookings.set(this.mapBookings(items)),
      error: () => this.intelligenceBookings.set(null),
    });

    this.usersService.getUserTickets(userId).subscribe({
      next: (items) => this.intelligenceTickets.set(this.mapTickets(items)),
      error: () => this.intelligenceTickets.set(null),
    });

    this.usersService.getUserPayments(userId).subscribe({
      next: (items) => this.intelligencePayments.set(this.mapPayments(items)),
      error: () => this.intelligencePayments.set(null),
    });
  }

  private mapBookings(items: Record<string, unknown>[]): UserBookingRow[] {
    return items.map((item, index) => {
      const seats = this.toStringArray(item['seatLabels'] ?? item['seats']);
      const ticketsCount =
        this.toNumber(item['ticketsCount'] ?? item['ticketCount']) ?? Math.max(seats.length, 1);

      return {
        id: this.toString(item['id']) ?? `booking-${index}`,
        bookingId: this.prefix(
          this.toString(item['bookingId']) ?? this.toString(item['id']),
          '#BK-',
        ),
        movieTitle:
          this.toString(item['movieTitle']) ?? this.toString(item['title']) ?? 'Unknown movie',
        movieSub: this.toString(item['movieSub']) ?? this.toString(item['hall']) ?? '—',
        showtime: this.toString(item['showtime']) ?? this.toString(item['showTime']) ?? '—',
        expires: this.toString(item['expires']) ?? this.toString(item['expiresAt']) ?? '—',
        seatLabels: seats.length > 0 ? seats.slice(0, 2) : ['—'],
        seatMore: seats.length > 2 ? seats.length - 2 : undefined,
        ticketsCount,
        amount: this.toNumber(item['amount']) ?? this.toNumber(item['totalAmount']) ?? 0,
        status: this.normalizeBookingStatus(this.toString(item['status'])),
        createdAt: this.toString(item['createdAt']) ?? this.toString(item['created']) ?? '—',
        createdIso: this.toString(item['createdIso']) ?? this.toString(item['createdAt']) ?? '',
      };
    });
  }

  private mapTickets(items: Record<string, unknown>[]): UserTicketRow[] {
    return items.map((item, index) => ({
      id: this.toString(item['id']) ?? `ticket-${index}`,
      ticketId: this.prefix(this.toString(item['ticketId']) ?? this.toString(item['id']), '#TK-'),
      ticketNumber: this.toString(item['ticketNumber']) ?? this.toString(item['number']) ?? '—',
      movieTitle:
        this.toString(item['movieTitle']) ?? this.toString(item['title']) ?? 'Unknown movie',
      showtime: this.toString(item['showtime']) ?? this.toString(item['showTime']) ?? '—',
      showtimeId: this.toString(item['showtimeId']) ?? this.toString(item['showTimeId']) ?? '—',
      bookingIdRef: this.prefix(
        this.toString(item['bookingId']) ?? this.toString(item['bookingRef']),
        '#BK-',
      ),
      seat: this.toString(item['seat']) ?? this.toString(item['seatLabel']) ?? '—',
      hall: this.toString(item['hall']) ?? '—',
      branch: this.toString(item['branch']) ?? this.toString(item['branchName']) ?? '—',
      amount: this.toNumber(item['amount']) ?? this.toNumber(item['price']) ?? 0,
      status: this.normalizeTicketStatus(this.toString(item['status'])),
    }));
  }

  private mapPayments(items: Record<string, unknown>[]): UserPaymentRow[] {
    return items.map((item, index) => ({
      id: this.toString(item['id']) ?? `payment-${index}`,
      paymentId: this.prefix(
        this.toString(item['paymentId']) ?? this.toString(item['id']),
        '#PMT-',
      ),
      bookingRef: this.prefix(
        this.toString(item['bookingId']) ?? this.toString(item['bookingRef']),
        '#BK-',
      ),
      amount: this.toNumber(item['amount']) ?? 0,
      transactionDate:
        this.toString(item['transactionDate']) ?? this.toString(item['createdAt']) ?? '—',
      transactionIso:
        this.toString(item['transactionIso']) ?? this.toString(item['createdAt']) ?? '',
      status: this.normalizePaymentStatus(this.toString(item['status'])),
    }));
  }

  private normalizeBookingStatus(value: string | null): UserBookingRow['status'] {
    const normalized = value?.toLowerCase();
    if (normalized === 'pending') {
      return 'pending';
    }
    if (normalized === 'cancelled' || normalized === 'canceled') {
      return 'cancelled';
    }
    if (normalized === 'expired') {
      return 'expired';
    }
    return 'confirmed';
  }

  private normalizeTicketStatus(value: string | null): UserTicketRow['status'] {
    const normalized = value?.toLowerCase();
    if (normalized === 'used') {
      return 'used';
    }
    if (normalized === 'cancelled' || normalized === 'canceled') {
      return 'cancelled';
    }
    return 'active';
  }

  private normalizePaymentStatus(value: string | null): UserPaymentRow['status'] {
    const normalized = value?.toLowerCase();
    if (normalized === 'pending') {
      return 'pending';
    }
    if (normalized === 'failed') {
      return 'failed';
    }
    if (normalized === 'cancelled' || normalized === 'canceled') {
      return 'cancelled';
    }
    return 'completed';
  }

  private toString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );
  }

  private prefix(value: string | null, prefixValue: string): string {
    if (!value) {
      return `${prefixValue}—`;
    }

    return value.startsWith('#') || value.startsWith(prefixValue)
      ? value
      : `${prefixValue}${value}`;
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
      emailConfirmed: user.emailConfirmed === 'CONFIRMED',
    };
  }

  private mapEditDetailsFromApi(
    user: UsersTableRow,
    details: UserDetailsResponse,
  ): EditUserDetails {
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
      emailConfirmed: this.normalizeEmailConfirmed(details, fallback.emailConfirmed),
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

  private buildUpdatePayload(
    selected: EditUserDetails,
    payload: UpdateUserFormPayload,
  ): UpdateUserPayload {
    const [firstName, ...rest] = selected.fullName.trim().split(/\s+/);

    return {
      email: selected.email,
      firstName: firstName || selected.fullName || 'User',
      lastName: rest.join(' ') || '-',
      phoneNumber: selected.phoneNumber,
      address: selected.address,
      city: selected.city,
      dateOfBirth: selected.dateOfBirth,
      isActive: payload.isActive,
      isEmailConfirmed: payload.emailConfirmed,
      gender: selected.gender.toLowerCase() === 'female' ? 'Female' : 'Male',
      role: payload.role.toLowerCase() === 'admin' ? 'Admin' : 'User',
    };
  }

  private applyEditResult(
    user: UsersTableRow,
    payload: UpdateUserFormPayload,
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
      emailConfirmed: emailConfirmed ? 'CONFIRMED' : 'NOT CONFIRMED',
    };
  }

  private finalizeUserEdit(
    id: string,
    payload: UpdateUserFormPayload,
    updated?: UserDetailsResponse,
  ): void {
    this.allUsers.update((items) =>
      items.map((user) => (user.id === id ? this.applyEditResult(user, payload, updated) : user)),
    );

    this.isEditSaving.set(false);
    this.isEditUserModalOpen.set(false);
    this.selectedUserDetails.set(null);
  }
}
