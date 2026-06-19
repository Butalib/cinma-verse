import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
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
  selector: 'app-edit-movie-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-movie-modal.component.html',
  styleUrl: './edit-movie-modal.component.scss',
})
export class EditMovieModalComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ApiClientService);

  readonly movie = input.required<MovieRow>();
  readonly closeModal = output<void>();
  readonly saveChanges = output<MovieRow>();

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
    this.initializeForm();
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

    const updated: MovieRow = {
      ...this.movie(),
      title: formValue.title.trim() || this.movie().title,
      genres: selectedGenres,
      genreIds: selectedGenreIds,
      ageRating: formValue.ageRating || this.movie().ageRating,
      duration: Number(formValue.duration) || this.movie().duration,
      language: formValue.language || this.movie().language,
      status: (formValue.status || this.movie().status) as MovieRow['status'],
      releaseDate: formValue.releaseDate || this.movie().releaseDate,
      internalRating: Number(formValue.internalRating) || this.movie().internalRating,
      trailerUrl: formValue.trailerUrl || this.movie().trailerUrl,
      posterUrl: formValue.moviePoster || this.movie().posterUrl,
      description: formValue.description || this.movie().description,
      cast: castMembersPayload.map((m) => m.personName).filter(Boolean),
      imageUrls: this.movieForm.value.imageUrls ?? [],
      castMembers: castMembersPayload,
    };

    const safeMinutes = Math.max(1, Number.isFinite(updated.duration) ? Math.round(updated.duration) : 1);
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    const durationStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

    console.log('Movie payload:', {
      movieName: updated.title,
      movieDescription: updated.description,
      movieDuration: durationStr,
      releaseDate: updated.releaseDate,
      castMembers: updated.castMembers,
      movieAgeRating: updated.ageRating,
      movieRating: updated.internalRating,
      trailerUrl: updated.trailerUrl,
      moviePoster: updated.posterUrl,
      genreIds: updated.genreIds,
      imageUrls: updated.imageUrls,
      language: updated.language,
      status: updated.status,
    });

    this.saveChanges.emit(updated);
  }

  private initializeForm(): void {
    const movie = this.movie();

    this.movieForm.patchValue({
      title: movie.title,
      ageRating: movie.ageRating,
      duration: movie.duration,
      internalRating: movie.internalRating,
      language: movie.language,
      status: movie.status,
      releaseDate: movie.releaseDate,
      trailerUrl: movie.trailerUrl,
      description: movie.description,
      genreIds: movie.genreIds ?? [],
      moviePoster: movie.posterUrl || '',
      imageUrls: movie.imageUrls ?? [],
    });

    const castMembers = movie.castMembers?.length
      ? movie.castMembers
      : movie.cast.map((name, index) => ({
          personName: name,
          imageUrl: '',
          roleType: 'Actor',
          characterName: '',
          displayOrder: index,
          isLead: index === 0,
        }));

    castMembers.forEach((member) => {
      this.castMembersFormArray.push(
        this.fb.group({
          personName: this.fb.control(member.personName || ''),
          imageUrl: this.fb.control(member.imageUrl || ''),
          roleType: this.fb.control(member.roleType || 'Actor'),
          characterName: this.fb.control(member.characterName || ''),
          displayOrder: this.fb.control(member.displayOrder ?? 0),
          isLead: this.fb.control(member.isLead ?? false),
        }),
      );
    });
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

        const movie = this.movie();
        const existingGenreIds = this.movieForm.controls.genreIds.value ?? [];
        if (existingGenreIds.length > 0) {
          return;
        }

        if (!movie.genres.length) {
          return;
        }

        const idsFromNames = items
          .filter((genre: GenreOption) => movie.genres.includes(genre.name))
          .map((genre: GenreOption) => genre.id);

        this.movieForm.controls.genreIds.setValue(idsFromNames);
      });
  }
}
