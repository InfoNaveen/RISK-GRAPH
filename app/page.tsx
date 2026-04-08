'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Brain, Activity, AlertTriangle, TrendingUp, Shield,
  Share2, Zap, BarChart2, PieChart, Receipt, BookOpen,
  ArrowRight,
} from 'lucide-react';

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <div ref={ref}>{count}</div>;
}

const modules = [
  { num: '01', name: 'Network Graph', href: '/network', icon: Share2, desc: 'Asset correlation topology & systemic risk', tech: 'D3-Force · Brandes · GSVI', isNew: false },
  { num: '02', name: 'Stress Testing', href: '/stress', icon: Zap, desc: 'PSD-safe correlation regime shifts', tech: 'Cholesky · Eigenvalue · Contagion', isNew: false },
  { num: '03', name: 'Monte Carlo', href: '/monte-carlo', icon: BarChart2, desc: '10,000-path GBM simulation engine', tech: 'Box-Muller · Correlated Paths · VaR', isNew: false },
  { num: '04', name: 'AI Intelligence', href: '/intelligence', icon: Brain, desc: '4 ML models running on live data', tech: 'HMM · K-Means · IF · OLS', isNew: true },
  { num: '05', name: 'Regime Detector', href: '/regime', icon: Activity, desc: 'Market state decoding via HMM', tech: 'Baum-Welch EM · Viterbi', isNew: true },
  { num: '06', name: 'Anomaly Scanner', href: '/anomaly', icon: AlertTriangle, desc: 'Unsupervised market anomaly detection', tech: 'Isolation Forest · 100 Trees', isNew: true },
  { num: '07', name: 'Vol Forecast', href: '/forecast', icon: TrendingUp, desc: 'Next-day volatility prediction', tech: 'OLS · Normal Equations · CI', isNew: true },
  { num: '08', name: 'Security SOC', href: '/security', icon: Shield, desc: 'Live adversarial defense system', tech: 'PromptGuard · Audit · Integrity', isNew: true },
  { num: '09', name: 'Tax Calculator', href: '/tax', icon: Receipt, desc: 'FY2025-26 Indian tax computation', tech: 'Old vs New Regime · HRA', isNew: false },
];

export default function HomePage() {
  return (
    <div>
      {/* HERO SECTION */}
      <div style={{ marginBottom: 60, maxWidth: 700 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 42,
          fontWeight: 400,
          color: 'var(--ink)',
          lineHeight: 1.15,
          margin: '0 0 16px 0',
        }}>
          Financial AI that knows{' '}
          <span style={{ color: 'var(--gold)' }}>when it&apos;s being attacked.</span>
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          color: 'var(--ink-muted)',
          lineHeight: 1.6,
          margin: 0,
          maxWidth: 560,
        }}>
          RiskGraph 3.0 — 4 ML models · Adversarial defense · Live NSE data · Every prediction mathematically auditable
        </p>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20, marginBottom: 60 }}>
        {[
          { value: 4, label: 'ML Models', suffix: '' },
          { value: 19, label: 'Mathematical Formulas', suffix: '' },
          { value: 10, label: 'Live NSE Assets', suffix: '' },
          { value: 100, label: 'Predictions Auditable', suffix: '%' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: 'var(--ink)',
            border: '1px solid var(--gold)',
            borderRadius: 8,
            padding: '24px 20px',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 36,
              fontWeight: 300,
              color: 'var(--gold)',
              lineHeight: 1,
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'baseline',
            }}>
              <AnimatedCounter target={stat.value} />
              {stat.suffix && <span>{stat.suffix}</span>}
            </div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: 'var(--cream)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* MODULE GRID */}
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 24,
        fontWeight: 400,
        color: 'var(--ink)',
        marginBottom: 24,
      }}>
        Deep Dive Modules
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 60 }}>
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none' }}>
              <div className="card-hover" style={{
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 24,
                height: '100%',
                transition: 'all 0.2s',
                position: 'relative',
              }}>
                {mod.isNew && (
                  <span style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    padding: '2px 8px',
                    borderRadius: 3,
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    background: 'rgba(201,168,76,0.15)',
                    color: 'var(--gold)',
                  }}>
                    NEW
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: 'var(--gold)',
                    fontWeight: 500,
                  }}>
                    {mod.num}
                  </span>
                  <Icon size={18} color="var(--ink)" strokeWidth={1.5} />
                </div>
                <h3 style={{
                  fontSize: 16,
                  color: 'var(--ink)',
                  margin: '0 0 6px 0',
                  fontWeight: 500,
                }}>
                  {mod.name}
                </h3>
                <p style={{
                  fontSize: 13,
                  color: 'var(--ink-muted)',
                  margin: '0 0 8px 0',
                  lineHeight: 1.4,
                }}>
                  {mod.desc}
                </p>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: 'var(--gold)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {mod.tech}
                  <ArrowRight size={10} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ARCHITECTURE DIAGRAM */}
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 24,
        fontWeight: 400,
        color: 'var(--ink)',
        marginBottom: 24,
      }}>
        System Architecture
      </h2>
      <div style={{
        background: 'var(--ink)',
        border: '1px solid var(--gold)',
        borderRadius: 8,
        padding: 32,
        marginBottom: 60,
      }}>
        {/* Row 1: Data Layer */}
        <div style={{
          border: '1px solid rgba(245,240,232,0.2)',
          borderRadius: 6,
          padding: '16px 20px',
          marginBottom: 12,
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--cream)',
            opacity: 0.6,
            marginBottom: 6,
          }}>
            DATA LAYER
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: 'var(--cream)',
          }}>
            Alpha Vantage → Feature Engineering → 10 BSE Assets
          </div>
        </div>

        {/* Arrow */}
        <div style={{ textAlign: 'center', fontSize: 16, color: 'var(--cream)', opacity: 0.4, margin: '4px 0' }}>↓</div>

        {/* Row 2: AI Layer */}
        <div style={{
          border: '1px solid rgba(245,240,232,0.2)',
          borderRadius: 6,
          padding: '16px 20px',
          marginBottom: 12,
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--cream)',
            opacity: 0.6,
            marginBottom: 6,
          }}>
            AI LAYER
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: 'var(--cream)',
          }}>
            HMM · K-Means · Isolation Forest · OLS
          </div>
        </div>

        {/* Arrow */}
        <div style={{ textAlign: 'center', fontSize: 16, color: 'var(--cream)', opacity: 0.4, margin: '4px 0' }}>↓</div>

        {/* Row 3: Security Layer */}
        <div style={{
          border: '1px solid var(--gold)',
          borderRadius: 6,
          padding: '16px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--gold)',
            marginBottom: 6,
          }}>
            SECURITY LAYER
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: 'var(--gold)',
          }}>
            PromptGuard · Integrity Monitor · Audit Log
          </div>
        </div>
      </div>

      {/* CTA ROW */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
        <Link href="/intelligence" style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ fontSize: 14, padding: '12px 28px' }}>
            Open Intelligence Dashboard
          </button>
        </Link>
        <Link href="/security" style={{ textDecoration: 'none' }}>
          <button className="btn-outline" style={{ fontSize: 14, padding: '12px 28px' }}>
            View Security Console
          </button>
        </Link>
        <a
          href="https://github.com/Praveen7Patil/RISK-GRAPH"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: 'none',
            padding: '12px 28px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: 'var(--ink-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          GitHub ↗
        </a>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .card-hover:hover {
          border-color: var(--gold) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
      `}} />
    </div>
  );
}
