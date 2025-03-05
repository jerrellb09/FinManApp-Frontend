export interface Bill {
  id: number;
  name: string;
  amount: number;
  dueDay: number;
  isPaid: boolean;
  isRecurring: boolean;
  userId?: number;
  categoryId?: number;
}