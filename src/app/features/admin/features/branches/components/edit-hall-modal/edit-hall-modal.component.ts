import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { HallRow } from '../branches-management/branches-management.component';
import type { HallBranchOption } from '../add-hall-modal/add-hall-modal.component';

export interface EditHallPayload {
  branchId: number;
  hallNumber: string;
  hallStatus: string;
  hallType: string;
}

@Component({
  selector: 'app-edit-hall-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edit-hall-modal.component.html',
  styleUrl: './edit-hall-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditHallModalComponent {
  readonly hall = input.required<HallRow>();
  readonly branches = input<HallBranchOption[]>([]);

  readonly closeModal = output<void>();
  readonly saveHall = output<EditHallPayload>();
  readonly deleteHall = output<void>();

  onBackdropClick(): void {
    this.closeModal.emit();
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  onSave(hallNumber: string, hallType: string, branchId: string, hallStatus: string): void {
    const numericBranchId = this.extractNumericId(branchId);

    if (!numericBranchId || !hallNumber.trim() || !hallType.trim() || !hallStatus.trim()) {
      return;
    }

    this.saveHall.emit({
      branchId: numericBranchId,
      hallNumber: hallNumber.trim(),
      hallStatus: hallStatus.trim(),
      hallType: hallType.trim(),
    });
  }

  onDelete(): void {
    this.deleteHall.emit();
  }

  private extractNumericId(value: string): number | null {
    const match = value.match(/\d+/);
    if (!match) {
      return null;
    }

    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
