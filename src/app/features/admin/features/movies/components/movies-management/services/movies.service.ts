import { Injectable, signal } from '@angular/core';
import { MovieRow } from '../movies-table/movies-table.component';

@Injectable({
  providedIn: 'root'
})
export class MoviesService {
  private readonly movies = signal<MovieRow[]>([]);

  constructor() {
    // يمكن تحميل البيانات من API هنا
    this.loadMockData();
  }

  private loadMockData(): void {
    const mockMovies: MovieRow[] = [
      { id: 'MOV-1001', title: 'Dune: Part Two', genres: ['Sci-Fi', 'Adventure'], ageRating: 'PG-13', duration: 166, language: 'English', status: 'ACTIVE', releaseDate: '2024-03-01', internalRating: 8.8, trailerUrl: 'https://youtube.com/watch?v=Way9Dexny3w', posterUrl: '', description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Josh Brolin'] },
      { id: 'MOV-1002', title: 'Oppenheimer', genres: ['Drama', 'History'], ageRating: 'R', duration: 180, language: 'English', status: 'ACTIVE', releaseDate: '2023-07-21', internalRating: 9.0, trailerUrl: 'https://youtube.com/watch?v=uYPbbksJxIg', posterUrl: '', description: 'The story of J. Robert Oppenheimer and the development of the atomic bomb.', cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'] },
      { id: 'MOV-1003', title: 'Inside Out 2', genres: ['Animation', 'Family'], ageRating: 'PG', duration: 100, language: 'English', status: 'ACTIVE', releaseDate: '2024-06-14', internalRating: 7.9, trailerUrl: '', posterUrl: '', description: "Riley's mind expands with new emotions as she faces the joys and challenges of teenage life.", cast: ['Amy Poehler', 'Maya Hawke', 'Kensington Tallman'] },
    ];
    this.movies.set(mockMovies);
  }

  getAllMovies() {
    return this.movies.asReadonly();
  }

  addMovie(movie: Omit<MovieRow, 'id'>): string {
    const newId = this.generateNextId();
    const newMovie: MovieRow = { ...movie, id: newId };
    this.movies.update(movies => [newMovie, ...movies]);
    return newId;
  }

  updateMovie(updatedMovie: MovieRow): void {
    this.movies.update(movies => 
      movies.map(movie => movie.id === updatedMovie.id ? updatedMovie : movie)
    );
  }

  deleteMovie(id: string): void {
    this.movies.update(movies => movies.filter(movie => movie.id !== id));
  }

  getMovieById(id: string): MovieRow | undefined {
    return this.movies().find(movie => movie.id === id);
  }

  private generateNextId(): string {
    const movies = this.movies();
    const max = movies.reduce((maxNum, movie) => {
      const n = Number(movie.id.replace('MOV-', ''));
      return isNaN(n) ? maxNum : Math.max(maxNum, n);
    }, 1000);
    return `MOV-${max + 1}`;
  }
}