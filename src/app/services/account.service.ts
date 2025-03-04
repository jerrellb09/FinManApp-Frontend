import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account } from '../models/account.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = `${environment.apiUrl}/api/accounts`;
  
  constructor(private http: HttpClient) { }
  
  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.apiUrl);
  }
  
  getAccountById(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/${id}`);
  }
  
  linkAccount(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/link`, { publicToken: token });
  }
  
  getTotalBalance(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/balance`);
  }
  
  syncAccount(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/sync`, {});
  }
}
