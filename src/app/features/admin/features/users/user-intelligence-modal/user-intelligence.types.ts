export type UserIntelligenceTab = 'overview' | 'bookings' | 'tickets' | 'payments';

export interface UserIntelligenceSelectedUser {
  displayName: string;
  email: string;
  phone: string;
  joinedLabel: string;
  avatarUrl?: string | null;
  /** When true, shows the premium member pill (default true in profile card if omitted). */
  isPremiumMember?: boolean;
}
