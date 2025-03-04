import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:8080/api/transactions';
  
  constructor(private http: HttpClient) { }
  
  getTransactions(params?: {
    accountId?: number,
    categoryId?: number,
    startDate?: string,
    endDate?: string,
    minAmount?: number,
    maxAmount?: number,
    search?: string,
    page?: number,
    size?: number
  }): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        // @ts-ignore
        if (params[key] !== undefined) {
          // @ts-ignore
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    
    return this.http.get<any>(this.apiUrl, { params: httpParams });
  }
  
  getTransactionById(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }
  
  addTransaction(transaction: any): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, transaction);
  }
  
  updateTransaction(id: number, transaction: any): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.apiUrl}/${id}`, transaction);
  }
  
  deleteTransaction(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  categorizeTransaction(id: number, categoryId: number): Observable<Transaction> {
    return this.http.post<Transaction>(
      `${this.apiUrl}/categorize/${id}`,
      { categoryId }
    );
  }
  
  syncTransactions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sync`);
  }
}
