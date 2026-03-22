'use client';

import React from 'react';
import SectionHeader from '@/components/SectionHeader';
import RiskAttributionChart from '@/components/attribution/RiskAttributionChart';
import ReturnAttributionChart from '@/components/attribution/ReturnAttributionChart';
import MarginalContribution from '@/components/attribution/MarginalContribution';

export default function AttributionPage() {
  return (
    <div>
      <SectionHeader
        label="MODULE 10"
        title="Risk & Return Attribution"
        description="Deconstructs portfolio risk and return into individual asset contributions to identify risk concentrators and diversifiers."
      />
      <RiskAttributionChart />
      <ReturnAttributionChart />
      <MarginalContribution />
    </div>
  );
}
