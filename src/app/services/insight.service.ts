import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InsightService {
  private apiUrl = 'http://localhost:8080/api/insights';
  
  constructor(private http: HttpClient) { }
  
  getSpendingByCategory(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    
    return this.http.get<any>(`${this.apiUrl}/spending-by-category`, { params });
  }
  
  getSpendingTrend(months?: number): Observable<any> {
    let params = new HttpParams();
    if (months) params = params.set('months', months.toString());
    
    return this.http.get<any>(`${this.apiUrl}/spending-trend`, { params });
  }
  
  getCategoryTrend(categoryId: number, months?: number): Observable<any> {
    let params = new HttpParams();
    if (months) params = params.set('months', months.toString());
    
    return this.http.get<any>(`${this.apiUrl}/category-trend/${categoryId}`, { params });
  }
  
  getBudgetPerformance(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/budget-performance`);
  }
  
  getMonthlySummary(year?: number, month?: number): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());
    
    return this.http.get<any>(`${this.apiUrl}/monthly-summary`, { params });
  }
  
  getSuggestedBudgets(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/suggested-budgets`);
  }
  
  getTopMerchants(limit?: number): Observable<any> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    
    return this.http.get<any>(`${this.apiUrl}/top-merchants`, { params });
  }
}
