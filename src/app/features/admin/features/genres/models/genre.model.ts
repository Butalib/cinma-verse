export type GenreSortOption = 'name_asc' | 'name_desc';

export interface Genre {
  id: string;
  name: string;
  moviesCount: number;
  createdAt: string;
}

export interface CreateGenrePayload {
  name: string;
}

export interface UpdateGenrePayload {
  name: string;
}

export interface GenresState {
  list: Genre[];
  loading: boolean;
  error: string | null;

  filters: {
    search: string;
    sort: GenreSortOption;
  };

  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface GenreStats {
  totalGenres: number;
  mostPopular: Genre | null;
  recentlyAdded: Genre | null;
}
