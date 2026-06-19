import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { ApiClientService } from '../../../../../../core/http/api-client.service';
import { AdminGenreDto, AdminPagedResponse } from '../../../../admin-api.models';
import { CastMember, MovieRow } from '../movies-management/movies-table/movies-table.component';

interface GenreOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-add-movie-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-movie-modal.component.html',
  styleUrl: './add-movie-modal.component.scss',
})
export class AddMovieModalComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiClientService);

  readonly closeModal = output<void>();
  readonly addMovie = output<MovieRow>();

  readonly genres = signal<GenreOption[]>([]);
  readonly isGenreMenuOpen = signal(false);
  readonly isUploadingPoster = signal(false);
  readonly isUploadingImages = signal(false);
  readonly uploadingCastImageIndex = signal<number | null>(null);

  readonly selectedGenreNames = computed(() => {
    const selectedIds = this.movieForm.controls.genreIds.value ?? [];
    const names = this.genres()
      .filter((genre) => selectedIds.includes(genre.id))
      .map((genre) => genre.name);

    if (names.length === 0) {
      return 'Select genres';
    }

    if (names.length <= 2) {
      return names.join(', ');
    }

    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  });

  readonly movieForm = this.fb.group({
    title: this.fb.control(''),
    ageRating: this.fb.control('PG-13'),
    duration: this.fb.control(0),
    internalRating: this.fb.control(0),
    language: this.fb.control('English'),
    status: this.fb.control<MovieRow['status']>('ACTIVE'),
    releaseDate: this.fb.control(''),
    trailerUrl: this.fb.control(''),
    description: this.fb.control(''),
    genreIds: this.fb.control<number[]>([]),
    moviePoster: this.fb.control(''),
    imageUrls: this.fb.control<string[]>([]),
    castMembers: this.fb.array([]),
  });

  ngOnInit(): void {
    this.loadGenres();
  }

  get castMembersFormArray(): FormArray {
    return this.movieForm.controls.castMembers;
  }

  addCastMember(): void {
    const group = this.fb.group({
      personName: this.fb.control(''),
      imageUrl: this.fb.control(''),
      roleType: this.fb.control('Actor'),
      characterName: this.fb.control(''),
      displayOrder: this.fb.control(this.castMembersFormArray.length),
      isLead: this.fb.control(false),
    });
    this.castMembersFormArray.push(group);
  }

  removeCastMember(index: number): void {
    this.castMembersFormArray.removeAt(index);
    this.castMembersFormArray.controls.forEach((ctrl, i) => {
      ctrl.get('displayOrder')?.setValue(i);
    });
  }

  toggleGenreMenu(): void {
    this.isGenreMenuOpen.update((value) => !value);
  }

  closeGenreMenu(): void {
    this.isGenreMenuOpen.set(false);
  }

  getGenreName(id: number): string {
    return this.genres().find((g) => g.id === id)?.name || '';
  }

  isGenreSelected(genreId: number): boolean {
    return (this.movieForm.controls.genreIds.value ?? []).includes(genreId);
  }

  toggleGenreSelection(genreId: number): void {
    const current = this.movieForm.controls.genreIds.value ?? [];
    const next = current.includes(genreId)
      ? current.filter((id) => id !== genreId)
      : [...current, genreId];

    this.movieForm.controls.genreIds.setValue(next);
  }

  onPosterSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingPoster.set(true);
    this.uploadFile(file).subscribe({
      next: (url: string) => {
        this.movieForm.patchValue({ moviePoster: url });
        this.isUploadingPoster.set(false);
      },
      error: () => {
        this.isUploadingPoster.set(false);
      },
    });
    input.value = '';
  }

  onGalleryFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    console.log('selected files', files);
    if (!files.length) return;

    this.isUploadingImages.set(true);
    console.log('starting upload');
    const uploads = files.map((file) => this.uploadFile(file));

    forkJoin(uploads).subscribe({
      next: (urls: string[]) => {
        console.log('uploaded urls', urls);
        const current = this.movieForm.controls.imageUrls.value ?? [];
        console.log('current imageUrls', current);
        const merged = [...current, ...urls];
        console.log('merged imageUrls', merged);
        this.movieForm.patchValue({ imageUrls: merged });
        console.log('form imageUrls after patch', this.movieForm.get('imageUrls')?.value);
        this.isUploadingImages.set(false);
      },
      error: () => {
        this.isUploadingImages.set(false);
      },
    });
    input.value = '';
  }

  removeImage(index: number): void {
    const current = this.movieForm.controls.imageUrls.value ?? [];
    this.movieForm.patchValue({
      imageUrls: current.filter((_, i) => i !== index),
    });
  }

  onCastImageSelected(event: Event, castIndex: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingCastImageIndex.set(castIndex);
    this.uploadFile(file).subscribe({
      next: (url: string) => {
        this.castMembersFormArray.at(castIndex).get('imageUrl')?.setValue(url);
        this.uploadingCastImageIndex.set(null);
      },
      error: () => {
        this.uploadingCastImageIndex.set(null);
      },
    });
    input.value = '';
  }

  onSubmit(): void {
    const formValue = this.movieForm.getRawValue();
    console.log('Form raw value:', formValue);

    console.log('submit imageUrls', this.movieForm.value.imageUrls);

    const now = new Date();

    const selectedGenreIds = (formValue.genreIds ?? [])
      .map((genreId) => Number(genreId))
      .filter((genreId) => Number.isFinite(genreId));

    const selectedGenres = this.genres()
      .filter((genre) => selectedGenreIds.includes(genre.id))
      .map((genre) => genre.name);

    const castMembersPayload: CastMember[] = ((formValue.castMembers ?? []) as CastMember[]).map(
      (member, index) => ({
        personName: member.personName || '',
        imageUrl: member.imageUrl || '',
        roleType: member.roleType || 'Actor',
        characterName: member.characterName || '',
        displayOrder: index,
        isLead: member.isLead ?? false,
      }),
    );

    const movie: MovieRow = {
      id: `MOV-${now.getTime()}`,
      title: formValue.title.trim() || 'Untitled',
      genres: selectedGenres,
      genreIds: selectedGenreIds,
      ageRating: formValue.ageRating || 'PG',
      duration: Number(formValue.duration) || 0,
      language: formValue.language || 'English',
      status: (formValue.status || 'ACTIVE') as MovieRow['status'],
      releaseDate: formValue.releaseDate || now.toISOString().slice(0, 10),
      internalRating: Number(formValue.internalRating) || 0,
      trailerUrl: formValue.trailerUrl || '',
      posterUrl: formValue.moviePoster || '',
      description: formValue.description || '',
      cast: castMembersPayload.map((m) => m.personName).filter(Boolean),
      imageUrls: this.movieForm.value.imageUrls ?? [],
      castMembers: castMembersPayload,
    };

    const safeMinutes = Math.max(1, Number.isFinite(movie.duration) ? Math.round(movie.duration) : 1);
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    const durationStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

    console.log('Movie payload:', {
      movieName: movie.title,
      movieDescription: movie.description,
      movieDuration: durationStr,
      releaseDate: movie.releaseDate,
      castMembers: movie.castMembers,
      movieAgeRating: movie.ageRating,
      movieRating: movie.internalRating,
      trailerUrl: movie.trailerUrl,
      moviePoster: movie.posterUrl,
      genreIds: movie.genreIds,
      imageUrls: movie.imageUrls,
      language: movie.language,
      status: movie.status,
    });

    this.addMovie.emit(movie);
  }

  private uploadFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    console.log('file', formData.get('file'));
    console.log('name', file.name);
    console.log('type', file.type);
    console.log('size', file.size);

    return this.api
      .upload<Record<string, unknown>>(
        '/api/admin/media/upload',
        formData,
      )
      .pipe(
        map((response) => {
          console.log('upload response', response);
          console.log('response type', typeof response);
          console.log('response keys', Object.keys(response ?? {}));

          const url = (response as any)?.url
            ?? (response as any)?.imageUrl
            ?? (response as any)?.path
            ?? (response as any)?.data?.url
            ?? (response as any)?.fileUrl
            ?? (response as any)?.mediaUrl
            ?? (typeof response === 'string' ? response : '');

          console.log('extracted url', url);
          return url;
        }),
        catchError((error) => {
          console.error('Upload failed', error);
          if (error instanceof HttpErrorResponse) {
            console.error('status', error.status);
            console.error('body', error.error);
            console.error('headers', error.headers);
          }
          return throwError(() => error);
        }),
      );
  }

  private loadGenres(): void {
    this.api
      .get<AdminPagedResponse<AdminGenreDto> | AdminGenreDto[]>('/api/admin/genres')
      .pipe(
        map((response) =>
          Array.isArray(response)
            ? response
            : (response.items ?? response.data ?? response.results ?? []),
        ),
        map((items) =>
          items
            .map((item) => ({
              id: Number(item.genreId),
              name: (item.genreName ?? '').trim(),
            }))
            .filter((item) => Number.isFinite(item.id) && item.name.length > 0),
        ),
        catchError(() => of([] as GenreOption[])),
      )
      .subscribe((items) => {
        this.genres.set(items);
      });
  }
}
