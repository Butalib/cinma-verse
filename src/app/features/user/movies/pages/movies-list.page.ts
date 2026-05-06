import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';
import { MovieDto, MoviesService } from '../data-access/movies.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, SectionCardComponent],
  templateUrl: './movies-list.page.html',
  styleUrl: './movies-list.page.scss'
})
export class MoviesListPage implements OnInit {
  movies$!: Observable<MovieDto[]>;

  constructor(private readonly moviesService: MoviesService) {}

  ngOnInit(): void {
    this.movies$ = this.moviesService.getMovies();
  }
}
