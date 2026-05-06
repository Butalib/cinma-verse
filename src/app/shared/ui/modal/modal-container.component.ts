import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-modal-container',
  imports: [],
  templateUrl: './modal-container.component.html',
  styleUrl: './modal-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalContainerComponent {
  readonly size = input<ModalSize>('md');
  readonly close = output<void>();
}
