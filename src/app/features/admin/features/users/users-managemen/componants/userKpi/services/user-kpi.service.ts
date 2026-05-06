import { Injectable } from '@angular/core';

export interface UserKpiItem {
  title: string;
  value: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserKpiService {
  getUserKpis(): UserKpiItem[] {
    return [
      {
        title: 'TOTAL USERS',
        value: '24,512',
        icon: 'group'
      },
      {
        title: 'ACTIVE USERS',
        value: '18,203',
        icon: 'bolt'
      },
      {
        title: 'NEW THIS MONTH',
        value: '2,104',
        icon: 'person_add'
      },
      {
        title: 'AVERAGE SPEND',
        value: '$342.80',
        icon: 'credit_card'
      }
    ];
  }
}
