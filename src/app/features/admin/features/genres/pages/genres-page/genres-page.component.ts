import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination.component';
import { CreateGenreModalComponent } from '../../components/create-genre-modal/create-genre-modal.component';
import { GenresStatsComponent } from '../../components/stats/genres-stats.component';
import { GenresTableComponent } from '../../components/table/genres-table.component';
import { GenresToolbarComponent } from '../../components/toolbar/genres-toolbar.component';
import { GenresFacade } from '../../facade/genres.facade';
import type { CreateGenrePayload, GenreSortOption } from '../../models/genre.model';

@Component({
  selector: 'app-genres-page',
  imports: [
    GenresStatsComponent,
    GenresToolbarComponent,
    GenresTableComponent,
    PaginationComponent,
    CreateGenreModalComponent,
  ],
  templateUrl: './genres-page.component.html',
  styleUrl: './genres-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenresPageComponent {
  protected readonly facade = inject(GenresFacade);

  constructor() {
    this.facade.loadGenres();
  }

  onSearchChange(query: string): void {
    this.facade.setSearch(query);
  }

  onSortChange(sort: GenreSortOption): void {
    this.facade.setSort(sort);
  }

  onPageChange(page: number): void {
    this.facade.setPage(page);
  }

  onPageSizeChange(pageSize: number): void {
    this.facade.setPageSize(pageSize);
  }

  openCreateModal(): void {
    this.facade.openCreateModal();
  }

  closeCreateModal(): void {
    this.facade.closeCreateModal();
  }

  onCreateGenre(payload: CreateGenrePayload): void {
    this.facade.createGenre(payload);
  }

  onViewGenre(id: string): void {
    this.facade.openViewModal(id);
  }

  closeViewGenre(): void {
    this.facade.closeViewModal();
  }

  onEditGenre(id: string): void {
    this.facade.openEditModal(id);
  }

  closeEditGenre(): void {
    this.facade.closeEditModal();
  }

  onUpdateGenre(payload: CreateGenrePayload): void {
    const selected = this.facade.selectedGenre();
    if (!selected) {
      return;
    }

    this.facade.updateGenre(selected.id, { name: payload.name });
  }

  onDeleteGenre(id: string): void {
    this.facade.deleteGenre(id);
  }
}
