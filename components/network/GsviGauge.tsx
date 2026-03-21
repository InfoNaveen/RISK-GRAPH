import MetricCard from '@/components/MetricCard';

interface GsviGaugeProps {
  gsvi: number;
}

function gsviColor(v: number): string {
  if (v < 0.3) return 'var(--risk-green)';
  if (v <= 0.6) return 'var(--gold)';
  return 'var(--risk-red)';
}

export default function GsviGauge({ gsvi }: GsviGaugeProps) {
  return (
    <MetricCard
      label="GSVI"
      value={gsvi.toFixed(4)}
      color={gsviColor(gsvi)}
      subtext="Graph-Weighted Systemic Vulnerability Index"
    />
  );
}
