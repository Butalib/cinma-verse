import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  onBackdropClick(): void {
    this.closeModal.emit();
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    // Static mock — no real logic
    this.closeModal.emit();
  }
}
