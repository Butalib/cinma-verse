import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HallBranchOption {
  id: string;
  name: string;
}

export interface AddHallPayload {
  branchId: number;
  hallNumber: string;
  hallStatus: string;
  hallType: string;
}

@Component({
  selector: 'app-add-hall-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-hall-modal.component.html',
  styleUrl: './add-hall-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddHallModalComponent {
  readonly branches = input<HallBranchOption[]>([]);
  readonly selectedBranchId = input<string>('');

  readonly closeModal = output<void>();
  readonly createHall = output<AddHallPayload>();

  onBackdropClick(): void {
    this.closeModal.emit();
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  onSubmit(hallNumber: string, hallType: string, branchId: string, hallStatus: string): void {
    const numericBranchId = this.extractNumericId(branchId);

    if (!numericBranchId || !hallNumber.trim() || !hallType.trim() || !hallStatus.trim()) {
      return;
    }

    this.createHall.emit({
      branchId: numericBranchId,
      hallNumber: hallNumber.trim(),
      hallStatus: hallStatus.trim(),
      hallType: hallType.trim(),
    });
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
