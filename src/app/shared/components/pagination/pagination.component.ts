import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  readonly totalItems = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly currentPage = input.required<number>();

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly totalPages = computed(() => Math.max(Math.ceil(this.totalItems() / this.pageSize()), 1));

  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );

  readonly showingFrom = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly showingTo = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.totalItems())
  );

  onPrev(): void {
    const next = this.currentPage() - 1;
    if (next >= 1) {
      this.pageChange.emit(next);
    }
  }

  onNext(): void {
    const next = this.currentPage() + 1;
    if (next <= this.totalPages()) {
      this.pageChange.emit(next);
    }
  }

  onSelect(page: number): void {
    if (page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const newSize = parseInt(target?.value ?? '10', 10);
    this.pageSizeChange.emit(newSize);
  }
}