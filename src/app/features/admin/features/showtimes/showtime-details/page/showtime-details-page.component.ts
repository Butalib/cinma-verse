import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ShowtimeDetailsFacade } from '../facade/showtime-details.facade';
import { ShowtimeSummaryComponent } from '../components/summary/showtime-summary.component';
import { ShowtimeStatsComponent } from '../components/stats/showtime-stats.component';
import { ShowtimeScheduleComponent } from '../components/schedule/showtime-schedule.component';
import { ShowtimeLocationComponent } from '../components/location/showtime-location.component';
import { ShowtimeActionsComponent } from '../components/actions/showtime-actions.component';
import {
  EditShowtimeModalComponent,
  type EditShowtimeDetails,
  type UpdateShowtimePayload,
} from '../../edit-showtime/edit-showtime-modal.component';
import { ShowtimesService } from '../../showtimes-management/services/showtimes.service';

@Component({
  selector: 'app-showtime-details-page',
  imports: [
    ShowtimeSummaryComponent,
    ShowtimeStatsComponent,
    ShowtimeScheduleComponent,
    ShowtimeLocationComponent,
    ShowtimeActionsComponent,
    EditShowtimeModalComponent,
  ],
  providers: [ShowtimeDetailsFacade],
  templateUrl: './showtime-details-page.component.html',
  styleUrl: './showtime-details-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.showtime-details-page--overlay]': 'overlayMode()',
  },
})
export class ShowtimeDetailsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly showtimesService = inject(ShowtimesService);
  protected readonly facade = inject(ShowtimeDetailsFacade);

  readonly showtimeId = input<string | null>(null);
  readonly overlayMode = input(false);

  readonly closeRequested = output<void>();
  readonly showtimeUpdated = output<{ id: string; payload: UpdateShowtimePayload }>();

  readonly isEditModalOpen = signal(false);
  readonly editDetails = signal<EditShowtimeDetails | null>(null);
  readonly isEditSaving = signal(false);

  private readonly effectiveShowtimeId = computed(
    () => this.showtimeId() ?? this.route.snapshot.paramMap.get('id'),
  );

  constructor() {
    effect(() => {
      const id = this.effectiveShowtimeId();
      if (id) {
        this.facade.loadShowtime(id);
      }
    });
  }

  onEdit(): void {
    const showtime = this.facade.showtime();
    if (!showtime) {
      return;
    }

    this.editDetails.set({
      id: showtime.id,
      movieTitle: showtime.movieTitle,
      branchName: showtime.branchName,
      hallName: showtime.hallName,
      date: showtime.date,
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      price: showtime.price,
      totalSeats: showtime.totalSeats,
      status: showtime.status,
    });
    this.isEditSaving.set(false);
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    if (this.isEditSaving()) {
      return;
    }

    this.isEditModalOpen.set(false);
    this.editDetails.set(null);
  }

  onSaveChanges(payload: UpdateShowtimePayload): void {
    const details = this.editDetails();
    if (!details) {
      return;
    }

    this.isEditSaving.set(true);

    this.showtimesService.updateShowtime(details.id, payload).subscribe({
      next: () => {
        this.isEditSaving.set(false);
        this.isEditModalOpen.set(false);
        this.editDetails.set(null);
        this.showtimeUpdated.emit({ id: details.id, payload });
        this.facade.loadShowtime(details.id);
      },
      error: () => {
        this.isEditSaving.set(false);
        this.isEditModalOpen.set(false);
        this.editDetails.set(null);
        this.showtimeUpdated.emit({ id: details.id, payload });
        this.facade.loadShowtime(details.id);
      },
    });
  }

  onBack(): void {
    if (this.overlayMode()) {
      this.closeRequested.emit();
      return;
    }

    this.facade.goBack();
  }
}
