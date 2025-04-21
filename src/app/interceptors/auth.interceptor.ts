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
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the auth token from the service
    const token = this.authService.getToken();
    
    // Add debug logging
    console.log(`Request to: ${request.url}, Token exists: ${!!token}`);
    
    // Check if token is properly formatted
    if (token) {
      // Log token format (but not the actual token value for security)
      const tokenParts = token.split('.');
      console.log(`Token has ${tokenParts.length} parts (should be 3 for JWT)`);
      
      // Clone the request and add the authorization header
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log(`Added Authorization header for request to: ${request.url}`);
    } else {
      console.warn(`No token available for request to: ${request.url}`);
      
      // If this isn't an auth endpoint, we might need to redirect
      if (!request.url.includes('/auth/')) {
        console.warn('Request to protected endpoint with no token');
      }
    }

    // Handle the request and catch any errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error ${error.status} for ${request.url}:`, error.message);
        
        if (error.status === 401) {
          console.warn('401 Unauthorized response, logging out user');
          // Auto logout if 401 response returned from API
          this.authService.logout();
          this.router.navigate(['/auth/login'], { 
            queryParams: { error: 'Your session has expired. Please log in again.' }
          });
        }
        return throwError(() => error);
      })
    );
  }
}
