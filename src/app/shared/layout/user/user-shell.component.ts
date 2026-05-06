import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './user-shell.component.html',
  styleUrl: './user-shell.component.scss'
})
export class UserShellComponent {}
