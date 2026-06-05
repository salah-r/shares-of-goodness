import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { DonationRecoveryService } from '../../services/donation-recovery.service';
import { WalletService, Wallet } from '../../services/wallet.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-donation-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './donation-checkout.component.html',
  styleUrls: ['./donation-checkout.component.scss']
})
export class DonationCheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recoveryService = inject(DonationRecoveryService);
  private walletService = inject(WalletService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // Form Definition with RTL / Elderly friendly Validation Rules
  donationForm: FormGroup = this.fb.group({
    donorName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^01[0-2,5]{1}[0-9]{8}$/)]], // Egyptian phone pattern
    isAnonymous: [false],
    shareAmount: [100, [Validators.required, Validators.min(10)]],
    sharePackageId: [''],
    walletId: ['', Validators.required]
  });

  // Signals for application state management
  currentStep = signal<number>(1); // Step 1: Data entry, Step 2: Upload receipt, Step 3: Success page
  selectedFile = signal<File | null>(null);
  filePreview = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);
  showRecoveryDialog = signal<boolean>(false);
  availableWallets = signal<Wallet[]>([]);

  // Computed signals
  hasAbandoned = computed(() => this.recoveryService.hasAbandonedDonation());
  selectedWalletDetails = computed(() => {
    return this.availableWallets().find(w => w._id === this.donationForm.get('walletId')?.value);
  });

  ngOnInit() {
    // Detect abandoned state on layout load
    if (this.hasAbandoned()) {
      this.showRecoveryDialog.set(true);
    }

    // Workaround for backend un-deployed changes: 
    // Auto login as a pseudo donor to fetch wallets
    if (!this.authService.isAuthenticated() || this.authService.currentUser()?.email !== 'donner@donner.com') {
      this.authService.login({ email: 'donner@donner.com', password: 'donner123' }).subscribe({
        next: () => {
          this.loadWallets();
        },
        error: (err) => {
          console.error('Failed to login as donner:', err);
          this.loadWallets(); // Try anyway just in case
        }
      });
    } else {
      this.loadWallets();
    }

    // Handle isAnonymous toggle to add/remove required validation dynamically
    this.donationForm.get('isAnonymous')?.valueChanges.subscribe(isAnon => {
      const donorNameControl = this.donationForm.get('donorName');
      if (isAnon) {
        donorNameControl?.clearValidators();
        donorNameControl?.setValue('فاعل خير');
        donorNameControl?.disable();
      } else {
        donorNameControl?.setValidators([Validators.required]);
        if (donorNameControl?.value === 'فاعل خير') {
          donorNameControl?.setValue('');
        }
        donorNameControl?.enable();
      }
      donorNameControl?.updateValueAndValidity();
    });

    // Auto-save form inputs in real time
    this.donationForm.valueChanges.subscribe(() => {
      // Prevent saving over the draft while the recovery dialog is still open
      if (this.currentStep() === 1 && !this.showRecoveryDialog()) {
        const values = this.donationForm.getRawValue();
        this.recoveryService.saveState({
          donorName: values.donorName || '',
          phone: values.phone || '',
          isAnonymous: !!values.isAnonymous,
          shareAmount: Number(values.shareAmount || 0),
          sharePackageId: values.sharePackageId || '',
          walletId: values.walletId || ''
        }, 1);
      }
    });
  }

  // Helper method for template to encode URL
  encodeURIComponent(val: string): string {
    return encodeURIComponent(val);
  }

  loadWallets() {
    this.walletService.getWallets().subscribe({
      next: (wallets) => {
        // Only show active wallets
        const activeWallets = wallets.filter(w => w.isActive !== false);
        this.availableWallets.set(activeWallets);
        
        // Auto select first primary or just first wallet if empty
        if (!this.donationForm.get('walletId')?.value && activeWallets.length > 0) {
          const primary = activeWallets.find(w => w.isPrimary) || activeWallets[0];
          this.donationForm.patchValue({ walletId: primary._id });
        }
      },
      error: (err) => console.error('Failed to load wallets:', err)
    });
  }

  // Restore the user's previous donation draft
  resumeDonation() {
    const abandoned = this.recoveryService.incompleteDonation();
    if (abandoned) {
      const donorNameControl = this.donationForm.get('donorName');
      if (abandoned.isAnonymous) {
        donorNameControl?.clearValidators();
        donorNameControl?.disable();
      } else {
        donorNameControl?.setValidators([Validators.required]);
        donorNameControl?.enable();
      }
      donorNameControl?.updateValueAndValidity();

      this.donationForm.patchValue({
        donorName: abandoned.donorName,
        phone: abandoned.phone,
        isAnonymous: abandoned.isAnonymous,
        shareAmount: abandoned.shareAmount,
        sharePackageId: abandoned.sharePackageId,
        walletId: abandoned.walletId
      });
      // Skip directly to Step 2 (Scan & Upload Receipt) where they left off
      this.currentStep.set(2);
    }
    this.showRecoveryDialog.set(false);
  }

  // Discard draft donation data
  discardDonation() {
    this.recoveryService.clearState();
    this.showRecoveryDialog.set(false);
  }

  // Advance step (Step 1 -> Step 2)
  goToStepTwo() {
    if (this.donationForm.valid) {
      this.currentStep.set(2);
      this.recoveryService.saveState(this.donationForm.getRawValue(), 2);
    } else {
      this.donationForm.markAllAsTouched();
    }
  }

  // Return to step 1
  goBackToStepOne() {
    this.currentStep.set(1);
    this.recoveryService.saveState(this.donationForm.getRawValue(), 1);
  }

  // File Upload listener
  onFileSelected(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.selectedFile.set(file);

      // FileReader for previewing receipt image instantly
      const reader = new FileReader();
      reader.onload = () => {
        this.filePreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // Post to the backend REST endpoint
  submitDonation() {
    if (!this.selectedFile()) {
      alert('الرجاء اختيار صورة التحويل أولاً للمتابعة.');
      return;
    }

    this.isSubmitting.set(true);

    const formData = new FormData();
    formData.append('receipt', this.selectedFile()!);
    formData.append('donorName', this.donationForm.get('isAnonymous')?.value ? 'فاعل خير' : this.donationForm.get('donorName')?.value);
    formData.append('phone', this.donationForm.get('phone')?.value);
    formData.append('isAnonymous', this.donationForm.get('isAnonymous')?.value);
    formData.append('shareAmount', this.donationForm.get('shareAmount')?.value);
    formData.append('walletId', this.donationForm.get('walletId')?.value);

    // Dynamic Server URI
    this.http.post(`${environment.apiUrl}/donations/submit`, formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.recoveryService.clearState(); // Success: Clear draft
        this.currentStep.set(3); // Route to dynamic success template
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Submission failed:', err);
        alert('حدث خطأ أثناء إرسال تبرعك. يرجى التحقق من الاتصال وإعادة المحاولة.');
      }
    });
  }

  // Reset state to start a new donation
  startNewDonation() {
    this.donationForm.reset({
      donorName: '',
      phone: '',
      isAnonymous: false,
      shareAmount: 100,
      sharePackageId: '',
      walletId: this.availableWallets().length > 0 ? (this.availableWallets().find(w => w.isPrimary) || this.availableWallets()[0])._id : ''
    });
    this.selectedFile.set(null);
    this.filePreview.set(null);
    this.currentStep.set(1);
    
    // Explicitly update donorName validators after reset based on isAnonymous
    const isAnon = this.donationForm.get('isAnonymous')?.value;
    const donorNameControl = this.donationForm.get('donorName');
    if (isAnon) {
      donorNameControl?.clearValidators();
      donorNameControl?.setValue('فاعل خير');
      donorNameControl?.disable();
    } else {
      donorNameControl?.setValidators([Validators.required]);
      donorNameControl?.enable();
    }
    donorNameControl?.updateValueAndValidity();
  }
}
