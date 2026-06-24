import { Injectable } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { CastMember, MovieRow, MovieStatus } from '../components/movies-management/movies-table/movies-table.component';

export interface MovieFormValue {
  title: string;
  ageRating: string;
  duration: number;
  internalRating: number;
  language: string;
  status: MovieStatus;
  releaseDate: string;
  trailerUrl: string;
  description: string;
  genreIds: number[];
  moviePoster: string;
  imageUrls: string[];
  castMembers: Array<{
    personName: string;
    imageUrl: string;
    roleType: string;
    characterName: string;
    displayOrder: number;
    isLead: boolean;
  }>;
}

@Injectable({ providedIn: 'root' })
export class MoviePayloadMapper {
  toCreatePayload(formValue: MovieFormValue): Record<string, unknown> {
    const castMembers = this.mapCastMembers(formValue.castMembers);
    const imageUrls = this.filterValidUrls(formValue.imageUrls);
    const moviePoster = this.toAbsoluteUrl(formValue.moviePoster);
    const trailerUrl = this.toAbsoluteUrl(formValue.trailerUrl);

    return {
      movieName: formValue.title,
      movieDescription: formValue.description || 'No description provided.',
      movieDuration: this.toTimeSpanString(formValue.duration),
      releaseDate: formValue.releaseDate,
      castMembers,
      movieAgeRating: this.toApiAgeRating(formValue.ageRating),
      movieRating: formValue.internalRating,
      trailerUrl,
      moviePoster,
      genreIds: formValue.genreIds ?? [],
      imageUrls,
      language: formValue.language,
      status: this.toApiCreateStatus(formValue.status),
    };
  }

  toUpdatePayload(formValue: MovieFormValue, existing: MovieRow): Record<string, unknown> {
    const castMembers = this.mapCastMembers(formValue.castMembers);
    const imageUrls = this.filterValidUrls(formValue.imageUrls);
    const moviePoster = this.toAbsoluteUrl(formValue.moviePoster) || this.toAbsoluteUrl(existing.posterUrl);
    const trailerUrl = this.toAbsoluteUrl(formValue.trailerUrl) || this.toAbsoluteUrl(existing.trailerUrl);

    return {
      movieName: formValue.title || existing.title,
      movieDescription: formValue.description || existing.description,
      movieDuration: this.toTimeSpanString(formValue.duration),
      releaseDate: formValue.releaseDate || existing.releaseDate,
      castMembers,
      movieAgeRating: this.toApiAgeRating(formValue.ageRating),
      movieRating: formValue.internalRating,
      trailerUrl,
      moviePoster,
      genreIds: formValue.genreIds ?? existing.genreIds ?? [],
      imageUrls,
      language: formValue.language || existing.language,
      status: this.toApiUpdateStatus(formValue.status),
    };
  }

  toMovieRow(formValue: MovieFormValue, genreNames: string[], existing?: MovieRow): MovieRow {
    const castMembersPayload = this.mapCastToPayload(formValue.castMembers);

    return {
      id: existing?.id || `MOV-${Date.now()}`,
      title: formValue.title.trim() || existing?.title || 'Untitled',
      genres: genreNames,
      genreIds: formValue.genreIds ?? [],
      ageRating: formValue.ageRating || existing?.ageRating || 'PG',
      duration: Number(formValue.duration) || existing?.duration || 0,
      language: formValue.language || existing?.language || 'English',
      status: formValue.status || existing?.status || 'ACTIVE',
      releaseDate: formValue.releaseDate || existing?.releaseDate || new Date().toISOString().slice(0, 10),
      internalRating: Number(formValue.internalRating) || existing?.internalRating || 0,
      trailerUrl: formValue.trailerUrl || existing?.trailerUrl || '',
      posterUrl: formValue.moviePoster || existing?.posterUrl || '',
      description: formValue.description || existing?.description || '',
      cast: castMembersPayload.map((m) => m.personName).filter(Boolean),
      imageUrls: this.filterValidUrls(formValue.imageUrls),
      castMembers: castMembersPayload,
    };
  }

  patchFormFromMovie(form: FormGroup, movie: MovieRow): void {
    form.patchValue({
      title: movie.title,
      ageRating: movie.ageRating,
      duration: movie.duration,
      internalRating: movie.internalRating,
      language: movie.language,
      status: movie.status,
      releaseDate: movie.releaseDate,
      trailerUrl: movie.trailerUrl,
      description: movie.description,
      genreIds: movie['genreIds'] ?? [],
      moviePoster: movie.posterUrl || '',
      imageUrls: movie['imageUrls'] ?? [],
    });
  }

  buildCastGroup(fb: any, member: Partial<CastMember> = {}, index = 0): FormGroup {
    return fb.group({
      personName: fb.control(member.personName || ''),
      imageUrl: fb.control(member.imageUrl || ''),
      roleType: fb.control(member.roleType || 'Actor'),
      characterName: fb.control(member.characterName || ''),
      displayOrder: fb.control(member.displayOrder ?? index),
      isLead: fb.control(member.isLead ?? false),
    });
  }

  populateCastMembers(formArray: FormArray, fb: any, movie: MovieRow): void {
    const castMembers = movie.castMembers?.length
      ? movie.castMembers
      : movie.cast.map((name: string, index: number) => ({
          personName: name,
          imageUrl: '',
          roleType: 'Actor',
          characterName: '',
          displayOrder: index,
          isLead: index === 0,
        }));

    castMembers.forEach((member: Partial<CastMember>, index: number) => {
      formArray.push(this.buildCastGroup(fb, member, index));
    });
  }

  resolveGenreIdsFromNames(genreOptions: Array<{ id: number; name: string }>, genreNames: string[]): number[] {
    return genreOptions
      .filter((g) => genreNames.includes(g.name))
      .map((g) => g.id);
  }

  private mapCastMembers(castMembers: MovieFormValue['castMembers']): Array<Record<string, unknown>> {
    return castMembers.map((member, index) => ({
      personName: member.personName || '',
      imageUrl: this.toAbsoluteUrl(member.imageUrl) || '',
      roleType: member.roleType || 'Actor',
      characterName: member.characterName || '',
      displayOrder: member.displayOrder ?? index,
      isLead: member.isLead ?? false,
    }));
  }

  private mapCastToPayload(castMembers: MovieFormValue['castMembers']): CastMember[] {
    return castMembers.map((member, index) => ({
      personName: member.personName || '',
      imageUrl: member.imageUrl || '',
      roleType: member.roleType || 'Actor',
      characterName: member.characterName || '',
      displayOrder: member.displayOrder ?? index,
      isLead: member.isLead ?? false,
    }));
  }

  private filterValidUrls(urls: string[]): string[] {
    return (urls ?? []).filter((url): url is string => typeof url === 'string' && url.length > 0);
  }

  private toAbsoluteUrl(value: string): string | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    return trimmed;
  }

  private toTimeSpanString(totalMinutes: number): string {
    const safeMinutes = Math.max(1, Number.isFinite(totalMinutes) ? Math.round(totalMinutes) : 1);
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  }

  private toApiAgeRating(ageRating: string): string {
    const normalized = ageRating.toUpperCase().replace('-', '');
    if (normalized === 'PG13') return 'PG13';
    if (normalized === 'R') return 'R';
    if (normalized === 'NC17') return 'NC17';
    return normalized === 'G' ? 'G' : 'PG';
  }

  private toApiCreateStatus(status: MovieStatus): string {
    if (status === 'COMING_SOON') return 'ComingSoon';
    return 'Draft';
  }

  private toApiUpdateStatus(status: MovieStatus): string {
    if (status === 'COMING_SOON') return 'ComingSoon';
    if (status === 'INACTIVE') return 'Draft';
    return 'NowShowing';
  }
}
