export interface AdminPagedResponse<T> {
  items?: T[];
  data?: T[];
  results?: T[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  total?: number;
  count?: number;
}

export type AdminBookingStatus = 'Pending' | 'Cancelled' | 'Confirmed' | 'Expired';
export type AdminPaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Cancelled';
export type AdminTicketStatus = 'Active' | 'Used' | 'Cancelled';

export interface AdminBookingDto {
  bookingId?: number;
  status?: AdminBookingStatus;
  totalAmount?: number;
  createdAt?: string;
  expiresAt?: string | null;
  customerName?: string;
  customerEmail?: string;
  showtime?: {
    movieShowTimeId?: number;
    startTime?: string;
    movieTitle?: string;
    posterUrl?: string;
  };
  bookedSeats?: Array<{
    seatId?: number;
    seatLabel?: string;
    seatRow?: string;
    seatColumn?: string;
  }>;
}

export interface AdminShowtimeDto {
  id?: number;
  movieId?: number;
  movieName?: string;
  movieTitle?: string;
  hallId?: number;
  hallNumber?: string;
  branchId?: number;
  branchName?: string;
  showStartTime?: string;
  showEndTime?: string;
  price?: number;
  createdAt?: string;
  totalBookings?: number;
  totalTickets?: number;
  totalSeats?: number;
  availableSeats?: number;
}

export interface AdminBranchDto {
  id?: number;
  branchName?: string;
  branchLocation?: string;
  totalHalls?: number;
  totalCapacity?: number;
  totalShowtimes?: number;
}

export interface AdminBranchSummaryDto {
  totalBranches?: number;
  totalHalls?: number;
  totalCapacity?: number;
  totalShowtimes?: number;
}

export interface AdminHallDto {
  id?: number;
  branchId?: number;
  capacity?: number;
  hallNumber?: string;
  hallStatus?: string;
  hallType?: string;
}

export interface AdminMovieDto {
  movieId?: number;
  movieName?: string;
  movieDescription?: string;
  releaseDate?: string;
  movieAgeRating?: string;
  movieRating?: number;
  trailerUrl?: string;
  moviePoster?: string;
  language?: string;
  status?: string;
  genres?: Array<{ genreId?: number; name?: string }>;
  images?: Array<{ id?: number; imageUrl?: string }>;
  castMembers?: Array<{
    id?: number;
    personName?: string;
    imageUrl?: string;
    roleType?: string;
    characterName?: string;
    displayOrder?: number;
    isLead?: boolean;
  }>;
  movieDuration?:
    | {
        ticks?: number;
        totalMinutes?: number;
        hours?: number;
        minutes?: number;
      }
    | string;
}

export interface AdminMovieSummaryDto {
  totalMovies?: number;
  nowShowingCount?: number;
  comingSoonCount?: number;
}

export interface AdminPaymentDto {
  paymentId?: number;
  bookingId?: number;
  amount?: number;
  currency?: string;
  transactionDate?: string;
  status?: AdminPaymentStatus;
  paymentIntentId?: string;
  userEmail?: string;
  userFullName?: string;
  movieName?: string;
}

export interface AdminPaymentSummaryDto {
  totalPayments?: number;
  completedPayments?: number;
  pendingPayments?: number;
  failedPayments?: number;
  totalRevenue?: number;
}

export interface AdminTicketListItemDto {
  ticketId?: number;
  ticketNumber?: string;
  movieName?: string;
  showStartTime?: string;
  status?: AdminTicketStatus;
  price?: number;
  branchName?: string;
  userEmail?: string;
  userFullName?: string;
  bookingStatus?: AdminBookingStatus;
}

export interface AdminTicketDetailsDto extends AdminTicketListItemDto {
  hallNumber?: string;
  hallType?: string;
  seatLabel?: string;
  moviePoster?: string;
  movieAgeRating?: string;
  qrToken?: string;
  userId?: number;
  fullName?: string;
  bookingId?: number;
  usedAt?: string | null;
}

export interface AdminTicketCheckResultDto {
  ticketNumber?: string;
  status?: AdminTicketStatus;
  movieName?: string;
  showStartTime?: string;
  hallNumber?: string;
  hallType?: string;
  seatLabel?: string;
  price?: number;
  branchName?: string;
  isFound?: boolean;
  message?: string;
}

export interface AdminTicketCheckInResultDto {
  success?: boolean;
  result?: 'Success' | 'NotFound' | 'AlreadyUsed' | 'Cancelled' | 'InvalidStatus' | 'Error';
  message?: string;
}

export interface AdminUserDto {
  userId?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string;
  isActive?: boolean;
  isEmailConfirmed?: boolean;
  emailConfirmed?: boolean;
  gender?: 'Male' | 'Female';
  role?: 'Admin' | 'User' | string;
  createdAt?: string;
  averageSpend?: number;
}

export interface AdminGenreDto {
  genreId?: number;
  genreName?: string;
  moviesCount?: number;
}

export interface AdminChartDataDto {
  labels?: string[];
  data?: number[];
}
