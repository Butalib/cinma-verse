import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { QrTicketResult } from '../models/ticket.models';
import { TicketsApiService } from './tickets-api.service';

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

    return null;
  }

  lookupByTokenAsync(token: string): Observable<QrTicketResult | null> {
    if (!this.validateTokenFormat(token)) {
      return of(null);
    }

    const normalized = this.normalizeToken(token);

    return this.ticketsApi.checkQr(normalized).pipe(
      map((result) => {
        if (!result || result.isFound === false) {
          return null;
        }

        return {
          ticketNumber: result.ticketNumber ?? normalized,
          movie: result.movieName ?? 'Unknown movie',
          showtime: result.showStartTime ? new Date(result.showStartTime).toLocaleString() : 'â€”',
          location: `${result.branchName ?? 'â€”'}, Hall ${result.hallNumber ?? 'â€”'}`,
          seat: result.seatLabel ?? 'â€”',
          price: `$${Number(result.price ?? 0).toFixed(2)}`,
          status: this.mapStatus(result.status),
          duration: 'â€”',
          format: result.hallType ?? 'Standard',
        } as QrTicketResult;
      }),
      catchError(() => of(null)),
    );
  }

  getAllTickets(): QrTicketResult[] {
    return [];
  }

  ticketExists(token: string): boolean {
    if (!this.validateTokenFormat(token)) return false;
    return false;
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
