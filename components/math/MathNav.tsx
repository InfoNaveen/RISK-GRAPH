'use client';

import React from 'react';

const SECTIONS = [
  { id: 'sec-1', label: '1. Stochastic Processes' },
  { id: 'sec-2', label: '2. Portfolio Theory' },
  { id: 'sec-3', label: '3. Graph Centrality' },
  { id: 'sec-4', label: '4. Spectral Risk' },
  { id: 'sec-5', label: '5. Monte Carlo Methods' },
  { id: 'sec-6', label: '6. Stress Testing' },
  { id: 'sec-7', label: '7. Contagion Dynamics' },
  { id: 'sec-8', label: '8. Risk Measures' },
  { id: 'sec-9', label: '9. Efficient Frontier' },
  { id: 'sec-10', label: '10. Portfolio Attribution' },
  { id: 'sec-11', label: '11. Drawdown Analysis' },
];

export default function MathNav() {
  const [active, setActive] = React.useState('sec-1');

  React.useEffect(() => {
    const handleScroll = () => {
      const offsets = SECTIONS.map(s => {
        const el = document.getElementById(s.id);
        return el ? el.getBoundingClientRect().top : Infinity;
      });
      // Find the last section whose top is <= 150px from viewport top
      let currentIdx = offsets.findLastIndex(offset => offset <= 150);
      if (currentIdx === -1) currentIdx = 0;
      setActive(SECTIONS[currentIdx]?.id || 'sec-1');
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav style={{
      position: 'sticky',
      top: 80,
      width: 180,
      flexShrink: 0,
    }}>
      <h3 style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--ink-muted)',
        marginBottom: 16,
        paddingLeft: 12,
      }}>
        Contents
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {SECTIONS.map((sec) => (
          <li key={sec.id}>
            <a
              href={`#${sec.id}`}
              style={{
                display: 'block',
                padding: '8px 12px',
                fontSize: 13,
                textDecoration: 'none',
                color: active === sec.id ? 'var(--ink)' : 'var(--ink-muted)',
                fontWeight: active === sec.id ? 500 : 400,
                borderLeft: active === sec.id ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
              onClick={() => setActive(sec.id)}
            >
              {sec.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
