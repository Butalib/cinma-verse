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

export const MOCK_USER_OVERVIEW: UserOverview = {
  id: 'USR-9876',
  internalSlug: '/api/admin/users/jane-doe',
  accountStatus: 'Active',
  role: 'Admin',
  emailConfirmed: true,
  basicInfo: {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    phone: '+1 555-0198',
  },
  personalInfo: {
    address: '123 Cinematic Blvd, Apt 4B',
    city: 'Los Angeles',
    dateOfBirth: '1990-05-15',
    gender: 'Female',
  },
  accountInfo: {
    role: 'Admin',
    status: 'Active',
    emailConfirmed: 'Yes',
    createdAt: 'Oct 12, 2023, 14:32',
  },
};
