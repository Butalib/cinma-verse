/**
 * Ticket Lookup Service
 *
 * Responsible for QR code validation and ticket lookup operations.
 * Abstracts the data source (mock, API, cache, etc.)
 *
 * In production, this would integrate with a backend API.
 * Currently uses mock data for demonstration.
 */

import { Injectable } from '@angular/core';
import { QrTicketResult } from '../models/ticket.models';

/**
 * Mock QR lookup table
 * Indexed by ticket number (format: CV-TK-{5-digit})
 *
 * In production, this would be replaced by HTTP calls to:
 * POST /api/tickets/lookup { token: string }
 */
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
  /**
   * Validate QR token format
   *
   * @param token The raw token input
   * @returns true if token matches expected format
   */
  validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    // Format: CV-TK-{5 digits}
    const pattern = /^CV-TK-\d{5}$/i;
    return pattern.test(token.trim());
  }

  /**
   * Normalize QR token (uppercase, trim)
   *
   * @param token The raw token input
   * @returns Normalized token
   */
  normalizeToken(token: string): string {
    return token.trim().toUpperCase();
  }

  /**
   * Lookup ticket by QR token
   *
   * In production:
   * - Call POST /api/tickets/lookup { token }
   * - Implement exponential backoff retry
   * - Cache results with TTL (e.g., 5 minutes)
   * - Handle 404 → null, 500 → error thrown
   *
   * @param token The QR token to lookup
   * @returns QrTicketResult if found, null if not found
   * @throws Error if lookup fails or token is invalid
   */
  lookupByToken(token: string): QrTicketResult | null {
    // Validate token format
    if (!this.validateTokenFormat(token)) {
      return null;
    }

    // Normalize token
    const normalized = this.normalizeToken(token);

    // Mock lookup (replace with HTTP call in production)
    const result = MOCK_QR_LOOKUP[normalized] ?? null;

    // Simulate network latency (remove in production)
    // In a real implementation, this would be handled by HttpClient

    return result;
  }

  /**
   * Get all available tickets (for testing, debugging, or seed data)
   *
   * @returns Array of all available tickets
   */
  getAllTickets(): QrTicketResult[] {
    return Object.values(MOCK_QR_LOOKUP);
  }

  /**
   * Check if a ticket exists in the system
   *
   * @param token The QR token to check
   * @returns true if ticket exists
   */
  ticketExists(token: string): boolean {
    if (!this.validateTokenFormat(token)) return false;
    const normalized = this.normalizeToken(token);
    return normalized in MOCK_QR_LOOKUP;
  }
}
