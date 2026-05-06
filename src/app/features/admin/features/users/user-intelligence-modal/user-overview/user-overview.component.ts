import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MOCK_USER_OVERVIEW,
  type UserOverview,
  type UserOverviewActiveDetail,
  type UserOverviewStatCardKind,
} from './user-overview.model';
import { UserOverviewHeaderComponent } from '../user-overview-header/user-overview-header.component';
import {
  AccountStatusDetailComponent,
  EmailConfirmedDetailComponent,
  RoleDetailComponent,
  UserIdDetailComponent,
} from '../user-detail-views/user-detail-views';
import {
  UserAccountInfoComponent,
  UserBasicInfoComponent,
  UserPersonalInfoComponent,
} from '../user-info-sections/user-info-sections';

@Component({
  selector: 'app-user-overview',
  standalone: true,
  imports: [
    CommonModule,
    UserOverviewHeaderComponent,
    UserIdDetailComponent,
    AccountStatusDetailComponent,
    RoleDetailComponent,
    EmailConfirmedDetailComponent,
    UserBasicInfoComponent,
    UserPersonalInfoComponent,
    UserAccountInfoComponent,
  ],
  templateUrl: './user-overview.component.html',
  styleUrl: './user-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserOverviewComponent {
  readonly overview = input<UserOverview>(MOCK_USER_OVERVIEW);

  readonly activeDetail = signal<UserOverviewActiveDetail>('none');

  constructor() {
    effect(() => {
      this.overview().id;
      this.activeDetail.set('none');
    });
  }

  onStatCardClick(kind: UserOverviewStatCardKind): void {
    if (this.activeDetail() === kind) {
      this.activeDetail.set('none');
    } else {
      this.activeDetail.set(kind);
    }
  }
}
