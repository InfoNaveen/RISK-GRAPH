'use client';

import { useState } from 'react';
import type { CentralityResult } from '@/lib/types';

interface CentralityTableProps {
  data: CentralityResult[];
}

type SortKey = keyof CentralityResult;

export default function CentralityTable({ data }: CentralityTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('eigenvectorCentrality');
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'number' && typeof bv === 'number') {
      return sortAsc ? av - bv : bv - av;
    }
    return String(av).localeCompare(String(bv)) * (sortAsc ? 1 : -1);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const arrow = (key: SortKey) => sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : '';

  const badgeClass = (tier: string) => {
    if (tier === 'Systemic') return 'badge badge-systemic';
    if (tier === 'Elevated') return 'badge badge-elevated';
    return 'badge badge-peripheral';
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('asset')}>
              Asset{arrow('asset')}
            </th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('degree')}>
              Degree{arrow('degree')}
            </th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('eigenvectorCentrality')}>
              Eigenvector Centrality{arrow('eigenvectorCentrality')}
            </th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('betweennessCentrality')}>
              Betweenness Centrality{arrow('betweennessCentrality')}
            </th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('weightedDegree')}>
              Weighted Degree{arrow('weightedDegree')}
            </th>
            <th>Risk Tier</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(row => (
            <tr key={row.asset}>
              <td style={{ fontWeight: 500 }}>{row.asset}</td>
              <td className="font-num">{row.degree}</td>
              <td className="font-num">{row.eigenvectorCentrality.toFixed(4)}</td>
              <td className="font-num">{row.betweennessCentrality.toFixed(4)}</td>
              <td className="font-num">{row.weightedDegree.toFixed(3)}</td>
              <td><span className={badgeClass(row.riskTier)}>{row.riskTier}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
