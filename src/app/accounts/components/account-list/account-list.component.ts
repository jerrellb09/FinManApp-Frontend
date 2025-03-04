import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AccountService } from '../../../services/account.service';
import { Account } from '../../../models/account.model';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss'],
  providers: [DatePipe]
})
export class AccountListComponent implements OnInit {
  accounts: Account[] = [];
  loading = true;
  error = '';
  totalBalance = 0;

  constructor(private accountService: AccountService) { }

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    this.accountService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.calculateTotalBalance();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load accounts. Please try again later.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  calculateTotalBalance(): void {
    this.totalBalance = this.accounts.reduce((sum, account) => sum + account.balance, 0);
  }

  syncAccount(id: number): void {
    const account = this.accounts.find(a => a.id === id);
    if (!account) return;
    
    account.syncing = true;
    this.accountService.syncAccount(id).subscribe({
      next: (response) => {
        const index = this.accounts.findIndex(a => a.id === id);
        if (index !== -1) {
          // Update account with new balance
          this.accounts[index] = { ...this.accounts[index], ...response, syncing: false };
          this.calculateTotalBalance();
        }
      },
      error: (err) => {
        const index = this.accounts.findIndex(a => a.id === id);
        if (index !== -1) {
          this.accounts[index].syncing = false;
        }
        console.error(`Failed to sync account ${id}`, err);
      }
    });
  }

  getAccountTypeLabel(type: string): string {
    switch (type) {
      case 'CHECKING': return 'Checking';
      case 'SAVINGS': return 'Savings';
      case 'CREDIT_CARD': return 'Credit Card';
      case 'INVESTMENT': return 'Investment';
      case 'OTHER': return 'Other';
      default: return type;
    }
  }

  syncAll(): void {
    this.accounts.forEach(account => {
      this.syncAccount(account.id);
    });
  }
  
  getCurrentDate(): Date {
    return new Date();
  }
}