import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../../services/account.service';

@Component({
  selector: 'app-account-form',
  templateUrl: './account-form.component.html',
  styleUrls: ['./account-form.component.scss']
})
export class AccountFormComponent implements OnInit {
  accountForm!: FormGroup;
  loading = false;
  error = '';
  success = '';
  linkingMode = false; // Toggle between manual entry and plaid linking

  constructor(
    private formBuilder: FormBuilder,
    private accountService: AccountService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.accountForm = this.formBuilder.group({
      name: ['', Validators.required],
      accountNumber: ['', Validators.required],
      balance: [0, [Validators.required, Validators.min(0)]],
      accountType: ['CHECKING', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.accountForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const account = this.accountForm.value;

    this.accountService.createAccount(account).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Account created successfully!';
        setTimeout(() => {
          this.router.navigate(['/accounts']);
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to create account. Please try again.';
      }
    });
  }

  launchPlaidLink(): void {
    this.loading = true;
    this.error = '';

    // Request link token from your backend
    this.accountService.getPlaidLinkToken().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.linkToken) {
          // Here you would normally launch Plaid Link using the received token
          // For simplicity, we'll just show a success message
          this.success = 'Plaid link initiated. In a real app, this would open Plaid Link interface.';
        } else {
          this.error = 'Failed to initialize account linking.';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to initialize account linking.';
      }
    });
  }

  toggleMode(): void {
    this.linkingMode = !this.linkingMode;
    this.error = '';
    this.success = '';
  }
}