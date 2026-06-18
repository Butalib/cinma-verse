import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { BranchRow } from '../branches-management/branches-management.component';

export interface EditBranchPayload {
  branchName: string;
  branchLocation: string;
}

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
  readonly saveBranch = output<EditBranchPayload>();

  onBackdropClick(): void {
    this.closeModal.emit();
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  onSave(branchName: string, branchLocation: string): void {
    const payload: EditBranchPayload = {
      branchName: branchName.trim(),
      branchLocation: branchLocation.trim(),
    };

    if (!payload.branchName || !payload.branchLocation) {
      return;
    }

    this.saveBranch.emit(payload);
  }
}
