import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.currentUser();
    // If the logged-in user is the global 'donner' account, prevent access to admin pages
    if (user && user.email === 'donner@donner.com') {
      authService.logout();
      return router.parseUrl('/login');
    }
    return true;
  }

  // Redirect to the login page
  return router.parseUrl('/login');
};
