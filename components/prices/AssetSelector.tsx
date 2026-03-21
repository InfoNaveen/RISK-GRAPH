import React from 'react';
import { ASSET_NAMES } from '@/lib/types';

interface AssetSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function AssetSelector({ selected, onChange }: AssetSelectorProps) {
  const toggle = (asset: string) => {
    if (selected.includes(asset)) {
      if (selected.length > 1) { // prevent deselecting all
        onChange(selected.filter(a => a !== asset));
      }
    } else {
      onChange([...selected, asset]);
    }
  };

  const toggleAll = () => {
    if (selected.length === ASSET_NAMES.length) {
      onChange([ASSET_NAMES[0]]); // keep just one
    } else {
      onChange([...ASSET_NAMES]);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        onClick={toggleAll}
        style={{
          padding: '6px 14px',
          background: selected.length === ASSET_NAMES.length ? 'var(--ink)' : 'transparent',
          color: selected.length === ASSET_NAMES.length ? 'white' : 'var(--ink-muted)',
          border: `1px solid ${selected.length === ASSET_NAMES.length ? 'var(--ink)' : 'var(--border)'}`,
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        ALL
      </button>
      {ASSET_NAMES.map(asset => {
        const isActive = selected.includes(asset);
        return (
          <button
            key={asset}
            onClick={() => toggle(asset)}
            style={{
              padding: '6px 14px',
              background: isActive ? 'var(--surface-2)' : 'transparent',
              color: isActive ? 'var(--ink)' : 'var(--ink-muted)',
              border: `1px solid ${isActive ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: 20,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {asset}
          </button>
        );
      })}
    </div>
  );
}
