import { Component, input } from '@angular/core';

export interface KpiData {
  title: string;
  value: string;
  apiSource: string;
  // trendValue: string;
  // trendType: 'up' | 'down' | 'neutral';
  icon: string;
}

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss'
})
export class KpiCardComponent {
  readonly data = input.required<KpiData>();
}
