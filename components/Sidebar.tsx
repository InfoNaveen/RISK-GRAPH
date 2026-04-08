'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Share2, TrendingUp, Zap, PieChart, Receipt, BookOpen, BarChart2, HelpCircle, Settings, X, Compass, Layers, Activity, ShieldAlert, AlertTriangle, Brain, Shield, ShieldCheck } from 'lucide-react';
import { usePortfolio } from '@/lib/PortfolioContext';

const navGroups = [
  {
    title: 'AI INTELLIGENCE',
    items: [
      { href: '/intelligence', label: 'Intelligence', icon: Brain },
      { href: '/compliance', label: 'Compliance', icon: ShieldCheck },
      { href: '/regime', label: 'Regime', icon: Activity },
      { href: '/anomaly', label: 'Anomaly', icon: AlertTriangle },
      { href: '/forecast', label: 'Forecast', icon: TrendingUp },
      { href: '/security', label: 'Security', icon: Shield },
    ]
  },
  {
    title: 'ANALYSIS',
    items: [
      { href: '/prices', label: 'Price History', icon: BarChart2 },
      { href: '/network', label: 'Network Graph', icon: Share2 },
      { href: '/monte-carlo', label: 'Monte Carlo', icon: TrendingUp },
      { href: '/stress', label: 'Stress Testing', icon: AlertTriangle },
    ]
  },
  {
    title: 'ADVANCED',
    items: [
      { href: '/efficient-frontier', label: 'Efficient Frontier', icon: Compass },
      { href: '/attribution', label: 'Attribution', icon: Layers },
      { href: '/rolling', label: 'Rolling Risk', icon: Activity },
      { href: '/scenarios', label: 'Scenarios', icon: ShieldAlert },
      { href: '/risk-explosion', label: 'Risk Explosion', icon: Zap },
    ]
  },
  {
    title: 'TOOLS',
    items: [
      { href: '/networth', label: 'Net Worth', icon: PieChart },
      { href: '/tax', label: 'Tax Calculator', icon: Receipt },
      { href: '/math', label: 'Math Reference', icon: BookOpen },
    ]
  }
];

const allNavItems = navGroups.flatMap(g => g.items);

function HelpTooltip({ text }: { text: string }) {
  return (
    <span title={text} style={{ cursor: 'help', display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}>
      <HelpCircle size={12} color="var(--ink-muted)" />
    </span>
  );
}

function ControlsPanel() {
  const {
    tickers, setTickers, dataPeriod, setDataPeriod,
    alpha, setAlpha, beta, setBeta, contagionSteps, setContagionSteps,
    runAnalysis, isAnalyzing, lastAnalyzed, lambdaMax
  } = usePortfolio();

  const [localTickers, setLocalTickers] = useState(tickers.join(', '));
  const [timeAgo, setTimeAgo] = useState('');

  // Sync back to context when analysis is triggered
  const handleAnalyze = () => {
    const newTickers = localTickers.split(',').map(s => s.trim()).filter(Boolean);
    setTickers(newTickers);
    runAnalysis();
  };

  useEffect(() => {
    if (!lastAnalyzed) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - lastAnalyzed.getTime()) / 1000);
      if (diff < 10) setTimeAgo('just now');
      else if (diff < 60) setTimeAgo(`${diff}s ago`);
      else setTimeAgo(`${Math.floor(diff / 60)}m ago`);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastAnalyzed, isAnalyzing]);

  const threshold = lambdaMax ? 1 / lambdaMax : null;
  const isBetaHigh = threshold !== null && beta >= threshold;

  const sectionHeaderStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    color: 'var(--ink-muted)',
    marginBottom: 12,
    marginTop: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 6
  };

  const labelStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--ink)',
    display: 'flex',
    alignItems: 'center',
    marginBottom: 6
  };

  const valueStyle = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: 'var(--gold)',
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
      {/* Portfolio Input */}
      <div style={{ ...sectionHeaderStyle, marginTop: 16 }}>📊 Portfolio Input</div>
      
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          Stock Tickers
          <HelpTooltip text="Comma-separated asset symbols. Gold, Silver, RealEstate are supported as special assets" />
        </label>
        <input
          type="text"
          value={localTickers}
          onChange={(e) => setLocalTickers(e.target.value)}
          disabled={isAnalyzing}
          style={{ width: '100%', padding: '8px', fontSize: 11, fontFamily: 'JetBrains Mono' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Data Period</label>
        <select
          value={dataPeriod}
          onChange={(e) => setDataPeriod(e.target.value)}
          disabled={isAnalyzing}
          style={{ width: '100%', padding: '8px', fontSize: 12 }}
        >
          <option value="3mo">3mo</option>
          <option value="6mo">6mo</option>
          <option value="1y">1y</option>
          <option value="2y">2y</option>
          <option value="5y">5y</option>
        </select>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        style={{
          width: '100%',
          background: 'var(--gold)',
          color: 'var(--ink)',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          fontWeight: 500,
          border: 'none',
          borderRadius: 4,
          padding: 10,
          cursor: isAnalyzing ? 'wait' : 'pointer',
          opacity: isAnalyzing ? 0.7 : 1,
        }}
      >
        {isAnalyzing ? '⏳ Analyzing...' : '🚀 Analyze Live Data'}
      </button>
      {lastAnalyzed && !isAnalyzing && (
        <div style={{ fontSize: 10, color: 'var(--ink-muted)', textAlign: 'center', marginTop: 8 }}>
          Last analyzed: {timeAgo || 'just now'}
        </div>
      )}

      <div style={{ height: 1, background: 'var(--border)', margin: '24px 0 0 0' }} />

      {/* Stress Parameters */}
      <div style={sectionHeaderStyle}>🔥 Stress Parameters</div>
      
      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>
            Stress Intensity (α)
            <HelpTooltip text="Controls stress level. α=0 = baseline, α=1 = all correlations → 1" />
          </label>
          <span style={valueStyle}>{alpha.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0" max="1" step="0.01"
          value={alpha}
          onChange={(e) => setAlpha(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--gold)' }}
        />
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontStyle: 'italic', color: 'var(--ink-muted)', marginBottom: 16 }}>
        Σ_stress = (1−α)Σ + αΣ_max
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '16px 0 0 0' }} />

      {/* Contagion Parameters */}
      <div style={sectionHeaderStyle}>🌊 Contagion Parameters</div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>
            Contagion Coeff. (β)
            <HelpTooltip text="Contagion rate. Exceeding 1/λ_max triggers herding collapse" />
          </label>
          <span style={{ ...valueStyle, color: isBetaHigh ? 'var(--risk-red)' : 'var(--gold)' }}>{beta.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0" max="0.5" step="0.01"
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--gold)' }}
        />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: isBetaHigh ? 'var(--risk-red)' : 'var(--ink-muted)', marginTop: 4 }}>
          (threshold: {threshold !== null ? threshold.toFixed(3) : '—'})
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Timesteps T</label>
          <span style={valueStyle}>{contagionSteps}</span>
        </div>
        <input
          type="range"
          min="1" max="50" step="1"
          value={contagionSteps}
          onChange={(e) => setContagionSteps(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--gold)' }}
        />
      </div>

    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar-desktop" style={{
        width: 260,
        height: '100vh',
        borderRight: '1px solid var(--border)',
        background: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--ink)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            RiskGraph
          </h1>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            letterSpacing: '0.2em',
            color: 'var(--ink-muted)',
          }}>
            3.0
          </span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 0' }}>
          {navGroups.map((group, gIdx) => (
            <div key={group.title} style={{ marginBottom: gIdx === navGroups.length - 1 ? 0 : 24 }}>
              <div style={{ 
                fontFamily: "'DM Sans', sans-serif", 
                fontSize: 10, 
                textTransform: 'uppercase', 
                letterSpacing: '0.12em', 
                color: 'var(--ink-muted)', 
                padding: '0 24px', 
                marginBottom: 8 
              }}>
                {group.title}
              </div>
              {group.items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 24px',
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? 'var(--ink)' : 'var(--ink-muted)',
                      background: isActive ? 'var(--surface)' : 'transparent',
                      borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Controls Panel (scrollable) */}
        <div className="sidebar-scroll" style={{ flexShrink: 0, borderTop: '1px solid var(--border)', overflowY: 'auto', maxHeight: '45vh' }}>
          <ControlsPanel />
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="sidebar-mobile" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: 'var(--cream)',
        borderTop: '1px solid var(--border)',
        display: 'none',
        justifyContent: 'flex-start',
        alignItems: 'center',
        zIndex: 40,
        overflowX: 'auto',
        gap: 12,
        padding: '0 12px'
      }}>
        {allNavItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none',
                fontSize: 9,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--gold)' : 'var(--ink-muted)',
                padding: '4px 8px',
                minWidth: 56
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Floating Settings Button for Mobile */}
      <div className="mobile-settings-btn" style={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'var(--gold)',
        color: 'var(--ink)',
        display: 'none',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 50,
        cursor: 'pointer'
      }} onClick={() => setMobileSettingsOpen(true)}>
        <Settings size={22} />
      </div>

      {/* Mobile Settings Bottom Sheet */}
      {mobileSettingsOpen && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100 }}
            onClick={() => setMobileSettingsOpen(false)}
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: '80vh',
            background: 'var(--cream)',
            borderTop: '1px solid var(--border)',
            borderRadius: '16px 16px 0 0',
            overflowY: 'auto',
            zIndex: 101,
            paddingTop: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2 }} />
            </div>
            <ControlsPanel />
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile { display: flex !important; }
          .mobile-settings-btn { display: flex !important; }
          .main-content { margin-left: 0 !important; padding: 20px 24px 80px 24px !important; }
        }
      `}} />
    </>
  );
}
