import { Component } from '@angular/core';
import { HeroBannerComponent } from './hero/hero';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroBannerComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
