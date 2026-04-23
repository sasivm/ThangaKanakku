import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ThangaKanakku');

  form: FormGroup;

  result: {
    goldValue:    number;
    makingCharge: number;
    subtotal:     number;
    gst:          number;
    totalPrice:   number;
    // formulas for breakup display
    goldFormula:    string;
    makingFormula:  string;
    gstFormula:     string;
  } | null = null;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      grossWeight:   [null, [Validators.required, Validators.min(0.001)]],
      goldRate:      [null, [Validators.required, Validators.min(1)]],
      makingType:    ['fixed', Validators.required],  // Fixed/gram is default
      makingPercent: [null],
      makingFixed:   [null],
      includeGst:    [true],
    });
  }

  get makingType(): string {
    return this.form.get('makingType')!.value;
  }

  get includeGst(): boolean {
    return this.form.get('includeGst')!.value;
  }

  setMakingType(t: string) {
    this.form.get('makingType')!.setValue(t);
    if (t === 'fixed') {
      this.form.get('makingPercent')!.reset();
    } else {
      this.form.get('makingFixed')!.reset();
    }
    this.result = null;
  }

  calculate() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const {
      grossWeight, goldRate,
      makingType, makingPercent, makingFixed,
      includeGst
    } = this.form.value;

    // Gold value (no purity — removed as requested)
    const goldValue = grossWeight * goldRate;

    // Making charge
    const makingCharge = makingType === 'fixed'
      ? grossWeight * (makingFixed || 0)
      : goldValue   * ((makingPercent || 0) / 100);

    // Subtotal
    const subtotal = goldValue + makingCharge;

    // GST on full subtotal (gold + making) — standard jewellery GST
    const gst        = includeGst ? subtotal * 0.03 : 0;
    const totalPrice = subtotal + gst;

    // Formulas shown in breakup
    const goldFormula   = `${grossWeight}g × ₹${this.fmt(goldRate)}/g`;
    const makingFormula = makingType === 'fixed'
      ? `${grossWeight}g × ₹${this.fmt(makingFixed || 0)}/g`
      : `${makingPercent || 0}% of gold value (₹${this.fmt(goldValue)})`;
    const gstFormula    = `3% on ₹${this.fmt(subtotal)} (gold + making)`;

    this.result = {
      goldValue, makingCharge, subtotal,
      gst, totalPrice,
      goldFormula, makingFormula, gstFormula
    };
  }

  reset() {
    this.form.reset({
      grossWeight:   null,
      goldRate:      null,
      makingType:    'fixed',
      makingPercent: null,
      makingFixed:   null,
      includeGst:    true,
    });
    this.result = null;
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  // Helper — formats number Indian style
  fmt(n: number): string {
    return n.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
