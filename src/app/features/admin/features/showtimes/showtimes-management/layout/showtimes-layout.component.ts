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

const MOCK_SHOWTIMES: ShowtimesTableRow[] = [
  {
    id: 'SHW-2001',
    movieTitle: 'The Dark Knight Rises',
    branchName: 'Downtown Cinema',
    hallName: 'Hall A',
    date: '2026-04-28',
    startTime: '14:00',
    endTime: '16:45',
    price: 15.0,
    availableSeats: 45,
    totalSeats: 120,
    status: 'SCHEDULED',
    createdAt: '2026-04-20',
  },
  {
    id: 'SHW-2002',
    movieTitle: 'Inception',
    branchName: 'Westside Plex',
    hallName: 'IMAX 1',
    date: '2026-04-27',
    startTime: '19:30',
    endTime: '22:00',
    price: 22.5,
    availableSeats: 12,
    totalSeats: 200,
    status: 'NOW_SHOWING',
    createdAt: '2026-04-18',
  },
  {
    id: 'SHW-2003',
    movieTitle: 'Interstellar',
    branchName: 'Downtown Cinema',
    hallName: 'Hall B',
    date: '2026-04-26',
    startTime: '10:00',
    endTime: '12:50',
    price: 12.0,
    availableSeats: 0,
    totalSeats: 80,
    status: 'COMPLETED',
    createdAt: '2026-04-15',
  },
  {
    id: 'SHW-2004',
    movieTitle: 'Dune: Part Two',
    branchName: 'Eastgate Mall Cinema',
    hallName: 'Screen 3',
    date: '2026-04-29',
    startTime: '16:00',
    endTime: '18:45',
    price: 18.0,
    availableSeats: 90,
    totalSeats: 150,
    status: 'SCHEDULED',
    createdAt: '2026-04-22',
  },
  {
    id: 'SHW-2005',
    movieTitle: 'Oppenheimer',
    branchName: 'Westside Plex',
    hallName: 'Hall C',
    date: '2026-04-25',
    startTime: '20:00',
    endTime: '23:00',
    price: 20.0,
    availableSeats: 0,
    totalSeats: 100,
    status: 'COMPLETED',
    createdAt: '2026-04-14',
  },
  {
    id: 'SHW-2006',
    movieTitle: 'Spider-Man: Across the Spider-Verse',
    branchName: 'Downtown Cinema',
    hallName: 'Hall A',
    date: '2026-04-27',
    startTime: '11:00',
    endTime: '13:20',
    price: 14.0,
    availableSeats: 30,
    totalSeats: 120,
    status: 'NOW_SHOWING',
    createdAt: '2026-04-19',
  },
  {
    id: 'SHW-2007',
    movieTitle: 'The Batman',
    branchName: 'Eastgate Mall Cinema',
    hallName: 'Screen 1',
    date: '2026-04-30',
    startTime: '21:00',
    endTime: '23:55',
    price: 16.5,
    availableSeats: 110,
    totalSeats: 140,
    status: 'SCHEDULED',
    createdAt: '2026-04-23',
  },
  {
    id: 'SHW-2008',
    movieTitle: 'Everything Everywhere All at Once',
    branchName: 'Westside Plex',
    hallName: 'IMAX 1',
    date: '2026-04-24',
    startTime: '15:30',
    endTime: '17:50',
    price: 22.5,
    availableSeats: 0,
    totalSeats: 200,
    status: 'CANCELLED',
    createdAt: '2026-04-12',
  },
  {
    id: 'SHW-2009',
    movieTitle: 'Guardians of the Galaxy Vol. 3',
    branchName: 'Downtown Cinema',
    hallName: 'Hall B',
    date: '2026-04-28',
    startTime: '18:00',
    endTime: '20:30',
    price: 14.0,
    availableSeats: 55,
    totalSeats: 80,
    status: 'SCHEDULED',
    createdAt: '2026-04-21',
  },
  {
    id: 'SHW-2010',
    movieTitle: 'Barbie',
    branchName: 'Eastgate Mall Cinema',
    hallName: 'Screen 2',
    date: '2026-04-27',
    startTime: '13:00',
    endTime: '15:00',
    price: 13.5,
    availableSeats: 8,
    totalSeats: 100,
    status: 'NOW_SHOWING',
    createdAt: '2026-04-20',
  },
  {
    id: 'SHW-2011',
    movieTitle: 'John Wick: Chapter 4',
    branchName: 'Westside Plex',
    hallName: 'Hall C',
    date: '2026-04-29',
    startTime: '22:00',
    endTime: '00:50',
    price: 17.0,
    availableSeats: 75,
    totalSeats: 100,
    status: 'SCHEDULED',
    createdAt: '2026-04-24',
  },
  {
    id: 'SHW-2012',
    movieTitle: 'Avatar: The Way of Water',
    branchName: 'Downtown Cinema',
    hallName: 'IMAX 1',
    date: '2026-04-26',
    startTime: '09:30',
    endTime: '12:45',
    price: 25.0,
    availableSeats: 0,
    totalSeats: 200,
    status: 'COMPLETED',
    createdAt: '2026-04-13',
  },
];

@Component({
  selector: 'app-showtimes-layout',
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

  readonly allShowtimes = signal<ShowtimesTableRow[]>(MOCK_SHOWTIMES);
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
      next: (created) => {
        this.allShowtimes.update((items) => [created, ...items]);
        this.currentPage.set(1);
        this.isCreateModalOpen.set(false);
      },
      error: (err) => {
        console.error('Create showtime API failed, falling back to local add', err);
        const now = new Date();
        const today = now.toISOString().slice(0, 10);

        const newShowtime: ShowtimesTableRow = {
          id: this.generateNextId(),
          movieTitle: payload.movieTitle,
          branchName: payload.branchName,
          hallName: payload.hallName,
          date: payload.date,
          startTime: payload.startTime,
          endTime: payload.endTime,
          price: payload.price,
          availableSeats: payload.totalSeats,
          totalSeats: payload.totalSeats,
          status: 'SCHEDULED',
          createdAt: today,
        };

        this.allShowtimes.update((items) => [newShowtime, ...items]);
        this.currentPage.set(1);
        this.isCreateModalOpen.set(false);
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
    this.allShowtimes.update((items) =>
      items.map((item) =>
        item.id === event.id ? this.applyEditResult(item, event.payload) : item,
      ),
    );
  }

  onEditShowtime(showtime: ShowtimesTableRow): void {
    this.isEditSaving.set(false);

    this.showtimesService.getShowtimeById(showtime.id).subscribe({
      next: (details) => {
        this.selectedShowtimeDetails.set(this.mapEditDetailsFromApi(showtime, details));
        this.isEditModalOpen.set(true);
      },
      error: (err) => {
        console.error('Get showtime details failed, opening with table data', err);
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
      next: (updated) => {
        this.allShowtimes.update((items) =>
          items.map((item) =>
            item.id === selected.id ? this.applyEditResult(item, payload, updated) : item,
          ),
        );

        this.isEditSaving.set(false);
        this.isEditModalOpen.set(false);
        this.selectedShowtimeDetails.set(null);
      },
      error: (err) => {
        console.error('Update showtime failed, applying local update', err);
        this.allShowtimes.update((items) =>
          items.map((item) =>
            item.id === selected.id ? this.applyEditResult(item, payload) : item,
          ),
        );

        this.isEditSaving.set(false);
        this.isEditModalOpen.set(false);
        this.selectedShowtimeDetails.set(null);
      },
    });
  }

  onDeleteShowtime(showtimeId: string): void {
    const applyLocalDelete = () => {
      this.allShowtimes.update((items) => items.filter((item) => item.id !== showtimeId));

      if (this.selectedViewShowtimeId() === showtimeId) {
        this.closeViewModal();
      }

      if (this.currentPage() > this.totalPages()) {
        this.currentPage.set(this.totalPages());
      }
    };

    this.showtimesService.deleteShowtime(showtimeId).subscribe({
      next: () => applyLocalDelete(),
      error: () => applyLocalDelete(),
    });
  }

  private loadShowtimesFromApi(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.showtimesApi.getShowtimes({ page: 1, pageSize: 100 }).subscribe({
      next: (items) => {
        if (items.length > 0) {
          this.allShowtimes.set(items);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Failed to load showtimes from API.');
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

  private generateNextId(): string {
    const maxId = this.allShowtimes().reduce((max, item) => {
      const value = Number(item.id.replace('SHW-', ''));
      return Number.isNaN(value) ? max : Math.max(max, value);
    }, 2000);

    return `SHW-${String(maxId + 1)}`;
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

  private applyEditResult(
    showtime: ShowtimesTableRow,
    payload: UpdateShowtimePayload,
    updated?: ShowtimeDetailsResponse,
  ): ShowtimesTableRow {
    return {
      ...showtime,
      date: updated?.date ?? payload.date,
      startTime: updated?.startTime ?? payload.startTime,
      endTime: updated?.endTime ?? payload.endTime,
      price: updated?.price ?? payload.price,
      totalSeats: updated?.totalSeats ?? payload.totalSeats,
      status: (updated?.status ?? payload.status) as ShowtimesTableRow['status'],
    };
  }
}
