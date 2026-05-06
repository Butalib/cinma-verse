import { Injectable } from '@angular/core';

export interface ShowtimeKpiItem {
  title: string;
  value: string;
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class ShowtimeKpiService {
  getShowtimeKpis(): ShowtimeKpiItem[] {
    return [
      {
        title: 'TOTAL SHOWTIMES',
        value: '1,248',
        icon: 'calendar_month'
      },
      {
        title: 'NOW SHOWING',
        value: '86',
        icon: 'play_circle'
      },
      {
        title: 'SCHEDULED TODAY',
        value: '42',
        icon: 'schedule'
      },
      {
        title: 'AVG OCCUPANCY',
        value: '74%',
        icon: 'event_seat'
      }
    ];
  }
}
