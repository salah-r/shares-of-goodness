import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService, Wallet } from '../../services/wallet.service';
import { AdminService, Admin } from '../../services/admin.service';

@Component({
  selector: 'app-wallet-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet-list.component.html',
  styleUrls: ['./wallet-list.component.scss']
})
export class WalletListComponent implements OnInit {
  private walletService = inject(WalletService);
  private adminService = inject(AdminService);

  wallets = signal<Wallet[]>([]);
  admins = signal<Admin[]>([]);
  showDialog = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  
  currentWallet: Wallet = { name: '', provider: '', number: '', adminId: '', isActive: true, isPrimary: false };

  ngOnInit() {
    this.loadWallets();
    this.loadAdmins();
  }

  loadWallets() {
    this.walletService.getWallets().subscribe({
      next: (data) => this.wallets.set(data),
      error: (err) => console.error('Failed to load wallets', err)
    });
  }

  loadAdmins() {
    this.adminService.getAdmins().subscribe({
      next: (data) => this.admins.set(data),
      error: (err) => console.error('Failed to load admins', err)
    });
  }

  openAddDialog() {
    this.isEditing.set(false);
    this.currentWallet = { name: '', provider: '', number: '', adminId: '', isActive: true, isPrimary: false };
    this.showDialog.set(true);
  }

  openEditDialog(wallet: Wallet) {
    this.isEditing.set(true);
    // If adminId is populated, extract the ID
    const adminId = typeof wallet.adminId === 'object' ? (wallet.adminId as any)._id : wallet.adminId;
    this.currentWallet = { ...wallet, adminId };
    this.showDialog.set(true);
  }

  closeDialog() {
    this.showDialog.set(false);
  }

  saveWallet() {
    if (this.isEditing() && this.currentWallet._id) {
      this.walletService.updateWallet(this.currentWallet._id, this.currentWallet).subscribe(() => {
        this.loadWallets();
        this.closeDialog();
      });
    } else {
      this.walletService.createWallet(this.currentWallet).subscribe(() => {
        this.loadWallets();
        this.closeDialog();
      });
    }
  }

  deleteWallet(id: string) {
    if (confirm('هل أنت متأكد من حذف هذه المحفظة؟')) {
      this.walletService.deleteWallet(id).subscribe(() => {
        this.loadWallets();
      });
    }
  }

  getAdminName(adminId: any): string {
    if (!adminId) return 'غير محدد';
    if (typeof adminId === 'object') return adminId.name;
    const admin = this.admins().find(a => a._id === adminId);
    return admin ? admin.name : 'غير معروف';
  }
}
