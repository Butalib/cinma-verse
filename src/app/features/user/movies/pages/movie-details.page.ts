import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { Observable, filter, map, switchMap } from 'rxjs';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';
import { MovieDto, MoviesService } from '../data-access/movies.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, SectionCardComponent],
  templateUrl: './movie-details.page.html',
  styleUrl: './movie-details.page.scss'
})
export class MovieDetailsPage implements OnInit {
  movie$!: Observable<MovieDto>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly moviesService: MoviesService
  ) {}

  ngOnInit(): void {
    this.movie$ = this.route.paramMap.pipe(
      map((params: ParamMap) => params.get('id')),
      filter((id): id is string => !!id),
      switchMap((id: string) => this.moviesService.getMovieById(id))
    );
  }
}
