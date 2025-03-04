export interface Transaction {
  id: number;
  accountId: number;
  plaidTransactionId: string;
  date: Date;
  amount: number;
  name: string;
  merchantName: string;
  pending: boolean;
  categoryId: number;
  description: string;
  
  // Additional properties needed by components
  merchant?: string;
  accountName?: string;
}