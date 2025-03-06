import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, forkJoin } from 'rxjs';
import { catchError, tap, timeout, switchMap } from 'rxjs/operators';
import { Bill } from '../models/bill.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private apiUrl = `${environment.apiUrl}/api/bills`;
  
  // In-memory cache of recently created bills to ensure they appear in the UI
  // This is a workaround for backend serialization issues
  private recentlyCreatedBills: Map<number, Bill> = new Map();

  constructor(private http: HttpClient) { }

  // Error handling
  private handleError<T>(error: HttpErrorResponse): Observable<T | never> {
    console.error('API Error:', error);
    
    // Check for nesting depth exceeded error (JSON serialization error from backend)
    if (error && error.message && 
        (error.message.includes('nesting depth') || 
         error.message.includes('HttpMessageNotWritableException') ||
         (error.error && typeof error.error === 'string' && 
          error.error.includes('nesting depth')))) {
      
      console.warn('Detected JSON nesting depth error, returning empty array');
      
      // If this is expecting a Bill[] (for getUserBills or getDueBills), return an empty array
      if (Array.isArray([] as unknown as T)) {
        console.log('Returning empty array for collection response');
        return of([] as unknown as T);
      }
    }
    
    // Special handling for 201 Created responses - treat as success
    if (error.status === 201) {
      console.log('Detected 201 Created status, treating as success');
      
      // If the response body contains valid data, return it as success
      if (error.error && typeof error.error === 'object') {
        console.log('Response body:', error.error);
        return of(error.error as T);
      }
      
      // If we have response data in the error object itself, use that
      if (error.error && (typeof error.error === 'string' || error.error instanceof Blob)) {
        try {
          // Try to parse the response as JSON if it's a string
          const responseData = typeof error.error === 'string' ? JSON.parse(error.error) : error.error;
          console.log('Parsed response data:', responseData);
          return of(responseData as T);
        } catch (e) {
          console.error('Failed to parse 201 response:', e);
        }
      }
      
      // If we don't have usable response data but it's a 201, return a minimal success object
      // Construct a minimal object with an id property if this is a Bill creation
      const successObj = { id: Math.floor(Math.random() * 1000) + 1 } as unknown as T;
      console.log('Creating minimal success object:', successObj);
      return of(successObj);
    }
    
    if (error.status === 0) {
      // A client-side or network error occurred
      console.error('Network error:', error.error);
    } else {
      // The backend returned an unsuccessful response code
      console.error(`Backend returned code ${error.status}, body was:`, error.error);
    }
    
    // Return an observable with a user-facing error message
    return throwError(() => error);
  }

  // Get all bills for the user
  getUserBills(userId: number): Observable<Bill[]> {
    console.log(`Fetching bills for user ${userId}`);
    // Add timestamp to avoid caching
    const timestamp = new Date().getTime();
    
    // Create an observable to get bills from the API
    const apiBills$ = this.http.get<Bill[]>(`${this.apiUrl}/user/${userId}/simple?_ts=${timestamp}`)
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(bills => console.log(`Received ${bills?.length || 0} bills from simple endpoint`)),
        catchError(error => {
          console.warn('Error fetching from simple endpoint, trying regular endpoint', error);
          // If the simple endpoint doesn't exist, fall back to the regular endpoint
          return this.http.get<Bill[]>(`${this.apiUrl}/user/${userId}?_ts=${timestamp}`)
            .pipe(
              timeout(5000),
              tap(bills => console.log(`Received ${bills?.length || 0} bills from regular endpoint`)),
              catchError(secondError => {
                // If we get a nesting depth error, try the individual bill approach
                if (secondError.message && 
                    (secondError.message.includes('nesting depth') || 
                     secondError.message.includes('HttpMessageNotWritableException'))) {
                  console.warn('Detected nesting issue, falling back to individual bill fetching');
                  return this.getAllBillsIndividually(userId);
                }
                return this.handleError<Bill[]>(secondError);
              })
            );
        })
      );
    
    // Return a new observable that combines API bills with cached bills
    return new Observable<Bill[]>(observer => {
      apiBills$.subscribe({
        next: (bills) => {
          // Get any recently created bills from our cache
          const cachedBills = Array.from(this.recentlyCreatedBills.values())
            .filter(bill => bill.userId === userId);
          
          if (cachedBills.length > 0) {
            console.log(`Found ${cachedBills.length} bills in local cache for user ${userId}:`, cachedBills);
            
            // Create a map of API bill IDs for fast lookups
            const apiBillIds = new Set(bills.map(bill => bill.id));
            
            // Filter out cached bills that already exist in the API response to avoid duplicates
            const newCachedBills = cachedBills.filter(bill => !apiBillIds.has(bill.id));
            
            if (newCachedBills.length > 0) {
              console.log(`Adding ${newCachedBills.length} cached bills to the result`);
              // Combine API bills with unique cached bills
              const combinedBills = [...bills, ...newCachedBills];
              observer.next(combinedBills);
            } else {
              // No new cached bills to add
              observer.next(bills);
            }
          } else {
            // No cached bills, just return API bills
            observer.next(bills);
          }
          observer.complete();
        },
        error: (err) => {
          // If API call fails, at least return any cached bills we have
          const cachedBills = Array.from(this.recentlyCreatedBills.values())
            .filter(bill => bill.userId === userId);
          
          if (cachedBills.length > 0) {
            console.log(`API failed but returning ${cachedBills.length} cached bills`);
            observer.next(cachedBills);
            observer.complete();
          } else {
            // No cached bills and API failed
            observer.error(err);
          }
        }
      });
    });
  }

  // Get bills that are currently due
  getDueBills(userId: number): Observable<Bill[]> {
    console.log(`Fetching due bills for user ${userId}`);
    // Add timestamp to avoid caching
    const timestamp = new Date().getTime();
    
    // Try a different endpoint with a simplified JSON response to avoid nesting issues
    return this.http.get<Bill[]>(`${this.apiUrl}/due/${userId}/simple?_ts=${timestamp}`)
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(bills => console.log(`Received ${bills?.length || 0} due bills`)),
        catchError(error => {
          console.warn('Error fetching from simple due bills endpoint, trying regular endpoint', error);
          // If the simple endpoint doesn't exist, fall back to the regular endpoint
          return this.http.get<Bill[]>(`${this.apiUrl}/due/${userId}?_ts=${timestamp}`)
            .pipe(
              timeout(5000),
              catchError(secondError => this.handleError<Bill[]>(secondError))
            );
        })
      );
  }

  // Create a new bill
  createBill(bill: Bill, userId: number): Observable<Bill> {
    console.log(`Creating bill for user ${userId}:`, bill);
    return this.http.post<Bill>(`${this.apiUrl}?userId=${userId}`, bill)
      .pipe(
        timeout(10000), // Increased timeout for slower responses
        tap(createdBill => {
          console.log('Bill created successfully with response:', createdBill);
          // Store the created bill in our cache
          if (createdBill && createdBill.id) {
            const fullBill = { ...bill, ...createdBill, userId };
            this.recentlyCreatedBills.set(createdBill.id, fullBill);
            console.log(`Added bill ${createdBill.id} to local cache:`, fullBill);
          }
        }),
        catchError(error => {
          // If it's a 201 error, treat it as success via handleError
          if (error.status === 201) {
            // Convert the error to a proper response and add to cache
            const errorResult = this.handleError<Bill>(error);
            
            errorResult.subscribe(bill => {
              if (bill && bill.id) {
                // Combine the original bill data with the response
                const fullBill = { ...bill, ...bill, userId };
                this.recentlyCreatedBills.set(bill.id, fullBill);
                console.log(`Added bill ${bill.id} to local cache from 201 response:`, fullBill);
              }
            });
            
            return errorResult;
          }
          
          // For network errors (status 0), attempt a retry
          if (error.status === 0) {
            console.log('Network error creating bill, will retry...');
            // Wait 1 second and try again
            return new Observable<Bill>(observer => {
              setTimeout(() => {
                console.log('Retrying bill creation...');
                this.http.post<Bill>(`${this.apiUrl}?userId=${userId}`, bill)
                  .pipe(
                    timeout(10000),
                    tap(createdBill => {
                      // Store the created bill in our cache
                      if (createdBill && createdBill.id) {
                        const fullBill = { ...bill, ...createdBill, userId };
                        this.recentlyCreatedBills.set(createdBill.id, fullBill);
                        console.log(`Added bill ${createdBill.id} to local cache from retry:`, fullBill);
                      }
                    }),
                    catchError(retryError => this.handleError<Bill>(retryError))
                  )
                  .subscribe({
                    next: (result) => {
                      console.log('Retry succeeded:', result);
                      observer.next(result);
                      observer.complete();
                    },
                    error: (retryError) => {
                      console.error('Retry failed:', retryError);
                      observer.error(retryError);
                    }
                  });
              }, 1000);
            });
          }
          
          // For other errors, pass through to handleError
          return this.handleError<Bill>(error);
        })
      );
  }

  // Update an existing bill
  updateBill(billId: number, bill: Bill): Observable<Bill> {
    console.log(`Updating bill ${billId}:`, bill);
    return this.http.put<Bill>(`${this.apiUrl}/${billId}`, bill)
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(updatedBill => console.log('Bill updated:', updatedBill)),
        catchError(error => this.handleError<Bill>(error))
      );
  }

  // Delete a bill
  deleteBill(billId: number): Observable<void> {
    console.log(`Deleting bill ${billId}`);
    return this.http.delete<void>(`${this.apiUrl}/${billId}`)
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(() => console.log(`Bill ${billId} deleted`)),
        catchError(error => this.handleError<void>(error))
      );
  }

  // Mark a bill as paid
  markBillAsPaid(billId: number): Observable<void> {
    console.log(`Marking bill ${billId} as paid`);
    return this.http.patch<void>(`${this.apiUrl}/${billId}/pay`, {})
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(() => console.log(`Bill ${billId} marked as paid`)),
        catchError(error => this.handleError<void>(error))
      );
  }

  // Mark a bill as unpaid (new functionality)
  markBillAsUnpaid(billId: number): Observable<void> {
    console.log(`Marking bill ${billId} as unpaid`);
    return this.http.patch<void>(`${this.apiUrl}/${billId}/unpay`, {})
      .pipe(
        timeout(5000),
        tap(() => console.log(`Bill ${billId} marked as unpaid`)),
        catchError(error => this.handleError<void>(error))
      );
  }

  // Get remaining income after bills
  getRemainingIncome(userId: number): Observable<{remainingIncome: number}> {
    console.log(`Fetching remaining income for user ${userId}`);
    // Add timestamp to avoid caching
    const timestamp = new Date().getTime();
    return this.http.get<{remainingIncome: number}>(`${this.apiUrl}/remaining-income/${userId}?_ts=${timestamp}`)
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(data => console.log('Remaining income:', data)),
        catchError(error => this.handleError<{remainingIncome: number}>(error))
      );
  }

  // Reset monthly bills (mark recurring bills as unpaid)
  resetMonthlyBills(userId: number): Observable<void> {
    console.log(`Resetting monthly bills for user ${userId}`);
    return this.http.post<void>(`${this.apiUrl}/reset-monthly/${userId}`, {})
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(() => console.log(`Monthly bills reset for user ${userId}`)),
        catchError(error => this.handleError<void>(error))
      );
  }
  
  // Get bills by category (new functionality)
  getBillsByCategory(userId: number, categoryId: number): Observable<Bill[]> {
    console.log(`Fetching bills for user ${userId} with category ${categoryId}`);
    return this.http.get<Bill[]>(`${this.apiUrl}/user/${userId}/category/${categoryId}`)
      .pipe(
        timeout(5000),
        tap(bills => console.log(`Received ${bills?.length || 0} bills for category ${categoryId}`)),
        catchError(error => this.handleError<Bill[]>(error))
      );
  }
  
  // Get a single bill by ID (can be used as fallback when list methods fail due to nesting)
  getBillById(billId: number): Observable<Bill> {
    console.log(`Fetching bill by ID ${billId}`);
    const timestamp = new Date().getTime();
    return this.http.get<Bill>(`${this.apiUrl}/${billId}?_ts=${timestamp}`)
      .pipe(
        timeout(5000),
        tap(bill => console.log(`Received bill with ID ${billId}`)),
        catchError(error => this.handleError<Bill>(error))
      );
  }
  
  // Fallback method to fetch all bills individually
  // Use this when the regular getUserBills fails due to JSON nesting issues
  getAllBillsIndividually(userId: number): Observable<Bill[]> {
    console.log(`Fetching all bill IDs for user ${userId}`);
    
    // First get just the IDs of all bills
    return this.http.get<number[]>(`${this.apiUrl}/user/${userId}/ids`)
      .pipe(
        timeout(5000),
        tap(ids => console.log(`Received ${ids?.length || 0} bill IDs`)),
        switchMap(ids => {
          if (!ids || ids.length === 0) {
            return of([]);
          }
          
          console.log(`Fetching ${ids.length} individual bills`);
          
          // Create an observable for each bill ID
          const billObservables = ids.map(id => this.getBillById(id));
          
          // Combine all observables into a single observable that emits an array
          return forkJoin(billObservables);
        }),
        catchError(error => {
          console.error('Error in getAllBillsIndividually:', error);
          return of([]);
        })
      );
  }
  
  // Manually add a bill to the local cache
  // This can be used when a bill is created successfully but can't be fetched from the backend
  addBillToLocalCache(bill: Bill): void {
    if (bill && bill.id) {
      this.recentlyCreatedBills.set(bill.id, {...bill});
      console.log(`Manually added bill ${bill.id} to local cache:`, bill);
    }
  }
  
  // Clear all bills from the local cache
  clearLocalCache(): void {
    this.recentlyCreatedBills.clear();
    console.log('Cleared local bill cache');
  }
}