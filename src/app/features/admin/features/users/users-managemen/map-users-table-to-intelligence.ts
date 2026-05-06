import type { UsersTableRow } from './componants/users-table/users-table.component';
import type { UserIntelligenceSelectedUser } from '../user-intelligence-modal/user-intelligence.types';
import type { UserOverview } from '../user-intelligence-modal/user-overview/user-overview.model';

function formatJoinedLabel(isoDate: string): string {
  const d = parseIsoDate(isoDate);
  if (!d) {
    return `Joined ${isoDate}`;
  }
  return `Joined ${formatMediumDate(d)}`;
}

function formatAccountCreatedAt(isoDate: string): string {
  const d = parseIsoDate(isoDate);
  if (!d) {
    return isoDate;
  }
  return `${formatMediumDate(d)}, 12:00`;
}

function parseIsoDate(value: string): Date | null {
  if (!value?.trim()) {
    return null;
  }
  const parsed = new Date(value.trim());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatMediumDate(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function syntheticEmail(row: UsersTableRow): string {
  const local = row.id.replace(/^USR-/i, 'user').toLowerCase();
  return `${local}@users.cinmaverse.local`;
}

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'member';
}

export function mapUsersTableRowToSelectedUser(row: UsersTableRow): UserIntelligenceSelectedUser {
  return {
    displayName: row.name,
    email: syntheticEmail(row),
    phone: row.contact,
    joinedLabel: formatJoinedLabel(row.joinedDate),
    isPremiumMember: row.role === 'Admin' || row.emailConfirmed === 'CONFIRMED',
  };
}

export function mapUsersTableRowToUserOverview(row: UsersTableRow): UserOverview {
  const { firstName, lastName } = splitFullName(row.name);
  const email = syntheticEmail(row);
  const overviewRole: UserOverview['role'] = row.role === 'Admin' ? 'Admin' : 'User';
  const accountStatus: UserOverview['accountStatus'] =
    row.status === 'ACTIVE' ? 'Active' : 'Suspended';

  return {
    id: row.id,
    internalSlug: `/api/admin/users/${slugFromName(row.name)}`,
    accountStatus,
    role: overviewRole,
    emailConfirmed: row.emailConfirmed === 'CONFIRMED',
    basicInfo: {
      firstName,
      lastName,
      email,
      phone: row.contact,
    },
    personalInfo: {
      address: `${row.city} — address on file`,
      city: row.city,
      dateOfBirth: row.dateOfBirth ?? '—',
      gender: row.gender,
    },
    accountInfo: {
      role: row.role,
      status: row.status === 'ACTIVE' ? 'Active' : 'Suspended',
      emailConfirmed: row.emailConfirmed === 'CONFIRMED' ? 'Yes' : 'No',
      createdAt: formatAccountCreatedAt(row.createdAt),
    },
  };
}
