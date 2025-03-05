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
  
  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
