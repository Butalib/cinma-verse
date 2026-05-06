import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { HallRow } from '../branches-management/branches-management.component';

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
  readonly closeModal = output<void>();

  onBackdropClick(): void {
    this.closeModal.emit();
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  onSave(): void {
    this.closeModal.emit();
  }
}
