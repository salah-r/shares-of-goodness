import { Injectable, signal, WritableSignal } from '@angular/core';

export interface IncompleteDonation {
  donorName: string;
  phone: string;
  isAnonymous: boolean;
  shareAmount: number;
  sharePackageId: string;
  walletId: string;
  step: number; // e.g. 1 (Details input), 2 (Receipt QR scan/upload)
}

@Injectable({
  providedIn: 'root'
})
export class DonationRecoveryService {
  private readonly STORAGE_KEY = 'shares_of_goodness_abandoned_donation';
  
  // Reactive Signal representing the current state of recovery data
  public incompleteDonation: WritableSignal<IncompleteDonation | null> = signal<IncompleteDonation | null>(null);

  constructor() {
    this.loadState();
  }

  /**
   * Save draft donation state to localStorage
   */
  saveState(state: Omit<IncompleteDonation, 'step'>, step: number): void {
    const data: IncompleteDonation = { ...state, step };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    this.incompleteDonation.set(data);
  }

  /**
   * Validates if the draft has enough required data to be considered worth recovering.
   */
  isValidDraft(data: IncompleteDonation): boolean {
    if (!data) return false;
    if (!data.phone || data.phone.trim() === '') return false;
    if (!data.walletId || data.walletId.trim() === '') return false;
    if (!data.shareAmount || data.shareAmount < 10) return false;
    if (!data.isAnonymous && (!data.donorName || data.donorName.trim() === '')) return false;
    return true;
  }

  /**
   * Load draft donation from localStorage
   */
  loadState(): IncompleteDonation | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored) as IncompleteDonation;
        if (this.isValidDraft(data)) {
          this.incompleteDonation.set(data);
          return data;
        } else {
          this.clearState();
        }
      } catch (e) {
        this.clearState();
      }
    }
    this.incompleteDonation.set(null);
    return null;
  }

  /**
   * Clear state from storage upon successful donation submission or manual user decline
   */
  clearState(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.incompleteDonation.set(null);
  }

  /**
   * Checks if an incomplete donation exists and is valid
   */
  hasAbandonedDonation(): boolean {
    const data = this.incompleteDonation();
    return data !== null && this.isValidDraft(data);
  }
}
