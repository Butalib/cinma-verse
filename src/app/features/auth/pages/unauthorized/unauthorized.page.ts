import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="unauthorized-page">
      <h1>Access denied</h1>
      <p>You do not have permission to access this page.</p>
      <a routerLink="/login">Back to login</a>
    </main>
  `,
  styles: [
    `
      .unauthorized-page {
        min-height: 100dvh;
        display: grid;
        place-content: center;
        gap: 0.75rem;
        text-align: center;
        padding: 1.5rem;
      }

      .unauthorized-page h1 {
        margin: 0;
      }

      .unauthorized-page p {
        margin: 0;
        opacity: 0.8;
      }
    `,
  ],
})
export class UnauthorizedPage {}
