import { computed, inject, Injectable, signal } from '@angular/core';
import {
  CreateGenrePayload,
  Genre,
  GenreSortOption,
  GenreStats,
  GenresState,
  UpdateGenrePayload,
} from '../models/genre.model';
import { GenreApiDto, GenresApiResponse, GenresService } from '../services/genres.service';

const MOCK_GENRES: Genre[] = [
  { id: 'GEN-001', name: 'Action', moviesCount: 42, createdAt: '2026-01-10' },
  { id: 'GEN-002', name: 'Drama', moviesCount: 37, createdAt: '2026-01-12' },
  { id: 'GEN-003', name: 'Comedy', moviesCount: 29, createdAt: '2026-01-15' },
  { id: 'GEN-004', name: 'Sci-Fi', moviesCount: 24, createdAt: '2026-01-18' },
  { id: 'GEN-005', name: 'Thriller', moviesCount: 18, createdAt: '2026-01-22' },
  { id: 'GEN-006', name: 'Animation', moviesCount: 16, createdAt: '2026-01-25' },
  { id: 'GEN-007', name: 'Family', moviesCount: 14, createdAt: '2026-01-27' },
  { id: 'GEN-008', name: 'Horror', moviesCount: 12, createdAt: '2026-01-30' },
  { id: 'GEN-009', name: 'Adventure', moviesCount: 20, createdAt: '2026-02-02' },
  { id: 'GEN-010', name: 'Romance', moviesCount: 15, createdAt: '2026-02-05' },
  { id: 'GEN-011', name: 'Fantasy', moviesCount: 13, createdAt: '2026-02-08' },
  { id: 'GEN-012', name: 'Documentary', moviesCount: 8, createdAt: '2026-02-11' },
];

@Injectable({ providedIn: 'root' })
export class GenresFacade {
  private readonly genresService = inject(GenresService);

  private readonly _state = signal<GenresState>({
    list: [],
    loading: false,
    error: null,
    filters: {
      search: '',
      sort: 'name_asc',
    },
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
    },
  });

  private readonly _createLoading = signal(false);
  private readonly _updateLoading = signal(false);
  private readonly _deleteLoading = signal(false);
  private readonly _createSuccessTick = signal(0);
  private readonly _updateSuccessTick = signal(0);

  private readonly _selectedGenre = signal<Genre | null>(null);
  private readonly _isCreateModalOpen = signal(false);
  private readonly _isViewModalOpen = signal(false);
  private readonly _isEditModalOpen = signal(false);

  private lastRequestId = 0;
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;

  readonly state = this._state.asReadonly();
  readonly createLoading = this._createLoading.asReadonly();
  readonly updateLoading = this._updateLoading.asReadonly();
  readonly deleteLoading = this._deleteLoading.asReadonly();
  readonly createSuccessTick = this._createSuccessTick.asReadonly();
  readonly updateSuccessTick = this._updateSuccessTick.asReadonly();

  readonly selectedGenre = this._selectedGenre.asReadonly();
  readonly isCreateModalOpen = this._isCreateModalOpen.asReadonly();
  readonly isViewModalOpen = this._isViewModalOpen.asReadonly();
  readonly isEditModalOpen = this._isEditModalOpen.asReadonly();

  readonly list = computed(() => this._state().list);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);

  readonly search = computed(() => this._state().filters.search);
  readonly sort = computed(() => this._state().filters.sort);

  readonly page = computed(() => this._state().pagination.page);
  readonly pageSize = computed(() => this._state().pagination.pageSize);
  readonly total = computed(() => this._state().pagination.total);

  readonly stats = computed<GenreStats>(() => {
    const items = this._state().list;
    const totalGenres = this._state().pagination.total;

    if (items.length === 0) {
      return {
        totalGenres,
        mostPopular: null,
        recentlyAdded: null,
      };
    }

    const mostPopular = [...items].sort((a, b) => b.moviesCount - a.moviesCount)[0] ?? null;
    const recentlyAdded =
      [...items].sort((a, b) => this.toMs(b.createdAt) - this.toMs(a.createdAt))[0] ?? null;

    return {
      totalGenres,
      mostPopular,
      recentlyAdded,
    };
  });

  loadGenres(): void {
    this.requestGenres();
  }

  setSearch(query: string): void {
    this._state.update((state) => ({
      ...state,
      filters: {
        ...state.filters,
        search: query,
      },
      pagination: {
        ...state.pagination,
        page: 1,
      },
    }));

    this.scheduleDebouncedRequest();
  }

  setSort(sort: GenreSortOption): void {
    this._state.update((state) => ({
      ...state,
      filters: {
        ...state.filters,
        sort,
      },
      pagination: {
        ...state.pagination,
        page: 1,
      },
    }));

    this.requestGenres();
  }

  setPage(page: number): void {
    this._state.update((state) => ({
      ...state,
      pagination: {
        ...state.pagination,
        page,
      },
    }));

    this.requestGenres();
  }

  setPageSize(pageSize: number): void {
    this._state.update((state) => ({
      ...state,
      pagination: {
        ...state.pagination,
        page: 1,
        pageSize,
      },
    }));

    this.requestGenres();
  }

  openCreateModal(): void {
    this._isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    if (this._createLoading()) {
      return;
    }

    this._isCreateModalOpen.set(false);
  }

  openViewModal(id: string): void {
    const found = this._state().list.find((item) => item.id === id) ?? this.findInMock(id);
    this._selectedGenre.set(found);
    this._isViewModalOpen.set(!!found);
  }

  closeViewModal(): void {
    this._isViewModalOpen.set(false);
  }

  openEditModal(id: string): void {
    const found = this._state().list.find((item) => item.id === id) ?? this.findInMock(id);
    this._selectedGenre.set(found);
    this._isEditModalOpen.set(!!found);
  }

  closeEditModal(): void {
    if (this._updateLoading()) {
      return;
    }

    this._isEditModalOpen.set(false);
  }

  createGenre(payload: CreateGenrePayload): void {
    this._createLoading.set(true);

    this.genresService.createGenre(payload).subscribe({
      next: () => {
        this._createLoading.set(false);
        this._createSuccessTick.update((value) => value + 1);
        this._isCreateModalOpen.set(false);
        this.requestGenres();
      },
      error: () => {
        this._createLoading.set(false);

        const now = new Date().toISOString().slice(0, 10);
        const fallback: Genre = {
          id: this.generateNextId(),
          name: payload.name.trim(),
          moviesCount: 0,
          createdAt: now,
        };

        const all = [fallback, ...MOCK_GENRES];
        this.applyFallbackResult(all);
        this._createSuccessTick.update((value) => value + 1);
        this._isCreateModalOpen.set(false);
      },
    });
  }

  updateGenre(id: string, payload: UpdateGenrePayload): void {
    this._updateLoading.set(true);

    this.genresService.updateGenre(id, payload).subscribe({
      next: () => {
        this._updateLoading.set(false);

        this._state.update((state) => ({
          ...state,
          list: state.list.map((item) =>
            item.id === id
              ? {
                  ...item,
                  name: payload.name,
                }
              : item,
          ),
        }));

        const current = this._selectedGenre();
        if (current && current.id === id) {
          this._selectedGenre.set({
            ...current,
            name: payload.name,
          });
        }

        this._updateSuccessTick.update((value) => value + 1);
        this._isEditModalOpen.set(false);

        this.requestGenres();
      },
      error: () => {
        this._updateLoading.set(false);

        this._state.update((state) => ({
          ...state,
          list: state.list.map((item) =>
            item.id === id
              ? {
                  ...item,
                  name: payload.name,
                }
              : item,
          ),
        }));

        const current = this._selectedGenre();
        if (current && current.id === id) {
          this._selectedGenre.set({
            ...current,
            name: payload.name,
          });
        }

        this._updateSuccessTick.update((value) => value + 1);
        this._isEditModalOpen.set(false);
      },
    });
  }

  deleteGenre(id: string): void {
    const confirmed = window.confirm('Are you sure you want to delete this genre?');
    if (!confirmed) {
      return;
    }

    this._deleteLoading.set(true);

    this.genresService.deleteGenre(id).subscribe({
      next: () => {
        this._deleteLoading.set(false);
        if (this._selectedGenre()?.id === id) {
          this._selectedGenre.set(null);
          this._isViewModalOpen.set(false);
          this._isEditModalOpen.set(false);
        }
        this.requestGenres();
      },
      error: () => {
        this._deleteLoading.set(false);

        const all = MOCK_GENRES.filter((item) => item.id !== id);
        this.applyFallbackResult(all);

        if (this._selectedGenre()?.id === id) {
          this._selectedGenre.set(null);
          this._isViewModalOpen.set(false);
          this._isEditModalOpen.set(false);
        }
      },
    });
  }

  private scheduleDebouncedRequest(): void {
    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle);
    }

    this.debounceHandle = setTimeout(() => {
      this.requestGenres();
    }, 350);
  }

  private requestGenres(): void {
    const snapshot = this._state();
    const requestId = ++this.lastRequestId;

    this._state.update((state) => ({
      ...state,
      loading: true,
      error: null,
    }));

    this.genresService
      .getGenres({
        search: snapshot.filters.search,
        sort: snapshot.filters.sort,
        page: snapshot.pagination.page,
        pageSize: snapshot.pagination.pageSize,
      })
      .subscribe({
        next: (response) => {
          if (requestId !== this.lastRequestId) {
            return;
          }

          const items = this.extractItems(response).map((item, index) =>
            this.mapGenre(item, index),
          );
          const total = this.extractTotal(response, items.length);

          this._state.update((state) => ({
            ...state,
            list: items,
            loading: false,
            error: null,
            pagination: {
              ...state.pagination,
              total,
            },
          }));
        },
        error: () => {
          if (requestId !== this.lastRequestId) {
            return;
          }

          this.applyFallbackResult(MOCK_GENRES);
        },
      });
  }

  private applyFallbackResult(source: Genre[]): void {
    const snapshot = this._state();
    const search = snapshot.filters.search.trim().toLowerCase();
    const sort = snapshot.filters.sort;
    const page = snapshot.pagination.page;
    const pageSize = snapshot.pagination.pageSize;

    let filtered = source;

    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(search) || item.id.toLowerCase().includes(search),
      );
    }

    filtered = [...filtered].sort((a, b) => {
      const base = a.name.localeCompare(b.name);
      return sort === 'name_asc' ? base : -base;
    });

    const start = (page - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    this._state.update((state) => ({
      ...state,
      list: pageItems,
      loading: false,
      error: null,
      pagination: {
        ...state.pagination,
        total: filtered.length,
      },
    }));
  }

  private extractItems(response: GenresApiResponse | GenreApiDto[]): GenreApiDto[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.items)) {
      return response.items;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.results)) {
      return response.results;
    }

    return [];
  }

  private extractTotal(response: GenresApiResponse | GenreApiDto[], fallback: number): number {
    if (Array.isArray(response)) {
      return response.length;
    }

    if (typeof response.totalCount === 'number') {
      return response.totalCount;
    }

    if (typeof response.total === 'number') {
      return response.total;
    }

    if (typeof response.count === 'number') {
      return response.count;
    }

    return fallback;
  }

  private mapGenre(dto: GenreApiDto, index: number): Genre {
    const numericId = typeof dto.genreId === 'number' ? dto.genreId : null;

    return {
      id:
        dto.id ??
        (numericId !== null
          ? `GEN-${String(numericId).padStart(3, '0')}`
          : `GEN-${String(index + 1).padStart(3, '0')}`),
      name: dto.genreName ?? dto.name ?? 'Untitled Genre',
      moviesCount: dto.moviesCount ?? dto.movieCount ?? dto.totalMovies ?? 0,
      createdAt: dto.createdAt ?? dto.created_at ?? '',
    };
  }

  private generateNextId(): string {
    const max = MOCK_GENRES.reduce((acc, item) => {
      const num = Number(item.id.replace('GEN-', ''));
      return Number.isNaN(num) ? acc : Math.max(acc, num);
    }, 0);

    return `GEN-${String(max + 1).padStart(3, '0')}`;
  }

  private findInMock(id: string): Genre | null {
    return MOCK_GENRES.find((item) => item.id === id) ?? null;
  }

  private toMs(value: string): number {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }
}
