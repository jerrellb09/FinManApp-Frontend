import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { User } from './models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  currentUser: User | null = null;
  currentUserName: string = '';
  isLoggedIn: boolean = false;
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      console.log('App component received user update:', user);
      this.currentUser = user;
      this.isLoggedIn = !!user;
      
      if (user) {
        this.currentUserName = `${user.firstName} ${user.lastName}`;
      } else {
        this.currentUserName = '';
      }
    });
    
    // Check for referrer from justjay.net
    this.checkReferrerForDemoMode();
    
    // Check if user is already logged in
    this.isLoggedIn = this.authService.isAuthenticated();
    
    // If token exists but no user info, try to get user info
    if (this.isLoggedIn && !this.currentUser) {
      console.log('App component: Token exists but no user info, refreshing user info');
      this.authService.refreshUserInfo().subscribe({
        next: user => console.log('Successfully refreshed user info in app component'),
        error: err => console.error('Failed to refresh user info in app component:', err)
      });
    }
  }
  
  /**
   * Checks if the user is coming from justjay.net and activates demo mode if they are.
   * This auto-logs them into the demo account.
   */
  private checkReferrerForDemoMode(): void {
    // Skip if user is already logged in
    if (this.authService.isAuthenticated()) {
      console.log('User already authenticated, skipping auto demo login');
      return;
    }
    
    // Check if we've already tried demo login in this session to avoid loops
    const demoLoginAttempted = sessionStorage.getItem('demoLoginAttempted');
    if (demoLoginAttempted) {
      console.log('Demo login already attempted in this session');
      return;
    }
    
    // Two ways to check for demo mode:
    // 1. Get the document referrer (where the user came from)
    const referrer = document.referrer;
    // 2. Check URL parameters for demo mode (allows direct linking to demo mode)
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo') === 'true';
    const fromJustJay = urlParams.get('source') === 'justjay.net';
    
    console.log('Checking demo mode triggers - referrer:', referrer, 'URL params:', {demoMode, fromJustJay});
    
    // Activate demo mode if coming from justjay.net OR if URL params explicitly request it
    if ((referrer && referrer.includes('justjay.net')) || (demoMode && fromJustJay)) {
      console.log('Activating demo mode');
      
      // Mark that we've attempted demo login in this session
      sessionStorage.setItem('demoLoginAttempted', 'true');
      
      // Auto login with demo account
      this.authService.demoLogin().subscribe({
        next: user => {
          console.log('Demo login successful');
          
          // Add a small delay before navigating to ensure everything is properly initialized
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 500);
        },
        error: err => {
          console.error('Demo login failed:', err);
          // Don't redirect, let them log in normally
        }
      });
    }
  }
  
  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  isDemoMode(): boolean {
    return this.authService.isDemoMode();
  }
}
