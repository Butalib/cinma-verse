export interface UserPaymentRow {
  id: string;
  paymentId: string;
  bookingRef: string;
  amount: number;
  transactionDate: string;
  transactionIso: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
}

export const MOCK_PAYMENTS: UserPaymentRow[] = [
  {
    id: 'p1',
    paymentId: '#PMT-44021',
    bookingRef: '#BK-99201',
    amount: 240,
    transactionDate: 'Nov 12, 2023 • 14:30',
    transactionIso: '2023-11-12',
    status: 'completed',
  },
  {
    id: 'p2',
    paymentId: '#PMT-43985',
    bookingRef: '#BK-99185',
    amount: 74,
    transactionDate: 'Nov 10, 2023 • 09:15',
    transactionIso: '2023-11-10',
    status: 'pending',
  },
  {
    id: 'p3',
    paymentId: '#PMT-43542',
    bookingRef: '#BK-98542',
    amount: 22,
    transactionDate: 'Nov 05, 2023 • 18:45',
    transactionIso: '2023-11-05',
    status: 'failed',
  },
  {
    id: 'p4',
    paymentId: '#PMT-43001',
    bookingRef: '#BK-98001',
    amount: 45,
    transactionDate: 'Oct 28, 2023 • 11:20',
    transactionIso: '2023-10-28',
    status: 'completed',
  },
  {
    id: 'p5',
    paymentId: '#PMT-42000',
    bookingRef: '#BK-97000',
    amount: 99,
    transactionDate: 'Oct 15, 2023 • 08:00',
    transactionIso: '2023-10-15',
    status: 'pending',
  },
  {
    id: 'p6',
    paymentId: '#PMT-41000',
    bookingRef: '#BK-96000',
    amount: 15,
    transactionDate: 'Sep 30, 2023 • 16:00',
    transactionIso: '2023-09-30',
    status: 'cancelled',
  },
];
