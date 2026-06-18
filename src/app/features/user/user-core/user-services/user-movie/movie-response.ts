import { IMovie } from './movie-interface';

export interface IMoviesResponse {
  movies: IMovie[];
  page: number;
  totalCount: number;
  pageSize: number;
  totalPages: number;
}
