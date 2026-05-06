import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { BranchRow, HallRow } from '../branches-management/branches-management.component';

const MOCK_HALLS: HallRow[] = [
  { id: 'HLL-001', number: 1, type: 'IMAX 4K', capacity: 250, status: 'ACTIVE', branchId: 'BRN-001', branchName: 'CinemaVerse Downtown' },
  { id: 'HLL-002', number: 2, type: 'DOLBY', capacity: 180, status: 'ACTIVE', branchId: 'BRN-001', branchName: 'CinemaVerse Downtown' },
  { id: 'HLL-003', number: 3, type: 'STANDARD', capacity: 150, status: 'ACTIVE', branchId: 'BRN-001', branchName: 'CinemaVerse Downtown' },
  { id: 'HLL-004', number: 4, type: 'STANDARD', capacity: 150, status: 'MAINTENANCE', branchId: 'BRN-001', branchName: 'CinemaVerse Downtown' },
  { id: 'HLL-005', number: 5, type: 'PREMIUM', capacity: 120, status: 'ACTIVE', branchId: 'BRN-001', branchName: 'CinemaVerse Downtown' },
  { id: 'HLL-006', number: 6, type: 'STANDARD', capacity: 160, status: 'ACTIVE', branchId: 'BRN-001', branchName: 'CinemaVerse Downtown' },
  { id: 'HLL-007', number: 7, type: 'IMAX 4K', capacity: 260, status: 'ACTIVE', branchId: 'BRN-001', branchName: 'CinemaVerse Downtown' },
  { id: 'HLL-008', number: 8, type: 'STANDARD', capacity: 140, status: 'ACTIVE', branchId: 'BRN-001', branchName: 'CinemaVerse Downtown' },
  { id: 'HLL-009', number: 9, type: 'DOLBY', capacity: 190, status: 'ACTIVE', branchId: 'BRN-001', branchName: 'CinemaVerse Downtown' },
  { id: 'HLL-010', number: 10, type: 'STANDARD', capacity: 150, status: 'ACTIVE', branchId: 'BRN-001', branchName: 'CinemaVerse Downtown' },
  { id: 'HLL-011', number: 11, type: 'PREMIUM', capacity: 100, status: 'ACTIVE', branchId: 'BRN-001', branchName: 'CinemaVerse Downtown' },
  { id: 'HLL-012', number: 12, type: 'STANDARD', capacity: 140, status: 'ACTIVE', branchId: 'BRN-001', branchName: 'CinemaVerse Downtown' },
];

@Component({
  selector: 'app-view-branch-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-branch-modal.component.html',
  styleUrl: './view-branch-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewBranchModalComponent {
  readonly branch = input.required<BranchRow>();
  readonly closeModal = output<void>();
  readonly editBranch = output<void>();
  readonly addHall = output<void>();
  readonly viewHall = output<HallRow>();
  readonly editHall = output<HallRow>();

  readonly hallsPageSize = 5;
  readonly hallsPage = signal(1);
  readonly allHalls = signal<HallRow[]>(MOCK_HALLS);

  readonly totalHallPages = computed(() => Math.max(Math.ceil(this.allHalls().length / this.hallsPageSize), 1));

  readonly pagedHalls = computed(() => {
    const start = (this.hallsPage() - 1) * this.hallsPageSize;
    return this.allHalls().slice(start, start + this.hallsPageSize);
  });

  readonly hallsFrom = computed(() => {
    if (this.allHalls().length === 0) return 0;
    return (this.hallsPage() - 1) * this.hallsPageSize + 1;
  });

  readonly hallsTo = computed(() => Math.min(this.hallsPage() * this.hallsPageSize, this.allHalls().length));

  readonly hallsTotal = computed(() => this.allHalls().length);

  readonly imaxCount = computed(() => this.allHalls().filter(h => h.type === 'IMAX 4K').length);
  readonly premiumCount = computed(() => this.allHalls().filter(h => h.type === 'PREMIUM').length);
  readonly standardCount = computed(() => this.allHalls().filter(h => h.type === 'STANDARD').length);

  readonly totalCapacity = computed(() => this.allHalls().reduce((sum, h) => sum + h.capacity, 0));

  onClose(): void {
    this.closeModal.emit();
  }

  onBackdropClick(): void {
    this.closeModal.emit();
  }

  onEditBranch(): void {
    this.editBranch.emit();
  }

  onAddHall(): void {
    this.addHall.emit();
  }

  onViewHall(hall: HallRow): void {
    this.viewHall.emit(hall);
  }

  onEditHall(hall: HallRow): void {
    this.editHall.emit(hall);
  }

  prevHallsPage(): void {
    if (this.hallsPage() > 1) {
      this.hallsPage.update(p => p - 1);
    }
  }

  nextHallsPage(): void {
    if (this.hallsPage() < this.totalHallPages()) {
      this.hallsPage.update(p => p + 1);
    }
  }
}
