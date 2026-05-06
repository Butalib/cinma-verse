import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MovieRow } from '../movies-management/movies-table/movies-table.component';

@Component({
  selector: 'app-edit-movie-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-movie-modal.component.html',
  styleUrl: './edit-movie-modal.component.scss',
})
export class EditMovieModalComponent {
  readonly movie       = input.required<MovieRow>();
  readonly closeModal  = output<void>();
  readonly saveChanges = output<MovieRow>();

  // Genre tags — initialized from movie input via getter
  readonly genres     = signal<string[]>([]);
  readonly genreInput = signal('');

  // Cast tags
  readonly castMembers = signal<string[]>([]);
  readonly castInput   = signal('');

  private _initialized = false;

  /** Lazily init tag signals from input on first read */
  private ensureInit(): void {
    if (this._initialized) return;
    this._initialized = true;
    this.genres.set([...this.movie().genres]);
    this.castMembers.set([...this.movie().cast]);
  }

  getGenres(): string[]     { this.ensureInit(); return this.genres(); }
  getCastMembers(): string[] { this.ensureInit(); return this.castMembers(); }

  addGenre(): void {
    const v = this.genreInput().trim().replace(/,$/, '');
    if (v && !this.genres().includes(v)) this.genres.update(arr => [...arr, v]);
    this.genreInput.set('');
  }

  removeGenre(genre: string): void {
    this.genres.update(arr => arr.filter(g => g !== genre));
  }

  addCast(): void {
    const v = this.castInput().trim().replace(/,$/, '');
    if (v && !this.castMembers().includes(v)) this.castMembers.update(arr => [...arr, v]);
    this.castInput.set('');
  }

  removeCast(member: string): void {
    this.castMembers.update(arr => arr.filter(m => m !== member));
  }

  onSubmit(form: HTMLFormElement): void {
    const data = new FormData(form);
    const updated: MovieRow = {
      ...this.movie(),
      title:          (data.get('title') as string) || this.movie().title,
      genres:         this.genres(),
      ageRating:      (data.get('ageRating') as string) || this.movie().ageRating,
      duration:       Number(data.get('duration')) || this.movie().duration,
      language:       (data.get('language') as string) || this.movie().language,
      status:         ((data.get('status') as string) || this.movie().status) as MovieRow['status'],
      releaseDate:    (data.get('releaseDate') as string) || this.movie().releaseDate,
      internalRating: Number(data.get('internalRating')) || this.movie().internalRating,
      trailerUrl:     (data.get('trailerUrl') as string) || this.movie().trailerUrl,
      description:    (data.get('description') as string) || this.movie().description,
      cast:           this.castMembers(),
    };
    this.saveChanges.emit(updated);
  }
}
