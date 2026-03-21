// ─── Indian Tax Engine FY 2025-26 ───────────────────────────────────
// Implements New Regime tax slabs, STCG/LTCG on equity and gold,
// surcharge, and health & education cess.

import { type TaxResult } from './types';

// ─── Income Tax Slabs (New Regime FY2025-26) ────────────────────────
const TAX_SLABS = [
  { limit: 400000,  rate: 0.00 },
  { limit: 800000,  rate: 0.05 },
  { limit: 1200000, rate: 0.10 },
  { limit: 1600000, rate: 0.15 },
  { limit: 2000000, rate: 0.20 },
  { limit: 2400000, rate: 0.25 },
  { limit: Infinity, rate: 0.30 },
];

const STANDARD_DEDUCTION_NEW = 75000;
const SECTION_87A_LIMIT_NEW = 1200000;
const LTCG_EXEMPTION = 125000;
const STCG_RATE = 0.20;     // Section 111A — 20% from Budget 2024
const LTCG_RATE = 0.125;    // Section 112A — 12.5%

// ─── Income Tax Slabs (Old Regime) ──────────────────────────────────
const TAX_SLABS_OLD = [
  { limit: 250000, rate: 0.00 },
  { limit: 500000, rate: 0.05 },
  { limit: 1000000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 },
];

const STANDARD_DEDUCTION_OLD = 50000;
const SECTION_87A_LIMIT_OLD = 500000;

// ─── Compute Slab Tax ───────────────────────────────────────────────
export function computeSlabTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  // Section 87A rebate: full rebate if total income ≤ ₹12L
  if (taxableIncome <= SECTION_87A_LIMIT_NEW) return 0;

  let tax = 0;
  let remaining = taxableIncome;
  let prevLimit = 0;

  for (const slab of TAX_SLABS) {
    const slabWidth = slab.limit - prevLimit;
    const taxable = Math.min(remaining, slabWidth);
    tax += taxable * slab.rate;
    remaining -= taxable;
    prevLimit = slab.limit;
    if (remaining <= 0) break;
  }

  return tax;
}

export function computeSlabTaxOld(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  // Section 87A rebate: full rebate if total income <= 5L
  if (taxableIncome <= SECTION_87A_LIMIT_OLD) return 0;

  let tax = 0;
  let remaining = taxableIncome;
  let prevLimit = 0;

  for (const slab of TAX_SLABS_OLD) {
    const slabWidth = slab.limit - prevLimit;
    const taxable = Math.min(remaining, slabWidth);
    tax += taxable * slab.rate;
    remaining -= taxable;
    prevLimit = slab.limit;
    if (remaining <= 0) break;
  }

  return tax;
}

// ─── Compute Surcharge ──────────────────────────────────────────────
function computeSurcharge(totalIncome: number, taxOnCapitalGains: number): number {
  // Surcharge on LTCG
  if (totalIncome > 10000000) return taxOnCapitalGains * 0.15;
  if (totalIncome > 5000000) return taxOnCapitalGains * 0.10;
  return 0;
}

// ─── Main Tax Computation ───────────────────────────────────────────
export function computeTax(
  stcgEquity: number,
  ltcgEquity: number,
  ltcgGold: number,
  otherIncome: number
): TaxResult {
  // 1. STCG on Equity — flat 20%
  const stcgTax = Math.max(0, stcgEquity) * STCG_RATE;

  // 2. LTCG on Equity — 12.5% after ₹1.25L exemption
  const ltcgExemption = Math.min(Math.max(0, ltcgEquity), LTCG_EXEMPTION);
  const ltcgTaxable = Math.max(0, ltcgEquity - LTCG_EXEMPTION);
  const ltcgTax = ltcgTaxable * LTCG_RATE;

  // 3. LTCG on Gold — 12.5% flat (no indexation from Budget 2024)
  const ltcgGoldTax = Math.max(0, ltcgGold) * LTCG_RATE;

  // 4. Income Tax on Other Income (after standard deduction)
  const taxableOtherIncome = Math.max(0, otherIncome - STANDARD_DEDUCTION_NEW);
  const incomeTax = computeSlabTax(taxableOtherIncome);

  // 5. Total before surcharge
  const totalTaxBeforeSurcharge = stcgTax + ltcgTax + ltcgGoldTax + incomeTax;

  // 6. Surcharge on capital gains portion
  const totalIncome = otherIncome + stcgEquity + ltcgEquity + ltcgGold;
  const capitalGainsTax = ltcgTax + ltcgGoldTax;
  const surcharge = computeSurcharge(totalIncome, capitalGainsTax);

  // 7. Health & Education Cess: 4% on (tax + surcharge)
  const cess = (totalTaxBeforeSurcharge + surcharge) * 0.04;

  // 8. Total
  const totalTax = totalTaxBeforeSurcharge + surcharge + cess;

  // Effective rate
  const totalGross = totalIncome;
  const effectiveRate = totalGross > 0 ? (totalTax / totalGross) * 100 : 0;

  return {
    stcgEquity: Math.max(0, stcgEquity),
    stcgTax: Math.round(stcgTax),
    ltcgEquity: Math.max(0, ltcgEquity),
    ltcgExemption,
    ltcgTaxable,
    ltcgTax: Math.round(ltcgTax),
    ltcgGold: Math.max(0, ltcgGold),
    ltcgGoldTax: Math.round(ltcgGoldTax),
    otherIncome,
    incomeTax: Math.round(incomeTax),
    totalTaxBeforeSurcharge: Math.round(totalTaxBeforeSurcharge),
    surcharge: Math.round(surcharge),
    cess: Math.round(cess),
    totalTax: Math.round(totalTax),
    effectiveRate: parseFloat(effectiveRate.toFixed(2)),
  };
}

export function computeTaxOldRegime(
  stcgEquity: number,
  ltcgEquity: number,
  ltcgGold: number, // LTCG on Debt/Gold/Property
  otherIncome: number,
  deductions: number = 0
): TaxResult {
  const stcgTax = Math.max(0, stcgEquity) * STCG_RATE;

  const ltcgExemption = Math.min(Math.max(0, ltcgEquity), LTCG_EXEMPTION);
  const ltcgTaxable = Math.max(0, ltcgEquity - LTCG_EXEMPTION);
  const ltcgTax = ltcgTaxable * LTCG_RATE;

  const ltcgGoldTax = Math.max(0, ltcgGold) * LTCG_RATE;

  // Standard deduction and Chapter VI-A deductions apply to other income
  const totalDeductions = STANDARD_DEDUCTION_OLD + deductions;
  const taxableOtherIncome = Math.max(0, otherIncome - totalDeductions);
  const incomeTax = computeSlabTaxOld(taxableOtherIncome);

  const totalTaxBeforeSurcharge = stcgTax + ltcgTax + ltcgGoldTax + incomeTax;

  const totalIncome = otherIncome + stcgEquity + ltcgEquity + ltcgGold;
  const capitalGainsTax = ltcgTax + ltcgGoldTax;
  const surcharge = computeSurcharge(totalIncome, capitalGainsTax);

  const cess = (totalTaxBeforeSurcharge + surcharge) * 0.04;

  const totalTax = totalTaxBeforeSurcharge + surcharge + cess;

  const totalGross = totalIncome;
  const effectiveRate = totalGross > 0 ? (totalTax / totalGross) * 100 : 0;

  return {
    stcgEquity: Math.max(0, stcgEquity),
    stcgTax: Math.round(stcgTax),
    ltcgEquity: Math.max(0, ltcgEquity),
    ltcgExemption,
    ltcgTaxable,
    ltcgTax: Math.round(ltcgTax),
    ltcgGold: Math.max(0, ltcgGold),
    ltcgGoldTax: Math.round(ltcgGoldTax),
    otherIncome,
    incomeTax: Math.round(incomeTax),
    totalTaxBeforeSurcharge: Math.round(totalTaxBeforeSurcharge),
    surcharge: Math.round(surcharge),
    cess: Math.round(cess),
    totalTax: Math.round(totalTax),
    effectiveRate: parseFloat(effectiveRate.toFixed(2)),
  };
}

// ─── Determine if STCG or LTCG ─────────────────────────────────────
export function isLongTermEquity(purchaseDate: string): boolean {
  const purchase = new Date(purchaseDate);
  const now = new Date();
  const diffMs = now.getTime() - purchase.getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
  return diffMonths >= 12;
}

export function isLongTermGold(purchaseDateMonthsAgo: number): boolean {
  return purchaseDateMonthsAgo >= 36;
}
