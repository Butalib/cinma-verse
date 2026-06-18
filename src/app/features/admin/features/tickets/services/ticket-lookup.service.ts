import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { QrTicketResult } from '../models/ticket.models';
import { TicketsApiService } from './tickets-api.service';

const MOCK_QR_LOOKUP: Record<string, QrTicketResult> = {
  'CV-TK-88291': {
    ticketNumber: 'CV-TK-88291',
    movie: 'Dune: Part Two',
    showtime: 'Apr 12, 2026 • 7:30 PM',
    location: 'Downtown Plaza, Hall 04',
    seat: 'G12',
    price: '$18.50',
    status: 'ACTIVE',
    duration: '142 min',
    format: 'TwoD',
  },
  'CV-TK-99102': {
    ticketNumber: 'CV-TK-99102',
    movie: 'Civil War',
    showtime: 'Apr 13, 2026 • 9:15 PM',
    location: 'Westside Mall, Hall 02',
    seat: 'D08',
    price: '$15.00',
    status: 'USED',
    duration: '109 min',
    format: 'Standard',
  },
  'CV-TK-77213': {
    ticketNumber: 'CV-TK-77213',
    movie: 'The Batman',
    showtime: 'Apr 12, 2026 • 10:45 PM',
    location: 'IMAX Theater, Hall 01',
    seat: 'L14',
    price: '$22.00',
    status: 'CANCELLED',
    duration: '176 min',
    format: 'IMAX',
  },
  'CV-TK-66129': {
    ticketNumber: 'CV-TK-66129',
    movie: 'Challengers',
    showtime: 'Apr 14, 2026 • 6:00 PM',
    location: 'Downtown Plaza, Hall 02',
    seat: 'E05',
    price: '$16.50',
    status: 'ACTIVE',
    duration: '130 min',
    format: 'Standard',
  },
  'CV-TK-33441': {
    ticketNumber: 'CV-TK-33441',
    movie: 'Kingdom of the Planet of the Apes',
    showtime: 'Apr 15, 2026 • 8:45 PM',
    location: 'Eastwood Center, Hall 03',
    seat: 'H10',
    price: '$19.00',
    status: 'ACTIVE',
    duration: '145 min',
    format: 'Standard',
  },
  'CV-TK-55019': {
    ticketNumber: 'CV-TK-55019',
    movie: 'Oppenheimer',
    showtime: 'Apr 16, 2026 • 5:00 PM',
    location: 'IMAX Theater, Hall 02',
    seat: 'F15',
    price: '$24.00',
    status: 'USED',
    duration: '180 min',
    format: 'IMAX',
  },
};

@Injectable({
  providedIn: 'root',
})
export class TicketLookupService {
  private readonly ticketsApi = inject(TicketsApiService);

  validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    const pattern = /^CV-TK-\d{5}$/i;
    return pattern.test(token.trim());
  }

  normalizeToken(token: string): string {
    return token.trim().toUpperCase();
  }

  lookupByToken(token: string): QrTicketResult | null {
    if (!this.validateTokenFormat(token)) {
      return null;
    }

    const normalized = this.normalizeToken(token);
    return MOCK_QR_LOOKUP[normalized] ?? null;
  }

  lookupByTokenAsync(token: string): Observable<QrTicketResult | null> {
    if (!this.validateTokenFormat(token)) {
      return of(null);
    }

    const normalized = this.normalizeToken(token);

    return this.ticketsApi.checkQr(normalized).pipe(
      map((result) => {
        if (!result || result.isFound === false) {
          return this.lookupByToken(normalized);
        }

        return {
          ticketNumber: result.ticketNumber ?? normalized,
          movie: result.movieName ?? 'Unknown movie',
          showtime: result.showStartTime ? new Date(result.showStartTime).toLocaleString() : '—',
          location: `${result.branchName ?? '—'}, Hall ${result.hallNumber ?? '—'}`,
          seat: result.seatLabel ?? '—',
          price: `$${Number(result.price ?? 0).toFixed(2)}`,
          status: this.mapStatus(result.status),
          duration: '—',
          format: result.hallType ?? 'Standard',
        } as QrTicketResult;
      }),
      catchError(() => of(this.lookupByToken(normalized))),
    );
  }

  getAllTickets(): QrTicketResult[] {
    return Object.values(MOCK_QR_LOOKUP);
  }

  ticketExists(token: string): boolean {
    if (!this.validateTokenFormat(token)) return false;
    const normalized = this.normalizeToken(token);
    return normalized in MOCK_QR_LOOKUP;
  }

  private mapStatus(status?: string): QrTicketResult['status'] {
    const normalized = (status ?? '').toLowerCase();
    if (normalized === 'used') {
      return 'USED';
    }
    if (normalized === 'cancelled' || normalized === 'canceled') {
      return 'CANCELLED';
    }
    return 'ACTIVE';
  }
}
