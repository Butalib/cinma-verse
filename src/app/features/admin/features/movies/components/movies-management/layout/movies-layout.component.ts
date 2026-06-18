import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { MoviesService } from '../services/movies.service';
import { MovieRow, MoviesTableComponent } from '../movies-table/movies-table.component';
import { MoviesKpiComponent } from '../../movies-kpi/movies-kpi.component';
import { MoviesSearchToolbarComponent } from '../movies-search-toolbar/movies-search-toolbar.component';
import { PaginationComponent } from '../../../../users/users-managemen/componants/pagination/pagination.component';
import { AddMovieModalComponent } from '../../add-movie-modal/add-movie-modal.component';
import { EditMovieModalComponent } from '../../edit-movie-modal/edit-movie-modal.component';
import { ViewMovieModalComponent } from '../../view-movie-modal/view-movie-modal.component';

@Component({
  selector: 'app-movies-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MoviesKpiComponent,
    MoviesSearchToolbarComponent,
    MoviesTableComponent,
    PaginationComponent,
    AddMovieModalComponent,
    EditMovieModalComponent,
    ViewMovieModalComponent,
  ],
  templateUrl: './movies-layout.component.html',
  styleUrl: './movies-layout.component.scss',
})
export class MoviesLayoutComponent {
  private readonly moviesService = inject(MoviesService);

  // قراءة البيانات من الـ Service مباشرة
  readonly allMovies = this.moviesService.getAllMovies();

  // فلاتر البحث
  readonly searchTerm = signal('');
  readonly genreFilter = signal('all');
  readonly statusFilter = signal('all');
  readonly ageFilter = signal('all');
  readonly langFilter = signal('all');
  readonly sortField = signal('release');
  readonly sortDir = signal('desc');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  // الصفحات
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  // حالات فتح وإغلاق النوافذ المنبثقة
  readonly isAddMovieOpen = signal(false);
  readonly isEditMovieOpen = signal(false);
  readonly isViewMovieOpen = signal(false);
  readonly selectedMovie = signal<MovieRow | null>(null);

  // حسابات الـ KPIs
  readonly totalMoviesKpi = computed(() => this.allMovies().length);
  readonly nowShowingMoviesKpi = computed(
    () => this.allMovies().filter((m) => m.status === 'ACTIVE').length,
  );
  readonly comingSoonMoviesKpi = computed(
    () => this.allMovies().filter((m) => m.status === 'COMING_SOON').length,
  );
  readonly avgRatingKpi = computed(() => {
    const ratedMovies = this.allMovies().filter((m) => m.internalRating > 0);
    if (ratedMovies.length === 0) return 0;
    const totalRating = ratedMovies.reduce((sum, m) => sum + m.internalRating, 0);
    return totalRating / ratedMovies.length;
  });

  // لوجيك فلترة وترتيب البيانات
  readonly filteredMovies = computed(() => {
    let items = this.allMovies();
    const s = this.searchTerm().toLowerCase().trim();
    if (s)
      items = items.filter(
        (m) => m.title.toLowerCase().includes(s) || m.id.toLowerCase().includes(s),
      );
    const status = this.statusFilter();
    if (status !== 'all')
      items = items.filter((m) => m.status.toLowerCase() === status.toLowerCase());
    const genre = this.genreFilter();
    if (genre !== 'all')
      items = items.filter((m) =>
        m.genres.map((g) => g.toLowerCase()).includes(genre.toLowerCase()),
      );
    const age = this.ageFilter();
    if (age !== 'all') items = items.filter((m) => m.ageRating === age);
    const lang = this.langFilter();
    if (lang !== 'all')
      items = items.filter((m) => m.language.toLowerCase() === lang.toLowerCase());
    const from = this.dateFrom();
    if (from) items = items.filter((m) => m.releaseDate >= from);
    const to = this.dateTo();
    if (to) items = items.filter((m) => m.releaseDate <= to);
    const field = this.sortField();
    const dir = this.sortDir();
    return [...items].sort((a, b) => {
      let cmp = 0;
      if (field === 'release') cmp = a.releaseDate.localeCompare(b.releaseDate);
      else if (field === 'title') cmp = a.title.localeCompare(b.title);
      else if (field === 'rating') cmp = a.internalRating - b.internalRating;
      else if (field === 'duration') cmp = a.duration - b.duration;
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  readonly pagedMovies = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredMovies().slice(start, start + this.pageSize());
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredMovies().length / this.pageSize())),
  );
  readonly showingFrom = computed(() =>
    this.filteredMovies().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1,
  );
  readonly showingTo = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.filteredMovies().length),
  );

  constructor() {
    effect(() => {
      this.searchTerm();
      this.statusFilter();
      this.genreFilter();
      this.ageFilter();
      this.langFilter();
      this.dateFrom();
      this.dateTo();
      this.sortField();
      this.sortDir();
      untracked(() => this.currentPage.set(1));
    });
  }

  onPageChange(p: number): void {
    this.currentPage.set(p);
  }
  onPageSizeChange(p: number): void {
    this.pageSize.set(p);
    this.currentPage.set(1);
  }

  openAddMovie(): void {
    this.isAddMovieOpen.set(true);
  }
  closeAddMovie(): void {
    this.isAddMovieOpen.set(false);
  }
  onMovieAdded(m: MovieRow): void {
    this.moviesService.addMovie(m);
    this.currentPage.set(1);
    this.isAddMovieOpen.set(false);
  }

  viewMovie(m: MovieRow): void {
    this.moviesService.getMovieByIdFromApi(m.id).subscribe({
      next: (movie) => {
        this.selectedMovie.set(movie ?? m);
        this.isViewMovieOpen.set(true);
      },
      error: () => {
        this.selectedMovie.set(m);
        this.isViewMovieOpen.set(true);
      },
    });
  }
  closeViewMovie(): void {
    this.isViewMovieOpen.set(false);
    this.selectedMovie.set(null);
  }

  editMovie(m: MovieRow): void {
    this.moviesService.getMovieByIdFromApi(m.id).subscribe({
      next: (movie) => {
        this.selectedMovie.set(movie ?? m);
        this.isEditMovieOpen.set(true);
      },
      error: () => {
        this.selectedMovie.set(m);
        this.isEditMovieOpen.set(true);
      },
    });
  }
  closeEditMovie(): void {
    this.isEditMovieOpen.set(false);
    this.selectedMovie.set(null);
  }
  onMovieUpdated(u: MovieRow): void {
    this.moviesService.updateMovie(u);
    this.isEditMovieOpen.set(false);
    this.selectedMovie.set(null);
  }

  deleteMovie(id: string): void {
    this.moviesService.deleteMovie(id);
    if (this.currentPage() > this.totalPages()) this.currentPage.set(this.totalPages());
  }

  formatDuration(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  getStatusClass(s: string): string {
    return s === 'ACTIVE'
      ? 'badge badge-active'
      : s === 'COMING_SOON'
        ? 'badge badge-coming-soon'
        : 'badge badge-inactive';
  }
  getStatusLabel(s: string): string {
    return s === 'ACTIVE' ? 'Active' : s === 'COMING_SOON' ? 'Coming Soon' : 'Inactive';
  }
}
