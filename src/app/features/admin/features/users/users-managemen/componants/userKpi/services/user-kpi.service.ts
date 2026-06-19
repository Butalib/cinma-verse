import { Injectable, inject, signal } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { ApiClientService } from '../../../../../../../../core/http/api-client.service';

export interface UserKpiItem {
  title: string;
  value: string;
  icon: string;
}

interface UserKpiSource {
  createdAt?: string;
  joinedDate?: string;
  createdOn?: string;
  created?: string;
  status?: string;
  isActive?: boolean | string;
  averageSpend?: number | string;
}

@Injectable({
  providedIn: 'root',
})
export class UserKpiService {
  private readonly api = inject(ApiClientService);
  private readonly kpis = signal<UserKpiItem[]>(this.buildKpis([]));

  constructor() {
    this.loadFromApi();
  }

  getUserKpis() {
    return this.kpis.asReadonly();
  }

  private loadFromApi(): void {
    this.api
      .get<unknown>('/api/admin/users')
      .pipe(
        map((response) => this.extractCollection(response)),
        map((items) => this.buildKpis(items)),
        catchError((error) => {
          console.error('Load user KPIs failed', error);
          return of(this.buildKpis([]));
        }),
      )
      .subscribe((items) => {
        this.kpis.set(items);
      });
  }

  private buildKpis(items: UserKpiSource[]): UserKpiItem[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const totalUsers = items.length;
    const activeUsers = items.filter((item) => this.isActiveUser(item)).length;
    const newThisMonth = items.filter((item) => {
      const createdAt = this.parseDate(
        item.createdAt ?? item.joinedDate ?? item.createdOn ?? item.created ?? '',
      );

      return (
        createdAt !== null &&
        createdAt.getFullYear() === currentYear &&
        createdAt.getMonth() === currentMonth
      );
    }).length;

    const spendValues = items
      .map((item) => this.toNumber(item.averageSpend))
      .filter((value): value is number => value !== null);

    const averageSpend =
      spendValues.length > 0
        ? spendValues.reduce((sum, value) => sum + value, 0) / spendValues.length
        : 0;

    return [
      {
        title: 'TOTAL USERS',
        value: this.formatCount(totalUsers),
        icon: 'group',
      },
      {
        title: 'ACTIVE USERS',
        value: this.formatCount(activeUsers),
        icon: 'bolt',
      },
      {
        title: 'NEW THIS MONTH',
        value: this.formatCount(newThisMonth),
        icon: 'person_add',
      },
      {
        title: 'AVERAGE SPEND',
        value: this.formatCurrency(averageSpend),
        icon: 'credit_card',
      },
    ];
  }

  private extractCollection(raw: unknown): UserKpiSource[] {
    if (Array.isArray(raw)) {
      return raw.filter((item): item is UserKpiSource => this.isRecord(item));
    }

    if (!this.isRecord(raw)) {
      return [];
    }

    const candidates = [raw['items'], raw['data'], raw['users'], raw['results'], raw['value']];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.filter((item): item is UserKpiSource => this.isRecord(item));
      }
    }

    return this.looksLikeUser(raw) ? [raw] : [];
  }

  private looksLikeUser(
    value: Record<string, unknown>,
  ): value is Record<string, unknown> & UserKpiSource {
    return (
      typeof value['id'] === 'string' ||
      typeof value['userId'] === 'string' ||
      typeof value['userId'] === 'number' ||
      typeof value['email'] === 'string' ||
      typeof value['firstName'] === 'string' ||
      typeof value['name'] === 'string'
    );
  }

  private isActiveUser(item: UserKpiSource): boolean {
    const active = this.toBoolean(item.isActive);
    if (active !== null) {
      return active;
    }

    return (item.status ?? '').toUpperCase() === 'ACTIVE';
  }

  private parseDate(value: string): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') {
        return true;
      }
      if (normalized === 'false') {
        return false;
      }
    }

    return null;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private formatCount(value: number): string {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
