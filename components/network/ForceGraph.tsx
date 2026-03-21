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

interface ForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string | null) => void;
}

function interpolateColor(t: number): string {
  // risk-green (#1A6B3C) to risk-red (#C0392B)
  const r = Math.round(26 + (192 - 26) * t);
  const g = Math.round(107 + (57 - 107) * t);
  const b = Math.round(60 + (43 - 60) * t);
  return `rgb(${r},${g},${b})`;
}

export default function ForceGraph({ nodes, edges, onNodeClick }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [simNodes, setSimNodes] = useState<GraphNode[]>([]);
  const [simLinks, setSimLinks] = useState<GraphEdge[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const simulationRef = useRef<ReturnType<typeof forceSimulation> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container
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

  const initSimulation = useCallback(() => {
    const nodesCopy = nodes.map(n => ({ ...n }));
    const linksCopy = edges.map(e => ({ ...e }));

    const sim = forceSimulation(nodesCopy as SimulationNodeDatum[])
      .force('charge', forceManyBody().strength(-300))
      .force('link', forceLink(linksCopy as SimulationLinkDatum<SimulationNodeDatum>[])
        .id((d: SimulationNodeDatum) => (d as GraphNode).id)
        .distance(80))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', forceCollide().radius((d: SimulationNodeDatum) => {
        const node = d as GraphNode;
        return 8 + 14 * node.eigenvectorCentrality + 4;
      }))
      .alphaDecay(0.02)
      .on('tick', () => {
        setSimNodes([...nodesCopy] as GraphNode[]);
        setSimLinks([...linksCopy] as GraphEdge[]);
      });

    simulationRef.current = sim;
    return () => { sim.stop(); };
  }, [nodes, edges, dimensions]);

  useEffect(() => {
    const cleanup = initSimulation();
    return cleanup;
  }, [initSimulation]);

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

  // Get 1-hop neighbors for highlighting
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

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', minHeight: 450 }}>
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
          const corr = Math.abs(link.weight);
          const isHighCorr = corr > 0.6;
          const dimmed = selected && (!neighbors.has(src.id) || !neighbors.has(tgt.id));
          return (
            <line
              key={`edge-${i}`}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke={isHighCorr ? '#C9A84C' : '#6B6660'}
              strokeWidth={0.5 + 2.5 * corr}
              opacity={dimmed ? 0.1 : 0.6}
            />
          );
        })}

        {/* Nodes */}
        {simNodes.map(node => {
          if (!node.x || !node.y) return null;
          const radius = 8 + 14 * node.eigenvectorCentrality;
          const dimmed = selected && !neighbors.has(node.id);
          const isHovered = hovered === node.id;
          return (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill={interpolateColor(node.eigenvectorCentrality)}
                opacity={dimmed ? 0.15 : 1}
                stroke={isHovered || selected === node.id ? 'var(--gold)' : 'white'}
                strokeWidth={isHovered || selected === node.id ? 2.5 : 1.5}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => {
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
                }}
                onMouseLeave={() => {
                  setHovered(null);
                  setTooltip(null);
                }}
                onClick={() => handleNodeClick(node.id)}
              />
              <text
                x={node.x}
                y={node.y! + radius + 14}
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
