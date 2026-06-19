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
  readonly allBranches = signal<BranchRow[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly locationFilter = signal('');
  readonly currentPage = signal(1);

  readonly totalBranches = computed(() => this.allBranches().length);
  readonly totalHalls = computed(() => this.allBranches().reduce((s, b) => s + b.totalHalls, 0));
  readonly totalShowtimes = signal('0');
  readonly totalCapacity = computed(() =>
    this.allBranches()
      .reduce((s, b) => s + b.capacity, 0)
      .toLocaleString(),
  );

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

  constructor() {
    this.loadBranchesFromApi();
  }

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
    const numericId = this.extractNumericId(branch.id);
    if (numericId === null) {
      return;
    }

    this.branchesService.deleteBranch(numericId).subscribe({
      next: () => this.loadBranchesFromApi(),
      error: (err) => console.error('Delete branch API failed', err),
    });
  }

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
    this.isViewHallOpen.set(false);
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
    this.branchesService.createBranch(this.toBranchPayload(payload)).subscribe({
      next: () => {
        this.closeAddBranch();
        this.loadBranchesFromApi();
      },
      error: (err) => console.error('Create branch API failed', err),
    });
  }

  onSaveBranch(payload: EditBranchPayload): void {
    const selected = this.selectedBranch();
    if (!selected) {
      return;
    }

    const numericId = this.extractNumericId(selected.id);
    if (numericId === null) {
      return;
    }

    this.branchesService.updateBranch(numericId, this.toBranchPayload(payload)).subscribe({
      next: () => {
        this.closeEditBranch();
        this.loadBranchesFromApi();
      },
      error: (err) => console.error('Update branch API failed', err),
    });
  }

  onCreateHall(payload: AddHallPayload): void {
    this.branchesService.createHall(this.toHallPayload(payload)).subscribe({
      next: () => {
        this.closeAddHall();
        this.loadHallsForBranch(this.selectedBranch()?.id ?? '');
      },
      error: (err) => console.error('Create hall API failed', err),
    });
  }

  onSaveHall(payload: EditHallPayload): void {
    const selected = this.selectedHall();
    if (!selected) {
      return;
    }

    const numericId = this.extractNumericId(selected.id);
    if (numericId === null) {
      return;
    }

    this.branchesService.updateHall(numericId, this.toHallPayload(payload)).subscribe({
      next: () => {
        this.closeEditHall();
        this.loadHallsForBranch(this.selectedBranch()?.id ?? '');
      },
      error: (err) => console.error('Update hall API failed', err),
    });
  }

  onDeleteHall(): void {
    const selected = this.selectedHall();
    if (!selected) {
      return;
    }

    const numericId = this.extractNumericId(selected.id);
    if (numericId === null) {
      return;
    }

    this.branchesService.deleteHall(numericId).subscribe({
      next: () => {
        this.closeEditHall();
        this.loadHallsForBranch(this.selectedBranch()?.id ?? '');
      },
      error: (err) => console.error('Delete hall API failed', err),
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

        this.allBranches.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set('Failed to load branches from API.');
        console.error('Load branches API failed', err);
      },
    });

    this.branchesService.getBranchSummary().subscribe({
      next: (summary) => {
        if (typeof summary.totalShowtimes === 'number') {
          this.totalShowtimes.set(summary.totalShowtimes.toLocaleString());
        }
      },
      error: (err) => console.error('Load branch summary failed', err),
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
      error: (err) => {
        this.selectedBranchHalls.set([]);
        console.error('Load halls API failed', err);
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
      location: item.branchLocation?.trim() || 'â€”',
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
      branchName: fallbackBranchName || this.selectedBranch()?.name || 'â€”',
    };
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
