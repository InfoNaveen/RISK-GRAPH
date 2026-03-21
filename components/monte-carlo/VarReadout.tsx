import MetricCard from '@/components/MetricCard';
import { formatINR } from '@/lib/math';
import type { VarMetrics } from '@/lib/types';

interface VarReadoutProps {
  metrics: VarMetrics;
  initialValue: number;
}

export default function VarReadout({ metrics, initialValue }: VarReadoutProps) {
  const varPct = ((metrics.var95 / initialValue) * 100).toFixed(2);
  const cvarPct = ((metrics.cvar95 / initialValue) * 100).toFixed(2);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 16,
    }}>
      <MetricCard
        label="VaR (95%)"
        value={formatINR(metrics.var95)}
        color="var(--risk-red)"
        subtext={`${varPct}% — Max expected loss at 95% confidence`}
      />
      <MetricCard
        label="CVaR (95%)"
        value={formatINR(metrics.cvar95)}
        color="var(--risk-red)"
        subtext={`${cvarPct}% — Average loss beyond VaR`}
      />
      <MetricCard
        label="Expected Return"
        value={formatINR(metrics.expectedReturn)}
        color="var(--risk-green)"
        subtext="Mean portfolio value change"
      />
      <MetricCard
        label="Sharpe Ratio"
        value={metrics.sharpeRatio.toFixed(3)}
        color="var(--gold)"
        subtext="Risk-adjusted return (annualized)"
      />
      <MetricCard
        label="Probability of Loss"
        value={`${metrics.probLoss.toFixed(1)}%`}
        color={metrics.probLoss > 50 ? 'var(--risk-red)' : 'var(--ink)'}
        subtext="Paths ending below initial value"
      />
    </div>
  );
}
