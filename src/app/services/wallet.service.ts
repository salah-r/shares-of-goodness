import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Admin } from './admin.service';

export interface Wallet {
  _id?: string;
  name: string;
  provider: string;
  number: string;
  adminId: string | Admin; // Can be ID string or populated Admin object
  qrCodeUrl?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wallets`;

  getWallets(): Observable<Wallet[]> {
    return this.http.get<Wallet[]>(this.apiUrl);
  }

  createWallet(wallet: Wallet): Observable<Wallet> {
    return this.http.post<Wallet>(this.apiUrl, wallet);
  }

  updateWallet(id: string, wallet: Partial<Wallet>): Observable<Wallet> {
    return this.http.put<Wallet>(`${this.apiUrl}/${id}`, wallet);
  }

  deleteWallet(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
