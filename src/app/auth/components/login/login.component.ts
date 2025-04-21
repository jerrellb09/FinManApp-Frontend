import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  demoLoading = false; // For demo button loading state
  returnUrl: string = '/';
  error: string = '';
  debug: boolean = false; // Can be enabled via query param

  constructor(
    private formBuilder: FormBuilder,
    public route: ActivatedRoute,
    private router: Router,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Check for debug mode
    this.debug = this.route.snapshot.queryParams['debug'] === 'true';
    
    // Pre-fill email if provided (from registration)
    const email = this.route.snapshot.queryParams['email'];
    if (email) {
      this.loginForm.controls['email'].setValue(email);
    }
    
    // Output auth status for debugging
    if (this.debug) {
      console.log('Auth check on login page init');
      console.log('Token exists:', !!localStorage.getItem('token'));
      console.log('User data exists:', !!localStorage.getItem('currentUser'));
      console.log('Auth service reports authenticated:', this.authService.isAuthenticated());
    }
    
    // Auto navigate to home if already logged in
    if (this.authService.isAuthenticated()) {
      console.log('User already authenticated, redirecting to home');
      this.router.navigate(['/']);
    }
  }
  
  // Helper methods for template access
  hasToken(): boolean {
    return !!localStorage.getItem('token');
  }
  
  hasUserData(): boolean {
    return !!localStorage.getItem('currentUser');
  }
  
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
  
  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    // Log to debug the login process
    console.log('Attempting login with email:', this.loginForm.controls['email'].value);
    
    this.authService.login(
      this.loginForm.controls['email'].value,
      this.loginForm.controls['password'].value
    ).subscribe({
      next: (response) => {
        console.log('Login successful, token saved:', !!localStorage.getItem('token'));
        
        // Verify token was saved correctly
        if (!localStorage.getItem('token')) {
          console.error('Login response received but token not saved to localStorage');
          this.error = 'Authentication error: Token not saved. Please try again.';
          this.loading = false;
          return;
        }
        
        // Short delay to let auth state propagate
        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 300);
      },
      error: error => {
        console.error('Login error:', error);
        this.error = error.message || error.error?.message || 'Invalid credentials';
        this.loading = false;
      }
    });
  }
  
  /**
   * Handles the demo login when user clicks the "Try Demo" button.
   * Uses the auth service's demoLogin method to authenticate with the backend.
   */
  tryDemoMode(): void {
    this.demoLoading = true;
    this.error = '';
    
    console.log('Attempting demo login');
    
    this.authService.demoLogin().subscribe({
      next: (response) => {
        console.log('Demo login successful');
        
        // Verify token was saved correctly
        if (!localStorage.getItem('token')) {
          console.error('Demo login response received but token not saved to localStorage');
          this.error = 'Authentication error: Token not saved. Please try again.';
          this.demoLoading = false;
          return;
        }
        
        // Short delay to let auth state propagate
        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 300);
      },
      error: error => {
        console.error('Demo login error:', error);
        this.error = error.message || 'Demo mode is only available when accessing from justjay.net';
        this.demoLoading = false;
      }
    });
  }
}
