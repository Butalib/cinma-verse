import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { MovieMediaService } from '../../services/movie-media.service';

@Component({
  selector: 'app-cast-members',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-group field-full">
      <label>CAST MEMBERS <span class="field-api-hint">(castMembers)</span></label>
      <div [formGroup]="castForm()" formArrayName="castMembers" class="cast-list">
        @for (member of castMembers.controls; track $index) {
          <div [formGroupName]="$index" class="cast-card">
            <div class="cast-card-header">
              <span class="cast-card-number">{{ $index + 1 }}</span>
              <input class="form-control cast-input" formControlName="personName" type="text" placeholder="Person name" />
              <input class="form-control cast-input" formControlName="characterName" type="text" placeholder="Character name" />
              <button type="button" class="cast-remove-btn" (click)="removeMember($index)" aria-label="Remove cast member">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="cast-card-body">
              <div class="cast-field">
                <label class="cast-field-label">Role Type</label>
                <select class="form-control form-control-sm" formControlName="roleType">
                  <option value="Actor">Actor</option>
                  <option value="Director">Director</option>
                  <option value="Producer">Producer</option>
                  <option value="Writer">Writer</option>
                </select>
              </div>
              <label class="cast-lead-checkbox">
                <input type="checkbox" formControlName="isLead" />
                <span>Lead Role</span>
              </label>
              <div class="cast-image-upload">
                @if (member.get('imageUrl')?.value) {
                  <div class="cast-image-wrapper">
                    <img [src]="member.get('imageUrl')?.value" alt="Cast photo" class="cast-image-preview" />
                    <input type="file" accept="image/*" hidden #castImgEditInput
                      (change)="onImageSelected($event, $index)" />
                    <button type="button" class="cast-image-change" (click)="castImgEditInput.click()">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                  </div>
                } @else {
                  <label class="cast-image-btn" [class.uploading]="uploadingIndex() === $index">
                    <input type="file" accept="image/*" hidden
                      (change)="onImageSelected($event, $index)"
                      [disabled]="uploadingIndex() === $index" />
                    <span class="material-symbols-outlined">
                      {{ uploadingIndex() === $index ? 'hourglass_empty' : 'add_a_photo' }}
                    </span>
                    Photo
                  </label>
                }
              </div>
            </div>
          </div>
        }
      </div>
      <button type="button" class="btn btn-ghost btn-sm add-cast-btn" (click)="addMember()">
        <span class="material-symbols-outlined">person_add</span>
        Add Cast Member
      </button>
    </div>
  `,
  styles: [`
    .cast-list { display: flex; flex-direction: column; gap: 8px; }
    .cast-card {
      border: 1px solid var(--ghost-border); border-radius: var(--radius-md);
      background: var(--surface-container); padding: 10px 12px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .cast-card-header {
      display: grid; grid-template-columns: 24px 1fr 1fr 24px; gap: 8px; align-items: center;
    }
    .cast-card-number {
      display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;
      border-radius: 50%; background: var(--primary-dim); color: var(--primary-container);
      font-size: 11px; font-weight: 700;
    }
    .cast-input { min-height: 32px !important; padding: 6px 10px !important; font-size: 12px !important; }
    .cast-remove-btn {
      display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;
      border: none; background: transparent; color: var(--on-surface-muted); cursor: pointer;
      border-radius: var(--radius-sm); transition: background var(--transition), color var(--transition);
    }
    .cast-remove-btn span { font-size: 16px; }
    .cast-remove-btn:hover { background: var(--status-danger-bg); color: var(--status-danger); }
    .cast-card-body {
      display: flex; align-items: center; gap: 10px; padding-top: 4px; border-top: 1px solid var(--ghost-border);
    }
    .cast-field { flex: 1; }
    .cast-field-label {
      display: block; font-size: 9px; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--on-surface-muted); margin-bottom: 2px;
    }
    .form-control-sm { min-height: 28px !important; padding: 4px 8px !important; font-size: 11px !important; }
    .cast-lead-checkbox {
      display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap;
      font-size: 11px; color: var(--on-surface-variant);
    }
    .cast-lead-checkbox input[type="checkbox"] { accent-color: var(--primary-container); width: 14px; height: 14px; }
    .cast-image-upload { flex-shrink: 0; }
    .cast-image-wrapper { position: relative; width: 40px; height: 40px; }
    .cast-image-preview { width: 40px; height: 40px; border-radius: var(--radius-sm); object-fit: cover; }
    .cast-image-change {
      position: absolute; bottom: -2px; right: -2px; width: 18px; height: 18px;
      border-radius: 50%; background: var(--surface-container-high); border: 1px solid var(--ghost-border);
      display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--on-surface-variant);
    }
    .cast-image-change span { font-size: 12px; }
    .cast-image-change:hover { color: var(--primary-container); }
    .cast-image-btn {
      display: flex; align-items: center; gap: 4px; padding: 4px 8px;
      border: 1px dashed var(--ghost-border); border-radius: var(--radius-sm);
      background: transparent; color: var(--on-surface-muted); cursor: pointer;
      font-size: 10px; transition: border-color var(--transition), color var(--transition);
    }
    .cast-image-btn span { font-size: 14px; }
    .cast-image-btn:hover { border-color: var(--primary-container); color: var(--primary-container); }
    .cast-image-btn.uploading { opacity: 0.6; pointer-events: none; }
    .add-cast-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; margin-top: 4px;
    }
    .add-cast-btn span { font-size: 16px; }
  `],
})
export class CastMembersComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly mediaService = inject(MovieMediaService);

  readonly castForm = input.required<FormGroup>();
  readonly castChange = output<void>();

  readonly uploadingIndex = signal<number | null>(null);

  get castMembers(): FormArray {
    return this.castForm().get('castMembers') as FormArray;
  }

  addMember(): void {
    const index = this.castMembers.length;
    this.castMembers.push(this.buildCastGroup(index));
    this.castChange.emit();
  }

  removeMember(index: number): void {
    this.castMembers.removeAt(index);
    this.castMembers.controls.forEach((ctrl, i) => {
      ctrl.get('displayOrder')?.setValue(i);
    });
    this.castChange.emit();
  }

  onImageSelected(event: Event, castIndex: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingIndex.set(castIndex);
    this.mediaService.upload(file).subscribe({
      next: (url: string) => {
        this.castMembers.at(castIndex).get('imageUrl')?.setValue(url);
        this.uploadingIndex.set(null);
        this.castChange.emit();
      },
      error: () => {
        this.uploadingIndex.set(null);
      },
    });
    input.value = '';
  }

  private buildCastGroup(index: number): FormGroup {
    return this.fb.group({
      personName: this.fb.control(''),
      imageUrl: this.fb.control(''),
      roleType: this.fb.control('Actor'),
      characterName: this.fb.control(''),
      displayOrder: this.fb.control(index),
      isLead: this.fb.control(false),
    });
  }
}
