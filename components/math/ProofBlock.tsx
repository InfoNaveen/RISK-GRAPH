'use client';

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface DerivationStep {
  equation: string;
  explanation: string;
}

interface ProofBlockProps {
  steps: DerivationStep[];
}

function StepRow({ step, index }: { step: DerivationStep; index: number }) {
  const eqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eqRef.current) {
      katex.render(step.equation, eqRef.current, {
        displayMode: true,
        throwOnError: false,
      });
    }
  }, [step.equation]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: 'var(--ink-muted)',
          width: 48,
          flexShrink: 0,
          textAlign: 'right',
          paddingTop: 8, // align with katex baseline loosely
        }}>
          Step {index + 1}
        </div>
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
          <div ref={eqRef} style={{ margin: 0, paddingLeft: 8 }} />
        </div>
      </div>
      <div style={{
        paddingLeft: 60,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        color: 'var(--ink-muted)',
        marginTop: 4,
      }}>
        {/* The user provided explanation enclosed in [] or plain text */}
        {step.explanation.replace(/^\[|\]$/g, '')}
      </div>
    </div>
  );
}

export default function ProofBlock({ steps }: ProofBlockProps) {
  return (
    <div style={{
      background: 'var(--surface-2)',
      borderLeft: '2px solid var(--gold)',
      padding: '20px 24px 4px 24px',
      borderRadius: '0 4px 4px 0',
    }}>
      {steps.map((step, i) => (
        <StepRow key={i} step={step} index={i} />
      ))}
    </div>
  );
}
