import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    
    // Log URLs for debugging but avoid logging sensitive data
    const isAuthRequest = request.url.includes('/auth/');
    console.log(`HTTP Request to: ${request.url}, Method: ${request.method}, Auth: ${!!token}`);
    
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Added Authorization header to request');
    } else {
      console.warn('No token available for request to: ' + request.url);
      
      // If this is not an auth request and we have no token, try to refresh user info
      if (!isAuthRequest) {
        console.warn('Non-auth request with no token - user may need to log in again');
      }
    }
    
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`HTTP Error: ${error.status} on ${request.url}`, error);
        
        if (error.status === 401 || error.status === 403) {
          console.warn('Authentication error detected, redirecting to login page');
          this.authService.logout();
          this.router.navigate(['/auth/login'], { 
            queryParams: { 
              returnUrl: this.router.url,
              error: 'Your session has expired. Please log in again.'
            } 
          });
        }
        return throwError(() => error);
      })
    );
  }
}
