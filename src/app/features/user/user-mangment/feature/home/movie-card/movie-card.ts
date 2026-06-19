import { Component, Input } from '@angular/core';
import { IMovie } from '../../../../user-core/user-services/user-movie/movie-interface';
import { API_BASE_URL } from '../../../../../../core/config/api.config';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.css'
})
export class MovieCardComponent {
  @Input({ required: true }) movie!: IMovie;

  resolvePosterUrl(posterUrl: string): string {
    if (posterUrl.startsWith('http://') || posterUrl.startsWith('https://')) {
      return posterUrl;
    }
    return `${API_BASE_URL}${posterUrl}`;
  }
}
