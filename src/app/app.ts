import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

export interface CalculationResult {
  goldValue:      number;
  makingCharge:   number;
  subtotal:       number;
  gst:            number;
  totalPrice:     number;
  goldFormula:    string;
  makingFormula:  string;
  gstFormula:     string;
}

export interface BargainResult {
  shopPrice:      number;
  fairPrice:      number;
  difference:     number;
  isOverpaying:   boolean;
  impliedMaking:  number;
  overchargePercent: number;
  tip: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ThangaKanakku');

  // Forms
  calcForm: FormGroup;
  bargainForm: FormGroup;

  // Results
  calcResult: CalculationResult | null = null;
  bargainResult: BargainResult | null = null;

  // Making type
  makingMode: 'fixed' | 'percent' = 'fixed';

  constructor(private fb: FormBuilder) {
    this.calcForm = this.fb.group({
      grossWeight:   [null, [Validators.required, Validators.min(0.001)]],
      goldRate:      [null, [Validators.required, Validators.min(1)]],
      makingFixed:   [null],
      makingPercent: [null],
      includeGst:    [true],
    });

    this.bargainForm = this.fb.group({
      shopPrice: [null, [Validators.required, Validators.min(1)]],
    });
  }

  // --- Making type toggle ---
  setMakingMode(mode: 'fixed' | 'percent') {
    this.makingMode = mode;
    if (mode === 'fixed') {
      this.calcForm.get('makingPercent')!.reset();
    } else {
      this.calcForm.get('makingFixed')!.reset();
    }
    this.calcResult  = null;
    this.bargainResult = null;
  }

  get includeGst(): boolean {
    return this.calcForm.get('includeGst')!.value;
  }

  // --- Calculate fair price ---
  calculate() {
    if (this.calcForm.invalid) {
      this.calcForm.markAllAsTouched();
      return;
    }

    const { grossWeight, goldRate, makingFixed, makingPercent, includeGst }
      = this.calcForm.value;

    const goldValue    = grossWeight * goldRate;
    const makingCharge = this.makingMode === 'fixed'
      ? grossWeight * (makingFixed   || 0)
      : goldValue   * ((makingPercent || 0) / 100);

    const subtotal   = goldValue + makingCharge;
    const gst        = includeGst ? subtotal * 0.03 : 0;
    const totalPrice = subtotal + gst;

    const goldFormula   = `${grossWeight}g × ₹${this.fmt(goldRate)}/g`;
    const makingFormula = this.makingMode === 'fixed'
      ? `${grossWeight}g × ₹${this.fmt(makingFixed || 0)}/g`
      : `${makingPercent || 0}% of gold value (₹${this.fmt(goldValue)})`;
    const gstFormula    = `3% on ₹${this.fmt(subtotal)} (gold + making)`;

    this.calcResult  = {
      goldValue, makingCharge, subtotal,
      gst, totalPrice,
      goldFormula, makingFormula, gstFormula
    };
    this.bargainResult = null;
  }

  // --- Bargain comparison ---
  compareBargain() {
    if (!this.calcResult) return;
    if (this.bargainForm.invalid) {
      this.bargainForm.markAllAsTouched();
      return;
    }

    const shopPrice  = this.bargainForm.value.shopPrice;
    const fairPrice  = this.calcResult.totalPrice;
    const difference = shopPrice - fairPrice;
    const isOverpaying      = difference > 0;
    const impliedMaking     = shopPrice - this.calcResult.goldValue;
    const overchargePercent = (difference / fairPrice) * 100;

    const tip = isOverpaying
      ? `Tell them your fair price is ₹${this.fmt(fairPrice)}. ` +
        `They charge ${overchargePercent.toFixed(1)}% more. ` +
        `Ask to match your making charge of ₹${this.fmt(this.calcResult.makingCharge)}.`
      : `Shop price is below your estimate — this is a good deal! Go ahead with confidence.`;

    this.bargainResult = {
      shopPrice, fairPrice, difference,
      isOverpaying, impliedMaking,
      overchargePercent, tip
    };
  }

  reset() {
    this.calcForm.reset({ includeGst: true });
    this.bargainForm.reset();
    this.calcResult    = null;
    this.bargainResult = null;
    this.makingMode    = 'fixed';
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const c = form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  fmt(n: number): string {
    return n.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
