import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

export interface ShowtimesFilter {
  status?: string;
  branchName?: string;
  movieTitle?: string;
  dateFrom?: Date;
  dateTo?: Date;
  priceMin?: number;
  priceMax?: number;
}

@Component({
  selector: 'app-showtimes-filter-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './showtimes-filter-panel.component.html',
  styleUrls: ['./showtimes-filter-panel.component.scss']
})
export class ShowtimesFilterPanelComponent {
  @Input() isOpen = false;
  @Output() applyFilters = new EventEmitter<ShowtimesFilter>();
  @Output() resetFilters = new EventEmitter<void>();
  filterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      status: ['All Status'],
      branchName: [''],
      movieTitle: [''],
      dateFrom: [null],
      dateTo: [null],
      priceMin: [null],
      priceMax: [null]
    });
  }

  onApply() {
    const rawValue = this.filterForm.value;
    const filterData: ShowtimesFilter = {};

    if (rawValue.status !== 'All Status') {
      filterData.status = rawValue.status;
    }

    if (rawValue.branchName && rawValue.branchName.trim() !== '') {
      filterData.branchName = rawValue.branchName;
    }

    if (rawValue.movieTitle && rawValue.movieTitle.trim() !== '') {
      filterData.movieTitle = rawValue.movieTitle;
    }

    if (rawValue.dateFrom) {
      filterData.dateFrom = new Date(rawValue.dateFrom);
    }

    if (rawValue.dateTo) {
      filterData.dateTo = new Date(rawValue.dateTo);
    }

    if (rawValue.priceMin !== null && rawValue.priceMin !== '') {
      filterData.priceMin = Number(rawValue.priceMin);
    }

    if (rawValue.priceMax !== null && rawValue.priceMax !== '') {
      filterData.priceMax = Number(rawValue.priceMax);
    }

    this.applyFilters.emit(filterData);
  }

  onReset() {
    this.filterForm.reset({
      status: 'All Status',
      branchName: '',
      movieTitle: '',
      dateFrom: null,
      dateTo: null,
      priceMin: null,
      priceMax: null
    });
    this.resetFilters.emit();
  }
}
