import { Component, OnInit } from '@angular/core';
import { BillService } from '../../../services/bill.service';
import { AuthService } from '../../../services/auth.service';
import { Bill } from '../../../models/bill.model';

@Component({
  selector: 'app-bill-dashboard',
  templateUrl: './bill-dashboard.component.html',
  styleUrls: ['./bill-dashboard.component.scss']
})
export class BillDashboardComponent implements OnInit {
  bills: Bill[] = [];
  dueBills: Bill[] = [];
  paidBills: Bill[] = [];
  unpaidBills: Bill[] = [];
  loading = true;
  error = '';
  userId: number | null = null;
  remainingIncome = 0;
  totalBillAmount = 0;
  totalDueAmount = 0;
  
  constructor(
    private billService: BillService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Force loading to false after 3 seconds to prevent infinite spinner
    setTimeout(() => {
      if (this.loading) {
        console.log('Timeout: Forcing loading to false');
        this.loading = false;
        if (!this.error) {
          this.error = 'Unable to load bill data. The bill management API may not be responding.';
        }
      }
    }, 3000);
    
    this.authService.currentUser.subscribe(user => {
      if (user && user.id) {
        this.userId = Number(user.id);
        this.loadData();
      } else {
        this.loading = false;
        this.error = 'User information not available.';
      }
    }, error => {
      console.error('Auth subscription error:', error);
      this.loading = false;
      this.error = 'Authentication error. Please try again later.';
    });
  }

  loadData(): void {
    if (!this.userId) {
      this.loading = false;
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    // Try to simulate the data since the backend might not be ready
    try {
      // Mock data for immediate display while we try the real API
      this.bills = [];
      this.unpaidBills = [];
      this.paidBills = [];
      this.dueBills = [];
      this.totalBillAmount = 0;
      this.totalDueAmount = 0;
      this.remainingIncome = 0;
      
      // Count of API calls to track
      let completedCalls = 0;
      const totalCalls = 3; // We have 3 API calls
      
      const checkAllCompleted = () => {
        completedCalls++;
        console.log(`API call ${completedCalls} of ${totalCalls} completed`);
        if (completedCalls >= totalCalls) {
          console.log('All API calls completed, stopping loading spinner');
          this.loading = false;
        }
      };
      
      // Wrap API calls in try-catch to ensure they don't crash the component
      try {
        // Load all bills
        this.billService.getUserBills(this.userId).subscribe({
          next: (bills) => {
            console.log('Bills loaded:', bills);
            this.bills = bills || [];
            this.unpaidBills = this.bills.filter(bill => !bill.isPaid);
            this.paidBills = this.bills.filter(bill => bill.isPaid);
            
            // Calculate total bill amount
            this.totalBillAmount = this.calculateTotalAmount(this.bills);
            checkAllCompleted();
          },
          error: (err) => {
            console.error('Error loading bills:', err);
            this.error = 'Failed to load bills. The bill management API may not be available yet.';
            this.bills = [];
            this.unpaidBills = [];
            this.paidBills = [];
            checkAllCompleted();
          }
        });
      } catch (e) {
        console.error('Exception in getUserBills API call:', e);
        checkAllCompleted();
      }
      
      try {
        // Load due bills
        this.billService.getDueBills(this.userId).subscribe({
          next: (dueBills) => {
            console.log('Due bills loaded:', dueBills);
            this.dueBills = dueBills || [];
            this.totalDueAmount = this.calculateTotalAmount(this.dueBills);
            checkAllCompleted();
          },
          error: (err) => {
            console.error('Error loading due bills:', err);
            this.dueBills = [];
            this.totalDueAmount = 0;
            checkAllCompleted();
          }
        });
      } catch (e) {
        console.error('Exception in getDueBills API call:', e);
        checkAllCompleted();
      }
      
      try {
        // Load remaining income
        this.billService.getRemainingIncome(this.userId).subscribe({
          next: (response) => {
            console.log('Remaining income loaded:', response);
            this.remainingIncome = response?.remainingIncome || 0;
            checkAllCompleted();
          },
          error: (err) => {
            console.error('Error loading remaining income:', err);
            this.remainingIncome = 0;
            checkAllCompleted();
          }
        });
      } catch (e) {
        console.error('Exception in getRemainingIncome API call:', e);
        checkAllCompleted();
      }
    } catch (e) {
      // Catch any unexpected errors
      console.error('Exception in loadData method:', e);
      this.error = 'An unexpected error occurred. Please try again later.';
      this.loading = false;
    }
  }
  
  calculateTotalAmount(bills: Bill[]): number {
    return bills.reduce((total, bill) => total + bill.amount, 0);
  }
  
  getBillsDueThisWeek(): Bill[] {
    const today = new Date();
    const currentDay = today.getDate();
    const endOfWeek = currentDay + 7;
    
    return this.unpaidBills.filter(bill => {
      const dueDay = bill.dueDay;
      return dueDay >= currentDay && dueDay <= endOfWeek;
    });
  }
  
  getOverdueBills(): Bill[] {
    const today = new Date();
    const currentDay = today.getDate();
    
    return this.unpaidBills.filter(bill => {
      return bill.dueDay < currentDay;
    });
  }
  
  markAsPaid(billId: number): void {
    this.billService.markBillAsPaid(billId).subscribe({
      next: () => {
        this.loadData(); // Reload all data
      },
      error: (err) => {
        this.error = 'Failed to mark bill as paid. Please try again.';
        console.error(err);
      }
    });
  }
  
  // Get percentage of bills paid this month
  getBillsCompletionRate(): number {
    if (this.bills.length === 0) return 0;
    return (this.paidBills.length / this.bills.length) * 100;
  }
  
  // Helper to format number as currency
  formatCurrency(amount: number): string {
    return amount.toFixed(2);
  }
  
  // Helper to get days until due
  getDaysUntilDue(dueDay: number): number {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    if (dueDay < currentDay) {
      // Due date is in the next month
      return dueDay + (daysInMonth - currentDay);
    } else {
      // Due date is in the current month
      return dueDay - currentDay;
    }
  }
}