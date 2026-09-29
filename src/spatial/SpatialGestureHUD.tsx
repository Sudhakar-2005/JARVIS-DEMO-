// Spatial Screen Interaction Engine V1 - SpatialGestureHUD
// High-tech status indicator, gesture controls, PiP camera skeleton monitor, and debug metrics.

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CameraOff,
  Hand,
  Activity,
  Zap,
  Sliders,
  Maximize2,
  Minimize2,
  X,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SpatialTelemetry, spatialController } from './SpatialInteractionController';

interface SpatialGestureHUDProps {
  telemetry: SpatialTelemetry;
  onToggleEnabled: (enabled: boolean) => void;
  onOpenSettings?: () => void;
}

export const SpatialGestureHUD: React.FC<SpatialGestureHUDProps> = ({
  telemetry,
  onToggleEnabled,
  onOpenSettings,
}) => {
  const { state, cameraStatus, handCount, currentGesture, confidence, fps, latencyMs, hands } = telemetry;
  const [showPreview, setShowPreview] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isGestureActive = cameraStatus === 'ACTIVE' && state !== 'INACTIVE';

  // Draw real-time skeletal overlay in the PiP preview canvas
  useEffect(() => {
    if (!showPreview || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark grid background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (hands.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO HANDS DETECTED // STANDBY', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Draw skeleton for each hand
    hands.forEach((hand) => {
      const isLeft = hand.handedness === 'left';
      const color = isLeft ? '#06b6d4' : '#10b981';

      // Draw Palm Centroid
      const px = (1.0 - hand.palmCenter.x) * canvas.width;
      const py = hand.palmCenter.y * canvas.height;

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Connect Landmarks (Bones)
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;

      const landmarks = hand.landmarks.map((lm) => ({
        x: (1.0 - lm.x) * canvas.width,
        y: lm.y * canvas.height,
      }));

      // Finger chains: Wrist(0) -> [Thumb(1..4), Index(5..8), Middle(9..12), Ring(13..16), Pinky(17..20)]
      const chains = [
        [0, 1, 2, 3, 4],
        [0, 5, 6, 7, 8],
        [0, 9, 10, 11, 12],
        [0, 13, 14, 15, 16],
        [0, 17, 18, 19, 20],
      ];

      chains.forEach((chain) => {
        ctx.beginPath();
        chain.forEach((idx, i) => {
          const pt = landmarks[idx];
          if (!pt) return;
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      });

      // Draw Landmark Nodes
      landmarks.forEach((pt, idx) => {
        ctx.beginPath();
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        ctx.arc(pt.x, pt.y, isTip ? 3.5 : 2, 0, Math.PI * 2);
        ctx.fillStyle = isTip ? '#facc15' : '#ffffff';
        ctx.fill();
      });

      // Pinch indicator line
      if (hand.isPinching) {
        const thumb = landmarks[4];
        const index = landmarks[8];
        if (thumb && index) {
          ctx.beginPath();
          ctx.moveTo(thumb.x, thumb.y);
          ctx.lineTo(index.x, index.y);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    });
  }, [hands, showPreview]);

  return (
    <div className="fixed top-3 right-3 z-[9990] flex flex-col items-end gap-2 font-mono select-none">
      {/* Primary HUD Control Pill */}
      <div className="flex items-center gap-2 p-1.5 px-3 rounded-full bg-slate-950/85 border border-slate-800 backdrop-blur-md shadow-2xl text-[11px]">
        {/* Camera Status LED */}
        <div
          className="flex items-center gap-1.5 cursor-pointer"
          onClick={() => onToggleEnabled(!isGestureActive)}
          title={isGestureActive ? 'Click to deactivate camera' : 'Click to activate camera gesture control'}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              isGestureActive
                ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)] animate-pulse'
                : cameraStatus === 'DENIED' || cameraStatus === 'ERROR'
                ? 'bg-rose-500'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-[10px] font-bold text-slate-300">
            {isGestureActive ? 'CAMERA ACTIVE' : cameraStatus === 'DENIED' ? 'CAMERA DENIED' : 'CAMERA OFF'}
          </span>
        </div>

        <div className="w-px h-3.5 bg-slate-800" />

        {/* Gesture State Pill */}
        {isGestureActive ? (
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                currentGesture === 'pinch' || currentGesture === 'pinch_drag'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : currentGesture === 'open_palm'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                  : currentGesture === 'fist'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : handCount > 0
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {handCount === 0
                ? 'NO HANDS'
                : currentGesture === 'pinch'
                ? 'PINCH (SELECT)'
                : currentGesture === 'pinch_drag'
                ? 'DRAGGING'
                : currentGesture === 'open_palm'
                ? 'OPEN PALM (PAUSE)'
                : currentGesture === 'fist'
                ? 'FIST (CANCEL)'
                : currentGesture === 'two_hand_zoom_in'
                ? 'ZOOM IN'
                : currentGesture === 'two_hand_zoom_out'
                ? 'ZOOM OUT'
                : 'POINTING'}
            </span>

            {/* Toggle PiP Monitor */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-1 rounded transition-colors ${
                showPreview ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle holographic hand skeleton radar"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>

            {/* Toggle Debug Overlay */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`p-1 rounded transition-colors ${
                showDebug ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle developer telemetry metrics"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>

            {/* Emergency Stop Button */}
            <button
              onClick={() => spatialController.emergencyStop()}
              className="p-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-colors"
              title="Emergency Stop: disable camera and spatial tracking"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Activation Quick Toggle */
          <button
            onClick={() => onToggleEnabled(true)}
            className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-[10px] font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1"
          >
            <Hand className="w-3 h-3 text-cyan-400" />
            <span>ENABLE GESTURES</span>
          </button>
        )}

        {/* Settings Shortcut */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title="Spatial Gesture Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* PiP Holographic Skeleton Radar Window */}
      {isGestureActive && showPreview && (
        <div className="w-56 bg-slate-950/95 border border-cyan-500/40 rounded-xl p-2 shadow-2xl backdrop-blur-md animate-fadeIn">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px] text-cyan-300">
            <span className="flex items-center gap-1 font-bold">
              <Activity className="w-3 h-3 text-cyan-400" />
              SKELETAL RADAR
            </span>
            <span className="text-[9px] text-slate-500">{fps} FPS</span>
          </div>
          <canvas
            ref={canvasRef}
            width={220}
            height={165}
            className="w-full h-auto rounded border border-slate-800/80 bg-slate-900"
          />
          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1.5">
            <span>HANDS: {handCount}</span>
            <span>LATENCY: {latencyMs}ms</span>
          </div>
        </div>
      )}

      {/* Developer Debug Telemetry Panel */}
      {isGestureActive && showDebug && (
        <div className="w-64 bg-slate-950/95 border border-amber-500/40 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-[10px] text-slate-300 space-y-1 animate-fadeIn">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800 font-bold text-amber-300">
            <span>SPATIAL ENGINE TELEMETRY</span>
            <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">DEBUG V1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Engine State:</span>
            <span className="font-bold text-cyan-300">{state}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Active Gesture:</span>
            <span className="font-bold text-amber-300">{currentGesture.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Confidence:</span>
            <span className="font-bold text-slate-200">{(confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">FPS / Latency:</span>
            <span className="font-bold text-emerald-300">{fps} FPS / {latencyMs}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Pointer (X, Y):</span>
            <span className="font-bold text-slate-300">
              {Math.round(telemetry.pointer.x)}px, {Math.round(telemetry.pointer.y)}px
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Hover Target:</span>
            <span className="font-bold text-cyan-400 truncate max-w-[120px]">
              {telemetry.pointer.targetElementText || 'None'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
