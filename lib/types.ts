export interface Transaction {
  _id: string;
  name: string;
  category: string;
  subCategory?: string;
  amount: number;
  date: string;
  displayDate: string;
  paymentMethod: string;
  walletId?: string;
  refunds?: import('./refund').RefundRecord[];
}
