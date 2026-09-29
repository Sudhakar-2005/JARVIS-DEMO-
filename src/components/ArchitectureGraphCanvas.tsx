import React, { useState, useRef } from 'react';
import { DiagramNodeId, HUDTheme } from '../types';
import { THEMES } from '../utils/theme';
import {
  DIAGRAM_CLUSTERS,
  DIAGRAM_NODES,
  DIAGRAM_EDGES,
  DiagramNodeDef,
} from '../data/architectureGraphData';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Hand,
  Layers,
} from 'lucide-react';

interface ArchitectureGraphCanvasProps {
  theme: HUDTheme;
  selectedNode: DiagramNodeId;
  onSelectNode: (nodeId: DiagramNodeId) => void;
  activeNodeId?: DiagramNodeId;
  activeEdgeId?: string;
}

export const ArchitectureGraphCanvas: React.FC<ArchitectureGraphCanvasProps> = ({
  theme,
  selectedNode,
  onSelectNode,
  activeNodeId,
  activeEdgeId,
}) => {
  const currentTheme = THEMES[theme];
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.0, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.65, +(z - 0.15).toFixed(2)));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // Only pan if not clicking a node directly
    const target = e.target as HTMLElement;
    if (target.closest('.diagram-interactive-node')) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Helper map for node coordinates
  const nodeMap = new Map<DiagramNodeId, DiagramNodeDef>();
  DIAGRAM_NODES.forEach((n) => nodeMap.set(n.id, n));

  // Compute center coordinates for arrow routing
  const getNodeCenter = (id: DiagramNodeId) => {
    const n = nodeMap.get(id);
    if (!n) {
      return {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      };
    }
    return {
      x: n.x + n.width / 2,
      y: n.y + n.height / 2,
      w: n.width,
      h: n.height,
      top: n.y,
      bottom: n.y + n.height,
      left: n.x,
      right: n.x + n.width,
    };
  };

  // Compute smooth orthogonal or curved line path between two nodes
  const calculatePath = (sourceId: DiagramNodeId, targetId: DiagramNodeId) => {
    const s = getNodeCenter(sourceId);
    const t = getNodeCenter(targetId);

    let startX = s.x;
    let startY = s.bottom;
    let endX = t.x;
    let endY = t.top;

    if (t.top >= s.bottom - 10) {
      // Target is below source
      startY = s.bottom;
      endY = t.top;
      const midY = (startY + endY) / 2;
      return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
    } else if (t.bottom <= s.top + 10) {
      // Target is above source
      startY = s.top;
      endY = t.bottom;
      const midY = (startY + endY) / 2;
      return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
    } else if (t.left >= s.right - 10) {
      // Target is to the right
      startX = s.right;
      startY = s.y;
      endX = t.left;
      endY = t.y;
      const midX = (startX + endX) / 2;
      return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
    } else if (t.right <= s.left + 10) {
      // Target is to the left
      startX = s.left;
      startY = s.y;
      endX = t.right;
      endY = t.y;
      const midX = (startX + endX) / 2;
      return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
    }

    // Default curve
    return `M ${startX} ${startY} Q ${(startX + endX) / 2} ${(startY + endY) / 2} ${endX} ${endY}`;
  };

  // Compute label position along curve
  const getMidPoint = (sourceId: DiagramNodeId, targetId: DiagramNodeId) => {
    const s = getNodeCenter(sourceId);
    const t = getNodeCenter(targetId);
    return {
      x: (s.x + t.x) / 2,
      y: (s.y + t.y) / 2,
    };
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-slate-950 select-none border border-slate-800 rounded-xl flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[620px]'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* Top Diagram Controls HUD Strip */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg flex items-center gap-2 pointer-events-auto shadow-xl">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-slate-100">
            SYSTEM ARCHITECTURAL BLUEPRINT
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            5 SUB-SYSTEMS · 20 COMPONENT MODULES
          </span>
        </div>

        {/* Viewport Zoom & Action Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-lg pointer-events-auto shadow-xl">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-cyan-400 font-bold px-1.5 min-w-[36px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            title="Reset View (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ml-0.5"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SVG Canvas Area with Pan and Zoom */}
      <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center relative">
        <svg
          viewBox="0 0 1190 890"
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.12s ease-out',
          }}
        >
          <defs>
            {/* Arrow marker standard */}
            <marker
              id="arrow-end"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
            </marker>

            {/* Glowing active arrow marker */}
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
            </marker>

            {/* Cylinder Gradients for Context & Memory */}
            <linearGradient id="cylinderGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4c0519" />
              <stop offset="50%" stopColor="#881337" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>

            {/* Subtle Grid Pattern for Canvas Background */}
            <pattern id="diagGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Canvas Background Grid */}
          <rect width="1190" height="890" fill="url(#diagGrid)" />

          {/* 1. RENDER SUBSYSTEM CLUSTERS (Background Containers from diagram (1).png) */}
          {DIAGRAM_CLUSTERS.map((cl) => {
            let bgFill = 'rgba(15, 23, 42, 0.6)';
            let borderStroke = '#334155';
            let titleColor = '#94a3b8';

            if (cl.id === 'user_interaction') {
              bgFill = 'rgba(2, 132, 199, 0.08)';
              borderStroke = 'rgba(56, 189, 248, 0.35)';
              titleColor = '#38bdf8';
            } else if (cl.id === 'assistant_runtime') {
              bgFill = 'rgba(217, 119, 6, 0.08)';
              borderStroke = 'rgba(245, 158, 11, 0.35)';
              titleColor = '#fbbf24';
            } else if (cl.id === 'context_memory') {
              bgFill = 'rgba(225, 29, 72, 0.08)';
              borderStroke = 'rgba(244, 63, 94, 0.35)';
              titleColor = '#fda4af';
            } else if (cl.id === 'actions_skills') {
              bgFill = 'rgba(5, 150, 105, 0.08)';
              borderStroke = 'rgba(16, 185, 129, 0.35)';
              titleColor = '#34d399';
            } else if (cl.id === 'display_remote') {
              bgFill = 'rgba(99, 102, 241, 0.08)';
              borderStroke = 'rgba(129, 140, 248, 0.35)';
              titleColor = '#818cf8';
            }

            return (
              <g key={cl.id}>
                <rect
                  x={cl.x}
                  y={cl.y}
                  width={cl.width}
                  height={cl.height}
                  rx="14"
                  fill={bgFill}
                  stroke={borderStroke}
                  strokeWidth="1.5"
                  className="transition-all duration-300"
                />
                <text
                  x={cl.x + 14}
                  y={cl.y + 18}
                  fill={titleColor}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  letterSpacing="0.05em"
                >
                  {cl.name.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* 2. RENDER LABELED CONNECTING ARROWS */}
          {DIAGRAM_EDGES.map((edge) => {
            const pathStr = calculatePath(edge.source, edge.target);
            const mid = getMidPoint(edge.source, edge.target);
            const isActive =
              edge.id === activeEdgeId ||
              edge.source === selectedNode ||
              edge.target === selectedNode ||
              edge.source === activeNodeId ||
              edge.target === activeNodeId;

            return (
              <g key={edge.id} className="transition-all duration-300">
                {/* Halo line when active */}
                {isActive && (
                  <path
                    d={pathStr}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeOpacity="0.4"
                    filter="drop-shadow(0 0 6px rgba(56, 189, 248, 0.8))"
                  />
                )}

                {/* Main line */}
                <path
                  d={pathStr}
                  fill="none"
                  stroke={isActive ? '#38bdf8' : '#475569'}
                  strokeWidth={isActive ? '2' : '1.5'}
                  strokeDasharray={edge.style === 'dashed' ? '4 3' : undefined}
                  markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow-end)'}
                  className="transition-colors duration-200"
                />

                {/* Animated light pulse traveling along arrow if active */}
                {isActive && (
                  <circle r="3.5" fill="#38bdf8">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path={pathStr} />
                  </circle>
                )}

                {/* Edge Label Pill */}
                {edge.label && (
                  <g transform={`translate(${mid.x}, ${mid.y})`}>
                    <rect
                      x={-(edge.label.length * 3.3 + 7)}
                      y="-9"
                      width={edge.label.length * 6.6 + 14}
                      height="16"
                      rx="8"
                      fill="#090d16"
                      stroke={isActive ? '#38bdf8' : '#334155'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="2.5"
                      textAnchor="middle"
                      fill={isActive ? '#38bdf8' : '#94a3b8'}
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 3. RENDER ARCHITECTURAL NODES */}
          {DIAGRAM_NODES.map((node) => {
            const isSelected = selectedNode === node.id;
            const isSimActive = activeNodeId === node.id;
            const isHighlighted = isSelected || isSimActive;

            // Compute styling based on colorType
            let fillBg = '#0f172a';
            let strokeColor = '#334155';
            let textColor = '#e2e8f0';

            if (node.colorType === 'orange') {
              fillBg = isHighlighted ? '#431407' : '#1c1917';
              strokeColor = isHighlighted ? '#f97316' : '#d97706';
              textColor = '#fed7aa';
            } else if (node.colorType === 'yellow') {
              fillBg = isHighlighted ? '#451a03' : '#1e1b18';
              strokeColor = isHighlighted ? '#f59e0b' : '#b45309';
              textColor = '#fef3c7';
            } else if (node.colorType === 'red') {
              fillBg = isHighlighted ? '#4c0519' : '#1a0d14';
              strokeColor = isHighlighted ? '#f43f5e' : '#be123c';
              textColor = '#fecdd3';
            } else if (node.colorType === 'green') {
              fillBg = isHighlighted ? '#064e3b' : '#0f1f1a';
              strokeColor = isHighlighted ? '#10b981' : '#059669';
              textColor = '#d1fae5';
            } else if (node.colorType === 'purple') {
              fillBg = isHighlighted ? '#312e81' : '#131126';
              strokeColor = isHighlighted ? '#818cf8' : '#6366f1';
              textColor = '#e0e7ff';
            } else {
              // blue
              fillBg = isHighlighted ? '#0c4a6e' : '#0b162c';
              strokeColor = isHighlighted ? '#38bdf8' : '#0284c7';
              textColor = '#e0f2fe';
            }

            return (
              <g
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.id);
                }}
                className="diagram-interactive-node cursor-pointer group"
                transform={`translate(${node.x}, ${node.y})`}
              >
                {/* CIRCLE SHAPE (e.g. User, Phone User) */}
                {node.shape === 'circle' ? (
                  <>
                    <circle
                      cx={node.width / 2}
                      cy={node.height / 2}
                      r={node.width / 2}
                      fill={fillBg}
                      stroke={strokeColor}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                      filter={isHighlighted ? 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.7))' : undefined}
                      className="transition-all duration-200"
                    />
                    <text
                      x={node.width / 2}
                      y={node.height / 2 + 3}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {node.label}
                    </text>
                  </>
                ) : node.shape === 'cylinder' ? (
                  /* CYLINDER SHAPE (Context & Memory) */
                  <>
                    <rect
                      x="0"
                      y="8"
                      width={node.width}
                      height={node.height - 16}
                      fill={fillBg}
                      stroke={strokeColor}
                      strokeWidth={isHighlighted ? 2 : 1.5}
                      filter={isHighlighted ? 'drop-shadow(0 0 10px rgba(244, 63, 94, 0.7))' : undefined}
                      className="transition-all duration-200"
                    />
                    {/* Top ellipse */}
                    <ellipse
                      cx={node.width / 2}
                      cy="8"
                      rx={node.width / 2}
                      ry="8"
                      fill={fillBg}
                      stroke={strokeColor}
                      strokeWidth="1.5"
                    />
                    {/* Bottom ellipse curve */}
                    <ellipse
                      cx={node.width / 2}
                      cy={node.height - 8}
                      rx={node.width / 2}
                      ry="8"
                      fill={fillBg}
                      stroke={strokeColor}
                      strokeWidth="1.5"
                    />
                    <text
                      x={node.width / 2}
                      y={node.height / 2 - 2}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {node.label}
                    </text>
                    {node.fileName && (
                      <text
                        x={node.width / 2}
                        y={node.height / 2 + 10}
                        textAnchor="middle"
                        fill="#fda4af"
                        fontSize="7.5"
                        fontFamily="monospace"
                      >
                        {node.fileName}
                      </text>
                    )}
                  </>
                ) : (
                  /* STANDARD RECTANGULAR BOX */
                  <>
                    <rect
                      x="0"
                      y="0"
                      width={node.width}
                      height={node.height}
                      rx="7"
                      fill={fillBg}
                      stroke={strokeColor}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                      filter={isHighlighted ? 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.7))' : undefined}
                      className="transition-all duration-200"
                    />
                    {/* Primary label */}
                    <text
                      x={node.width / 2}
                      y={node.fileName ? node.height / 2 - 3 : node.height / 2 + 3}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {node.label}
                    </text>
                    {/* File tag subtitle if present */}
                    {node.fileName && (
                      <text
                        x={node.width / 2}
                        y={node.height / 2 + 10}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="7.5"
                        fontFamily="monospace"
                      >
                        {node.fileName}
                      </text>
                    )}
                  </>
                )}

                {/* Animated selection ping badge if active */}
                {isHighlighted && (
                  <circle
                    cx={node.width - 4}
                    cy="4"
                    r="3.5"
                    fill={currentTheme.primary}
                    className="animate-ping"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Subsystem Legend Bar */}
      <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono gap-2 z-20">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500/40 border border-blue-400" />
            <span className="text-slate-300">User Interaction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-400" />
            <span className="text-slate-300">Assistant Runtime</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/40 border border-rose-400" />
            <span className="text-slate-300">Context &amp; Memory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-400" />
            <span className="text-slate-300">Actions &amp; Skills</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500/40 border border-indigo-400" />
            <span className="text-slate-300">Display &amp; Remote</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 hidden md:block">
          Click any component to inspect telemetry, bindings, and source code.
        </div>
      </div>
    </div>
  );
};
