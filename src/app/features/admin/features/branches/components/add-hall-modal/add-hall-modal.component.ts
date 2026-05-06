import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-hall-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-hall-modal.component.html',
  styleUrl: './add-hall-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddHallModalComponent {
  readonly closeModal = output<void>();

  onBackdropClick(): void {
    this.closeModal.emit();
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    this.closeModal.emit();
  }
}
