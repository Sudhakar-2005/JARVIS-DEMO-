// Spatial Screen Interaction Engine V1 - SpatialCursor
// Futuristic, holographic spatial cursor with dynamic reticle states.

import React from 'react';
import { SpatialTelemetry } from './SpatialInteractionController';

interface SpatialCursorProps {
  telemetry: SpatialTelemetry;
  themeColor?: string;
}

export const SpatialCursor: React.FC<SpatialCursorProps> = ({
  telemetry,
  themeColor = '#06b6d4',
}) => {
  const { pointer, state, currentGesture, confidence } = telemetry;

  // Don't render cursor if gesture tracking is inactive or hand lost
  if (state === 'INACTIVE' || state === 'CAMERA_ERROR' || state === 'LOST_HAND') {
    return null;
  }

  const isSelecting = state === 'SELECTING' || currentGesture === 'pinch';
  const isDragging = state === 'DRAGGING' || currentGesture === 'pinch_drag';
  const isPaused = state === 'PAUSED' || currentGesture === 'open_palm';
  const isCancelled = state === 'CANCELLED' || currentGesture === 'fist';
  const isHovering = pointer.isOverInteractiveElement;

  return (
    <div
      className="fixed pointer-events-none z-[9999] transition-transform duration-75 will-change-transform font-mono select-none"
      style={{
        transform: `translate3d(${pointer.x}px, ${pointer.y}px, 0)`,
        left: -24,
        top: -24,
      }}
    >
      {/* Outer Reticle Ring */}
      <div
        className={`w-12 h-12 rounded-full border border-dashed flex items-center justify-center transition-all duration-150 ${
          isSelecting
            ? 'scale-75 border-amber-400 bg-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.8)] rotate-45'
            : isDragging
            ? 'scale-125 border-emerald-400 bg-emerald-400/15 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-pulse'
            : isPaused
            ? 'scale-90 border-amber-500 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
            : isCancelled
            ? 'scale-110 border-rose-500 bg-rose-500/25 shadow-[0_0_20px_rgba(244,63,94,0.8)]'
            : isHovering
            ? 'scale-110 border-cyan-400 bg-cyan-400/15 shadow-[0_0_16px_rgba(6,182,212,0.8)] animate-spin-slow'
            : 'border-cyan-400/60 bg-cyan-400/5 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
        }`}
      >
        {/* Core Targeting Pip */}
        <div
          className={`w-2.5 h-2.5 rounded-full transition-transform duration-100 ${
            isSelecting
              ? 'bg-amber-300 scale-150 shadow-[0_0_10px_#fde047]'
              : isDragging
              ? 'bg-emerald-300 scale-125 shadow-[0_0_10px_#86efac]'
              : isPaused
              ? 'bg-amber-400 scale-75'
              : isCancelled
              ? 'bg-rose-400 scale-125'
              : isHovering
              ? 'bg-cyan-300 scale-125 shadow-[0_0_8px_#67e8f9]'
              : 'bg-cyan-400'
          }`}
        />

        {/* Tactical Crosshair Tick Marks */}
        <div className="absolute -top-1 w-0.5 h-1.5 bg-cyan-400/80" />
        <div className="absolute -bottom-1 w-0.5 h-1.5 bg-cyan-400/80" />
        <div className="absolute -left-1 w-1.5 h-0.5 bg-cyan-400/80" />
        <div className="absolute -right-1 w-1.5 h-0.5 bg-cyan-400/80" />
      </div>

      {/* Hovering Target Element Label Tag */}
      {pointer.targetElementText && (
        <div className="absolute left-10 top-0 whitespace-nowrap bg-slate-950/90 border border-cyan-400/60 rounded px-2 py-0.5 text-[10px] text-cyan-200 shadow-xl backdrop-blur-md flex items-center gap-1.5 animate-fadeIn">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider uppercase">{pointer.targetElementText}</span>
          <span className="text-[8px] text-slate-400 bg-slate-900 px-1 rounded">
            {isSelecting ? 'SELECT' : isDragging ? 'DRAG' : 'PINCH TO CLICK'}
          </span>
        </div>
      )}

      {/* State Feedback Badge */}
      {isPaused && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-950/90 border border-amber-500 rounded px-1.5 text-[9px] text-amber-200 font-bold shadow-lg">
          INTERACTION PAUSED
        </div>
      )}
      {isCancelled && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-rose-950/90 border border-rose-500 rounded px-1.5 text-[9px] text-rose-200 font-bold shadow-lg">
          CANCELLED
        </div>
      )}
    </div>
  );
};
