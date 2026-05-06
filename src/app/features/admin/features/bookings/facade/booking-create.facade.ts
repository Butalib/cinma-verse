import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, shareReplay } from 'rxjs';
import { BookingCreateService } from '../services/booking-create.service';
import type { BookingShowtimeOption, CreateBookingPayload } from '../models/booking-create.model';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type BookingFormField = 'customerName' | 'customerEmail' | 'showtime' | 'seats';

@Injectable()
export class BookingCreateFacade {
  private readonly service = inject(BookingCreateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly customerName = signal('');
  readonly customerEmail = signal('');
  readonly selectedShowtimeId = signal<string | null>(null);
  readonly selectedSeats = signal<string[]>([]);
  readonly touched = signal<Record<BookingFormField, boolean>>({
    customerName: false,
    customerEmail: false,
    showtime: false,
    seats: false,
  });
  readonly submitAttempted = signal(false);
  readonly isSubmitting = signal(false);

  readonly showtimes$ = this.service.getShowtimes().pipe(
    catchError(() => this.service.getFallbackShowtimes()),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly showtimes = toSignal(this.showtimes$, {
    initialValue: [] as BookingShowtimeOption[],
  });

  readonly selectedShowtime = computed(() => {
    const id = this.selectedShowtimeId();
    return this.showtimes().find((item) => item.id === id) ?? null;
  });

  readonly seatOptions = computed(() => {
    const showtime = this.selectedShowtime();
    return showtime ? this.buildSeatOptions(showtime.availableSeats) : [];
  });

  readonly hasSeatOptions = computed(() => this.seatOptions().length > 0);
  readonly hasSelectedShowtime = computed(() => !!this.selectedShowtime());
  readonly selectedShowtimeValue = computed(() => this.selectedShowtimeId() ?? '');

  readonly selectedSeatSet = computed(() => new Set(this.selectedSeats()));
  readonly pricePerSeat = computed(() => this.selectedShowtime()?.price ?? 0);
  readonly totalPrice = computed(() => this.selectedSeats().length * this.pricePerSeat());

  readonly totalPriceLabel = computed(() => `$${this.totalPrice().toFixed(2)}`);
  readonly pricePerSeatLabel = computed(() => `$${this.pricePerSeat().toFixed(2)}`);
  readonly seatsLabel = computed(() => this.selectedSeats().join(', '));

  readonly summary = computed(() => {
    const showtime = this.selectedShowtime();
    const seatCount = this.selectedSeats().length;

    return {
      customerName: this.customerName().trim() || 'Not provided',
      customerEmail: this.customerEmail().trim() || 'Not provided',
      showtimeTitle: showtime?.movieTitle ?? 'Select a showtime',
      showtimeMeta: showtime ? `${showtime.date} · ${showtime.startTime}` : '—',
      location: showtime ? `${showtime.branchName} · ${showtime.hallName}` : '—',
      seats: seatCount ? this.seatsLabel() : 'No seats selected',
      seatCount,
      pricePerSeat: showtime ? this.pricePerSeatLabel() : '$0.00',
      totalPrice: this.totalPriceLabel(),
      hasShowtime: !!showtime,
    };
  });

  readonly customerNameError = computed(() => {
    const value = this.customerName().trim();
    return value ? '' : 'Customer name is required.';
  });

  readonly customerEmailError = computed(() => {
    const value = this.customerEmail().trim();
    if (!value) {
      return 'Customer email is required.';
    }

    return EMAIL_REGEX.test(value) ? '' : 'Enter a valid email address.';
  });

  readonly showtimeError = computed(() => (this.selectedShowtimeId() ? '' : 'Select a showtime.'));
  readonly seatsError = computed(() =>
    this.selectedSeats().length ? '' : 'Select at least one seat.',
  );

  readonly customerNameInvalid = computed(
    () => this.shouldShowError('customerName') && !!this.customerNameError(),
  );
  readonly customerEmailInvalid = computed(
    () => this.shouldShowError('customerEmail') && !!this.customerEmailError(),
  );
  readonly showtimeInvalid = computed(
    () => this.shouldShowError('showtime') && !!this.showtimeError(),
  );
  readonly seatsInvalid = computed(() => this.shouldShowError('seats') && !!this.seatsError());

  readonly seatSelectionDisabled = computed(() => !this.selectedShowtime() || this.isSubmitting());

  setCustomerName(value: string): void {
    this.customerName.set(value);
  }

  setCustomerEmail(value: string): void {
    this.customerEmail.set(value);
  }

  selectShowtime(id: string): void {
    this.selectedShowtimeId.set(id || null);
    this.selectedSeats.set([]);
    this.markTouched('showtime');
  }

  toggleSeat(seat: string): void {
    if (this.seatSelectionDisabled()) {
      return;
    }

    this.selectedSeats.update((current) =>
      current.includes(seat) ? current.filter((item) => item !== seat) : [...current, seat],
    );
    this.markTouched('seats');
  }

  markTouched(field: BookingFormField): void {
    this.touched.update((current) => ({ ...current, [field]: true }));
  }

  submit(): void {
    this.submitAttempted.set(true);
    this.touchAll();

    if (this.isSubmitting() || this.isInvalid()) {
      return;
    }

    const showtimeId = this.selectedShowtimeId();
    if (!showtimeId) {
      return;
    }

    const payload: CreateBookingPayload = {
      customerName: this.customerName().trim(),
      customerEmail: this.customerEmail().trim(),
      showtimeId,
      seats: this.selectedSeats(),
    };

    this.isSubmitting.set(true);

    this.service
      .createBooking(payload)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.resetForm(),
        error: () => {
          this.submitAttempted.set(true);
        },
      });
  }

  private shouldShowError(field: BookingFormField): boolean {
    const touched = this.touched();
    return touched[field] || this.submitAttempted();
  }

  private isInvalid(): boolean {
    return !!(
      this.customerNameError() ||
      this.customerEmailError() ||
      this.showtimeError() ||
      this.seatsError()
    );
  }

  private touchAll(): void {
    this.touched.set({
      customerName: true,
      customerEmail: true,
      showtime: true,
      seats: true,
    });
  }

  private resetForm(): void {
    this.customerName.set('');
    this.customerEmail.set('');
    this.selectedShowtimeId.set(null);
    this.selectedSeats.set([]);
    this.submitAttempted.set(false);
    this.touched.set({
      customerName: false,
      customerEmail: false,
      showtime: false,
      seats: false,
    });
  }

  private buildSeatOptions(count: number): string[] {
    if (count <= 0) {
      return [];
    }

    const seatsPerRow = 8;
    const rows = Math.ceil(count / seatsPerRow);
    const options: string[] = [];

    for (let row = 0; row < rows; row += 1) {
      const rowLabel = String.fromCharCode(65 + row);
      for (let seat = 1; seat <= seatsPerRow; seat += 1) {
        if (options.length >= count) {
          return options;
        }
        options.push(`${rowLabel}${seat}`);
      }
    }

    return options;
  }
}
