/**
 * Ticket Check-In Modal Component
 *
 * A reusable modal component for checking in tickets via QR code.
 * Integrated into the Tickets Management page workflow.
 *
 * This component:
 * - Displays QR token input with scan support
 * - Validates tickets in real-time
 * - Shows ticket preview before confirmation
 * - Handles check-in confirmation with async validation
 * - Displays success/failure results
 *
 * State Machine:
 *   idle → validating → valid → confirming → confirmed
 *   └─ invalid | already-used | cancelled | error
 *   At any state: can close via button or ESC key (except during loading)
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  output,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { QrTicketResult, CheckInModalState } from '../../../models/ticket.models';
import { TicketLookupService } from '../../../services/ticket-lookup.service';
import { CheckInService } from '../../../services/check-in.service';

@Component({
  selector: 'app-ticket-check-in-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-check-in-modal.component.html',
  styleUrl: './ticket-check-in-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketCheckInModalComponent {
  // ────────────────────────────────────────────────────────
  // INPUTS & OUTPUTS
  // ────────────────────────────────────────────────────────

  readonly closeModal = output<void>();
  readonly checkInConfirmed = output<QrTicketResult>();

  // ────────────────────────────────────────────────────────
  // INTERNAL STATE
  // ────────────────────────────────────────────────────────

  /**
   * Current modal state in the workflow
   */
  readonly modalState = signal<CheckInModalState>('idle');

  /**
   * QR token input value
   */
  readonly qrToken = signal('');

  /**
   * Ticket result from lookup
   */
  readonly ticket = signal<QrTicketResult | null>(null);

  /**
   * Error message (for validation failures)
   */
  readonly errorMessage = signal('');

  /**
   * Loading state during validation/check-in
   */
  readonly isLoading = signal(false);

  // ────────────────────────────────────────────────────────
  // COMPUTED STATE
  // ────────────────────────────────────────────────────────

  /**
   * Check if modal can be closed (not loading)
   */
  readonly canClose = computed(() => !this.isLoading());

  /**
   * Check if in input state
   */
  readonly isInputState = computed(() =>
    ['idle', 'validating', 'invalid'].includes(this.modalState()),
  );

  /**
   * Check if in preview state
   */
  readonly isPreviewState = computed(() => this.modalState() === 'valid');

  /**
   * Check if in result state
   */
  readonly isResultState = computed(() =>
    ['confirmed', 'already-used', 'cancelled', 'error'].includes(this.modalState()),
  );

  /**
   * Result configuration for UI rendering
   */
  readonly resultConfig = computed(() => {
    const state = this.modalState();
    if (state === 'confirmed') {
      return {
        variant: 'success' as const,
        icon: 'check_circle',
        title: 'CHECK-IN SUCCESSFUL',
        message: 'Ticket has been checked in.',
        statusLabel: 'Checked In',
      };
    }

    if (state === 'already-used') {
      return {
        variant: 'error' as const,
        icon: 'error',
        title: 'ALREADY USED',
        message: 'This ticket has already been checked in.',
        statusLabel: 'Already Used',
      };
    }

    if (state === 'cancelled') {
      return {
        variant: 'error' as const,
        icon: 'cancel',
        title: 'TICKET CANCELLED',
        message: 'This ticket was cancelled and cannot be checked in.',
        statusLabel: 'Cancelled',
      };
    }

    if (state === 'error') {
      return {
        variant: 'error' as const,
        icon: 'error',
        title: 'CHECK-IN FAILED',
        message: this.errorMessage() || 'An error occurred. Please try again.',
        statusLabel: 'Failed',
      };
    }

    return null;
  });

  /**
   * Check if token input is valid (format check only)
   */
  readonly isTokenValid = computed(() => {
    const token = this.qrToken().trim();
    return token.length > 0 && this.lookupService.validateTokenFormat(token);
  });

  // ────────────────────────────────────────────────────────
  // LIFECYCLE & INITIALIZATION
  // ────────────────────────────────────────────────────────

  @ViewChild('modalRoot') private modalRoot?: ElementRef<HTMLElement>;

  constructor(
    private lookupService: TicketLookupService,
    private checkInService: CheckInService,
  ) {
    // Auto-focus input when modal enters input state
    effect(() => {
      if (this.isInputState()) {
        setTimeout(() => {
          const input = document.getElementById('checkin-qr-input') as HTMLInputElement;
          input?.focus();
        }, 100);
      }
    });
  }

  // ────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ────────────────────────────────────────────────────────

  /**
   * Handle QR token input change
   */
  onTokenInput(value: string): void {
    this.qrToken.set(value);
    if (this.modalState() !== 'idle') {
      this.modalState.set('idle');
      this.ticket.set(null);
    }
    this.errorMessage.set('');
  }

  /**
   * Handle Enter key press in input
   * Allows barcode scanner keyboard mode (pastes token + presses Enter)
   */
  onTokenInputKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.validateAndPreview();
    }
  }

  /**
   * Validate ticket and show preview
   * Called when user clicks "Scan QR" or presses Enter
   */
  async validateAndPreview(): Promise<void> {
    if (this.isLoading()) {
      return;
    }
    if (!this.isTokenValid()) {
      this.ticket.set(null);
      this.errorMessage.set('Invalid QR token format');
      this.modalState.set('invalid');
      return;
    }

    this.isLoading.set(true);
    this.modalState.set('validating');

    await new Promise((resolve) => setTimeout(resolve, 300));

    const token = this.lookupService.normalizeToken(this.qrToken());
    const result = await firstValueFrom(this.lookupService.lookupByTokenAsync(token));

    this.isLoading.set(false);

    if (!result) {
      this.ticket.set(null);
      this.errorMessage.set('Ticket not found. Please check the QR token and try again.');
      this.modalState.set('invalid');
      return;
    }

    this.ticket.set(result);

    if (result.status === 'USED') {
      this.errorMessage.set('This ticket has already been checked in.');
      this.modalState.set('already-used');
      return;
    }

    if (result.status === 'CANCELLED') {
      this.errorMessage.set('This ticket was cancelled and cannot be checked in.');
      this.modalState.set('cancelled');
      return;
    }

    if (result.status === 'EXPIRED') {
      this.errorMessage.set('This ticket has expired and cannot be checked in.');
      this.modalState.set('error');
      return;
    }

    this.errorMessage.set('');
    this.modalState.set('valid');
  }

  /**
   * Confirm and execute check-in
   */
  async confirmCheckIn(): Promise<void> {
    if (this.isLoading()) {
      return;
    }
    const ticket = this.ticket();
    if (!ticket) {
      return;
    }

    this.isLoading.set(true);
    this.modalState.set('confirming');

    try {
      const response = await this.checkInService.checkInAsync(this.qrToken(), ticket);

      if (response.result === 'success') {
        this.modalState.set('confirmed');

        // Update ticket status in parent
        this.checkInConfirmed.emit({ ...ticket, status: 'USED' });
      } else if (response.result === 'already_used') {
        this.errorMessage.set(response.reason || 'This ticket has already been checked in.');
        this.modalState.set('already-used');
      } else if (response.result === 'expired') {
        this.errorMessage.set(response.reason || 'This ticket has expired.');
        this.modalState.set('error');
      } else {
        this.errorMessage.set(response.reason || 'This ticket cannot be checked in.');
        this.modalState.set('cancelled');
      }
    } catch (error) {
      this.errorMessage.set('An error occurred. Please try again.');
      this.modalState.set('error');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Reset modal to initial state
   */
  reset(): void {
    this.qrToken.set('');
    this.ticket.set(null);
    this.errorMessage.set('');
    this.isLoading.set(false);
    this.modalState.set('idle');
  }

  /**
   * Close modal via button
   */
  onCloseClick(): void {
    if (this.canClose()) {
      this.closeModal.emit();
    }
  }

  /**
   * Handle backdrop click (close if allowed)
   */
  onBackdropClick(event: MouseEvent): void {
    if (
      (event.target as HTMLElement).classList.contains('checkin-modal-overlay') &&
      this.canClose()
    ) {
      this.closeModal.emit();
    }
  }

  /**
   * Handle ESC key press
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.canClose()) {
      this.closeModal.emit();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = this.getFocusableElements();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        last.focus();
        event.preventDefault();
      } else if (!event.shiftKey && active === last) {
        first.focus();
        event.preventDefault();
      }
    }
  }

  // ────────────────────────────────────────────────────────
  // HELPER METHODS
  // ────────────────────────────────────────────────────────

  /**
   * Get modal title based on state
   */
  getModalTitle(): string {
    switch (this.modalState()) {
      case 'idle':
      case 'validating':
      case 'invalid':
        return 'Quick Check-In';
      case 'valid':
        return 'Confirm Check-In';
      case 'confirmed':
      case 'already-used':
      case 'cancelled':
      case 'error':
        return 'Check-In Result';
      default:
        return 'Check-In';
    }
  }

  /**
   * Get modal subtitle based on state
   */
  getModalSubtitle(): string {
    switch (this.modalState()) {
      case 'idle':
      case 'validating':
      case 'invalid':
        return 'Scan or enter ticket QR token';
      case 'valid':
        return 'Review ticket details and confirm check-in';
      case 'confirmed':
      case 'already-used':
      case 'cancelled':
      case 'error':
        return 'Operation complete';
      default:
        return '';
    }
  }

  /**
   * Get focusable elements within modal (for focus trapping)
   */
  private getFocusableElements(): HTMLElement[] {
    const root = this.modalRoot?.nativeElement;
    if (!root) return [];

    const elements = root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    return Array.from(elements);
  }
}
