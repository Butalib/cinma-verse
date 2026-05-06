import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { BranchRow } from '../branches-management/branches-management.component';

@Component({
  selector: 'app-edit-branch-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edit-branch-modal.component.html',
  styleUrl: './edit-branch-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditBranchModalComponent {
  readonly branch = input.required<BranchRow>();
  readonly closeModal = output<void>();

  onBackdropClick(): void {
    this.closeModal.emit();
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  onSave(): void {
    // Static mock — no real logic
    this.closeModal.emit();
  }
}
