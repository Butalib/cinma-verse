export type ShowtimeDetailStatus = 'SCHEDULED' | 'NOW_SHOWING' | 'COMPLETED' | 'CANCELLED';

export interface ShowtimeDetail {
  id: string;
  movieTitle: string;
  branchName: string;
  hallName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: ShowtimeDetailStatus;
  createdAt: string;
}

export interface ShowtimeStats {
  ticketPrice: string;
  totalBookings: number;
  totalTickets: number;
}
