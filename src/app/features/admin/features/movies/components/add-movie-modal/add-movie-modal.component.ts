import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { MovieRow } from '../movies-management/movies-table/movies-table.component';

@Component({
  selector: 'app-add-movie-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-movie-modal.component.html',
  styleUrl: './add-movie-modal.component.scss',
})
export class AddMovieModalComponent {
  readonly closeModal = output<void>();
  readonly addMovie   = output<MovieRow>();

  // Genre tags
  readonly genres     = signal<string[]>([]);
  readonly genreInput = signal('');

  // Cast tags
  readonly castMembers = signal<string[]>([]);
  readonly castInput   = signal('');

  addGenre(): void {
    const v = this.genreInput().trim().replace(/,$/, '');
    if (v && !this.genres().includes(v)) {
      this.genres.update(arr => [...arr, v]);
    }
    this.genreInput.set('');
  }

  removeGenre(genre: string): void {
    this.genres.update(arr => arr.filter(g => g !== genre));
  }

  addCast(): void {
    const v = this.castInput().trim().replace(/,$/, '');
    if (v && !this.castMembers().includes(v)) {
      this.castMembers.update(arr => [...arr, v]);
    }
    this.castInput.set('');
  }

  removeCast(member: string): void {
    this.castMembers.update(arr => arr.filter(m => m !== member));
  }

  onSubmit(form: HTMLFormElement): void {
    const data = new FormData(form);
    const now  = new Date();

    const movie: MovieRow = {
      id:             `MOV-${now.getTime()}`,
      title:          (data.get('title') as string) || 'Untitled',
      genres:         this.genres(),
      ageRating:      (data.get('ageRating') as string) || 'PG',
      duration:       Number(data.get('duration')) || 0,
      language:       (data.get('language') as string) || 'English',
      status:         ((data.get('status') as string) || 'ACTIVE') as MovieRow['status'],
      releaseDate:    (data.get('releaseDate') as string) || now.toISOString().slice(0, 10),
      internalRating: Number(data.get('internalRating')) || 0,
      trailerUrl:     (data.get('trailerUrl') as string) || '',
      posterUrl:      '',
      description:    (data.get('description') as string) || '',
      cast:           this.castMembers(),
    };

    this.addMovie.emit(movie);
  }
}
