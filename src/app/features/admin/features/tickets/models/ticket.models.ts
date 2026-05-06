/**
 * Unified Ticket Domain Models
 *
 * This module consolidates all ticket-related types and interfaces
 * used across the tickets management and check-in features.
 */

// ──────────────────────────────────────────────────────────────
// TICKET STATUS TYPES
// ──────────────────────────────────────────────────────────────

export type TicketStatus = 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED';

export type ValidationStatus = 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED' | 'INVALID';

// ──────────────────────────────────────────────────────────────
// QR CHECK STATE MACHINE
// ──────────────────────────────────────────────────────────────

export type CheckInModalState =
  | 'idle'
  | 'validating'
  | 'valid'
  | 'confirming'
  | 'confirmed'
  | 'already-used'
  | 'cancelled'
  | 'invalid'
  | 'error';

// ──────────────────────────────────────────────────────────────
// CORE TICKET RESULT INTERFACE
// ──────────────────────────────────────────────────────────────

/**
 * Core ticket information returned from QR lookup
 * Used by both QR Check page and Manual Check-in flow
 */
export interface QrTicketResult {
  ticketNumber: string;
  movie: string;
  showtime: string;
  location: string;
  seat: string;
  price: string;
  status: TicketStatus;
  duration: string;
  format: string;
}

// ──────────────────────────────────────────────────────────────
// TABLE ROW INTERFACE
// ──────────────────────────────────────────────────────────────

/**
 * Represents a ticket row in the management table
 */
export interface TicketsTableRow {
  id: string;
  ticketNumber: string;
  movie: string;
  showtime: string;
  price: string;
  branch: string;
  customerInitials: string;
  customerName: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
}

// ──────────────────────────────────────────────────────────────
// MODAL VIEW DATA
// ──────────────────────────────────────────────────────────────

/**
 * Extended ticket view data for modal display
 */
export interface TicketViewData {
  id: string;
  ticketNumber: string;
  movie: string;
  showtime: string;
  location: string;
  format: string;
  seat: string;
  rating: string;
  duration: string;
  price: string;
  bookingId: string;
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  ticketStatus: TicketStatus;
  customerName: string;
  customerInitials: string;
  userId: string;
  email: string;
  checkInStatus: 'NOT_USED' | 'CHECKED_IN';
  checkInTime?: string;
}

// ──────────────────────────────────────────────────────────────
// FILTER & SEARCH
// ──────────────────────────────────────────────────────────────

export interface TicketsFilter {
  status?: TicketStatus;
  bookingId?: string;
  showtimeId?: string;
  userId?: string;
  ticketNo?: string;
  startDate?: string;
  endDate?: string;
}

// ──────────────────────────────────────────────────────────────
// CHECK-IN OPERATIONS
// ──────────────────────────────────────────────────────────────

/**
 * Result of a check-in validation attempt
 */
export type CheckInValidationResult = 'success' | 'already_used' | 'invalid_status' | 'expired';

/**
 * Request payload for check-in operation
 */
export interface CheckInRequest {
  token: string;
  ticket: QrTicketResult;
  timestamp: string;
}

/**
 * Response payload for check-in operation
 */
export interface CheckInResponse {
  result: CheckInValidationResult;
  checkedInAt?: string;
  reason?: string;
}

/**
 * Audit record for check-in event
 */
export interface CheckInAuditRecord {
  ticketNumber: string;
  token: string;
  result: CheckInValidationResult;
  timestamp: string;
  userId?: string;
  location?: string;
}

// ──────────────────────────────────────────────────────────────
// PAGINATION
// ──────────────────────────────────────────────────────────────

export interface PaginatedTickets {
  tickets: TicketsTableRow[];
  total: number;
  page: number;
  pageSize: number;
}

// ──────────────────────────────────────────────────────────────
// ERROR HANDLING
// ──────────────────────────────────────────────────────────────

export interface TicketError {
  code: string;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}
