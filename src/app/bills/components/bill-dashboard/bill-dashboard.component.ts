import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BillService } from '../../../services/bill.service';
import { AuthService } from '../../../services/auth.service';
import { Bill } from '../../../models/bill.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';

declare var bootstrap: any;

@Component({
  selector: 'app-bill-dashboard',
  templateUrl: './bill-dashboard.component.html',
  styleUrls: ['./bill-dashboard.component.scss']
})
export class BillDashboardComponent implements OnInit, OnDestroy {
  bills: Bill[] = [];
  filteredBills: Bill[] = [];
  dueBills: Bill[] = [];
  paidBills: Bill[] = [];
  unpaidBills: Bill[] = [];
  loading = true;
  refreshing = false; // For background refreshes
  error = '';
  userId: number | null = null;
  remainingIncome = 0;
  totalBillAmount = 0;
  totalDueAmount = 0;
  lastUpdated: Date = new Date();
  
  // UI state
  selectedBill: Bill | null = null;
  selectedCategoryFilter = '';
  editModal: any;
  deleteModal: any;
  
  // Subscriptions
  private routeQueryParamsSub: Subscription | null = null;
  private authSub: Subscription | null = null;
  private refreshInterval: any = null;
  
  constructor(
    private billService: BillService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Force loading to false after 7 seconds to prevent infinite spinner
    setTimeout(() => {
      if (this.loading) {
        console.log('Timeout: Forcing loading to false');
        this.loading = false;
        if (!this.error) {
          this.error = 'Unable to load bill data. The bill management API may not be responding.';
        }
      }
    }, 7000);
    
    // Setup route query params subscription to handle refresh from bill creation/edit
    this.routeQueryParamsSub = this.route.queryParams.subscribe(params => {
      const shouldRefresh = params['refresh'] === 'true';
      
      if (shouldRefresh) {
        console.log('Refresh parameter detected, will reload data');
        // Clear the refresh parameter without reloading the page
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { refresh: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
        
        // Reset any error state
        this.error = '';
        
        // Force a complete data refresh with a small delay
        // to ensure the backend has processed any recent changes
        if (this.userId) {
          console.log('Forcing data refresh due to refresh parameter');
          this.loading = true; // Show loading immediately
          
          // Add a small delay to ensure backend has processed any changes
          setTimeout(() => {
            this.loadData(true);
          }, 500);
        }
      }
      
      // Always set up authentication
      this.setupAuthentication();
    });
    
    // Initialize modals
    setTimeout(() => {
      this.initializeModals();
    }, 500);
    
    // Set up auto-refresh every 2 minutes
    this.refreshInterval = setInterval(() => {
      console.log('Auto-refreshing dashboard data');
      if (this.userId) {
        this.loadData(false); // Don't show main loading indicator for auto-refresh
      }
    }, 120000); // Refresh every 2 minutes
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    if (this.routeQueryParamsSub) {
      this.routeQueryParamsSub.unsubscribe();
    }
    
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    
    // Clear auto-refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
  
  private setupAuthentication(): void {
    console.log('Setting up authentication...');
    if (!this.authService.isAuthenticated()) {
      console.error('No authentication token found');
      this.loading = false;
      this.error = 'Please log in to access this page.';
      return;
    }
    
    // Attempt to get user info - try current value first for speed
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      console.log('Using existing user info:', currentUser);
      this.userId = Number(currentUser.id);
      this.loadData();
    } else {
      // No cached user info, try to get from server
      console.log('No cached user, fetching from server...');
      this.authService.getAuthenticatedUser()
        .subscribe({
          next: (user) => {
            if (user && user.id) {
              console.log('Successfully got user info:', user);
              this.userId = Number(user.id);
              this.loadData();
            } else {
              console.error('Got invalid user object:', user);
              this.loading = false;
              this.error = 'Invalid user information returned from server.';
            }
          },
          error: (err) => {
            console.error('Failed to get user info:', err);
            this.loading = false;
            this.error = 'Unable to load user information. Please try logging in again.';
          }
        });
    }
    
    // Unsubscribe from previous subscription if exists
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    
    // Listen for user state changes
    this.authSub = this.authService.currentUser.subscribe({
      next: (user) => {
        if (user && user.id) {
          if (!this.userId) {
            console.log('User updated from subscription:', user);
            this.userId = Number(user.id);
            this.loadData();
          }
        } else if (this.userId) {
          // User logged out
          console.log('User logged out');
          this.userId = null;
          this.loading = false;
          this.error = 'User logged out.';
        }
      }
    });
  }

  initializeModals(): void {
    // Initialize Bootstrap modals
    const editModalEl = document.getElementById('editBillModal');
    const deleteModalEl = document.getElementById('deleteBillModal');
    
    if (editModalEl) {
      this.editModal = new bootstrap.Modal(editModalEl, {
        backdrop: 'static',
        keyboard: false
      });
    }
    
    if (deleteModalEl) {
      this.deleteModal = new bootstrap.Modal(deleteModalEl, {
        backdrop: 'static',
        keyboard: false
      });
    }
    
    // Make sure modals close when buttons are clicked
    document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(button => {
      button.addEventListener('click', () => {
        if (this.editModal) {
          this.editModal.hide();
        }
        if (this.deleteModal) {
          this.deleteModal.hide();
        }
      });
    });
  }

  loadData(showLoading: boolean = true): void {
    if (!this.userId) {
      this.loading = false;
      this.refreshing = false;
      return;
    }
    
    if (showLoading) {
      this.loading = true;
      this.refreshing = false;
    } else {
      // If this is a background refresh, don't show the main loading indicator
      this.loading = false;
      this.refreshing = true;
    }
    this.error = '';
    
    // Try to simulate the data since the backend might not be ready
    try {
      // Reset data before loading new data
      this.bills = [];
      this.filteredBills = [];
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
          console.log('All API calls completed, stopping loading/refresh indicators');
          this.loading = false;
          this.refreshing = false;
        }
      };
      
      // Wrap API calls in try-catch to ensure they don't crash the component
      try {
        // Load all bills
        this.billService.getUserBills(this.userId).subscribe({
          next: (bills) => {
            console.log('Bills loaded:', bills);
            this.bills = bills || [];
            this.filteredBills = [...this.bills]; // Initialize filtered bills
            this.unpaidBills = this.bills.filter(bill => !bill.isPaid);
            this.paidBills = this.bills.filter(bill => bill.isPaid);
            
            // Calculate total bill amount
            this.totalBillAmount = this.calculateTotalAmount(this.bills);
            
            // Apply any existing filters
            this.applyFilters();
            
            // Update last refreshed timestamp
            this.lastUpdated = new Date();
            
            checkAllCompleted();
          },
          error: (err) => {
            console.error('Error loading bills:', err);
            // More specific error message based on status code
            if (err.status === 0) {
              this.error = 'Unable to connect to the bill management API. The backend service may be offline.';
            } else if (err.status === 401 || err.status === 403) {
              this.error = 'Authentication error. Please try logging in again.';
            } else {
              this.error = `Error loading bills: ${err.error?.message || err.message || 'Unknown error'}`;
            }
            this.bills = [];
            this.filteredBills = [];
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
  
  // Mark a bill as unpaid - new functionality
  markAsUnpaid(billId: number): void {
    this.billService.markBillAsUnpaid(billId).subscribe({
      next: () => {
        this.loadData(); // Reload all data
      },
      error: (err) => {
        this.error = 'Failed to mark bill as unpaid. Please try again.';
        console.error(err);
      }
    });
  }
  
  // Reset all monthly bills - new functionality
  resetMonthlyBills(): void {
    if (!this.userId) return;
    
    this.loading = true;
    this.billService.resetMonthlyBills(this.userId).subscribe({
      next: () => {
        this.loadData();
        this.error = '';
      },
      error: (err) => {
        this.error = 'Failed to reset monthly bills. Please try again.';
        console.error(err);
        this.loading = false;
      }
    });
  }
  
  // Edit bill functionality - new
  editBill(bill: Bill): void {
    this.selectedBill = {...bill}; // Create a copy to avoid direct binding
    if (this.editModal) {
      this.editModal.show();
    }
  }
  
  // Save bill changes - new
  saveBillChanges(): void {
    if (!this.selectedBill) return;
    
    this.billService.updateBill(this.selectedBill.id, this.selectedBill).subscribe({
      next: () => {
        if (this.editModal) {
          this.editModal.hide();
        }
        this.loadData();
        this.error = '';
      },
      error: (err) => {
        this.error = 'Failed to update bill. Please try again.';
        console.error(err);
      }
    });
  }
  
  // Delete bill functionality - new
  confirmDeleteBill(bill: Bill): void {
    this.selectedBill = bill;
    if (this.deleteModal) {
      this.deleteModal.show();
    }
  }
  
  deleteBill(): void {
    if (!this.selectedBill) return;
    
    this.billService.deleteBill(this.selectedBill.id).subscribe({
      next: () => {
        if (this.deleteModal) {
          this.deleteModal.hide();
        }
        this.loadData();
        this.error = '';
      },
      error: (err) => {
        this.error = 'Failed to delete bill. Please try again.';
        console.error(err);
      }
    });
  }
  
  // Filter functionality - new
  applyFilters(): void {
    this.filteredBills = [...this.bills]; // Reset to all bills
    
    // Apply category filter if selected
    if (this.selectedCategoryFilter) {
      const categoryId = this.getCategoryIdFromName(this.selectedCategoryFilter);
      this.filteredBills = this.filteredBills.filter(bill => bill.categoryId === categoryId);
    }
  }
  
  clearFilters(): void {
    this.selectedCategoryFilter = '';
    this.filteredBills = [...this.bills];
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
  
  // Check if bill is due (overdue)
  isDue(bill: Bill): boolean {
    if (bill.isPaid) return false;
    
    const today = new Date();
    const currentDay = today.getDate();
    return bill.dueDay < currentDay;
  }
  
  // Check if bill is upcoming (due this week)
  isUpcoming(bill: Bill): boolean {
    if (bill.isPaid) return false;
    
    const today = new Date();
    const currentDay = today.getDate();
    const endOfWeek = currentDay + 7;
    return bill.dueDay >= currentDay && bill.dueDay <= endOfWeek;
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
  
  // Helper to get category ID from name
  getCategoryIdFromName(categoryName: string): number {
    switch(categoryName.toLowerCase()) {
      case 'utilities': return 1;
      case 'rent': return 2;
      case 'insurance': return 3;
      case 'subscription': return 4;
      case 'other': return 5;
      default: return 0;
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
  
  // Force refresh data
  refreshData(): void {
    console.log('Manual refresh requested');
    this.error = '';
    
    if (this.userId) {
      this.loadData(true); // Show full loading indicator for manual refresh
    } else {
      // Try to get user info again
      this.setupAuthentication();
    }
  }
}