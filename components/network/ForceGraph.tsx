'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { GraphNode, GraphEdge } from '@/lib/types';
import { ASSET_COLORS } from '@/lib/types';

interface ForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  alpha?: number;
  onNodeClick?: (nodeId: string | null) => void;
}

/* ── Color utilities ───────────────────────────────────────────────── */

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parseHex(a);
  const [r2, g2, b2] = parseHex(b);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${clamp(r1 + (r2 - r1) * t)},${clamp(g1 + (g2 - g1) * t)},${clamp(b1 + (b2 - b1) * t)})`;
}

/** 3-stop color ramp: 0→ink-muted, 0.6→gold, 1.0→risk-red */
function edgeColor(effectiveCorr: number): string {
  const INK = '#6B6660';
  const GOLD = '#C9A84C';
  const RED = '#C0392B';
  const t = Math.max(0, Math.min(1, effectiveCorr));
  if (t <= 0.6) {
    return lerpColor(INK, GOLD, t / 0.6);
  }
  return lerpColor(GOLD, RED, (t - 0.6) / 0.4);
}

/** Original centrality → green-to-red ramp */
function interpolateCentralityColor(t: number): string {
  const r = Math.round(26 + (192 - 26) * t);
  const g = Math.round(107 + (57 - 107) * t);
  const b = Math.round(60 + (43 - 60) * t);
  return `rgb(${r},${g},${b})`;
}

/** Convert any CSS rgb(...) or hex to hex for lerpColor */
function toHex(color: string): string {
  if (color.startsWith('#')) return color;
  const m = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return '#6B6660';
  return '#' + [m[1], m[2], m[3]].map(v => parseInt(v).toString(16).padStart(2, '0')).join('');
}

/* ── Pulse keyframes (injected once) ───────────────────────────────── */
const PULSE_STYLE_ID = 'rg-force-pulse';
function ensurePulseKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(PULSE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PULSE_STYLE_ID;
  style.textContent = `
    @keyframes rgPulse {
      0%, 100% { stroke-opacity: 0.6; stroke-width: 2px; }
      50%      { stroke-opacity: 1;   stroke-width: 4px; }
    }
  `;
  document.head.appendChild(style);
}

/* ── Component ─────────────────────────────────────────────────────── */

export default function ForceGraph({ nodes, edges, alpha = 0, onNodeClick }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [simNodes, setSimNodes] = useState<GraphNode[]>([]);
  const [simLinks, setSimLinks] = useState<GraphEdge[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const simulationRef = useRef<ReturnType<typeof forceSimulation> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { ensurePulseKeyframes(); }, []);

  /* ── Measure container ───────────────────────────────────────────── */
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width || 600, height: Math.max(rect.height, 450) });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  /* ── Helper: compute node radius ─────────────────────────────────── */
  const getNodeRadius = useCallback((node: GraphNode) => {
    const base = 8 + 14 * node.eigenvectorCentrality;
    const isSpecial = ['Gold', 'Silver', 'RealEstate'].includes(node.id);
    return isSpecial ? base * 1.2 : base;
  }, []);

  /* ── Init simulation ─────────────────────────────────────────────── */
  const initSimulation = useCallback(() => {
    const nodesCopy = nodes.map(n => ({ ...n }));
    const linksCopy = edges.map(e => ({ ...e }));

    const linkDistance = 120 - (alpha * 90);
    const chargeStrength = -300 + (alpha * 250);
    const centerStrength = 0.05 + (alpha * 0.45);

    const sim = forceSimulation(nodesCopy as SimulationNodeDatum[])
      .force('charge', forceManyBody().strength(chargeStrength))
      .force('link', forceLink(linksCopy as SimulationLinkDatum<SimulationNodeDatum>[])
        .id((d: SimulationNodeDatum) => (d as GraphNode).id)
        .distance(linkDistance))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2).strength(centerStrength))
      .force('collision', forceCollide().radius((d: SimulationNodeDatum) => {
        const node = d as GraphNode;
        const r = getNodeRadius(node);
        const collisionR = r - (alpha * r * 0.6);
        return collisionR + 4;
      }))
      .alphaDecay(0.02)
      .on('tick', () => {
        setSimNodes([...nodesCopy] as GraphNode[]);
        setSimLinks([...linksCopy] as GraphEdge[]);
      });

    simulationRef.current = sim;
    return () => { sim.stop(); };
  }, [nodes, edges, dimensions, alpha, getNodeRadius]);

  useEffect(() => {
    const cleanup = initSimulation();
    return cleanup;
  }, [initSimulation]);

  /* ── Update forces when alpha changes (gentle reheat) ────────────── */
  const prevAlphaRef = useRef(alpha);
  useEffect(() => {
    if (prevAlphaRef.current === alpha) return;
    prevAlphaRef.current = alpha;

    const sim = simulationRef.current;
    if (!sim) return;

    const linkDistance = 120 - (alpha * 90);
    const chargeStrength = -300 + (alpha * 250);
    const centerStrength = 0.05 + (alpha * 0.45);

    const linkForce = sim.force('link') as ReturnType<typeof forceLink> | undefined;
    if (linkForce) (linkForce as any).distance(linkDistance);

    const chargeForce = sim.force('charge') as ReturnType<typeof forceManyBody> | undefined;
    if (chargeForce) (chargeForce as any).strength(chargeStrength);

    const centerForce = sim.force('center') as ReturnType<typeof forceCenter> | undefined;
    if (centerForce) (centerForce as any).strength(centerStrength);

    const collisionForce = sim.force('collision') as ReturnType<typeof forceCollide> | undefined;
    if (collisionForce) {
      (collisionForce as any).radius((d: SimulationNodeDatum) => {
        const node = d as GraphNode;
        const r = getNodeRadius(node);
        return (r - (alpha * r * 0.6)) + 4;
      });
    }

    sim.alpha(0.3).restart();
  }, [alpha, getNodeRadius]);

  /* ── Handlers ────────────────────────────────────────────────────── */
  const handleRandomize = () => {
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
  };

  const handleNodeClick = (nodeId: string) => {
    const newSelected = selected === nodeId ? null : nodeId;
    setSelected(newSelected);
    onNodeClick?.(newSelected);
  };

  /* ── Neighbor set for selection dimming ───────────────────────────── */
  const neighbors = new Set<string>();
  if (selected) {
    neighbors.add(selected);
    for (const link of simLinks) {
      const src = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id;
      const tgt = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
      if (src === selected) neighbors.add(tgt);
      if (tgt === selected) neighbors.add(src);
    }
  }

  /* ── Pulse active? ───────────────────────────────────────────────── */
  const showPulse = alpha > 0.7;

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', minHeight: 450 }}>
      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        background: 'rgba(255,255,255,0.8)',
        padding: '6px 12px',
        borderRadius: 4,
        fontSize: 11,
        fontFamily: "'DM Sans', sans-serif",
        color: 'var(--ink)',
        display: 'flex',
        gap: 12,
        pointerEvents: 'none'
      }}>
        <span>● Equity</span>
        <span>◆ Commodity</span>
        <span>■ Real Assets</span>
      </div>

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block', cursor: 'grab' }}
      >
        {/* Edges */}
        {simLinks.map((link, i) => {
          const src = link.source as GraphNode;
          const tgt = link.target as GraphNode;
          if (!src.x || !tgt.x) return null;

          const baseCorr = Math.abs(link.weight);
          const effectiveCorr = (1 - alpha) * baseCorr + alpha * 1.0;

          const color = edgeColor(effectiveCorr);
          const width = (0.5 + 2.5 * effectiveCorr) * (1 + alpha);
          const dimmed = selected && (!neighbors.has(src.id) || !neighbors.has(tgt.id));

          return (
            <line
              key={`edge-${i}`}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke={color}
              strokeWidth={width}
              opacity={dimmed ? 0.1 : (effectiveCorr < 0.4 ? 0.2 : 0.6)}
              style={{ transition: 'stroke 0.4s ease, stroke-width 0.3s ease, opacity 0.3s ease' }}
            />
          );
        })}

        {/* Nodes */}
        {simNodes.map(node => {
          if (!node.x || !node.y) return null;

          const isGoldOrSilver = node.id === 'Gold' || node.id === 'Silver';
          const isRealEstate = node.id === 'RealEstate';
          const isSpecial = isGoldOrSilver || isRealEstate;

          const radius = getNodeRadius(node);

          const dimmed = selected && !neighbors.has(node.id);
          const isHovered = hovered === node.id;

          // Base fill: special assets use ASSET_COLORS, equities use centrality ramp
          const baseFillHex = isSpecial
            ? ASSET_COLORS[node.id]
            : toHex(interpolateCentralityColor(node.eigenvectorCentrality));

          // Blend toward risk-red based on alpha
          const fill = alpha > 0 ? lerpColor(baseFillHex, '#C0392B', alpha * 0.6) : (isSpecial ? ASSET_COLORS[node.id] : interpolateCentralityColor(node.eigenvectorCentrality));

          const stroke = isHovered || selected === node.id ? 'var(--gold)' : 'white';
          const strokeWidth = isHovered || selected === node.id ? 2.5 : 1.5;

          const commonProps = {
            fill,
            opacity: dimmed ? 0.15 : 1,
            stroke: showPulse ? '#C0392B' : stroke,
            strokeWidth,
            style: {
              cursor: 'pointer' as const,
              transition: 'fill 0.4s ease, opacity 0.2s',
              ...(showPulse ? {
                animation: 'rgPulse 1.5s ease-in-out infinite',
              } : {}),
            },
            onMouseEnter: () => {
              setHovered(node.id);
              const svg = svgRef.current;
              if (svg) {
                const rect = svg.getBoundingClientRect();
                setTooltip({
                  x: node.x! - rect.left + 12,
                  y: node.y! - rect.top - 12,
                  text: `${node.id} | Centrality: ${node.eigenvectorCentrality.toFixed(3)} | Degree: ${node.degree}`,
                });
              }
            },
            onMouseLeave: () => {
              setHovered(null);
              setTooltip(null);
            },
            onClick: () => handleNodeClick(node.id),
          };

          return (
            <g key={node.id}>
              {isGoldOrSilver ? (
                <polygon
                  points={`
                    ${node.x},${node.y - radius}
                    ${node.x + radius},${node.y}
                    ${node.x},${node.y + radius}
                    ${node.x - radius},${node.y}
                  `}
                  {...commonProps}
                />
              ) : isRealEstate ? (
                <rect
                  x={node.x - radius}
                  y={node.y - radius}
                  width={radius * 2}
                  height={radius * 2}
                  rx={2}
                  {...commonProps}
                />
              ) : (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  {...commonProps}
                />
              )}

              <text
                x={node.x}
                y={node.y + radius + 14}
                textAnchor="middle"
                fontSize={10}
                fontFamily="'DM Sans', sans-serif"
                fill={dimmed ? 'var(--border)' : 'var(--ink-muted)'}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {node.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}

      {/* Randomize button */}
      <button
        onClick={handleRandomize}
        className="btn-outline"
        style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 11 }}
      >
        Randomize Layout
      </button>
    </div>
  );
}
