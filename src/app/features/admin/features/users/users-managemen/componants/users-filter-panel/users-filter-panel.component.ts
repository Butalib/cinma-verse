import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

export interface UsersFilter {
  isActive?: boolean;
  emailConfirmed?: boolean;
  gender?: string;
  city?: string;
  createdFrom?: Date;
  createdTo?: Date;
  dateOfBirthFrom?: Date;
  dateOfBirthTo?: Date;
}

@Component({
  selector: 'app-users-filter-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users-filter-panel.component.html',
  styleUrls: ['./users-filter-panel.component.scss']
})
export class UsersFilterPanelComponent {
  @Input() isOpen = false;
  @Output() applyFilters = new EventEmitter<UsersFilter>();
  @Output() resetFilters = new EventEmitter<void>();
  filterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      isActive: ['All Status'],
      emailConfirmed: ['All Email'],
      gender: ['All'],
      city: [''],
      createdFrom: [null],
      createdTo: [null],
      dateOfBirthFrom: [null],
      dateOfBirthTo: [null]
    });
  }

  onApply() {
    const rawValue = this.filterForm.value;
    const filterData: UsersFilter = {};

    if (rawValue.isActive !== 'All Status') {
      filterData.isActive = rawValue.isActive === 'Active';
    }

    if (rawValue.emailConfirmed !== 'All Email') {
      filterData.emailConfirmed = rawValue.emailConfirmed === 'Confirmed';
    }

    if (rawValue.gender !== 'All') {
      filterData.gender = rawValue.gender;
    }

    if (rawValue.city && rawValue.city.trim() !== '') {
      filterData.city = rawValue.city;
    }

    if (rawValue.createdFrom) {
      filterData.createdFrom = new Date(rawValue.createdFrom);
    }

    if (rawValue.createdTo) {
      filterData.createdTo = new Date(rawValue.createdTo);
    }

    if (rawValue.dateOfBirthFrom) {
      filterData.dateOfBirthFrom = new Date(rawValue.dateOfBirthFrom);
    }

    if (rawValue.dateOfBirthTo) {
      filterData.dateOfBirthTo = new Date(rawValue.dateOfBirthTo);
    }

    this.applyFilters.emit(filterData);
  }

  onReset() {
    this.filterForm.reset({
      isActive: 'All Status',
      emailConfirmed: 'All Email',
      gender: 'All',
      city: '',
      createdFrom: null,
      createdTo: null,
      dateOfBirthFrom: null,
      dateOfBirthTo: null
    });
    this.resetFilters.emit();
  }
}
