import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../users/users-managemen/componants/pagination/pagination.component';
import {
  AddBranchModalComponent,
  AddBranchPayload,
} from '../add-branch-modal/add-branch-modal.component';
import {
  EditBranchModalComponent,
  EditBranchPayload,
} from '../edit-branch-modal/edit-branch-modal.component';
import { ViewBranchModalComponent } from '../view-branch-modal/view-branch-modal.component';
import {
  AddHallModalComponent,
  AddHallPayload,
  HallBranchOption,
} from '../add-hall-modal/add-hall-modal.component';
import {
  EditHallModalComponent,
  EditHallPayload,
} from '../edit-hall-modal/edit-hall-modal.component';
import { ViewHallModalComponent } from '../view-hall-modal/view-hall-modal.component';
import {
  BranchesService,
  BranchUpsertPayload,
  HallUpsertPayload,
} from '../../services/branches.service';

export type BranchStatus = 'ACTIVE' | 'MAINTENANCE';

export interface BranchRow {
  id: string;
  name: string;
  location: string;
  totalHalls: number;
  capacity: number;
  status: BranchStatus;
}

export interface HallRow {
  id: string;
  number: number;
  type: string;
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE';
  branchId: string;
  branchName: string;
}

const MOCK_BRANCHES: BranchRow[] = [
  {
    id: 'BRN-001',
    name: 'CinemaVerse Downtown',
    location: 'Downtown Metro Center, Block A',
    totalHalls: 12,
    capacity: 1840,
    status: 'ACTIVE',
  },
  {
    id: 'BRN-002',
    name: 'CinemaVerse Westfield',
    location: 'Westfield Mall, Level 3',
    totalHalls: 8,
    capacity: 1200,
    status: 'ACTIVE',
  },
  {
    id: 'BRN-003',
    name: 'CinemaVerse Nile Plaza',
    location: 'Nile Plaza, Corniche Road',
    totalHalls: 10,
    capacity: 1560,
    status: 'ACTIVE',
  },
  {
    id: 'BRN-004',
    name: 'CinemaVerse Galaxy',
    location: 'Galaxy Tower, Floor 5',
    totalHalls: 6,
    capacity: 900,
    status: 'MAINTENANCE',
  },
  {
    id: 'BRN-005',
    name: 'CinemaVerse Sunrise',
    location: 'Sunrise District, Main Street',
    totalHalls: 9,
    capacity: 1350,
    status: 'ACTIVE',
  },
  {
    id: 'BRN-006',
    name: 'CinemaVerse Park Avenue',
    location: 'Park Avenue Center, South Wing',
    totalHalls: 11,
    capacity: 1720,
    status: 'ACTIVE',
  },
  {
    id: 'BRN-007',
    name: 'CinemaVerse Marina',
    location: 'Marina Bay Complex, Tower B',
    totalHalls: 7,
    capacity: 1050,
    status: 'ACTIVE',
  },
  {
    id: 'BRN-008',
    name: 'CinemaVerse Heritage',
    location: 'Heritage Square, Old Town',
    totalHalls: 5,
    capacity: 750,
    status: 'MAINTENANCE',
  },
  {
    id: 'BRN-009',
    name: 'CinemaVerse Skyline',
    location: 'Skyline Towers, Penthouse Level',
    totalHalls: 14,
    capacity: 2100,
    status: 'ACTIVE',
  },
  {
    id: 'BRN-010',
    name: 'CinemaVerse Central',
    location: 'Central Hub, East Gate',
    totalHalls: 8,
    capacity: 1200,
    status: 'ACTIVE',
  },
  {
    id: 'BRN-011',
    name: 'CinemaVerse Oasis',
    location: 'Oasis Mall, Ground Floor',
    totalHalls: 6,
    capacity: 880,
    status: 'ACTIVE',
  },
  {
    id: 'BRN-012',
    name: 'CinemaVerse Promenade',
    location: 'Promenade Boulevard, Unit 15',
    totalHalls: 10,
    capacity: 1500,
    status: 'ACTIVE',
  },
];

@Component({
  selector: 'app-branches-management',
  standalone: true,
  imports: [
    CommonModule,
    PaginationComponent,
    AddBranchModalComponent,
    EditBranchModalComponent,
    ViewBranchModalComponent,
    AddHallModalComponent,
    EditHallModalComponent,
    ViewHallModalComponent,
  ],
  templateUrl: './branches-management.component.html',
  styleUrl: './branches-management.component.scss',
})
export class BranchesManagementComponent {
  private readonly branchesService = inject(BranchesService);

  readonly pageSize = signal(10);

  readonly allBranches = signal<BranchRow[]>(MOCK_BRANCHES);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly locationFilter = signal('');
  readonly currentPage = signal(1);

  // KPI computed values
  readonly totalBranches = computed(() => this.allBranches().length);
  readonly totalHalls = computed(() => this.allBranches().reduce((s, b) => s + b.totalHalls, 0));
  readonly totalShowtimes = signal('1,254');
  readonly totalCapacity = computed(() =>
    this.allBranches()
      .reduce((s, b) => s + b.capacity, 0)
      .toLocaleString(),
  );

  constructor() {
    this.loadBranchesFromApi();
  }

  // Modal states
  readonly isAddBranchOpen = signal(false);
  readonly isEditBranchOpen = signal(false);
  readonly isViewBranchOpen = signal(false);
  readonly isAddHallOpen = signal(false);
  readonly isEditHallOpen = signal(false);
  readonly isViewHallOpen = signal(false);
  readonly selectedBranch = signal<BranchRow | null>(null);
  readonly selectedHall = signal<HallRow | null>(null);
  readonly selectedBranchHalls = signal<HallRow[]>([]);

  readonly branchOptions = computed<HallBranchOption[]>(() =>
    this.allBranches().map((branch) => ({ id: branch.id, name: branch.name })),
  );

  readonly filteredBranches = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const loc = this.locationFilter();

    return this.allBranches().filter((branch) => {
      if (term) {
        const target = `${branch.id} ${branch.name} ${branch.location}`.toLowerCase();
        if (!target.includes(term)) return false;
      }
      if (loc) {
        if (!branch.location.toLowerCase().includes(loc.toLowerCase())) return false;
      }
      return true;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(Math.ceil(this.filteredBranches().length / this.pageSize()), 1),
  );

  readonly pagedBranches = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredBranches().slice(start, start + this.pageSize());
  });

  readonly showingFrom = computed(() => {
    if (this.filteredBranches().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly showingTo = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.filteredBranches().length),
  );

  readonly totalCount = computed(() => this.filteredBranches().length);

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm.set(target?.value ?? '');
    this.currentPage.set(1);
  }

  onLocationFilter(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.locationFilter.set(target?.value ?? '');
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onPageSizeChange(page: number): void {
    this.pageSize.set(page);
    this.currentPage.set(1);
  }

  // Modal operations
  openAddBranch(): void {
    this.isAddBranchOpen.set(true);
  }

  closeAddBranch(): void {
    this.isAddBranchOpen.set(false);
  }

  openEditModal(branch: BranchRow): void {
    this.selectedBranch.set(branch);
    this.isEditBranchOpen.set(true);
  }

  closeEditBranch(): void {
    this.isEditBranchOpen.set(false);
    this.selectedBranch.set(null);
  }

  openViewModal(branch: BranchRow): void {
    this.selectedBranch.set(branch);
    this.loadHallsForBranch(branch.id);
    this.isViewBranchOpen.set(true);
  }

  closeViewBranch(): void {
    this.isViewBranchOpen.set(false);
    this.selectedBranch.set(null);
    this.selectedBranchHalls.set([]);
  }

  openDeleteConfirm(branch: BranchRow): void {
    const applyLocalDelete = () => {
      this.allBranches.update((items) => items.filter((b) => b.id !== branch.id));
      if (this.currentPage() > this.totalPages()) {
        this.currentPage.set(this.totalPages());
      }
    };

    const numericId = this.extractNumericId(branch.id);
    if (numericId === null) {
      applyLocalDelete();
      return;
    }

    this.branchesService.deleteBranch(numericId).subscribe({
      next: () => applyLocalDelete(),
      error: () => applyLocalDelete(),
    });
  }

  // Hall modal operations (triggered from view-branch)
  openAddHall(): void {
    if (!this.selectedBranch()) {
      return;
    }

    this.isAddHallOpen.set(true);
  }

  closeAddHall(): void {
    this.isAddHallOpen.set(false);
  }

  openEditHall(hall: HallRow): void {
    this.isViewHallOpen.set(false); // close view hall first
    this.selectedHall.set(hall);
    this.isEditHallOpen.set(true);
  }

  closeEditHall(): void {
    this.isEditHallOpen.set(false);
    this.selectedHall.set(null);
  }

  openViewHall(hall: HallRow): void {
    this.selectedHall.set(hall);
    this.isViewHallOpen.set(true);
  }

  closeViewHall(): void {
    this.isViewHallOpen.set(false);
    this.selectedHall.set(null);
  }

  openEditFromView(): void {
    const branch = this.selectedBranch();
    if (branch) {
      this.isViewBranchOpen.set(false);
      this.isEditBranchOpen.set(true);
    }
  }

  onCreateBranch(payload: AddBranchPayload): void {
    const request = this.toBranchPayload(payload);

    this.branchesService.createBranch(request).subscribe({
      next: (created) => {
        const mapped = this.mapBranchRow(created);
        if (mapped) {
          this.allBranches.update((items) => [mapped, ...items]);
          this.currentPage.set(1);
        }
        this.closeAddBranch();
      },
      error: () => {
        this.allBranches.update((items) => [this.mapLocalCreatedBranch(payload), ...items]);
        this.currentPage.set(1);
        this.closeAddBranch();
      },
    });
  }

  onSaveBranch(payload: EditBranchPayload): void {
    const selected = this.selectedBranch();
    if (!selected) {
      return;
    }

    const numericId = this.extractNumericId(selected.id);
    const request = this.toBranchPayload(payload);

    if (numericId === null) {
      this.applyLocalBranchEdit(selected.id, payload);
      this.closeEditBranch();
      return;
    }

    this.branchesService.updateBranch(numericId, request).subscribe({
      next: () => {
        this.applyLocalBranchEdit(selected.id, payload);
        this.closeEditBranch();
      },
      error: () => {
        this.applyLocalBranchEdit(selected.id, payload);
        this.closeEditBranch();
      },
    });
  }

  onCreateHall(payload: AddHallPayload): void {
    const request = this.toHallPayload(payload);

    this.branchesService.createHall(request).subscribe({
      next: (created) => {
        const selectedBranch = this.selectedBranch();
        const mapped = this.mapHallRow(created, selectedBranch?.name);

        if (mapped) {
          this.selectedBranchHalls.update((items) => [mapped, ...items]);
        }

        this.closeAddHall();
        this.loadBranchesFromApi();
      },
      error: () => {
        const selectedBranch = this.selectedBranch();
        this.selectedBranchHalls.update((items) => [
          this.mapLocalCreatedHall(payload, selectedBranch),
          ...items,
        ]);
        this.closeAddHall();
      },
    });
  }

  onSaveHall(payload: EditHallPayload): void {
    const selected = this.selectedHall();
    if (!selected) {
      return;
    }

    const numericId = this.extractNumericId(selected.id);
    if (numericId === null) {
      this.applyLocalHallEdit(selected.id, payload);
      this.closeEditHall();
      return;
    }

    this.branchesService.updateHall(numericId, this.toHallPayload(payload)).subscribe({
      next: () => {
        this.applyLocalHallEdit(selected.id, payload);
        this.closeEditHall();
        this.loadBranchesFromApi();
      },
      error: () => {
        this.applyLocalHallEdit(selected.id, payload);
        this.closeEditHall();
      },
    });
  }

  onDeleteHall(): void {
    const selected = this.selectedHall();
    if (!selected) {
      return;
    }

    const applyLocalDelete = () => {
      this.selectedBranchHalls.update((items) => items.filter((hall) => hall.id !== selected.id));
      this.closeEditHall();
    };

    const numericId = this.extractNumericId(selected.id);
    if (numericId === null) {
      applyLocalDelete();
      return;
    }

    this.branchesService.deleteHall(numericId).subscribe({
      next: () => {
        applyLocalDelete();
        this.loadBranchesFromApi();
      },
      error: () => applyLocalDelete(),
    });
  }

  private loadBranchesFromApi(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.branchesService.getBranches({ page: 1, pageSize: 100 }).subscribe({
      next: (response) => {
        const items = (response.items ?? response.data ?? response.results ?? [])
          .map((item) => this.mapBranchRow(item))
          .filter((item): item is BranchRow => Boolean(item));

        if (items.length > 0) {
          this.allBranches.set(items);
        }

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Failed to load branches from API.');
      },
    });

    this.branchesService.getBranchSummary().subscribe({
      next: (summary) => {
        if (typeof summary.totalShowtimes === 'number') {
          this.totalShowtimes.set(summary.totalShowtimes.toLocaleString());
        }
      },
      error: () => {},
    });
  }

  private loadHallsForBranch(branchId: string): void {
    const numericId = this.extractNumericId(branchId);
    if (numericId === null) {
      this.selectedBranchHalls.set([]);
      return;
    }

    this.branchesService.getHalls({ branchId: numericId, page: 1, pageSize: 200 }).subscribe({
      next: (response) => {
        const branchName = this.selectedBranch()?.name;
        const halls = (response.items ?? response.data ?? response.results ?? [])
          .map((item) => this.mapHallRow(item, branchName))
          .filter((item): item is HallRow => Boolean(item));

        this.selectedBranchHalls.set(halls);
      },
      error: () => {
        this.selectedBranchHalls.set([]);
      },
    });
  }

  private mapBranchRow(item: {
    id?: number;
    branchName?: string;
    branchLocation?: string;
    totalHalls?: number;
    totalCapacity?: number;
  }): BranchRow | null {
    const idValue = typeof item.id === 'number' ? item.id : null;
    const name = item.branchName?.trim();

    if (!idValue && !name) {
      return null;
    }

    return {
      id: idValue
        ? `BRN-${String(idValue).padStart(3, '0')}`
        : `BRN-${String(Date.now()).slice(-3)}`,
      name: name || 'Branch',
      location: item.branchLocation?.trim() || '—',
      totalHalls: item.totalHalls ?? 0,
      capacity: item.totalCapacity ?? 0,
      status: 'ACTIVE',
    };
  }

  private mapHallRow(
    item: {
      id?: number;
      branchId?: number;
      hallNumber?: string;
      hallType?: string;
      hallStatus?: string;
      capacity?: number;
    },
    fallbackBranchName?: string,
  ): HallRow | null {
    const idValue = typeof item.id === 'number' ? item.id : null;
    const branchIdValue = typeof item.branchId === 'number' ? item.branchId : null;

    if (!idValue && !item.hallNumber) {
      return null;
    }

    return {
      id: idValue
        ? `HLL-${String(idValue).padStart(3, '0')}`
        : `HLL-${String(Date.now()).slice(-3)}`,
      number: Number(item.hallNumber ?? 0) || 0,
      type: item.hallType?.trim() || 'TwoD',
      capacity: item.capacity ?? 0,
      status: this.normalizeHallStatus(item.hallStatus),
      branchId: branchIdValue
        ? `BRN-${String(branchIdValue).padStart(3, '0')}`
        : this.selectedBranch()?.id || 'BRN-000',
      branchName: fallbackBranchName || this.selectedBranch()?.name || '—',
    };
  }

  private mapLocalCreatedBranch(payload: AddBranchPayload): BranchRow {
    return {
      id: `BRN-${String(Date.now()).slice(-3)}`,
      name: payload.branchName,
      location: payload.branchLocation,
      totalHalls: 0,
      capacity: 0,
      status: 'ACTIVE',
    };
  }

  private mapLocalCreatedHall(payload: AddHallPayload, selectedBranch: BranchRow | null): HallRow {
    const branchId = selectedBranch?.id || `BRN-${String(payload.branchId).padStart(3, '0')}`;

    return {
      id: `HLL-${String(Date.now()).slice(-3)}`,
      number: Number(payload.hallNumber) || 0,
      type: payload.hallType,
      capacity: 0,
      status: this.normalizeHallStatus(payload.hallStatus),
      branchId,
      branchName: selectedBranch?.name || '—',
    };
  }

  private applyLocalBranchEdit(id: string, payload: EditBranchPayload): void {
    this.allBranches.update((items) =>
      items.map((branch) =>
        branch.id === id
          ? {
              ...branch,
              name: payload.branchName,
              location: payload.branchLocation,
            }
          : branch,
      ),
    );

    this.selectedBranch.update((branch) =>
      branch && branch.id === id
        ? {
            ...branch,
            name: payload.branchName,
            location: payload.branchLocation,
          }
        : branch,
    );
  }

  private applyLocalHallEdit(id: string, payload: EditHallPayload): void {
    const targetBranch = this.allBranches().find(
      (branch) => branch.id === `BRN-${String(payload.branchId).padStart(3, '0')}`,
    );

    this.selectedBranchHalls.update((items) =>
      items.map((hall) =>
        hall.id === id
          ? {
              ...hall,
              number: Number(payload.hallNumber) || hall.number,
              type: payload.hallType,
              status: this.normalizeHallStatus(payload.hallStatus),
              branchId: `BRN-${String(payload.branchId).padStart(3, '0')}`,
              branchName: targetBranch?.name || hall.branchName,
            }
          : hall,
      ),
    );

    this.selectedHall.update((hall) =>
      hall && hall.id === id
        ? {
            ...hall,
            number: Number(payload.hallNumber) || hall.number,
            type: payload.hallType,
            status: this.normalizeHallStatus(payload.hallStatus),
            branchId: `BRN-${String(payload.branchId).padStart(3, '0')}`,
            branchName: targetBranch?.name || hall.branchName,
          }
        : hall,
    );
  }

  private normalizeHallStatus(status?: string): 'ACTIVE' | 'MAINTENANCE' {
    if (!status) {
      return 'ACTIVE';
    }

    const normalized = status.trim().toLowerCase();
    if (normalized.includes('maintenance')) {
      return 'MAINTENANCE';
    }

    return 'ACTIVE';
  }

  private toBranchPayload(payload: AddBranchPayload | EditBranchPayload): BranchUpsertPayload {
    return {
      branchName: payload.branchName,
      branchLocation: payload.branchLocation,
    };
  }

  private toHallPayload(payload: AddHallPayload | EditHallPayload): HallUpsertPayload {
    return {
      branchId: payload.branchId,
      hallNumber: payload.hallNumber,
      hallStatus: payload.hallStatus,
      hallType: payload.hallType,
    };
  }

  private extractNumericId(value: string): number | null {
    const match = value.match(/\d+/);
    if (!match) {
      return null;
    }

    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
