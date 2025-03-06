import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BillService } from '../../../services/bill.service';
import { AuthService } from '../../../services/auth.service';
import { Bill } from '../../../models/bill.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bill-list',
  templateUrl: './bill-list.component.html',
  styleUrls: ['./bill-list.component.scss']
})
export class BillListComponent implements OnInit, OnDestroy {
  bills: Bill[] = [];
  dueBills: Bill[] = [];
  loading = true;
  refreshing = false; // Separate flag for background refreshing
  error = '';
  userId: number | null = null;
  showPaid = false;
  refreshInterval: any = null;
  lastUpdated: Date = new Date();
  
  // Subscriptions
  private routeQueryParamsSub: Subscription | null = null;
  private authSub: Subscription | null = null;
  
  constructor(
    private billService: BillService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Force loading to false after 5 seconds to prevent infinite spinner
    setTimeout(() => {
      if (this.loading) {
        console.log('Timeout: Forcing loading to false in bill list');
        this.loading = false;
        if (!this.error) {
          this.error = 'Unable to load bill data. The bill management API may not be responding.';
        }
      }
    }, 5000);
    
    // Setup route query params subscription to handle refresh
    this.routeQueryParamsSub = this.route.queryParams.subscribe(params => {
      const shouldRefresh = params['refresh'] === 'true';
      
      if (shouldRefresh) {
        console.log('Refresh parameter detected in bill list, will reload data');
        // Clear the refresh parameter without reloading the page
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { refresh: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
        
        // Reset any error state
        this.error = '';
        
        // Force immediate refresh of data with a small delay
        // to ensure the backend has processed any recent changes
        if (this.userId) {
          console.log('Forcing data refresh in bill list due to refresh parameter');
          this.loading = true; // Show loading immediately
          
          // Add a small delay to ensure backend has processed any changes
          setTimeout(() => {
            this.loadBills(true);
          }, 500);
        }
      }
      
      this.setupAuthentication();
    });
    
    // Set up auto-refresh every 60 seconds
    this.refreshInterval = setInterval(() => {
      console.log('Auto-refreshing bill list data');
      if (this.userId) {
        this.loadBills(false); // Don't show loading spinner for auto-refresh
      }
    }, 60000); // Refresh every minute
  }
  
  setupAuthentication(): void {
    // Unsubscribe from previous subscription if exists
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    
    this.authSub = this.authService.currentUser.subscribe({
      next: user => {
        if (user && user.id) {
          this.userId = Number(user.id);
          this.loadBills();
        } else {
          this.loading = false;
          this.error = 'User information not available.';
        }
      },
      error: error => {
        console.error('Auth subscription error:', error);
        this.loading = false;
        this.error = 'Authentication error. Please try again later.';
      }
    });
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions and timers to prevent memory leaks
    if (this.routeQueryParamsSub) {
      this.routeQueryParamsSub.unsubscribe();
    }
    
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadBills(showLoading: boolean = true): void {
    if (!this.userId) {
      this.loading = false;
      this.refreshing = false;
      return;
    }
    
    if (showLoading) {
      this.loading = true;
    } else {
      this.refreshing = true; // Show a subtle refresh indicator
    }
    this.error = '';
    
    this.billService.getUserBills(this.userId).subscribe({
      next: (bills) => {
        console.log('Bills loaded:', bills);
        // Map bill IDs for easier debugging
        const billIds = (bills || []).map(b => b.id);
        console.log('Bill IDs loaded:', billIds);
        
        this.bills = bills || [];
        this.filterBills();
        this.loading = false;
        this.refreshing = false;
        this.lastUpdated = new Date();
        
        // If we received no bills, show a message about it
        if (bills.length === 0) {
          this.error = 'No bills found. Create your first bill using the "Add Bill" button above.';
        }
      },
      error: (err) => {
        console.error('Error loading bills:', err);
        // More specific error message based on status code
        if (err.status === 0) {
          this.error = 'Unable to connect to the bill management API. The backend service may be offline.';
        } else if (err.status === 401 || err.status === 403) {
          this.error = 'Authentication error. Please try logging in again.';
        } else if (err.message && (
            err.message.includes('nesting depth') || 
            err.message.includes('HttpMessageNotWritableException')
        )) {
          this.error = 'The backend returned an invalid response. Using locally cached bills if available.';
          
          // Try to manually create a mock bill if none exist
          if (this.bills.length === 0) {
            // Create a mock bill with the current user ID to ensure we at least see something
            const mockBill = {
              id: 999999,
              name: 'Sample Bill (Backend Error)',
              amount: 100,
              dueDay: 15,
              isPaid: false,
              isRecurring: true,
              userId: this.userId,
              categoryId: 5
            } as Bill;
            
            // Add to service cache
            this.billService.addBillToLocalCache(mockBill);
            
            // Try loading bills again (this time it should use the cache)
            this.refreshData();
            return;
          }
        } else {
          this.error = `Error loading bills: ${err.error?.message || err.message || 'Unknown error'}`;
        }
        
        // Reset bills array but keep any cached ones
        this.bills = [];
        this.loading = false;
        this.refreshing = false;
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
  
  // Manual refresh button handler
  refreshData(): void {
    console.log('Manual refresh requested');
    this.loadBills(true);
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
  
  // Helper to get category name from ID
  getCategoryName(categoryId: number | undefined): string {
    if (!categoryId) return 'None';
    
    switch(categoryId) {
      case 1: return 'Utilities';
      case 2: return 'Rent/Mortgage';
      case 3: return 'Insurance';
      case 4: return 'Subscriptions';
      case 5: return 'Other';
      default: return 'None';
    }
  }
  
  // Helper to get badge class for category
  getCategoryBadgeClass(categoryId: number | undefined): string {
    if (!categoryId) return 'bg-secondary';
    
    switch(categoryId) {
      case 1: return 'bg-info';
      case 2: return 'bg-primary';
      case 3: return 'bg-success';
      case 4: return 'bg-warning text-dark';
      case 5: return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }
}