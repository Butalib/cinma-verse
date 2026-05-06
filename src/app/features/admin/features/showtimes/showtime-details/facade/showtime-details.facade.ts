import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ShowtimesService } from '../../showtimes-management/services/showtimes.service';
import type { ShowtimeDetail, ShowtimeDetailStatus, ShowtimeStats } from '../models/showtime-detail.model';

const MOCK_SHOWTIMES: ShowtimeDetail[] = [
  { id: 'SHW-2001', movieTitle: 'The Dark Knight Rises', branchName: 'Downtown Cinema', hallName: 'Hall A', date: '2026-04-28', startTime: '14:00', endTime: '16:45', price: 15.00, availableSeats: 45, totalSeats: 120, status: 'SCHEDULED', createdAt: '2026-04-20' },
  { id: 'SHW-2002', movieTitle: 'Inception', branchName: 'Westside Plex', hallName: 'IMAX 1', date: '2026-04-27', startTime: '19:30', endTime: '22:00', price: 22.50, availableSeats: 12, totalSeats: 200, status: 'NOW_SHOWING', createdAt: '2026-04-18' },
  { id: 'SHW-2003', movieTitle: 'Interstellar', branchName: 'Downtown Cinema', hallName: 'Hall B', date: '2026-04-26', startTime: '10:00', endTime: '12:50', price: 12.00, availableSeats: 0, totalSeats: 80, status: 'COMPLETED', createdAt: '2026-04-15' },
  { id: 'SHW-2004', movieTitle: 'Dune: Part Two', branchName: 'Eastgate Mall Cinema', hallName: 'Screen 3', date: '2026-04-29', startTime: '16:00', endTime: '18:45', price: 18.00, availableSeats: 90, totalSeats: 150, status: 'SCHEDULED', createdAt: '2026-04-22' },
  { id: 'SHW-2005', movieTitle: 'Oppenheimer', branchName: 'Westside Plex', hallName: 'Hall C', date: '2026-04-25', startTime: '20:00', endTime: '23:00', price: 20.00, availableSeats: 0, totalSeats: 100, status: 'COMPLETED', createdAt: '2026-04-14' },
  { id: 'SHW-2006', movieTitle: 'Spider-Man: Across the Spider-Verse', branchName: 'Downtown Cinema', hallName: 'Hall A', date: '2026-04-27', startTime: '11:00', endTime: '13:20', price: 14.00, availableSeats: 30, totalSeats: 120, status: 'NOW_SHOWING', createdAt: '2026-04-19' },
  { id: 'SHW-2007', movieTitle: 'The Batman', branchName: 'Eastgate Mall Cinema', hallName: 'Screen 1', date: '2026-04-30', startTime: '21:00', endTime: '23:55', price: 16.50, availableSeats: 110, totalSeats: 140, status: 'SCHEDULED', createdAt: '2026-04-23' },
  { id: 'SHW-2008', movieTitle: 'Everything Everywhere All at Once', branchName: 'Westside Plex', hallName: 'IMAX 1', date: '2026-04-24', startTime: '15:30', endTime: '17:50', price: 22.50, availableSeats: 0, totalSeats: 200, status: 'CANCELLED', createdAt: '2026-04-12' },
];

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
        const mock = MOCK_SHOWTIMES.find((s) => s.id === id);
        if (mock) {
          this._showtime.set(mock);
          this._loading.set(false);
        } else {
          this._error.set('Showtime not found');
          this._loading.set(false);
        }
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
