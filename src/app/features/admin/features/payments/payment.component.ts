import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { PaymentsService } from './services/payments.service';
type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';

interface PaymentRow {
  sourceId?: number;
  id: string;
  paymentId: string;
  bookingId: string;
  transactionDate: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
}

interface PaymentViewModel extends PaymentRow {
  amountLabel: string;
  statusLabel: string;
  statusClass: string;
}

const STATUS_META: Record<PaymentStatus, { label: string; className: string }> = {
  COMPLETED: { label: 'Completed', className: 'payment-status-badge--completed' },
  PENDING: { label: 'Pending', className: 'payment-status-badge--pending' },
  FAILED: { label: 'Failed', className: 'payment-status-badge--failed' },
  CANCELLED: { label: 'Cancelled', className: 'payment-status-badge--cancelled' },
};

const MOCK_PAYMENTS: PaymentRow[] = [
  {
    id: 'pay-001',
    paymentId: 'PMT-44021',
    bookingId: 'BKG-3001',
    transactionDate: '2026-05-02 19:38',
    amount: 45,
    currency: 'USD',
    status: 'COMPLETED',
  },
  {
    id: 'pay-002',
    paymentId: 'PMT-44022',
    bookingId: 'BKG-3002',
    transactionDate: '2026-05-03 13:08',
    amount: 36,
    currency: 'USD',
    status: 'PENDING',
  },
  {
    id: 'pay-003',
    paymentId: 'PMT-44023',
    bookingId: 'BKG-3003',
    transactionDate: '2026-05-04 20:10',
    amount: 22.5,
    currency: 'USD',
    status: 'FAILED',
  },
  {
    id: 'pay-004',
    paymentId: 'PMT-44024',
    bookingId: 'BKG-3004',
    transactionDate: '2026-05-05 21:04',
    amount: 33,
    currency: 'USD',
    status: 'COMPLETED',
  },
  {
    id: 'pay-005',
    paymentId: 'PMT-44025',
    bookingId: 'BKG-3005',
    transactionDate: '2026-05-06 18:12',
    amount: 16,
    currency: 'USD',
    status: 'CANCELLED',
  },
  {
    id: 'pay-006',
    paymentId: 'PMT-44026',
    bookingId: 'BKG-3006',
    transactionDate: '2026-05-06 15:22',
    amount: 27,
    currency: 'USD',
    status: 'COMPLETED',
  },
  {
    id: 'pay-007',
    paymentId: 'PMT-44027',
    bookingId: 'BKG-3007',
    transactionDate: '2026-05-07 19:41',
    amount: 22.5,
    currency: 'USD',
    status: 'PENDING',
  },
  {
    id: 'pay-008',
    paymentId: 'PMT-44028',
    bookingId: 'BKG-3008',
    transactionDate: '2026-05-08 09:35',
    amount: 50,
    currency: 'USD',
    status: 'COMPLETED',
  },
];

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentComponent {
  private readonly paymentsService = inject(PaymentsService);

  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly selectedPayment = signal<PaymentViewModel | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  private readonly payments = signal<PaymentRow[]>(MOCK_PAYMENTS);
  private readonly moneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  readonly filteredPayments = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const items = this.payments();

    if (!search) {
      return items;
    }

    return items.filter((payment) => {
      const target =
        `${payment.paymentId} ${payment.bookingId} ${payment.transactionDate} ${payment.status}`.toLowerCase();
      return target.includes(search);
    });
  });

  readonly paymentRows = computed<PaymentViewModel[]>(() =>
    this.filteredPayments().map((payment) => this.toViewModel(payment)),
  );

  readonly pagedPayments = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.paymentRows().slice(start, start + this.pageSize());
  });

  constructor() {
    this.loadPaymentsFromApi();
  }

  readonly stats = computed(() => {
    const payments = this.filteredPayments();
    const completed = payments.filter((payment) => payment.status === 'COMPLETED');
    const pending = payments.filter((payment) => payment.status === 'PENDING');
    const revenue = completed.reduce((total, payment) => total + payment.amount, 0);

    return {
      total: payments.length,
      completed: completed.length,
      pending: pending.length,
      revenue: this.moneyFormatter.format(revenue),
    };
  });

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm.set(target?.value ?? '');
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
  }

  openDetails(payment: PaymentViewModel): void {
    this.selectedPayment.set(payment);
  }

  closeDetails(): void {
    this.selectedPayment.set(null);
  }

  trackByPaymentId(_: number, payment: PaymentViewModel): string {
    return payment.id;
  }

  private loadPaymentsFromApi(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.paymentsService.getPayments({ page: 1, pageSize: 100 }).subscribe({
      next: (response) => {
        const items = (response.items ?? response.data ?? response.results ?? []).map(
          (item, index) => {
            const status = (item.status ?? 'Pending').toUpperCase() as PaymentStatus;

            return {
              sourceId: item.paymentId,
              id: item.paymentId ? `pay-${item.paymentId}` : `pay-api-${index + 1}`,
              paymentId: item.paymentId ? `PMT-${item.paymentId}` : `PMT-${44000 + index + 1}`,
              bookingId: item.bookingId ? `BKG-${item.bookingId}` : 'BKG-—',
              transactionDate: item.transactionDate
                ? new Date(item.transactionDate).toISOString().slice(0, 16).replace('T', ' ')
                : '—',
              amount: item.amount ?? 0,
              currency: item.currency ?? 'USD',
              status: this.normalizeStatus(status),
            };
          },
        );

        if (items.length > 0) {
          this.payments.set(items);
        }

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Failed to load payments from API.');
      },
    });
  }

  private normalizeStatus(status: string): PaymentStatus {
    if (status === 'COMPLETED') return 'COMPLETED';
    if (status === 'FAILED') return 'FAILED';
    if (status === 'CANCELLED') return 'CANCELLED';
    return 'PENDING';
  }

  private toViewModel(payment: PaymentRow): PaymentViewModel {
    const status = STATUS_META[payment.status];

    return {
      ...payment,
      amountLabel: this.moneyFormatter.format(payment.amount),
      statusLabel: status.label,
      statusClass: status.className,
    };
  }
}
