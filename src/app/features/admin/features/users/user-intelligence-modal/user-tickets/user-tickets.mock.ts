export interface UserTicketRow {
  id: string;
  ticketId: string;
  ticketNumber: string;
  movieTitle: string;
  showtime: string;
  showtimeId: string;
  bookingIdRef: string;
  seat: string;
  hall: string;
  branch: string;
  amount: number;
  status: 'active' | 'used' | 'cancelled';
}

export const MOCK_TICKETS: UserTicketRow[] = [
  {
    id: 't1',
    ticketId: '#TK-100293',
    ticketNumber: '9281-2291-8812',
    movieTitle: 'Dune: Part Two',
    showtime: 'Mar 14, 2024 • 19:30',
    showtimeId: 'SHW-44120',
    bookingIdRef: '#BK-99281',
    seat: 'J12',
    hall: '01 • IMAX',
    branch: 'Downtown Plaza',
    amount: 17,
    status: 'active',
  },
  {
    id: 't2',
    ticketId: '#TK-100294',
    ticketNumber: '9281-2291-8813',
    movieTitle: 'Dune: Part Two',
    showtime: 'Mar 14, 2024 • 19:30',
    showtimeId: 'SHW-44120',
    bookingIdRef: '#BK-99281',
    seat: 'J13',
    hall: '01 • IMAX',
    branch: 'Downtown Plaza',
    amount: 17,
    status: 'active',
  },
  {
    id: 't3',
    ticketId: '#TK-988210',
    ticketNumber: '4412-1102-9921',
    movieTitle: 'Oppenheimer',
    showtime: 'Mar 08, 2024 • 21:00',
    showtimeId: 'SHW-33801',
    bookingIdRef: '#BK-99185',
    seat: 'D91',
    hall: '04 • Premium',
    branch: 'Central Station',
    amount: 18.5,
    status: 'used',
  },
  {
    id: 't4',
    ticketId: '#TK-877215',
    ticketNumber: '1122-3944-5566',
    movieTitle: 'The Batman',
    showtime: 'Feb 24, 2024 • 18:45',
    showtimeId: 'SHW-22001',
    bookingIdRef: '#BK-98542',
    seat: 'A91',
    hall: '02 • Standard',
    branch: 'East Mall',
    amount: 11,
    status: 'cancelled',
  },
  {
    id: 't5',
    ticketId: '#TK-870001',
    ticketNumber: '2233-4455-6677',
    movieTitle: 'Interstellar',
    showtime: 'Feb 10, 2024 • 20:00',
    showtimeId: 'SHW-22994',
    bookingIdRef: '#BK-98001',
    seat: 'B02',
    hall: '05 • IMAX',
    branch: 'Downtown Plaza',
    amount: 22,
    status: 'used',
  },
  {
    id: 't6',
    ticketId: '#TK-860000',
    ticketNumber: '9988-7766-5544',
    movieTitle: 'Avatar: The Way of Water',
    showtime: 'Jan 05, 2024 • 18:30',
    showtimeId: 'SHW-11002',
    bookingIdRef: '#BK-97744',
    seat: 'C33',
    hall: '03 • Standard',
    branch: 'East Mall',
    amount: 14,
    status: 'active',
  },
];
