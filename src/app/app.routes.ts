import { Routes } from '@angular/router';
import { DonationCheckoutComponent } from './components/donation-checkout/donation-checkout.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

import { AdminListComponent } from './components/admin-list/admin-list.component';
import { WalletListComponent } from './components/wallet-list/wallet-list.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

import { TopDonorsComponent } from './components/top-donors/top-donors.component';

export const routes: Routes = [
  { path: '', redirectTo: 'donate', pathMatch: 'full' },
  { path: 'donate', component: DonationCheckoutComponent },
  { path: 'top-donors', component: TopDonorsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'stats', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'admin/list', component: AdminListComponent, canActivate: [authGuard] },
  { path: 'admin/wallets', component: WalletListComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'donate' }
];
