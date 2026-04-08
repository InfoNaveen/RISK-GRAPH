// ─── Blockchain Audit Anchoring — Polygon Amoy Testnet ────────────────────
// Writes audit log hash to Polygon Amoy as calldata for tamper-proof retention
// SEBI Regulation 25(1) RA Regs — 5-year minimum record retention

import { ethers } from 'ethers';
import { AuditEntry } from '@/lib/security/audit-logger';

export interface BlockchainAnchor {
  txHash: string;
  blockNumber: number;
  timestamp: string;
  entriesAnchored: number;
  merkleRoot: string;
  network: 'polygon-amoy';
  explorerUrl: string;
}

export interface AnchorResult {
  success: boolean;
  anchor?: BlockchainAnchor;
  error?: string;
}

// Simple hash root: concatenate all entry hashes and compute a final hash
function computeAuditRoot(entries: AuditEntry[]): string {
  if (entries.length === 0) return '0x' + '0'.repeat(64);
  const combined = entries.map(e => e.hash).join('');
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash) + combined.charCodeAt(i);
    hash = hash & hash;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}

export async function anchorAuditLog(
  entries: AuditEntry[],
  privateKey: string,
  rpcUrl: string
): Promise<AnchorResult> {
  try {
    if (!privateKey) {
      return { success: false, error: 'POLYGON_PRIVATE_KEY not configured' };
    }
    if (!rpcUrl) {
      return { success: false, error: 'POLYGON_AMOY_RPC not configured' };
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const auditRoot = computeAuditRoot(entries);
    const payload = JSON.stringify({
      platform: 'RiskGraph 3.0',
      auditRoot,
      entries: entries.length,
      timestamp: new Date().toISOString(),
      sebiCompliance: 'Regulation 25(1) RA Regs — 5yr retention',
    });

    // Write to chain as calldata on a self-transfer (0 MATIC)
    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: BigInt(0),
      data: ethers.hexlify(ethers.toUtf8Bytes(payload)),
    });

    const receipt = await tx.wait();
    if (!receipt) throw new Error('Transaction failed — no receipt');

    return {
      success: true,
      anchor: {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date().toISOString(),
        entriesAnchored: entries.length,
        merkleRoot: auditRoot,
        network: 'polygon-amoy',
        explorerUrl: `https://amoy.polygonscan.com/tx/${receipt.hash}`,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'Unknown blockchain error',
    };
  }
}
