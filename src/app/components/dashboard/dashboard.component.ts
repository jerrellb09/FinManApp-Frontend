import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../services/account.service';
import { TransactionService } from '../../services/transaction.service';
import { BudgetService } from '../../services/budget.service';
import { InsightService } from '../../services/insight.service';
import { Account } from '../../models/account.model';
import { Transaction } from '../../models/transaction.model';
import { Budget } from '../../models/budget.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
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
  
  constructor(
    private accountService: AccountService,
    private transactionService: TransactionService,
    private budgetService: BudgetService,
    private insightService: InsightService
  ) {}
  
  ngOnInit(): void {
    this.loadAccounts();
    this.loadRecentTransactions();
    this.loadActiveBudgets();
    this.loadSpendingByCategory();
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
    // For each active budget, get its current spending
    this.activeBudgets.forEach((budget, index) => {
      this.budgetService.getBudgetSpending(budget.id).subscribe({
        next: (data) => {
          this.activeBudgets[index] = { ...budget, spending: data };
        },
        error: (err) => {
          console.error(`Failed to load spending for budget ${budget.id}`, err);
        }
      });
    });
  }
  
  loadSpendingByCategory(): void {
    // Get current month's spending by category
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.insightService.getSpendingByCategory(
      firstDay.toISOString().split('T')[0],
      lastDay.toISOString().split('T')[0]
    ).subscribe({
      next: (data) => {
        this.spendingByCategory = data;
        this.loading.insights = false;
      },
      error: (err) => {
        this.error.insights = 'Failed to load spending insights';
        this.loading.insights = false;
        console.error(err);
      }
    });
  }
  
  calculateTotalBalance(): void {
    this.totalBalance = this.accounts.reduce((sum, account) => sum + account.balance, 0);
  }
  
  getBudgetProgress(budget: any): number {
    if (!budget.spending) return 0;
    return (budget.spending.currentSpending / budget.amount) * 100;
  }
  
  getProgressBarClass(percentage: number): string {
    if (percentage >= 100) return 'bg-danger';
    if (percentage >= 80) return 'bg-warning';
    return 'bg-success';
  }
}
