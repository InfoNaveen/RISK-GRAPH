'use client';

import React from 'react';
import SectionHeader from '@/components/SectionHeader';
import ExplosionCurve from '@/components/risk-explosion/ExplosionCurve';
import EigenSpectrum from '@/components/risk-explosion/EigenSpectrum';
import RiskRegimePanel from '@/components/risk-explosion/RiskRegimePanel';

export default function RiskExplosionPage() {
  return (
    <div>
      <SectionHeader
        label="MODULE 08"
        title="Risk Explosion Curve"
        description="Analyzes how portfolio volatility explodes as systemic stress (α) increases from 0 (normal) to 1 (perfect correlation crisis)."
      />

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        {/* Main Chart Column (60%) */}
        <div style={{ flex: 6, minWidth: 0 }}>
          <ExplosionCurve />
        </div>

        {/* Right Panels Column (40%) */}
        <div style={{ flex: 4, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <EigenSpectrum />
          <RiskRegimePanel />
        </div>
      </div>
    </div>
  );
}
