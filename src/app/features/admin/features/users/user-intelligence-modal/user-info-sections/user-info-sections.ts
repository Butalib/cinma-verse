import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { UserOverview } from '../user-overview/user-overview.model';

@Component({
  selector: 'app-user-basic-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="info-card">
      <header class="info-card__head">
        <span class="info-card__icon" aria-hidden="true">👤</span>
        <h3 class="info-card__title">Basic Info</h3>
      </header>
      @let b = data();
      <div class="info-card__grid">
        <div>
          <span class="info-card__label">First name</span>
          <span class="info-card__value">{{ b.firstName }}</span>
        </div>
        <div>
          <span class="info-card__label">Last name</span>
          <span class="info-card__value">{{ b.lastName }}</span>
        </div>
        <div class="info-card__item--full">
          <span class="info-card__label">Email</span>
          <span class="info-card__value">{{ b.email }}</span>
        </div>
        <div class="info-card__item--full">
          <span class="info-card__label">Phone</span>
          <span class="info-card__value">{{ b.phone }}</span>
        </div>
      </div>
    </article>
  `,
  styleUrl: './user-info-sections.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserBasicInfoComponent {
  readonly data = input.required<UserOverview['basicInfo']>();
}

@Component({
  selector: 'app-user-personal-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="info-card">
      <header class="info-card__head">
        <span class="info-card__icon" aria-hidden="true">🏠</span>
        <h3 class="info-card__title">Personal Info</h3>
      </header>
      @let p = data();
      <div class="info-card__grid">
        <div class="info-card__item--full">
          <span class="info-card__label">Address</span>
          <span class="info-card__value">{{ p.address }}</span>
        </div>
        <div>
          <span class="info-card__label">City</span>
          <span class="info-card__value">{{ p.city }}</span>
        </div>
        <div>
          <span class="info-card__label">Date of birth</span>
          <span class="info-card__value">{{ p.dateOfBirth }}</span>
        </div>
        <div>
          <span class="info-card__label">Gender</span>
          <span class="info-card__value">{{ p.gender }}</span>
        </div>
      </div>
    </article>
  `,
  styleUrl: './user-info-sections.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPersonalInfoComponent {
  readonly data = input.required<UserOverview['personalInfo']>();
}

@Component({
  selector: 'app-user-account-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="info-card">
      <header class="info-card__head">
        <span class="info-card__icon" aria-hidden="true">⚙️</span>
        <h3 class="info-card__title">Account Info</h3>
      </header>
      @let a = data();
      <div class="info-card__grid info-card__grid--account">
        <div>
          <span class="info-card__label">Role</span>
          <span class="info-card__value info-card__value--cyan">{{ a.role }}</span>
        </div>
        <div>
          <span class="info-card__label">Status</span>
          <span class="info-card__value info-card__value--green">{{ a.status }}</span>
        </div>
        <div>
          <span class="info-card__label">Email confirmed</span>
          <span class="info-card__value">{{ a.emailConfirmed }}</span>
        </div>
        <div>
          <span class="info-card__label">Created at</span>
          <span class="info-card__value">{{ a.createdAt }}</span>
        </div>
      </div>
    </article>
  `,
  styleUrl: './user-info-sections.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAccountInfoComponent {
  readonly data = input.required<UserOverview['accountInfo']>();
}
