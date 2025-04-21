import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api`;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  
  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Try to restore user session if we have a token but no user
    if (this.getToken() && !this.currentUserValue) {
      this.refreshUserInfo().subscribe();
    }
  }
  
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
  
  login(email: string, password: string): Observable<User> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        map(response => {
          console.log('Login response:', response);
          
          // Validate response contains expected data
          if (!response || !response.token) {
            throw new Error('Invalid login response - missing token');
          }
          
          // Use user from response or fetch from token
          const user = response.user;
          if (!user || !user.id) {
            console.warn('Login response missing user data, will try to fetch from /whoami');
            // Store token anyway so we can fetch user info
            localStorage.setItem('token', response.token);
            // Try to get user info using the token
            this.refreshUserInfo().subscribe();
            return null as any; // Return placeholder to continue the flow
          }
          
          // Fully valid response
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('token', response.token);
          this.currentUserSubject.next(user);
          return user;
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => new Error('Login failed. Please check your credentials.'));
        })
      );
  }
  
  /**
   * Logs the user in with the demo account.
   * This method is used when accessing the application from justjay.net
   * or when clicking the Demo button.
   * 
   * @returns An observable of User with the demo user information
   */
  demoLogin(): Observable<User> {
    console.log('Attempting demo login...');
    
    return this.http.get<any>(`${this.apiUrl}/auth/demo-login`, {
      headers: {
        // Add a custom header to indicate this is a demo login request
        'X-Demo-Request': 'true',
        // Set Referer header to justjay.net (this is required by the backend)
        'Referer': 'https://justjay.net'
      }
    }).pipe(
      map(response => {
        console.log('Demo login response:', response);
        
        // Validate response contains expected data
        if (!response || !response.token) {
          throw new Error('Invalid demo login response - missing token');
        }
        
        // Use user from response
        const user = response.user;
        if (!user || !user.id) {
          throw new Error('Invalid demo login response - missing user data');
        }
        
        // Set demo flag in localStorage to indicate this is a demo session
        localStorage.setItem('demoMode', 'true');
        
        // Save user data and token
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('token', response.token);
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError(error => {
        console.error('Demo login error:', error);
        
        // Provide a better error message based on the error
        let errorMessage = 'Failed to access demo mode';
        
        if (error.status === 403) {
          errorMessage = 'Demo access is only available from justjay.net';
        } else if (error.status === 404) {
          errorMessage = 'Demo mode is not available';
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized to access demo mode';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  
  /**
   * Checks if the current session is in demo mode.
   * 
   * @returns True if the current session is using a demo account
   */
  isDemoMode(): boolean {
    return localStorage.getItem('demoMode') === 'true';
  }
  
  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, user);
  }
  
  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('demoMode'); // Clear demo mode flag
    this.currentUserSubject.next(null);
  }
  
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      console.warn('No token available - user is not authenticated');
      return false;
    }
    
    try {
      // Add basic token validation
      // JWT tokens have 3 parts separated by dots
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format');
        // Clear invalid token
        this.logout();
        return false;
      }
      
      // Simple token expiration check
      // This is not secure but just an additional layer to prevent obviously expired tokens
      const payload = JSON.parse(atob(parts[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      
      if (expiry && Date.now() >= expiry) {
        console.warn('Token has expired, logging out');
        this.logout();
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Error processing token', e);
      this.logout();
      return false;
    }
  }
  
  // Get current user info from server
  refreshUserInfo(): Observable<User> {
    // If not authenticated, don't make the request
    if (!this.isAuthenticated()) {
      console.warn('refreshUserInfo called when not authenticated');
      return throwError(() => new Error('Not authenticated'));
    }
    
    console.log('Refreshing user info from /api/auth/whoami endpoint');
    const token = this.getToken();
    console.log('Using token:', token ? 'Token exists (not shown for security)' : 'No token!');
    
    return this.http.get<User>(`${this.apiUrl}/auth/whoami`)
      .pipe(
        tap(user => {
          console.log('User info response received:', user);
          if (user && user.id) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
            console.log('User info successfully updated in local storage and subject');
          } else {
            console.error('Response from /whoami did not contain valid user data:', user);
            // If response doesn't have required user info, treat as error
            throw new Error('Invalid user data received');
          }
        }),
        catchError(error => {
          console.error('Error fetching user info:', error);
          // Check if this is an auth error
          if (error.status === 401 || error.status === 403) {
            console.warn('Authentication error - clearing stored credentials');
            this.logout(); // Clear invalid tokens
          }
          return throwError(() => new Error('Failed to fetch user information: ' + (error.message || 'Unknown error')));
        })
      );
  }
  
  // Force get current user - either from cache or server
  getAuthenticatedUser(): Observable<User> {
    // First check if we're authenticated
    if (!this.isAuthenticated()) {
      return throwError(() => new Error('Not authenticated - missing token'));
    }
    
    // If we already have valid user data, return it
    if (this.currentUserValue && this.currentUserValue.id) {
      console.log('Using cached user data:', this.currentUserValue);
      return of(this.currentUserValue);
    }
    
    // Otherwise try to get it from server
    console.log('No cached user data, fetching from server');
    return this.refreshUserInfo().pipe(
      // Add extra error handling for debugging
      catchError(error => {
        console.error('Error in getAuthenticatedUser():', error);
        // If we got an auth error, clear token
        if (error.status === 401 || error.status === 403) {
          console.warn('Auth error in getAuthenticatedUser, logging out');
          this.logout();
        }
        return throwError(() => new Error(`Failed to get authenticated user: ${error.message || 'Unknown error'}`));
      })
    );
  }
}
