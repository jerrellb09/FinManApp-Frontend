import { Component, OnInit } from '@angular/core';
import { BillService } from '../../../services/bill.service';
import { AuthService } from '../../../services/auth.service';
import { Bill } from '../../../models/bill.model';

@Component({
  selector: 'app-bill-list',
  templateUrl: './bill-list.component.html',
  styleUrls: ['./bill-list.component.scss']
})
export class BillListComponent implements OnInit {
  bills: Bill[] = [];
  dueBills: Bill[] = [];
  loading = true;
  error = '';
  userId: number | null = null;
  showPaid = false;
  
  constructor(
    private billService: BillService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Force loading to false after 3 seconds to prevent infinite spinner
    setTimeout(() => {
      if (this.loading) {
        console.log('Timeout: Forcing loading to false in bill list');
        this.loading = false;
        if (!this.error) {
          this.error = 'Unable to load bill data. The bill management API may not be responding.';
        }
      }
    }, 3000);
    
    this.authService.currentUser.subscribe(user => {
      if (user && user.id) {
        this.userId = Number(user.id);
        this.loadBills();
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

  loadBills(): void {
    if (!this.userId) {
      this.loading = false;
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.billService.getUserBills(this.userId).subscribe({
      next: (bills) => {
        console.log('Bills loaded:', bills);
        this.bills = bills || [];
        this.filterBills();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading bills:', err);
        this.error = 'Failed to load bills. The bill management API may not be available yet.';
        this.bills = [];
        this.loading = false;
      }
    });

    // Also load due bills for highlighting
    this.billService.getDueBills(this.userId).subscribe({
      next: (dueBills) => {
        console.log('Due bills loaded:', dueBills);
        this.dueBills = dueBills || [];
      },
      error: (err) => {
        console.error('Error loading due bills:', err);
        this.dueBills = [];
      }
    });
  }

  filterBills(): void {
    if (!this.showPaid) {
      this.bills = this.bills.filter(bill => !bill.isPaid);
    }
  }

  togglePaidBills(): void {
    this.showPaid = !this.showPaid;
    if (this.userId) {
      this.loadBills();
    }
  }

  markAsPaid(billId: number): void {
    this.billService.markBillAsPaid(billId).subscribe({
      next: () => {
        // Update the local bills array
        const billIndex = this.bills.findIndex(bill => bill.id === billId);
        if (billIndex !== -1) {
          this.bills[billIndex].isPaid = true;
          this.filterBills();
        }
      },
      error: (err) => {
        this.error = 'Failed to mark bill as paid. Please try again.';
        console.error(err);
      }
    });
  }

  deleteBill(billId: number): void {
    if (confirm('Are you sure you want to delete this bill?')) {
      this.billService.deleteBill(billId).subscribe({
        next: () => {
          this.bills = this.bills.filter(bill => bill.id !== billId);
        },
        error: (err) => {
          this.error = 'Failed to delete bill. Please try again.';
          console.error(err);
        }
      });
    }
  }

  resetMonthlyBills(): void {
    if (!this.userId) return;
    
    if (confirm('Are you sure you want to reset all paid bills for the new month?')) {
      this.billService.resetMonthlyBills(this.userId).subscribe({
        next: () => {
          this.loadBills();
        },
        error: (err) => {
          this.error = 'Failed to reset bills. Please try again.';
          console.error(err);
        }
      });
    }
  }

  isDueSoon(bill: Bill): boolean {
    return this.dueBills.some(dueBill => dueBill.id === bill.id);
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