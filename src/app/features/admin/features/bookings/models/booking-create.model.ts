export interface BookingShowtimeOption {
  id: string;
  movieTitle: string;
  branchName: string;
  hallName: string;
  date: string;
  startTime: string;
  price: number;
  availableSeats: number;
}

export interface CreateBookingPayload {
  customerName: string;
  customerEmail: string;
  showtimeId: string;
  seats: string[];
}
