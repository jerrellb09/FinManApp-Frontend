import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import { Bill } from '../models/bill.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private apiUrl = `${environment.apiUrl}/api/bills`;

  constructor(private http: HttpClient) { }

  // Error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
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
    return this.http.get<Bill[]>(`${this.apiUrl}/user/${userId}`)
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(bills => console.log(`Received ${bills?.length || 0} bills`)),
        catchError((error) => {
          console.error('Error fetching bills:', error);
          return throwError(() => error);
        })
      );
  }

  // Get bills that are currently due
  getDueBills(userId: number): Observable<Bill[]> {
    console.log(`Fetching due bills for user ${userId}`);
    return this.http.get<Bill[]>(`${this.apiUrl}/due/${userId}`)
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(bills => console.log(`Received ${bills?.length || 0} due bills`)),
        catchError((error) => {
          console.error('Error fetching due bills:', error);
          return throwError(() => error);
        })
      );
  }

  // Create a new bill
  createBill(bill: Bill, userId: number): Observable<Bill> {
    console.log(`Creating bill for user ${userId}:`, bill);
    return this.http.post<Bill>(`${this.apiUrl}?userId=${userId}`, bill)
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(createdBill => console.log('Bill created:', createdBill)),
        catchError(this.handleError)
      );
  }

  // Update an existing bill
  updateBill(billId: number, bill: Bill): Observable<Bill> {
    console.log(`Updating bill ${billId}:`, bill);
    return this.http.put<Bill>(`${this.apiUrl}/${billId}`, bill)
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(updatedBill => console.log('Bill updated:', updatedBill)),
        catchError(this.handleError)
      );
  }

  // Delete a bill
  deleteBill(billId: number): Observable<void> {
    console.log(`Deleting bill ${billId}`);
    return this.http.delete<void>(`${this.apiUrl}/${billId}`)
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(() => console.log(`Bill ${billId} deleted`)),
        catchError(this.handleError)
      );
  }

  // Mark a bill as paid
  markBillAsPaid(billId: number): Observable<void> {
    console.log(`Marking bill ${billId} as paid`);
    return this.http.patch<void>(`${this.apiUrl}/${billId}/pay`, {})
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(() => console.log(`Bill ${billId} marked as paid`)),
        catchError(this.handleError)
      );
  }

  // Mark a bill as unpaid (new functionality)
  markBillAsUnpaid(billId: number): Observable<void> {
    console.log(`Marking bill ${billId} as unpaid`);
    return this.http.patch<void>(`${this.apiUrl}/${billId}/unpay`, {})
      .pipe(
        timeout(5000),
        tap(() => console.log(`Bill ${billId} marked as unpaid`)),
        catchError(this.handleError)
      );
  }

  // Get remaining income after bills
  getRemainingIncome(userId: number): Observable<{remainingIncome: number}> {
    console.log(`Fetching remaining income for user ${userId}`);
    return this.http.get<{remainingIncome: number}>(`${this.apiUrl}/remaining-income/${userId}`)
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(data => console.log('Remaining income:', data)),
        catchError(this.handleError)
      );
  }

  // Reset monthly bills (mark recurring bills as unpaid)
  resetMonthlyBills(userId: number): Observable<void> {
    console.log(`Resetting monthly bills for user ${userId}`);
    return this.http.post<void>(`${this.apiUrl}/reset-monthly/${userId}`, {})
      .pipe(
        timeout(5000), // Add 5 second timeout
        tap(() => console.log(`Monthly bills reset for user ${userId}`)),
        catchError(this.handleError)
      );
  }
  
  // Get bills by category (new functionality)
  getBillsByCategory(userId: number, categoryId: number): Observable<Bill[]> {
    console.log(`Fetching bills for user ${userId} with category ${categoryId}`);
    return this.http.get<Bill[]>(`${this.apiUrl}/user/${userId}/category/${categoryId}`)
      .pipe(
        timeout(5000),
        tap(bills => console.log(`Received ${bills?.length || 0} bills for category ${categoryId}`)),
        catchError(this.handleError)
      );
  }
}