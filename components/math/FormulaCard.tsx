'use client';

import React, { useEffect, useRef, useState } from 'react';
import ProofBlock, { type DerivationStep } from './ProofBlock';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface FormulaCardProps {
  id: string;
  title: string;
  formula: string;
  description: string;
  derivation?: DerivationStep[];
  usedInConfig?: { links: { label: string; route: string }[] };
}

export default function FormulaCard({ id, title, formula, description, derivation, usedInConfig }: FormulaCardProps) {
  const formulaRef = useRef<HTMLDivElement>(null);
  const [showProof, setShowProof] = useState(false);

  useEffect(() => {
    if (formulaRef.current) {
      katex.render(formula, formulaRef.current, {
        displayMode: true,
        throwOnError: false,
      });
    }
  }, [formula]);

  return (
    <div
      id={id}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        padding: '28px 32px',
        marginBottom: 16,
      }}
    >
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--ink-muted)',
      }}>
        {title}
      </div>

      <div ref={formulaRef} style={{ fontSize: '1.1em', margin: '16px 0', overflowX: 'auto', overflowY: 'hidden' }} />

      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        color: 'var(--ink)',
        lineHeight: 1.7,
      }}>
        {description}
      </div>

      {derivation && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setShowProof(!showProof)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 12,
              color: 'var(--gold)',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {showProof ? '▼ Hide Derivation' : '▶ Show Derivation'}
          </button>
          
          {showProof && (
            <div style={{ marginTop: 12 }}>
              <ProofBlock steps={derivation} />
            </div>
          )}
        </div>
      )}

      {usedInConfig && (
        <div style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: 'var(--ink-muted)',
          display: 'flex',
          gap: 6,
          alignItems: 'center'
        }}>
          <span>Used in →</span>
          {usedInConfig.links.map((link, i) => (
            <React.Fragment key={link.route}>
              <a 
                href={link.route}
                style={{
                  color: 'var(--ink)',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--border)',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderBottomColor = 'var(--gold)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderBottomColor = 'var(--border)'; }}
              >
                {link.label}
              </a>
              {i < usedInConfig.links.length - 1 && <span>,</span>}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
