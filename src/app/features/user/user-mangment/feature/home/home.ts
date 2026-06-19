import { Component } from '@angular/core';
import { HeroBannerComponent } from './hero/hero';
import { NowShowingComponent } from './nowShowing/now-showing/now-showing';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroBannerComponent, NowShowingComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
