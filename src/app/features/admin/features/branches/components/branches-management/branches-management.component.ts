import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../users/users-managemen/componants/pagination/pagination.component';
import { AddBranchModalComponent } from '../add-branch-modal/add-branch-modal.component';
import { EditBranchModalComponent } from '../edit-branch-modal/edit-branch-modal.component';
import { ViewBranchModalComponent } from '../view-branch-modal/view-branch-modal.component';
import { AddHallModalComponent } from '../add-hall-modal/add-hall-modal.component';
import { EditHallModalComponent } from '../edit-hall-modal/edit-hall-modal.component';
import { ViewHallModalComponent } from '../view-hall-modal/view-hall-modal.component';

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
  type: 'IMAX 4K' | 'DOLBY' | 'STANDARD' | 'PREMIUM';
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE';
  branchId: string;
  branchName: string;
}

const MOCK_BRANCHES: BranchRow[] = [
  { id: 'BRN-001', name: 'CinemaVerse Downtown', location: 'Downtown Metro Center, Block A', totalHalls: 12, capacity: 1840, status: 'ACTIVE' },
  { id: 'BRN-002', name: 'CinemaVerse Westfield', location: 'Westfield Mall, Level 3', totalHalls: 8, capacity: 1200, status: 'ACTIVE' },
  { id: 'BRN-003', name: 'CinemaVerse Nile Plaza', location: 'Nile Plaza, Corniche Road', totalHalls: 10, capacity: 1560, status: 'ACTIVE' },
  { id: 'BRN-004', name: 'CinemaVerse Galaxy', location: 'Galaxy Tower, Floor 5', totalHalls: 6, capacity: 900, status: 'MAINTENANCE' },
  { id: 'BRN-005', name: 'CinemaVerse Sunrise', location: 'Sunrise District, Main Street', totalHalls: 9, capacity: 1350, status: 'ACTIVE' },
  { id: 'BRN-006', name: 'CinemaVerse Park Avenue', location: 'Park Avenue Center, South Wing', totalHalls: 11, capacity: 1720, status: 'ACTIVE' },
  { id: 'BRN-007', name: 'CinemaVerse Marina', location: 'Marina Bay Complex, Tower B', totalHalls: 7, capacity: 1050, status: 'ACTIVE' },
  { id: 'BRN-008', name: 'CinemaVerse Heritage', location: 'Heritage Square, Old Town', totalHalls: 5, capacity: 750, status: 'MAINTENANCE' },
  { id: 'BRN-009', name: 'CinemaVerse Skyline', location: 'Skyline Towers, Penthouse Level', totalHalls: 14, capacity: 2100, status: 'ACTIVE' },
  { id: 'BRN-010', name: 'CinemaVerse Central', location: 'Central Hub, East Gate', totalHalls: 8, capacity: 1200, status: 'ACTIVE' },
  { id: 'BRN-011', name: 'CinemaVerse Oasis', location: 'Oasis Mall, Ground Floor', totalHalls: 6, capacity: 880, status: 'ACTIVE' },
  { id: 'BRN-012', name: 'CinemaVerse Promenade', location: 'Promenade Boulevard, Unit 15', totalHalls: 10, capacity: 1500, status: 'ACTIVE' },
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
  readonly pageSize = signal(10);

  readonly allBranches = signal<BranchRow[]>(MOCK_BRANCHES);
  readonly searchTerm = signal('');
  readonly locationFilter = signal('');
  readonly currentPage = signal(1);

  // KPI computed values
  readonly totalBranches = computed(() => this.allBranches().length);
  readonly totalHalls = computed(() => this.allBranches().reduce((s, b) => s + b.totalHalls, 0));
  readonly totalShowtimes = signal('1,254');
  readonly totalCapacity = computed(() =>
    this.allBranches().reduce((s, b) => s + b.capacity, 0).toLocaleString()
  );

  // Modal states
  readonly isAddBranchOpen = signal(false);
  readonly isEditBranchOpen = signal(false);
  readonly isViewBranchOpen = signal(false);
  readonly isAddHallOpen = signal(false);
  readonly isEditHallOpen = signal(false);
  readonly isViewHallOpen = signal(false);
  readonly selectedBranch = signal<BranchRow | null>(null);
  readonly selectedHall = signal<HallRow | null>(null);

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

  readonly totalPages = computed(() => Math.max(Math.ceil(this.filteredBranches().length / this.pageSize()), 1));

  readonly pagedBranches = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredBranches().slice(start, start + this.pageSize());
  });

  readonly showingFrom = computed(() => {
    if (this.filteredBranches().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly showingTo = computed(() => Math.min(this.currentPage() * this.pageSize(), this.filteredBranches().length));

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
    this.isViewBranchOpen.set(true);
  }

  closeViewBranch(): void {
    this.isViewBranchOpen.set(false);
    this.selectedBranch.set(null);
  }

  openDeleteConfirm(branch: BranchRow): void {
    console.log('Delete branch:', branch.id);
    this.allBranches.update((items) => items.filter((b) => b.id !== branch.id));
    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }
  }

  // Hall modal operations (triggered from view-branch)
  openAddHall(): void {
    this.isAddHallOpen.set(true);
  }

  closeAddHall(): void {
    this.isAddHallOpen.set(false);
  }

  openEditHall(hall: HallRow): void {
    this.isViewHallOpen.set(false);   // close view hall first
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
}
