import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { BranchRow, HallRow } from '../branches-management/branches-management.component';

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

  readonly halls = input<HallRow[]>([]);

  readonly hallsPageSize = 5;
  readonly hallsPage = signal(1);

  readonly totalHallPages = computed(() =>
    Math.max(Math.ceil(this.halls().length / this.hallsPageSize), 1),
  );

  readonly pagedHalls = computed(() => {
    const start = (this.hallsPage() - 1) * this.hallsPageSize;
    return this.halls().slice(start, start + this.hallsPageSize);
  });

  readonly hallsFrom = computed(() => {
    if (this.halls().length === 0) return 0;
    return (this.hallsPage() - 1) * this.hallsPageSize + 1;
  });

  readonly hallsTo = computed(() =>
    Math.min(this.hallsPage() * this.hallsPageSize, this.halls().length),
  );

  readonly hallsTotal = computed(() => this.halls().length);

  readonly imaxCount = computed(() => this.halls().filter((h) => this.isImaxType(h.type)).length);
  readonly premiumCount = computed(
    () => this.halls().filter((h) => this.isPremiumType(h.type)).length,
  );
  readonly standardCount = computed(
    () => this.halls().filter((h) => this.isStandardType(h.type)).length,
  );

  readonly totalCapacity = computed(() => this.halls().reduce((sum, h) => sum + h.capacity, 0));

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
      this.hallsPage.update((p) => p - 1);
    }
  }

  nextHallsPage(): void {
    if (this.hallsPage() < this.totalHallPages()) {
      this.hallsPage.update((p) => p + 1);
    }
  }

  isImaxType(type: string): boolean {
    return type.toLowerCase().includes('imax');
  }

  isPremiumType(type: string): boolean {
    const normalized = type.toLowerCase();
    return normalized.includes('vip') || normalized.includes('premium');
  }

  isStandardType(type: string): boolean {
    const normalized = type.toLowerCase();
    return (
      normalized.includes('standard') || normalized.includes('twod') || normalized.includes('2d')
    );
  }

  isDolbyType(type: string): boolean {
    return type.toLowerCase().includes('dolby') || type.toLowerCase().includes('threed');
  }
}
