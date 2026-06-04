import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-top-donors',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './top-donors.component.html',
  styleUrl: './top-donors.component.scss'
})
export class TopDonorsComponent implements OnInit {
  private http = inject(HttpClient);

  topDonors = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.fetchTopDonors();
  }

  fetchTopDonors() {
    this.isLoading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/donations/top`).subscribe({
      next: (data) => {
        this.topDonors.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch top donors', err);
        this.isLoading.set(false);
      }
    });
  }
}
