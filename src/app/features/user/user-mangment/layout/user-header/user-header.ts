import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-header',
  imports: [RouterLink],
  templateUrl: './user-header.html',
  styleUrl: './user-header.scss',
})
export class UserHeader {}
