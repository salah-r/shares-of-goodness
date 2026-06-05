import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  login() {
    if (!this.email || !this.password) {
      this.errorMessage.set('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/stats']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('بيانات الدخول غير صحيحة');
        console.error('Login error', err);
      }
    });
  }
}
