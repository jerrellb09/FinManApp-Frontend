import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccountService } from '../../services/account.service';
import { TransactionService } from '../../services/transaction.service';
import { BudgetService } from '../../services/budget.service';
import { InsightService } from '../../services/insight.service';
import { AuthService } from '../../services/auth.service';
import { Account } from '../../models/account.model';
import { Transaction } from '../../models/transaction.model';
import { Budget } from '../../models/budget.model';
import { catchError, finalize, forkJoin, map, Observable, of, Subject, takeUntil, timer } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  accounts: Account[] = [];
  recentTransactions: Transaction[] = [];
  activeBudgets: (Budget & { spending?: any })[] = [];
  totalBalance = 0;
  spendingByCategory: any[] = [];
  loading = {
    accounts: true,
    transactions: true,
    budgets: true,
    insights: true
  };
  error = {
    accounts: '',
    transactions: '',
    budgets: '',
    insights: ''
  };
  
  // Add flag to track initial data load
  initialLoadComplete = false;
  
  // Retry mechanism
  maxRetries = 3;
  retryDelay = 1000; // milliseconds
  
  // Destroy notifier for cleanup
  private destroy$ = new Subject<void>();
  
  constructor(
    private accountService: AccountService,
    private transactionService: TransactionService,
    private budgetService: BudgetService,
    private insightService: InsightService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    // First make sure we have user info, then load all data
    this.ensureAuthenticated(() => {
      // Use forkJoin to load all data in parallel with proper completion detection
      this.loadDashboardData();
    });
    
    // Set up a refresh timer for the dashboard data every 30 seconds
    timer(30000, 30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.authService.isAuthenticated()) {
          console.log('Refreshing dashboard data...');
          this.refreshDashboardData();
        }
      });
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private ensureAuthenticated(callback: () => void): void {
    if (!this.authService.isAuthenticated()) {
      console.warn('Not authenticated, cannot load dashboard data');
      return;
    }
    
    // If we already have user data, proceed immediately
    if (this.authService.currentUserValue) {
      callback();
      return;
    }
    
    // Otherwise, fetch user info first
    console.log('Fetching user info before loading dashboard data');
    this.authService.refreshUserInfo()
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          console.error('Error refreshing user info:', err);
          return of(null);
        })
      )
      .subscribe(user => {
        if (user) {
          callback();
        } else {
          console.error('Failed to get user info, cannot load dashboard data');
        }
      });
  }
  
  private loadDashboardData(retryCount = 0): void {
    // Reset any existing errors
    this.error = {
      accounts: '',
      transactions: '',
      budgets: '',
      insights: ''
    };
    
    // Set all loading flags to true
    this.loading = {
      accounts: true,
      transactions: true,
      budgets: true,
      insights: true
    };
    
    // Create observables for all data fetching operations
    const accounts$ = this.accountService.getAccounts().pipe(
      catchError(err => {
        console.error('Error loading accounts:', err);
        this.error.accounts = 'Failed to load accounts';
        return of([]);
      })
    );
    
    const transactions$ = this.transactionService.getTransactions({ page: 0, size: 5 }).pipe(
      catchError(err => {
        console.error('Error loading transactions:', err);
        this.error.transactions = 'Failed to load recent transactions';
        return of({ content: [] });
      })
    );
    
    const budgets$ = this.budgetService.getActiveBudgets().pipe(
      catchError(err => {
        console.error('Error loading budgets:', err);
        this.error.budgets = 'Failed to load budgets';
        return of([]);
      })
    );
    
    // Create date range for spending insights
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const insights$ = this.insightService.getSpendingByCategory(
      firstDay.toISOString().split('T')[0],
      lastDay.toISOString().split('T')[0]
    ).pipe(
      catchError(err => {
        console.error('Error loading spending insights:', err);
        this.error.insights = 'Failed to load spending insights';
        return of([]);
      }),
      // Ensure we always return an array, even if the API returns null
      map(result => result || [])
    );
    
    // Use forkJoin to run all requests in parallel and wait for all to complete
    forkJoin({
      accounts: accounts$,
      transactions: transactions$,
      budgets: budgets$,
      insights: insights$
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        // Always set loading to false when done, regardless of success/failure
        this.loading = {
          accounts: false,
          transactions: false,
          budgets: false,
          insights: false
        };
        this.initialLoadComplete = true;
      })
    )
    .subscribe({
      next: (results) => {
        // Process accounts data
        this.accounts = results.accounts || [];
        this.calculateTotalBalance();
        
        // Process transactions data
        this.recentTransactions = results.transactions?.content || [];
        
        // Process budgets data
        this.activeBudgets = results.budgets || [];
        if (this.activeBudgets.length > 0) {
          this.loadBudgetSpending();
        }
        
        // Process spending data
        this.spendingByCategory = results.insights || [];
        
        console.log('All dashboard data loaded successfully');
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        
        // Retry logic if needed
        if (retryCount < this.maxRetries) {
          console.log(`Retrying dashboard data load (${retryCount + 1}/${this.maxRetries})...`);
          setTimeout(() => {
            this.loadDashboardData(retryCount + 1);
          }, this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        }
      }
    });
  }
  
  // Method to refresh dashboard data without showing loading indicators
  private refreshDashboardData(): void {
    // Only refresh if initial load completed
    if (!this.initialLoadComplete) {
      return;
    }
    
    // Use the same loading process but don't show loading indicators
    this.loadDashboardData();
  }
  
  loadAccounts(): void {
    this.accountService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.calculateTotalBalance();
        this.loading.accounts = false;
      },
      error: (err) => {
        this.error.accounts = 'Failed to load accounts';
        this.loading.accounts = false;
        console.error(err);
      }
    });
  }
  
  loadRecentTransactions(): void {
    // Get the last 5 transactions
    this.transactionService.getTransactions({ page: 0, size: 5 }).subscribe({
      next: (data) => {
        this.recentTransactions = data.content;
        this.loading.transactions = false;
      },
      error: (err) => {
        this.error.transactions = 'Failed to load recent transactions';
        this.loading.transactions = false;
        console.error(err);
      }
    });
  }
  
  loadActiveBudgets(): void {
    this.budgetService.getActiveBudgets().subscribe({
      next: (budgets) => {
        this.activeBudgets = budgets;
        this.loadBudgetSpending();
        this.loading.budgets = false;
      },
      error: (err) => {
        this.error.budgets = 'Failed to load budgets';
        this.loading.budgets = false;
        console.error(err);
      }
    });
  }
  
  loadBudgetSpending(): void {
    // Create an array of observables for all budget spending requests
    const spendingRequests: Observable<any>[] = [];
    
    // For each active budget, create a spending request and track its index
    const budgetIndices: { [key: string]: number } = {};
    
    this.activeBudgets.forEach((budget, index) => {
      // Skip if budget has no id
      if (!budget.id) {
        console.warn('Budget missing ID, cannot load spending');
        // Create a placeholder spending object to prevent UI errors
        this.activeBudgets[index] = { 
          ...budget, 
          spending: { 
            currentSpending: 0, 
            budgetAmount: budget.amount || 0,
            percentageUsed: 0,
            remaining: budget.amount || 0
          } 
        };
        return;
      }
      
      // Create request and save the index
      const budgetId = budget.id.toString();
      budgetIndices[budgetId] = index;
      
      // Add the request to our array
      spendingRequests.push(
        this.budgetService.getBudgetSpending(budget.id).pipe(
          catchError(err => {
            console.error(`Failed to load spending for budget ${budget.id}`, err);
            // Return default data on error
            return of({ 
              currentSpending: 0, 
              budgetAmount: budget.amount || 0,
              percentageUsed: 0,
              remaining: budget.amount || 0,
              budgetId: budget.id
            });
          })
        )
      );
    });
    
    // If no requests, return early
    if (spendingRequests.length === 0) {
      return;
    }
    
    // Run all requests in parallel
    forkJoin(spendingRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        // Process all results
        results.forEach(data => {
          const budgetId = data.budgetId ? data.budgetId.toString() : null;
          if (budgetId && budgetIndices[budgetId] !== undefined) {
            const index = budgetIndices[budgetId];
            this.activeBudgets[index] = { 
              ...this.activeBudgets[index], 
              spending: data 
            };
          }
        });
        console.log('All budget spending data loaded successfully');
      });
  }
  
  // Keep the original function name for the HTML binding
  // This needs to be public for the reload button
  public reloadDashboard(): void {
    this.loadDashboardData();
  }
  
  calculateTotalBalance(): void {
    // Set default to 0 if accounts is missing
    if (!this.accounts || !Array.isArray(this.accounts)) {
      this.totalBalance = 0;
      return;
    }
    
    this.totalBalance = this.accounts.reduce((sum, account) => {
      // Handle potential null or undefined values
      if (!account) return sum;
      const balance = account.balance || 0;
      return sum + balance;
    }, 0);
  }
  
  getBudgetProgress(budget: any): number {
    if (!budget || !budget.spending || !budget.amount) return 0;
    const currentSpending = budget.spending.currentSpending || 0;
    const amount = budget.amount || 1; // Avoid division by zero
    return (currentSpending / amount) * 100;
  }
  
  getProgressBarClass(percentage: number): string {
    if (!percentage && percentage !== 0) return 'bg-success';
    if (percentage >= 100) return 'bg-danger';
    if (percentage >= 80) return 'bg-warning';
    return 'bg-success';
  }
}
