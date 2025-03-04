import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../../../services/transaction.service';
import { Transaction } from '../../../models/transaction.model';

// Make Math available in the template
declare global {
  interface Window {
    Math: Math;
  }
}

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss']
})
export class TransactionListComponent implements OnInit {
  // Make Math available to the template
  Math = Math;
  transactions: Transaction[] = [];
  loading = true;
  error = '';
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  
  // Filters
  dateFrom = '';
  dateTo = '';
  minAmount: number | null = null;
  maxAmount: number | null = null;
  categoryId: number | null = null;
  searchTerm = '';
  
  constructor(private transactionService: TransactionService) { }
  
  ngOnInit(): void {
    this.loadTransactions();
  }
  
  loadTransactions(): void {
    this.loading = true;
    
    const params: any = {
      page: this.currentPage,
      size: this.pageSize
    };
    
    // Add filters if they have values
    if (this.dateFrom) params.dateFrom = this.dateFrom;
    if (this.dateTo) params.dateTo = this.dateTo;
    if (this.minAmount !== null) params.minAmount = this.minAmount;
    if (this.maxAmount !== null) params.maxAmount = this.maxAmount;
    if (this.categoryId !== null) params.categoryId = this.categoryId;
    if (this.searchTerm) params.search = this.searchTerm;
    
    this.transactionService.getTransactions(params).subscribe({
      next: (data) => {
        this.transactions = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load transactions. Please try again later.';
        this.loading = false;
        console.error(err);
      }
    });
  }
  
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTransactions();
  }
  
  applyFilters(): void {
    this.currentPage = 0; // Reset to first page when applying filters
    this.loadTransactions();
  }
  
  resetFilters(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.minAmount = null;
    this.maxAmount = null;
    this.categoryId = null;
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadTransactions();
  }
  
  getCategoryName(categoryId: number | null): string {
    if (categoryId === null) return 'Uncategorized';
    // Ideally, you would have a category service to get the name from the ID
    return 'Category ' + categoryId; // This is a placeholder
  }
  
  getTransactionIcon(transaction: Transaction): string {
    if (transaction.amount > 0) {
      return 'bi-arrow-down-circle-fill text-success';
    } else {
      return 'bi-arrow-up-circle-fill text-danger';
    }
  }
  
  // Format date to a more readable format
  formatDate(date: Date | string): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    if (date instanceof Date) {
      return date.toLocaleDateString(undefined, options);
    }
    return new Date(date).toLocaleDateString(undefined, options);
  }
}