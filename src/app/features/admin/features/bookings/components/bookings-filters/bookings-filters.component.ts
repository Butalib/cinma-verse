import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import type { BookingsFilters } from '../../models/booking.model';

@Component({
  selector: 'app-bookings-filters',
  imports: [ReactiveFormsModule],
  templateUrl: './bookings-filters.component.html',
  styleUrl: './bookings-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingsFiltersComponent {
  private readonly fb = new FormBuilder();

  readonly filters = input.required<BookingsFilters>();
  readonly filtersChange = output<Partial<BookingsFilters>>();
  readonly clearFilters = output<void>();

  readonly filterForm = this.fb.group({
    status: ['ALL'],
    dateFrom: [''],
    dateTo: [''],
    amountMin: [null as number | null],
    amountMax: [null as number | null],
  });

  onFilterChange(): void {
    const value = this.filterForm.getRawValue();
    this.filtersChange.emit({
      status: (value.status ?? 'ALL') as BookingsFilters['status'],
      dateFrom: value.dateFrom ?? '',
      dateTo: value.dateTo ?? '',
      amountMin: value.amountMin,
      amountMax: value.amountMax,
    });
  }

  onClear(): void {
    this.filterForm.reset({
      status: 'ALL',
      dateFrom: '',
      dateTo: '',
      amountMin: null,
      amountMax: null,
    });
    this.clearFilters.emit();
  }
}
