import { Component, AfterViewInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { WeeklyBookingsService } from '../../data-access/weekly-bookings.service';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip);

@Component({
  selector: 'app-weekly-bookings-chart',
  standalone: true,
  templateUrl: './weekly-bookings-chart.component.html',
  styleUrls: ['./weekly-bookings-chart.component.scss'],
})
export class WeeklyBookingsChartComponent implements AfterViewInit, OnDestroy {
  private readonly weeklyBookingsService = inject(WeeklyBookingsService);
  private readonly platformId = inject(PLATFORM_ID);
  
  private subscription = new Subscription();
  private chartInstance: Chart | null = null;

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchDataAndRender();
    }
  }

  private fetchDataAndRender(): void {
    const sub = this.weeklyBookingsService.getWeeklyBookings().subscribe({
      next: (response) => {
        const labels = response?.labels?.length ? response.labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = response?.data?.length ? response.data : [15, 25, 20, 45, 80, 110, 95];

        this.initChart(labels, data);
      },
      error: (err) => {
        console.error('Failed to load weekly bookings data', err);
        this.initChart(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], [0, 0, 0, 0, 0, 0, 0]);
      }
    });

    this.subscription.add(sub);
  }

  private initChart(labels: string[], data: number[]): void {
    const canvas = document.getElementById('weeklyBookingsChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Bookings',
            data,
            borderColor: '#22c1dc',
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#22c1dc',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8b949e' }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8b949e' },
            beginAtZero: true
          }
        },
        plugins: {
          legend: { display: false }
        }
      },
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
}
