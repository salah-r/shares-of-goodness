import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { WalletService, Wallet } from '../../services/wallet.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private walletService = inject(WalletService);

  // Signals
  donations = signal<any[]>([]);
  wallets = signal<Wallet[]>([]);
  filter = signal<'all' | 'pending' | 'approved' | 'rejected'>('all');
  selectedReceiptUrl = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  // Computed Values
  filteredDonations = computed(() => {
    const currentFilter = this.filter();
    const list = this.donations();
    if (currentFilter === 'all') {
      return list;
    }
    return list.filter(d => d.status === currentFilter);
  });

  totalRaised = computed(() => {
    return this.donations()
      .filter(d => d.status === 'approved')
      .reduce((sum, d) => sum + d.shareAmount, 0);
  });

  pendingCount = computed(() => {
    return this.donations().filter(d => d.status === 'pending').length;
  });

  approvedCount = computed(() => {
    return this.donations().filter(d => d.status === 'approved').length;
  });

  ngOnInit() {
    this.loadDonations();
    this.loadWallets();
  }

  loadWallets() {
    this.walletService.getWallets().subscribe({
      next: (data) => this.wallets.set(data),
      error: (err) => console.error('Failed to load wallets:', err)
    });
  }

  loadDonations() {
    this.isLoading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/donations`).subscribe({
      next: (data) => {
        this.donations.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load donations:', err);
        this.isLoading.set(false);
        alert('حدث خطأ أثناء تحميل التبرعات. يرجى التحقق من اتصالك بالخادم.');
      }
    });
  }

  updateStatus(id: string, status: 'approved' | 'rejected') {
    this.http.patch(`${environment.apiUrl}/donations/${id}/status`, { status }).subscribe({
      next: () => {
        // Update local list state directly to preserve responsiveness
        this.donations.update(list => 
          list.map(d => d._id === id ? { ...d, status } : d)
        );
      },
      error: (err) => {
        console.error(`Failed to update status for ${id}:`, err);
        alert('حدث خطأ أثناء تحديث حالة التبرع. يرجى إعادة المحاولة.');
      }
    });
  }

  openReceipt(url: string) {
    this.selectedReceiptUrl.set(url);
  }

  closeReceipt() {
    this.selectedReceiptUrl.set(null);
  }

  setFilter(status: 'all' | 'pending' | 'approved' | 'rejected') {
    this.filter.set(status);
  }

  getWalletName(walletId: string): string {
    const wallet = this.wallets().find(w => w._id === walletId);
    if (wallet) {
      return `${wallet.name} (${wallet.provider})`;
    }
    switch (walletId) {
      case 'vodafone_cash_primary':
        return 'فودافون كاش (أساسي)';
      case 'instapay_primary':
        return 'إنستاباي (أساسي)';
      case 'cib_smart_wallet':
        return 'محفظة ذكية CIB';
      default:
        return walletId || 'غير محدد';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved': return 'badge-approved';
      case 'rejected': return 'badge-rejected';
      default: return 'badge-pending';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'approved': return 'مقبول';
      case 'rejected': return 'مرفوض';
      default: return 'قيد الانتظار';
    }
  }
}
