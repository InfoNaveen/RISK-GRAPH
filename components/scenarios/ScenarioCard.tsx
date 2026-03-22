'use client';

import React from 'react';
import { ScenarioDefinition } from '@/lib/scenarios';

interface ScenarioCardProps {
  scenario: ScenarioDefinition;
  impactPercent: number;
  onAnalyze: () => void;
}

export default function ScenarioCard({ scenario, impactPercent, onAnalyze }: ScenarioCardProps) {
  const isNegative = impactPercent < 0;
  
  return (
    <div style={{ 
      background: 'var(--surface)', 
      border: '1px solid var(--border)', 
      borderRadius: 4, 
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, margin: 0 }}>{scenario.name}</h4>
        <span style={{ 
          background: 'var(--cream)', 
          padding: '4px 8px', 
          borderRadius: 4, 
          fontSize: 10, 
          fontFamily: 'DM Sans',
          color: 'var(--ink-muted)',
          border: '1px solid var(--border)' 
        }}>{scenario.date}</span>
      </div>
      
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 24, flex: 1, lineHeight: 1.5 }}>
        {scenario.description}
      </p>

      <div style={{ 
        background: 'var(--cream)', 
        border: '1px solid var(--border)', 
        padding: '12px', 
        borderRadius: 4,
        marginBottom: 16,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Portfolio Impact</div>
        <div style={{ 
          fontFamily: 'JetBrains Mono', 
          fontSize: 20, 
          fontWeight: 600,
          color: isNegative ? 'var(--risk-red)' : 'var(--risk-green)'
        }}>
          {isNegative ? '' : '+'}{(impactPercent * 100).toFixed(1)}%
        </div>
      </div>

      <button
        onClick={onAnalyze}
        className="btn-outline"
        style={{ width: '100%', fontSize: 13, padding: 10 }}
      >
        Analyze &rarr;
      </button>

    </div>
  );
}
