'use client';

import { useState, useMemo } from 'react';
import SectionHeader from '@/components/SectionHeader';
import AssetForm from '@/components/networth/AssetForm';
import NetWorthSummary from '@/components/networth/NetWorthSummary';
import TaxBreakdown from '@/components/networth/TaxBreakdown';
import { ASSET_NAMES, DEFAULT_PRICES, GOLD_PRICE_PER_GRAM, SILVER_PRICE_PER_GRAM } from '@/lib/types';
import type { EquityHolding, PhysicalAssets, Liabilities } from '@/lib/types';
import { computeTax, isLongTermEquity } from '@/lib/tax';

function defaultEquity(): EquityHolding[] {
  return ASSET_NAMES.map(name => ({
    asset: name,
    units: 10,
    purchasePrice: Math.round(DEFAULT_PRICES[name] * 0.85),
    currentPrice: DEFAULT_PRICES[name],
    purchaseDate: '2024-01-15',
  }));
}

export default function NetWorthPage() {
  const [equity, setEquity] = useState<EquityHolding[]>(defaultEquity());
  const [physical, setPhysical] = useState<PhysicalAssets>({
    goldGrams: 50,
    silverGrams: 500,
    realEstate: 5000000,
    cashFD: 1000000,
  });
  const [liabilities, setLiabilities] = useState<Liabilities>({
    homeLoan: 2000000,
    personalLoan: 300000,
    creditCard: 50000,
  });
  const [otherIncome, setOtherIncome] = useState(1200000);

  const computed = useMemo(() => {
    // Equity value
    const equityValue = equity.reduce(
      (sum, h) => sum + h.units * h.currentPrice, 0
    );

    // Physical value
    const goldValue = physical.goldGrams * GOLD_PRICE_PER_GRAM;
    const silverValue = physical.silverGrams * SILVER_PRICE_PER_GRAM;
    const physicalTotal = goldValue + silverValue + physical.realEstate;

    // Liabilities
    const totalLiabilities = liabilities.homeLoan + liabilities.personalLoan + liabilities.creditCard;

    // Capital gains
    let stcgEquity = 0;
    let ltcgEquity = 0;
    for (const h of equity) {
      const gain = h.units * (h.currentPrice - h.purchasePrice);
      if (gain <= 0) continue;
      if (isLongTermEquity(h.purchaseDate)) {
        ltcgEquity += gain;
      } else {
        stcgEquity += gain;
      }
    }

    // Gold LTCG (simplified: assume long-term if held > 36 months)
    const goldCostBasis = physical.goldGrams * 4800; // assumed historical cost
    const ltcgGold = Math.max(0, goldValue - goldCostBasis);

    const taxResult = computeTax(stcgEquity, ltcgEquity, ltcgGold, otherIncome);

    return {
      equityValue,
      physicalTotal,
      cashFD: physical.cashFD,
      totalLiabilities,
      taxResult,
    };
  }, [equity, physical, liabilities, otherIncome]);

  return (
    <div>
      <SectionHeader
        label="MODULE 04"
        title="Net Worth & Tax Calculator"
        description="Comprehensive asset valuation with Indian FY2025-26 tax computation under the new regime — STCG, LTCG, surcharge, and cess."
      />

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {/* Left: Input Form */}
        <div style={{ flex: '1 1 45%', minWidth: 360 }}>
          <AssetForm
            equity={equity}
            physical={physical}
            liabilities={liabilities}
            otherIncome={otherIncome}
            onEquityChange={setEquity}
            onPhysicalChange={setPhysical}
            onLiabilitiesChange={setLiabilities}
            onOtherIncomeChange={setOtherIncome}
          />
        </div>

        {/* Right: Summary + Tax */}
        <div style={{ flex: '1 1 45%', minWidth: 360 }}>
          <NetWorthSummary
            equityValue={computed.equityValue}
            physicalAssets={computed.physicalTotal}
            cashFD={computed.cashFD}
            totalLiabilities={computed.totalLiabilities}
          />
          <TaxBreakdown result={computed.taxResult} />
        </div>
      </div>
    </div>
  );
}
