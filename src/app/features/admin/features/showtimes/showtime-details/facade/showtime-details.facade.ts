import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ShowtimesService } from '../../showtimes-management/services/showtimes.service';
import type { ShowtimeDetail, ShowtimeDetailStatus, ShowtimeStats } from '../models/showtime-detail.model';

@Injectable()
export class ShowtimeDetailsFacade {
  private readonly showtimesService = inject(ShowtimesService);
  private readonly router = inject(Router);

  private readonly _showtime = signal<ShowtimeDetail | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly showtime = this._showtime.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly formattedDate = computed(() => {
    const s = this._showtime();
    if (!s) return '';
    const d = new Date(s.date);
    return Number.isNaN(d.getTime())
      ? s.date
      : d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  });

  readonly formattedTime = computed(() => {
    const s = this._showtime();
    if (!s) return '';
    return `${this.formatTimeTo12h(s.startTime)} - ${this.formatTimeTo12h(s.endTime)}`;
  });

  readonly stats = computed<ShowtimeStats>(() => {
    const s = this._showtime();
    if (!s) return { ticketPrice: '$0.00', totalBookings: 0, totalTickets: 0 };
    return {
      ticketPrice: `$${s.price.toFixed(2)}`,
      totalBookings: s.totalSeats - s.availableSeats,
      totalTickets: s.totalSeats,
    };
  });

  loadShowtime(id: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.showtimesService.getShowtimeById(id).subscribe({
      next: (res) => {
        this._showtime.set({
          id: res.id ?? id,
          movieTitle: res.movieTitle ?? '',
          branchName: res.branchName ?? '',
          hallName: res.hallName ?? '',
          date: res.date ?? '',
          startTime: res.startTime ?? '',
          endTime: res.endTime ?? '',
          price: res.price ?? 0,
          availableSeats: res.availableSeats ?? 0,
          totalSeats: res.totalSeats ?? 0,
          status: (res.status as ShowtimeDetailStatus) ?? 'SCHEDULED',
          createdAt: res.createdAt ?? '',
        });
        this._loading.set(false);
      },
      error: () => {
        this._showtime.set(null);
        this._error.set('Showtime not found');
        this._loading.set(false);
      },
    });
  }

  navigateToEdit(id: string): void {
    this.router.navigate(['/admin', 'showtimes', id, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/admin', 'showtimes']);
  }

  private formatTimeTo12h(time: string): string {
    const [h, m] = time.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return time;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  }
}
