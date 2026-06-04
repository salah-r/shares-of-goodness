import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  // Reactive state for authentication
  isAuthenticated = signal<boolean>(this.hasToken());
  currentUser = signal<any>(this.getUserFromStorage());

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem('adminToken', res.token);
          localStorage.setItem('adminUser', JSON.stringify(res.admin));
          this.isAuthenticated.set(true);
          this.currentUser.set(res.admin);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('adminToken');
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('adminToken');
  }

  private getUserFromStorage(): any {
    const userStr = localStorage.getItem('adminUser');
    return userStr ? JSON.parse(userStr) : null;
  }
}
