import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { CurrentUser } from '../../../../core/auth/auth.models';
import { SectionCardComponent } from '../../../../shared/ui/section-card.component';

@Component({
  standalone: true,
  imports: [CommonModule, SectionCardComponent],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss'
})
export class ProfilePage implements OnInit {
  me$!: Observable<CurrentUser | null>;

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.me$ = this.authService.currentUser$;
  }
}
