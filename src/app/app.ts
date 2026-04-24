import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

export interface CalculationResult {
  grossWeight:    number;
  goldRate:       number;
  wastageGrams:   number;
  wastagePercent: number;
  totalGrams:     number;
  goldValue:      number;
  wastageValue:   number;
  makingCharge:   number;
  makingPercent:  number;
  subtotal:       number;
  gst:            number;
  totalPrice:     number;
  // formulas
  goldFormula:    string;
  wastageFormula: string;
  makingFormula:  string;
  gstFormula:     string;
}

export interface BargainResult {
  shopPrice:          number;
  fairPrice:          number;
  difference:         number;
  isOverpaying:       boolean;
  impliedMaking:      number;
  overchargePercent:  number;
  tip:                string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App {
  calcForm:   FormGroup;
  bargainForm: FormGroup;

  calcResult:   CalculationResult | null = null;
  bargainResult: BargainResult    | null = null;

  makingMode:  'fixed'   | 'percent' = 'fixed';
  wastageMode: 'grams'   | 'percent' = 'percent';

  constructor(private fb: FormBuilder) {
    this.calcForm = this.fb.group({
      grossWeight:    [null, [Validators.required, Validators.min(0.001)]],
      goldRate:       [null, [Validators.required, Validators.min(1)]],
      wastageValue:   [null],   // grams OR percent depending on wastageMode
      makingFixed:    [null],
      makingPercent:  [null],
      includeGst:     [true],
    });

    this.bargainForm = this.fb.group({
      shopPrice: [null, [Validators.required, Validators.min(1)]],
    });
  }

  // ── Making type ──────────────────────────────────
  setMakingMode(mode: 'fixed' | 'percent') {
    this.makingMode = mode;
    this.calcForm.get('makingFixed')!.reset();
    this.calcForm.get('makingPercent')!.reset();
    this.calcResult   = null;
    this.bargainResult = null;
  }

  // ── Wastage type ─────────────────────────────────
  setWastageMode(mode: 'grams' | 'percent') {
    this.wastageMode = mode;
    this.calcForm.get('wastageValue')!.reset();
    this.calcResult   = null;
    this.bargainResult = null;
  }

  get includeGst(): boolean {
    return this.calcForm.get('includeGst')!.value;
  }

  // ── Calculate ────────────────────────────────────
  calculate() {
    if (this.calcForm.invalid) {
      this.calcForm.markAllAsTouched();
      return;
    }

    const {
      grossWeight, goldRate,
      wastageValue,
      makingFixed, makingPercent,
      includeGst
    } = this.calcForm.value;

    // 1. Gold value on gross weight
    const goldValue = grossWeight * goldRate;

    // 2. Wastage — adds extra grams on gross weight
    const wastageGrams = this.wastageMode === 'percent'
      ? grossWeight * ((wastageValue || 0) / 100)
      : (wastageValue || 0);
    
    const wastageAmt  = wastageGrams * goldRate;
    const totalGrams  = grossWeight + wastageGrams;

    const wastagePercent = grossWeight > 0
      ? (wastageGrams / grossWeight) * 100
      : 0;

    // 3. Making charge applied on totalGrams (gross + wastage)
    const makingCharge = this.makingMode === 'fixed'
      ? totalGrams  * (makingFixed   || 0)
      : goldValue   * ((makingPercent || 0) / 100);
    const makingPercentValue = goldValue > 0
      ? (makingCharge / goldValue) * 100
      : 0;

    // 4. Subtotal = gold + wastage + making
    const subtotal   = goldValue + wastageAmt + makingCharge;
    const gst        = includeGst ? subtotal * 0.03 : 0;
    const totalPrice = subtotal + gst;

    // 5. Formulas for breakup display
    const goldFormula = `${grossWeight}g × ₹${this.fmt(goldRate)}/g`;

    const wastageFormula = this.wastageMode === 'percent'
      ? `${wastageValue || 0}% of ${grossWeight}g = ${this.fmtG(wastageGrams)} × ₹${this.fmt(goldRate)}/g`
      : `${wastageGrams}g × ₹${this.fmt(goldRate)}/g`;

    const makingFormula = this.makingMode === 'fixed'
      ? `${this.fmtG(totalGrams)} total × ₹${this.fmt(makingFixed || 0)}/g`
      : `${makingPercent || 0}% of gold value ₹${this.fmt(goldValue)}`;

    const gstFormula = `3% on ₹${this.fmt(subtotal)} (gold + wastage + making)`;

    this.calcResult = {
      grossWeight, goldRate,
      wastageGrams, wastagePercent, totalGrams,
      goldValue, wastageValue: wastageAmt,
      makingCharge, makingPercent: makingPercentValue, subtotal, gst, totalPrice,
      goldFormula, wastageFormula, makingFormula, gstFormula,
    };

    this.bargainResult = null;
  }

  // ── Bargain ──────────────────────────────────────
  compareBargain() {
    if (!this.calcResult) return;
    if (this.bargainForm.invalid) {
      this.bargainForm.markAllAsTouched();
      return;
    }

    const shopPrice  = this.bargainForm.value.shopPrice;
    const fairPrice  = this.calcResult.totalPrice;
    const difference = shopPrice - fairPrice;
    const isOverpaying       = difference > 0;
    const impliedMaking      = shopPrice - this.calcResult.goldValue - this.calcResult.wastageValue;
    const overchargePercent  = (difference / fairPrice) * 100;

    const tip = isOverpaying
      ? `Tell them your fair price is ₹${this.fmt(fairPrice)}. ` +
        `They are charging ${overchargePercent.toFixed(1)}% more. ` +
        `Ask them to reduce making charge to ₹${this.fmt(this.calcResult.makingCharge)}.`
      : `Shop price is below your estimate — this is a good deal! Go ahead with confidence.`;

    this.bargainResult = {
      shopPrice, fairPrice, difference,
      isOverpaying, impliedMaking,
      overchargePercent, tip,
    };
  }

  // ── Reset ────────────────────────────────────────
  reset() {
    this.calcForm.reset({ includeGst: true });
    this.bargainForm.reset();
    this.calcResult    = null;
    this.bargainResult = null;
    this.makingMode    = 'fixed';
    this.wastageMode   = 'percent';
  }

  // ── Helpers ──────────────────────────────────────
  isInvalid(form: FormGroup, field: string): boolean {
    const c = form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  fmt(n: number): string {
    return n.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  fmtG(n: number): string {
    return n.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }) + 'g';
  }

  fmtPercent(n: number): string {
    return n.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }) + '%';
  }
}
