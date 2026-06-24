import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { ApiClientService } from '../../../../../core/http/api-client.service';
import { API_BASE_URL } from '../../../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class MovieMediaService {
  private readonly api = inject(ApiClientService);

  upload(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.api.upload<Record<string, unknown>>('/api/admin/media/upload', formData).pipe(
      map((response) => {
        console.log('upload response', response);
        console.log('response type', typeof response);

        if (response && typeof response === 'object') {
          console.log('response keys', Object.keys(response));
        }

        const rawUrl = this.extractUrl(response);
        const absoluteUrl = this.toAbsoluteUrl(rawUrl);
        console.log('extracted url', rawUrl);
        console.log('absolute url', absoluteUrl);
        return absoluteUrl;
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

  uploadMany(files: File[]): Observable<string[]> {
    if (!files.length) {
      return of([]);
    }

    const uploads = files.map((file) => this.upload(file));

    return forkJoin(uploads).pipe(
      map((urls) => urls.filter((url): url is string => Boolean(url))),
    );
  }

  private extractUrl(response: Record<string, unknown>): string {
    const url =
      (response as any)?.url ??
      (response as any)?.imageUrl ??
      (response as any)?.path ??
      (response as any)?.data?.url ??
      (response as any)?.fileUrl ??
      (response as any)?.mediaUrl ??
      (response as any)?.publicUrl ??
      (response as any)?.src ??
      (typeof response === 'string' ? response : '');

    return typeof url === 'string' ? url : '';
  }

  toAbsoluteUrl(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    const lower = trimmed.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      return trimmed;
    }

    if (lower.startsWith('data:') || lower.startsWith('blob:')) {
      return trimmed;
    }

    const normalized = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
    return `${API_BASE_URL}${normalized}`;
  }
}
