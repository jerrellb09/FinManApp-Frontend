import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Budget } from '../models/budget.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = `${environment.apiUrl}/api/budgets`;
  
  constructor(private http: HttpClient) { }
  
  getBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.apiUrl);
  }
  
  getActiveBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${this.apiUrl}/active`);
  }
  
  getBudgetById(id: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.apiUrl}/${id}`);
  }
  
  createBudget(budget: any): Observable<Budget> {
    return this.http.post<Budget>(this.apiUrl, budget);
  }
  
  updateBudget(id: number, budget: any): Observable<Budget> {
    return this.http.put<Budget>(`${this.apiUrl}/${id}`, budget);
  }
  
  deleteBudget(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  getBudgetSpending(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/spending`);
  }
  
  getBudgetCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }
  
  getBudgetTransactions(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/transactions`);
  }
}
