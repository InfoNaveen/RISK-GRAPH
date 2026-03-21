import React, { useMemo } from 'react';
import { ASSET_NAMES } from '@/lib/types';
import { SYNTHETIC_PRICES } from '@/lib/priceData';
import { formatINR } from '@/lib/math';
import SparklineRow from './SparklineRow';

interface PriceTableProps {
  selectedAssets: string[];
}

export default function PriceTable({ selectedAssets }: PriceTableProps) {
  const tableData = useMemo(() => {
    return ASSET_NAMES.filter(a => selectedAssets.includes(a)).map(asset => {
      const prices = SYNTHETIC_PRICES[asset];
      const start = prices[0];
      const current = prices[prices.length - 1];
      const change = ((current - start) / start) * 100;
      
      const high = Math.max(...prices);
      const low = Math.min(...prices);

      // Compute realized volatility
      const returns: number[] = [];
      for(let i=1; i<prices.length; i++) {
        returns.push(Math.log(prices[i] / prices[i-1]));
      }
      const meanRet = returns.reduce((a,b)=>a+b, 0) / returns.length;
      const varRet = returns.reduce((a,b)=>a + Math.pow(b - meanRet, 2), 0) / (returns.length - 1);
      const vol = Math.sqrt(varRet * 252) * 100;
      
      const sharpe = meanRet > 0 ? (meanRet * 252) / (Math.sqrt(varRet * 252)) : 0;

      return {
        asset,
        start,
        current,
        change,
        high,
        low,
        vol,
        sharpe,
        prices
      };
    });
  }, [selectedAssets]);

  if (tableData.length === 0) return null;

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: 'white' }}>
      <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--surface)' }}>
            <th style={{ textAlign: 'left' }}>Asset</th>
            <th>60D Trend</th>
            <th>Start Price</th>
            <th>Current Price</th>
            <th>Return</th>
            <th>52W High</th>
            <th>52W Low</th>
            <th>Vol (Ann)</th>
            <th>Sharpe</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => (
            <tr key={row.asset}>
              <td style={{ textAlign: 'left', fontWeight: 500 }}>{row.asset}</td>
              <td style={{ width: 140, paddingRight: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <SparklineRow data={row.prices} />
                </div>
              </td>
              <td className="font-num">{formatINR(row.start)}</td>
              <td className="font-num" style={{ fontWeight: 600 }}>{formatINR(row.current)}</td>
              <td className="font-num" style={{ color: row.change >= 0 ? 'var(--risk-green)' : 'var(--risk-red)' }}>
                {row.change > 0 ? '+' : ''}{row.change.toFixed(2)}%
              </td>
              <td className="font-num" style={{ color: 'var(--ink-muted)' }}>{formatINR(row.high)}</td>
              <td className="font-num" style={{ color: 'var(--ink-muted)' }}>{formatINR(row.low)}</td>
              <td className="font-num">{row.vol.toFixed(2)}%</td>
              <td className="font-num">{row.sharpe.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
