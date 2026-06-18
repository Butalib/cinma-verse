import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AddBranchPayload {
  branchName: string;
  branchLocation: string;
}

@Component({
  selector: 'app-add-branch-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-branch-modal.component.html',
  styleUrl: './add-branch-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddBranchModalComponent {
  readonly closeModal = output<void>();
  readonly createBranch = output<AddBranchPayload>();

  onBackdropClick(): void {
    this.closeModal.emit();
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  onSubmit(branchName: string, branchLocation: string): void {
    const payload: AddBranchPayload = {
      branchName: branchName.trim(),
      branchLocation: branchLocation.trim(),
    };

    if (!payload.branchName || !payload.branchLocation) {
      return;
    }

    this.createBranch.emit(payload);
  }
}
