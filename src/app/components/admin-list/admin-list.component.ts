import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Admin } from '../../services/admin.service';

@Component({
  selector: 'app-admin-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-list.component.html',
  styleUrls: ['./admin-list.component.scss']
})
export class AdminListComponent implements OnInit {
  private adminService = inject(AdminService);

  admins = signal<Admin[]>([]);
  showDialog = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  
  currentAdmin: Admin = { name: '', email: '', isActive: true };

  ngOnInit() {
    this.loadAdmins();
  }

  loadAdmins() {
    this.adminService.getAdmins().subscribe({
      next: (data) => this.admins.set(data),
      error: (err) => console.error('Failed to load admins', err)
    });
  }

  openAddDialog() {
    this.isEditing.set(false);
    this.currentAdmin = { name: '', email: '', password: '', isActive: true };
    this.showDialog.set(true);
  }

  openEditDialog(admin: Admin) {
    this.isEditing.set(true);
    this.currentAdmin = { ...admin, password: '' };
    this.showDialog.set(true);
  }

  closeDialog() {
    this.showDialog.set(false);
  }

  saveAdmin() {
    if (this.isEditing() && this.currentAdmin._id) {
      this.adminService.updateAdmin(this.currentAdmin._id, this.currentAdmin).subscribe(() => {
        this.loadAdmins();
        this.closeDialog();
      });
    } else {
      this.adminService.createAdmin(this.currentAdmin).subscribe(() => {
        this.loadAdmins();
        this.closeDialog();
      });
    }
  }

  deleteAdmin(id: string) {
    if (confirm('هل أنت متأكد من حذف هذا المشرف؟ ستُحذف أيضاً جميع المحافظ المرتبطة به.')) {
      this.adminService.deleteAdmin(id).subscribe(() => {
        this.loadAdmins();
      });
    }
  }
}
