import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private jwtHelper = new JwtHelperService();
  private readonly TOKEN_KEY = 'auth_token';
  
  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }
  
  login(email: string, password: string): Observable<any> {
    return this.http.post<{token: string, user: User}>(`${environment.apiUrl}/api/auth/login`, { email, password })
      .pipe(
        tap(response => {
          this.setSession(response.token);
          this.currentUserSubject.next(response.user);
        })
      );
  }
  
  register(user: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/auth/register`, user);
  }
  
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }
  
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && !this.jwtHelper.isTokenExpired(token);
  }
  
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
  
  private setSession(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  private loadStoredUser(): void {
    const token = this.getToken();
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      // Assuming the token contains user information
      this.currentUserSubject.next({
        id: decodedToken.sub,
        email: decodedToken.email,
        firstName: decodedToken.firstName,
        lastName: decodedToken.lastName
      });
    }
  }
}
