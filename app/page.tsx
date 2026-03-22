'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import SectionHeader from '@/components/SectionHeader';
import { usePortfolio } from '@/lib/PortfolioContext';
import {
  eigenvectorCentrality,
  betweennessCentrality,
  computeGSVI,
  spectralRiskRatio,
  portfolioVariance,
  getVolatilities,
  stressCovariance
} from '@/lib/math';
import { Activity, ShieldAlert, TrendingDown, Layers, Share2, BarChart2, Zap, PieChart, Receipt, BookOpen } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { href: '/network', label: 'Network', icon: Share2 },
  { href: '/prices', label: 'Prices', icon: BarChart2 },
  { href: '/monte-carlo', label: 'Monte Carlo', icon: Activity },
  { href: '/stress', label: 'Stress', icon: Zap },
  { href: '/networth', label: 'Net Worth', icon: PieChart },
  { href: '/tax', label: 'Tax', icon: Receipt },
  { href: '/math', label: 'Math', icon: BookOpen },
];

export default function DashboardPage() {
  const { tickers, correlationMatrix, alpha, beta, isAnalyzing, lambdaMax } = usePortfolio();
  const pathname = usePathname();

  const metrics = useMemo(() => {
    if (!correlationMatrix || !tickers.length || correlationMatrix.length !== tickers.length) return null;

    const eigCent = eigenvectorCentrality(correlationMatrix);
    const betCent = betweennessCentrality(correlationMatrix);
    const gsvi = computeGSVI(eigCent, betCent);
    const srr = spectralRiskRatio(correlationMatrix);

    const vols = getVolatilities(tickers);
    const equalWeights = new Array(tickers.length).fill(1 / tickers.length);
    const baseCov = stressCovariance(0, vols, correlationMatrix);
    const stressCov = stressCovariance(alpha, vols, correlationMatrix);

    const baseVol = Math.sqrt(portfolioVariance(equalWeights, baseCov)) * Math.sqrt(252);
    const stressVol = Math.sqrt(portfolioVariance(equalWeights, stressCov)) * Math.sqrt(252);

    return { gsvi, srr, baseVol, stressVol };
  }, [tickers, correlationMatrix, alpha]);

  return (
    <div style={{ opacity: isAnalyzing ? 0.5 : 1, transition: 'opacity 0.2s', pointerEvents: isAnalyzing ? 'none' : 'auto' }}>
      {/* Horizontal Tab Bar */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 40, 
        padding: '6px', 
        background: 'rgba(0,0,0,0.03)', 
        borderRadius: 12, 
        width: 'fit-content' 
      }}>
        <Link href="/" style={{
          textDecoration: 'none',
          padding: '10px 20px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          background: pathname === '/' ? 'var(--gold)' : 'transparent',
          color: pathname === '/' ? 'var(--ink)' : 'var(--ink-muted)',
          transition: 'all 0.2s'
        }}>
          Overview
        </Link>
        {navItems.map(item => (
          <Link key={item.href} href={item.href} style={{
            textDecoration: 'none',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            background: pathname === item.href ? 'var(--gold)' : 'transparent',
            color: pathname === item.href ? 'var(--ink)' : 'var(--ink-muted)',
            transition: 'all 0.2s'
          }}>
            {item.label}
          </Link>
        ))}
      </div>

      <SectionHeader
        label="OVERVIEW"
        title="RiskGraph Dashboard"
        description="Comprehensive summary of portfolio systemic risk and contagion vulnerability."
      />

      {/* Metrics Row */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(201,168,76,0.1)', padding: 8, borderRadius: 8 }}>
                <Activity size={20} color="var(--gold)" />
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Systemic Risk (GSVI)</div>
            </div>
            <div style={{ fontSize: 28, fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink)' }}>
              {metrics.gsvi.toFixed(3)}
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(52,199,89,0.1)', padding: 8, borderRadius: 8 }}>
                <Layers size={20} color="var(--risk-green)" />
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spectral Concentration</div>
            </div>
            <div style={{ fontSize: 28, fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink)' }}>
              {metrics.srr.toFixed(3)}
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(192,57,43,0.1)', padding: 8, borderRadius: 8 }}>
                <ShieldAlert size={20} color="var(--risk-red)" />
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contagion Threshold</div>
            </div>
            <div style={{ fontSize: 28, fontFamily: "'JetBrains Mono', monospace", color: beta >= (lambdaMax ? 1/lambdaMax : Infinity) ? 'var(--risk-red)' : 'var(--ink)' }}>
              {lambdaMax ? (1 / lambdaMax).toFixed(4) : '—'}
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(0,122,255,0.1)', padding: 8, borderRadius: 8 }}>
                <TrendingDown size={20} color="#007AFF" />
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected Volatility</div>
            </div>
            <div style={{ fontSize: 28, fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink)' }}>
              {(metrics.baseVol * 100).toFixed(1)}% <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}>→ {(metrics.stressVol * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 20 }}>Deep Dive Modules</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <Link href="/network" style={{ textDecoration: 'none' }}>
          <div className="card-hover" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 24, height: '100%', transition: 'all 0.2s' }}>
            <h4 style={{ fontSize: 16, color: 'var(--ink)', marginBottom: 8 }}>Network Graph Analysis</h4>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5 }}>Visualize asset correlation structures and identify systemically important nodes driving portfolio risk.</p>
          </div>
        </Link>
        <Link href="/monte-carlo" style={{ textDecoration: 'none' }}>
          <div className="card-hover" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 24, height: '100%', transition: 'all 0.2s' }}>
            <h4 style={{ fontSize: 16, color: 'var(--ink)', marginBottom: 8 }}>Return Distribution Sim</h4>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5 }}>5,000-path correlated Geometric Brownian Motion exploring tail events and VaR under baseline & stressed regimes.</p>
          </div>
        </Link>
        <Link href="/stress" style={{ textDecoration: 'none' }}>
          <div className="card-hover" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 24, height: '100%', transition: 'all 0.2s' }}>
            <h4 style={{ fontSize: 16, color: 'var(--ink)', marginBottom: 8 }}>Stress Testing & Contagion</h4>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5 }}>Regime-shifting tests scaling correlations towards 1.0, and eigenvalue metrics highlighting systemic collapse points.</p>
          </div>
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .card-hover:hover {
          border-color: var(--gold) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
      `}} />
    </div>
  );
}
