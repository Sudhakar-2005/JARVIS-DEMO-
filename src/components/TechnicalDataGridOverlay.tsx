import React, { useState, useEffect } from 'react';
import { HUDTheme } from '../types';
import { THEMES } from '../utils/theme';
import {
  Cpu,
  Flame,
  Activity,
  Radio,
  Eye,
  Crosshair,
  Shield,
  Zap,
  Maximize2,
  Scan,
} from 'lucide-react';

interface TechnicalDataGridOverlayProps {
  cpuTemp?: number;
  gpuTemp?: number;
  cpuUsage?: number;
  gpuUsage?: number;
  theme?: HUDTheme;
  showControls?: boolean;
}

export const TechnicalDataGridOverlay: React.FC<TechnicalDataGridOverlayProps> = ({
  cpuTemp = 44.5,
  gpuTemp = 48.2,
  cpuUsage = 22,
  gpuUsage = 24,
  theme = 'cyan',
  showControls = true,
}) => {
  const [scanActive, setScanActive] = useState(true);
  const [scanSpeed, setScanSpeed] = useState<'normal' | 'fast' | 'pulse'>('normal');
  const [scanPosition, setScanPosition] = useState(0);
  const [scanCycle, setScanCycle] = useState(108);

  const currentTheme = THEMES[theme] || THEMES.cyan;
  const isHighThermal = cpuTemp > 70 || gpuTemp > 70;
  const isCritical = cpuTemp > 78 || gpuTemp > 78;

  // Scan cycle counter and dynamic telemetry tracking
  useEffect(() => {
    if (!scanActive) return;

    const interval = setInterval(() => {
      setScanPosition((prev) => (prev + 1) % 100);
      setScanCycle((c) => c + 1);
    }, 120);

    return () => clearInterval(interval);
  }, [scanActive]);

  // Derived telemetry coordinates based on CPU and GPU readings
  const cpuFluxX = ((cpuTemp / 90) * 100).toFixed(1);
  const gpuFluxY = ((gpuTemp / 90) * 100).toFixed(1);
  const combinedLoad = Math.round((cpuUsage + gpuUsage) / 2);

  // Determine active scanning target based on scan cycle
  const currentTarget =
    scanPosition < 45
      ? `CPU_PACKAGE_${cpuTemp.toFixed(1)}C`
      : scanPosition < 85
      ? `GPU_DIODE_${gpuTemp.toFixed(1)}C`
      : `THERMAL_BUS_NOMINAL`;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10 rounded-2xl">
      {/* 1. Subtle Transparent Blueprint Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:32px_32px]"
        style={{
          transform: 'translateZ(0)',
        }}
      />

      {/* 2. Concentric Radar & Crosshair Markings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.08]">
        <div className="w-[480px] h-[480px] rounded-full border border-cyan-400 border-dashed" />
        <div className="w-[320px] h-[320px] rounded-full border border-cyan-400/60" />
        <div className="w-[160px] h-[160px] rounded-full border border-cyan-400/40 border-dashed" />
      </div>

      {/* 3. Corner Technical Brackets & Coordinate Markers */}
      <div className="absolute top-2 left-2 flex flex-col font-mono text-[9px] text-cyan-500/50 leading-tight">
        <span className="font-bold text-cyan-400/70">┌─ GRID_SYS_MK85 ──┐</span>
        <span>LAT: 34.0259° N // LON: 118.7798° W</span>
        <span>CPU_SENSOR: [CH_0A · {cpuTemp.toFixed(1)}°C]</span>
      </div>

      <div className="absolute top-2 right-2 text-right font-mono text-[9px] text-cyan-500/50 leading-tight">
        <span className="font-bold text-cyan-400/70">┌── GPU_CORE_LINK ─┐</span>
        <span>GPU_SENSOR: [DIODE_1B · {gpuTemp.toFixed(1)}°C]</span>
        <span>CYCLE: 0x{scanCycle.toString(16).toUpperCase()} // PASS</span>
      </div>

      <div className="absolute bottom-2 left-2 flex flex-col font-mono text-[9px] text-cyan-500/50 leading-tight">
        <span>THERMAL_BUS: {combinedLoad}% ENGAGED</span>
        <span className="font-bold text-cyan-400/70">└─ FLUX_VECTOR: {cpuFluxX} / {gpuFluxY} ─┘</span>
      </div>

      <div className="absolute bottom-2 right-2 text-right font-mono text-[9px] text-cyan-500/50 leading-tight">
        <span className={isCritical ? 'text-rose-400 font-bold' : isHighThermal ? 'text-amber-400' : 'text-emerald-400'}>
          {isCritical ? 'CRITICAL THERMAL FLUX' : isHighThermal ? 'ELEVATED HEAT FLUX' : 'STATUS: OPTIMAL'}
        </span>
        <span className="font-bold text-cyan-400/70">└── ACPI_I2C_SURVEILLANCE ──┘</span>
      </div>

      {/* 4. Real-Time Floating Telemetry Nodes that update to match CPU and GPU */}
      <div className="absolute top-10 right-6 font-mono text-[10px] hidden md:flex flex-col gap-1 items-end">
        {/* CPU Technical Data Badge */}
        <div className="px-2 py-1 rounded bg-slate-950/80 border border-cyan-500/40 backdrop-blur-sm shadow-lg flex items-center gap-1.5 transition-all duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-cyan-400 font-bold">CPU TELEMETRY:</span>
          <span className="text-slate-200 tabular-nums">{cpuTemp.toFixed(1)}°C</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-300">{cpuUsage}% LOAD</span>
        </div>

        {/* GPU Technical Data Badge */}
        <div className="px-2 py-1 rounded bg-slate-950/80 border border-emerald-500/40 backdrop-blur-sm shadow-lg flex items-center gap-1.5 transition-all duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-400 font-bold">GPU DIODE:</span>
          <span className="text-slate-200 tabular-nums">{gpuTemp.toFixed(1)}°C</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-300">{gpuUsage}% VRAM</span>
        </div>
      </div>

      {/* 5. Active Target Lock Callout Box */}
      <div className="absolute bottom-10 left-6 font-mono text-[9px] hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-950/80 border border-cyan-500/30 text-cyan-300">
        <Crosshair className="w-3 h-3 text-cyan-400 animate-spin" />
        <span>RADAR LOCK:</span>
        <strong className="text-slate-100 uppercase">{currentTarget}</strong>
        <span className="text-slate-500">[{scanPosition}% SWEEP]</span>
      </div>

      {/* 6. High-Tech Animated Scanning Beam using CSS Transforms */}
      {scanActive && (
        <div
          className="absolute left-0 right-0 pointer-events-none transition-transform duration-100 ease-linear"
          style={{
            top: 0,
            height: '24px',
            transform: `translate3d(0, ${scanPosition * 6}px, 0)`,
            willChange: 'transform',
          }}
        >
          {/* Laser scanning line */}
          <div
            className={`w-full h-[2px] shadow-[0_0_15px_rgba(6,182,212,0.9)] ${
              isCritical
                ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)]'
                : isHighThermal
                ? 'bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.9)]'
                : 'bg-cyan-400'
            }`}
          />
          {/* Trailing laser glow gradient */}
          <div
            className={`w-full h-12 opacity-25 ${
              isCritical
                ? 'bg-gradient-to-t from-rose-500 to-transparent'
                : isHighThermal
                ? 'bg-gradient-to-t from-amber-400 to-transparent'
                : 'bg-gradient-to-t from-cyan-400 to-transparent'
            }`}
          />
        </div>
      )}

      {/* 7. Interactive Controls Pill (Top Center, Pointer Events Active) */}
      {showControls && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/90 border border-slate-800 text-[10px] font-mono shadow-xl backdrop-blur-md">
          <Scan className={`w-3 h-3 ${scanActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-slate-400">DATA GRID:</span>
          <button
            onClick={() => setScanActive(!scanActive)}
            className={`px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
              scanActive
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {scanActive ? 'SCANNING' : 'FROZEN'}
          </button>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-slate-400 hidden sm:inline">
            CPU: <strong className="text-cyan-300">{cpuTemp.toFixed(1)}°C</strong>
          </span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-slate-400 hidden sm:inline">
            GPU: <strong className="text-emerald-300">{gpuTemp.toFixed(1)}°C</strong>
          </span>
        </div>
      )}
    </div>
  );
};
