export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  movieTitle: string;
  date: string;
  time: string;
  seats: string[];
  amount: number;
  status: BookingStatus;
  createdAt: string;
}

export interface BookingsFilters {
  search: string;
  status: BookingStatus | 'ALL';
  dateFrom: string;
  dateTo: string;
  amountMin: number | null;
  amountMax: number | null;
}

export interface BookingsPagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface BookingsStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
}

export interface BookingsQuery {
  search: string;
  status: BookingStatus | 'ALL';
  dateFrom: string;
  dateTo: string;
  amountMin: number | null;
  amountMax: number | null;
  page: number;
  pageSize: number;
}

export interface UpdateBookingStatusPayload {
  status: BookingStatus;
}
