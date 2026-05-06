/**
 * Check-In Service
 *
 * Responsible for ticket check-in operations.
 * Handles validation, state transitions, and audit logging.
 *
 * This service encapsulates the business logic for checking in tickets,
 * ensuring consistency across the application.
 */

import { Injectable, signal, computed } from '@angular/core';
import { QrTicketResult, CheckInValidationResult, CheckInResponse } from '../models/ticket.models';

@Injectable({
  providedIn: 'root',
})
export class CheckInService {
  /**
   * Audit log for check-in operations
   * In production, this would be persisted to a backend service
   */
  private auditLog = signal<
    Array<{ timestamp: string; token: string; result: CheckInValidationResult }>
  >([]);

  /**
   * Readonly view of audit log
   */
  readonly auditHistory = this.auditLog.asReadonly();

  /**
   * Count of successful check-ins in current session
   */
  readonly successfulCheckIns = computed(
    () => this.auditLog().filter((entry) => entry.result === 'success').length,
  );

  /**
   * Validate ticket eligibility for check-in
   *
   * Business Rules:
   * - ACTIVE tickets → eligible
   * - USED tickets → not eligible (already checked in)
   * - CANCELLED tickets → not eligible
   * - EXPIRED tickets → not eligible (show time passed)
   *
   * @param ticket The ticket to validate
   * @returns Validation result and reason if not eligible
   */
  validateCheckInEligibility(ticket: QrTicketResult): {
    eligible: boolean;
    reason?: string;
  } {
    if (ticket.status === 'ACTIVE') {
      return { eligible: true };
    }

    if (ticket.status === 'USED') {
      return {
        eligible: false,
        reason: 'This ticket has already been checked in.',
      };
    }

    if (ticket.status === 'CANCELLED') {
      return {
        eligible: false,
        reason: 'This ticket has been cancelled and cannot be checked in.',
      };
    }

    if (ticket.status === 'EXPIRED') {
      return {
        eligible: false,
        reason: 'This ticket has expired and can no longer be used.',
      };
    }

    return {
      eligible: false,
      reason: 'Unknown ticket status.',
    };
  }

  /**
   * Perform check-in validation
   *
   * This is the core business logic that determines check-in eligibility.
   * Currently synchronous, but designed to be easily extended to async
   * operations (HTTP calls, database updates, etc.)
   *
   * @param token The QR token being checked in
   * @param ticket The ticket details
   * @returns CheckInValidationResult
   */
  performCheckInValidation(token: string, ticket: QrTicketResult): CheckInValidationResult {
    const validation = this.validateCheckInEligibility(ticket);

    if (!validation.eligible) {
      if (ticket.status === 'USED') {
        return 'already_used';
      }
      if (ticket.status === 'CANCELLED') {
        return 'invalid_status';
      }
      if (ticket.status === 'EXPIRED') {
        return 'expired';
      }
      return 'invalid_status';
    }

    return 'success';
  }

  /**
   * Execute check-in operation
   *
   * This method orchestrates the complete check-in workflow:
   * 1. Validate ticket eligibility
   * 2. Generate response
   * 3. Log audit entry
   * 4. Return result
   *
   * In production, this would:
   * - Call POST /api/tickets/{ticketNumber}/check-in
   * - Handle network errors with retry logic
   * - Update backend state transactionally
   * - Emit events for real-time UI updates
   *
   * @param token The QR token being checked in
   * @param ticket The ticket details
   * @returns CheckInResponse with result and metadata
   */
  checkIn(token: string, ticket: QrTicketResult): CheckInResponse {
    // Perform validation
    const validationResult = this.performCheckInValidation(token, ticket);

    // Generate response
    const response: CheckInResponse = {
      result: validationResult,
      ...(validationResult === 'success' && { checkedInAt: new Date().toISOString() }),
      ...(validationResult !== 'success' && {
        reason: this.getCheckInFailureReason(validationResult),
      }),
    };

    // Log audit entry
    this.logCheckInAudit(token, validationResult);

    return response;
  }

  /**
   * Simulate asynchronous check-in operation (for UX delays)
   *
   * In production, this would be a real HTTP call.
   * Used to provide realistic loading states in the UI.
   *
   * @param token The QR token
   * @param ticket The ticket details
   * @param delayMs Simulated API latency (default: 800ms)
   * @returns Promise that resolves to CheckInResponse
   */
  async checkInAsync(
    token: string,
    ticket: QrTicketResult,
    delayMs = 800,
  ): Promise<CheckInResponse> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Perform validation
    return this.checkIn(token, ticket);
  }

  /**
   * Get human-readable failure reason
   *
   * @param result The validation result
   * @returns Descriptive message
   */
  private getCheckInFailureReason(result: CheckInValidationResult): string {
    const reasons: Record<string, string> = {
      already_used: 'This ticket has already been checked in.',
      invalid_status: 'This ticket cannot be checked in due to its status.',
      expired: 'This ticket has expired.',
    };
    return reasons[result] ?? 'Check-in failed. Please try again.';
  }

  /**
   * Log check-in audit entry
   *
   * In production, this would be sent to a backend audit service.
   * Current implementation stores in memory for demonstration.
   *
   * @param token The QR token
   * @param result The validation result
   */
  private logCheckInAudit(token: string, result: CheckInValidationResult): void {
    this.auditLog.update((log) => [
      ...log,
      {
        timestamp: new Date().toISOString(),
        token,
        result,
      },
    ]);
  }

  /**
   * Get check-in history for a specific ticket
   *
   * @param ticketNumber The ticket number
   * @returns Array of check-in audit records
   */
  getCheckInHistory(
    ticketNumber: string,
  ): Array<{ timestamp: string; result: CheckInValidationResult }> {
    return this.auditLog().filter((entry) => entry.token.includes(ticketNumber));
  }

  /**
   * Clear audit log (for testing/demo purposes)
   */
  clearAuditLog(): void {
    this.auditLog.set([]);
  }
}
