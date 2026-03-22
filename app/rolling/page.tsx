'use client';

import React from 'react';
import SectionHeader from '@/components/SectionHeader';
import RollingVolChart from '@/components/rolling/RollingVolChart';
import RollingCorrelationChart from '@/components/rolling/RollingCorrelationChart';
import RollingVarChart from '@/components/rolling/RollingVarChart';
import DrawdownChart from '@/components/rolling/DrawdownChart';

export default function RollingRiskPage() {
  return (
    <div>
      <SectionHeader
        label="MODULE 11"
        title="Rolling Risk Analytics"
        description="Time-series evaluation of portfolio volatility, correlations, Value at Risk, and drawdowns over the 252-day synthetic history."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 32 }}>
        <RollingVolChart />
        <RollingCorrelationChart />
        <RollingVarChart />
        <DrawdownChart />
      </div>
    </div>
  );
}
