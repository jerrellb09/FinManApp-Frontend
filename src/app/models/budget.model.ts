export interface Budget {
  id: number;
  userId: number;
  name: string;
  amount: number;
  categoryId: number;
  period: string;
  startDate: Date;
  endDate: Date | null;
  warningThreshold: number;
  
  // Additional properties needed by components
  currentSpending?: number;
  categoryName?: string;
  description?: string;
}