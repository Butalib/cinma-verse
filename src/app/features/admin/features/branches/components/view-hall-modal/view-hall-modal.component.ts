import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { HallRow } from '../branches-management/branches-management.component';

@Component({
  selector: 'app-view-hall-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-hall-modal.component.html',
  styleUrl: './view-hall-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewHallModalComponent {
  readonly hall = input.required<HallRow>();
  readonly closeModal = output<void>();
  readonly editHall = output<HallRow>();

  // Static seat layout rows
  readonly seatRows = [
    { label: 'A', seats: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { label: 'B', seats: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { label: 'C', seats: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { label: 'D', seats: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  ];

  onClose(): void {
    this.closeModal.emit();
  }

  onBackdropClick(): void {
    this.closeModal.emit();
  }

  onEditHall(): void {
    this.editHall.emit(this.hall());
  }
}
