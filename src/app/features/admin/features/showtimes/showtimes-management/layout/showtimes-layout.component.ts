import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ShowtimeKpiComponent } from '../components/showtime-kpi/components/showtime-kpi.component';
import { ShowtimesSearchToolbarComponent } from '../components/showtimes-search-toolbar/showtimes-search-toolbar.component';
import {
  ShowtimesFilterPanelComponent,
  ShowtimesFilter,
} from '../components/showtimes-filter-panel/showtimes-filter-panel.component';
import {
  ShowtimesTableComponent,
  ShowtimesTableRow,
} from '../components/showtimes-table/showtimes-table.component';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination.component';
import {
  CreateShowtimeModalComponent,
  CreateShowtimePayload,
} from '../../add-showtime/create-showtime-modal.component';
import {
  EditShowtimeModalComponent,
  EditShowtimeDetails,
} from '../../edit-showtime/edit-showtime-modal.component';
import { ShowtimeDetailsPageComponent } from '../../showtime-details/page/showtime-details-page.component';
import { ShowtimesApiService } from '../services/showtimes-api.service';
import {
  ShowtimeDetailsResponse,
  ShowtimesService,
  UpdateShowtimePayload,
} from '../services/showtimes.service';

@Component({
  selector: 'app-showtimes-layout',
  standalone: true,
  imports: [
    ShowtimeKpiComponent,
    ShowtimesSearchToolbarComponent,
    ShowtimesFilterPanelComponent,
    ShowtimesTableComponent,
    PaginationComponent,
    CreateShowtimeModalComponent,
    EditShowtimeModalComponent,
    ShowtimeDetailsPageComponent,
  ],
  templateUrl: './showtimes-layout.component.html',
  styleUrl: './showtimes-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowtimesLayoutComponent {
  readonly pageSize = signal(10);

  readonly isFilterOpen = signal(false);
  readonly isCreateModalOpen = signal(false);
  readonly isEditModalOpen = signal(false);
  readonly isViewModalOpen = signal(false);
  readonly selectedViewShowtimeId = signal<string | null>(null);
  readonly selectedShowtimeDetails = signal<EditShowtimeDetails | null>(null);
  readonly isEditSaving = signal(false);

  private readonly showtimesApi = inject(ShowtimesApiService);
  private readonly showtimesService = inject(ShowtimesService);

  readonly allShowtimes = signal<ShowtimesTableRow[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly activeFilters = signal<ShowtimesFilter>({});
  readonly currentPage = signal(1);

  readonly filteredShowtimes = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const filters = this.activeFilters();

    return this.allShowtimes().filter((showtime) => {
      if (term) {
        const searchTarget =
          `${showtime.id} ${showtime.movieTitle} ${showtime.branchName} ${showtime.hallName}`.toLowerCase();
        if (!searchTarget.includes(term)) {
          return false;
        }
      }

      if (filters.status) {
        if (showtime.status !== filters.status) {
          return false;
        }
      }

      if (filters.branchName) {
        if (!showtime.branchName.toLowerCase().includes(filters.branchName.toLowerCase())) {
          return false;
        }
      }

      if (filters.movieTitle) {
        if (!showtime.movieTitle.toLowerCase().includes(filters.movieTitle.toLowerCase())) {
          return false;
        }
      }

      if (filters.priceMin !== undefined) {
        if (showtime.price < filters.priceMin) {
          return false;
        }
      }

      if (filters.priceMax !== undefined) {
        if (showtime.price > filters.priceMax) {
          return false;
        }
      }

      const showtimeDate = this.parseDateValue(showtime.date);

      if (filters.dateFrom && (!showtimeDate || showtimeDate < filters.dateFrom)) {
        return false;
      }

      if (filters.dateTo && (!showtimeDate || showtimeDate > filters.dateTo)) {
        return false;
      }

      return true;
    });
  });

  readonly totalPages = computed(() => {
    const pages = Math.ceil(this.filteredShowtimes().length / this.pageSize());
    return Math.max(pages, 1);
  });

  constructor() {
    this.loadShowtimesFromApi();
  }

  readonly pagedShowtimes = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredShowtimes().slice(start, end);
  });

  toggleFilter(): void {
    this.isFilterOpen.update((value) => !value);
  }

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  onCreateShowtime(payload: CreateShowtimePayload): void {
    this.showtimesApi.createShowtime(payload).subscribe({
      next: () => {
        this.loadShowtimesFromApi();
        this.currentPage.set(1);
        this.isCreateModalOpen.set(false);
      },
      error: (err) => {
        console.error('Create showtime API failed', err);
      },
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  onApplyFilters(filters: ShowtimesFilter): void {
    this.activeFilters.set(filters);
    this.currentPage.set(1);
  }

  onResetFilters(): void {
    this.activeFilters.set({});
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  onViewShowtime(showtimeId: string): void {
    this.selectedViewShowtimeId.set(showtimeId);
    this.isViewModalOpen.set(true);
  }

  closeViewModal(): void {
    this.isViewModalOpen.set(false);
    this.selectedViewShowtimeId.set(null);
  }

  onViewShowtimeUpdated(event: { id: string; payload: UpdateShowtimePayload }): void {
    this.showtimesService.updateShowtime(event.id, event.payload).subscribe({
      next: () => this.loadShowtimesFromApi(),
      error: (err) => console.error('Update showtime from view failed', err),
    });
  }

  onEditShowtime(showtime: ShowtimesTableRow): void {
    this.isEditSaving.set(false);

    this.showtimesService.getShowtimeById(showtime.id).subscribe({
      next: (details) => {
        this.selectedShowtimeDetails.set(this.mapEditDetailsFromApi(showtime, details));
        this.isEditModalOpen.set(true);
      },
      error: (err) => {
        console.error('Get showtime details failed', err);
        this.selectedShowtimeDetails.set(this.mapEditDetailsFromRow(showtime));
        this.isEditModalOpen.set(true);
      },
    });
  }

  closeEditModal(): void {
    if (this.isEditSaving()) {
      return;
    }

    this.isEditModalOpen.set(false);
    this.selectedShowtimeDetails.set(null);
  }

  onSaveShowtimeChanges(payload: UpdateShowtimePayload): void {
    const selected = this.selectedShowtimeDetails();
    if (!selected) {
      return;
    }

    this.isEditSaving.set(true);

    this.showtimesService.updateShowtime(selected.id, payload).subscribe({
      next: () => {
        this.isEditSaving.set(false);
        this.isEditModalOpen.set(false);
        this.selectedShowtimeDetails.set(null);
        this.loadShowtimesFromApi();
      },
      error: (err) => {
        console.error('Update showtime failed', err);
        this.isEditSaving.set(false);
      },
    });
  }

  onDeleteShowtime(showtimeId: string): void {
    this.showtimesService.deleteShowtime(showtimeId).subscribe({
      next: () => {
        if (this.selectedViewShowtimeId() === showtimeId) {
          this.closeViewModal();
        }

        this.loadShowtimesFromApi();
      },
      error: (err) => console.error('Delete showtime failed', err),
    });
  }

  private loadShowtimesFromApi(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.showtimesApi.getShowtimes({ page: 1, pageSize: 100 }).subscribe({
      next: (items) => {
        this.allShowtimes.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set('Failed to load showtimes from API.');
        console.error('Load showtimes API failed', err);
      },
    });
  }

  private parseDateValue(value: string): Date | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\s+\d{2}:\d{2}$/, '').trim();
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private mapEditDetailsFromRow(showtime: ShowtimesTableRow): EditShowtimeDetails {
    return {
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
    };
  }

  private mapEditDetailsFromApi(
    showtime: ShowtimesTableRow,
    details: ShowtimeDetailsResponse,
  ): EditShowtimeDetails {
    const fallback = this.mapEditDetailsFromRow(showtime);

    return {
      id: details.id ?? fallback.id,
      movieTitle: details.movieTitle ?? fallback.movieTitle,
      branchName: details.branchName ?? fallback.branchName,
      hallName: details.hallName ?? fallback.hallName,
      date: details.date ?? fallback.date,
      startTime: details.startTime ?? fallback.startTime,
      endTime: details.endTime ?? fallback.endTime,
      price: details.price ?? fallback.price,
      totalSeats: details.totalSeats ?? fallback.totalSeats,
      status: details.status ?? fallback.status,
    };
  }
}
