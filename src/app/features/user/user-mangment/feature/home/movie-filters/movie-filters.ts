import { Component } from '@angular/core';

@Component({
  selector: 'app-movie-filters',
  standalone: true,
  imports: [],
  templateUrl: './movie-filters.html',
  styleUrl: './movie-filters.css'
})
export class MovieFiltersComponent {
  filters = ['All Formats', 'IMAX', 'Dolby Cinema'];
  activeFilter = 'All Formats';
}
