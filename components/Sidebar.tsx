'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Share2, TrendingUp, Zap, PieChart, Receipt, BookOpen, BarChart2 } from 'lucide-react';

const navItems = [
  { href: '/network', label: 'Network Graph', icon: Share2 },
  { href: '/prices', label: 'Price History', icon: BarChart2 },
  { href: '/monte-carlo', label: 'Monte Carlo', icon: TrendingUp },
  { href: '/stress', label: 'Stress Testing', icon: Zap },
  { href: '/networth', label: 'Net Worth', icon: PieChart },
  { href: '/tax', label: 'Tax Calculator', icon: Receipt },
  { href: '/math', label: 'Math Reference', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar-desktop" style={{
        width: 220,
        minHeight: '100vh',
        borderRight: '1px solid var(--border)',
        background: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: '32px 24px 24px' }}>
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
            2.0
          </span>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 0 0 0' }}>
          {navItems.map(item => {
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
                  padding: '12px 24px',
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
        </nav>

        {/* Footer */}
        <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: 'var(--ink-muted)',
          }}>
            Invariant Systems
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            color: 'var(--ink-muted)',
            opacity: 0.6,
            marginTop: 2,
          }}>
            MathXplore 2026
          </div>
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
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 50,
      }}>
        {navItems.map(item => {
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
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
