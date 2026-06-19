export type UserOverviewStatCardKind = 'userId' | 'accountStatus' | 'role' | 'emailConfirmed';

export type UserOverviewActiveDetail = 'none' | UserOverviewStatCardKind;

export interface UserOverview {
  id: string;
  /** Shown in user-id detail panel (monospace). */
  internalSlug?: string;
  accountStatus: 'Active' | 'Suspended' | 'Pending';
  role: 'Admin' | 'User' | 'Moderator';
  emailConfirmed: boolean;
  basicInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  personalInfo: {
    address: string;
    city: string;
    dateOfBirth: string;
    gender: string;
  };
  accountInfo: {
    role: string;
    status: string;
    emailConfirmed: string;
    createdAt: string;
  };
}
