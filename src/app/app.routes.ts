import { Routes } from '@angular/router';
import { DonationCheckoutComponent } from './components/donation-checkout/donation-checkout.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'donate', pathMatch: 'full' },
  { path: 'donate', component: DonationCheckoutComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: '**', redirectTo: 'donate' }
];
