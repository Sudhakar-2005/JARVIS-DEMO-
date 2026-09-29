import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  Zap,
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  Cpu,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface NeuralSyncState {
  rtt: number | null;
  geminiLatency: number | null;
  model: string;
  status: 'online' | 'degraded' | 'offline' | 'checking';
  lastPingTime: string | null;
}

export const NeuralSyncIndicator: React.FC = () => {
  const [syncState, setSyncState] = useState<NeuralSyncState>({
    rtt: 142,
    geminiLatency: 118,
    model: 'gemini-3.8-flash',
    status: 'online',
    lastPingTime: 'Just now',
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Ping the server and Gemini API
  const pingNeuralSync = useCallback(async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/neural-sync', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const end = performance.now();
      const rtt = Math.round(end - start);

      if (res.ok) {
        const data = await res.json();
        setSyncState({
          rtt,
          geminiLatency: data.geminiLatency || Math.round(rtt * 0.75),
          model: data.model || 'gemini-3.8-flash',
          status: data.status === 'degraded' ? 'degraded' : rtt > 800 ? 'degraded' : 'online',
          lastPingTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
      } else {
        setSyncState((prev) => ({
          ...prev,
          rtt,
          status: 'degraded',
          lastPingTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        }));
      }
    } catch (err) {
      const end = performance.now();
      setSyncState((prev) => ({
        ...prev,
        rtt: Math.round(end - start),
        status: 'offline',
        lastPingTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }));
    } finally {
      setIsPinging(false);
    }
  }, []);

  // Periodic ping every 10 seconds
  useEffect(() => {
    pingNeuralSync();
    const interval = setInterval(pingNeuralSync, 10000);
    return () => clearInterval(interval);
  }, [pingNeuralSync]);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const { rtt, status } = syncState;

  // Determine pulse color tier based on RTT:
  // Green: < 350ms (Optimal)
  // Yellow/Amber: 350ms - 800ms (Elevated)
  // Red: > 800ms or offline (Degraded)
  const isOptimal = status === 'online' && rtt !== null && rtt < 350;
  const isModerate = (status === 'online' && rtt !== null && rtt >= 350 && rtt <= 800) || status === 'degraded';
  const isHighLatency = (rtt !== null && rtt > 800) || status === 'offline';

  const colorScheme = isOptimal
    ? {
        text: 'text-emerald-400',
        dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]',
        pingRing: 'border-emerald-500/40 bg-emerald-500/10',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        label: 'OPTIMAL UPLINK',
      }
    : isModerate
    ? {
        text: 'text-amber-400',
        dot: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]',
        pingRing: 'border-amber-500/40 bg-amber-500/10',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        label: 'MODERATE LATENCY',
      }
    : {
        text: 'text-rose-400',
        dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]',
        pingRing: 'border-rose-500/40 bg-rose-500/10',
        badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        label: 'HIGH LATENCY / DEGRADED',
      };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Footer Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all cursor-pointer font-mono text-[10px] select-none ${colorScheme.pingRing} hover:bg-slate-800/80`}
        title={`Neural Sync: ${rtt ?? '--'}ms round-trip to Gemini API. Click for diagnostic telemetry.`}
      >
        {/* Pulsing indicator dot */}
        <div className="relative flex items-center justify-center w-2 h-2">
          <div className={`w-2 h-2 rounded-full ${colorScheme.dot}`} />
          <div
            className={`absolute w-3.5 h-3.5 rounded-full border opacity-75 ${
              isHighLatency ? 'border-rose-500 animate-ping' : isModerate ? 'border-amber-400 animate-pulse' : 'border-emerald-400 animate-ping'
            }`}
          />
        </div>

        <span className="font-bold text-slate-300 tracking-wider">NEURAL SYNC:</span>
        <span className={`font-bold tabular-nums ${colorScheme.text}`}>
          {isPinging ? 'PING...' : `${rtt ?? '--'}ms`}
        </span>
      </button>

      {/* Interactive Diagnostics Popover Flyout */}
      {isOpen && (
        <div className="absolute bottom-8 right-0 sm:left-0 sm:right-auto z-50 w-72 p-3 bg-slate-950/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl font-mono text-xs space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>NEURAL SYNC DIAGNOSTICS</span>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${colorScheme.badge}`}>
              {colorScheme.label}
            </span>
          </div>

          {/* Metric Rows */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                Round-Trip Time (RTT):
              </span>
              <strong className={`tabular-nums ${colorScheme.text}`}>
                {syncState.rtt !== null ? `${syncState.rtt} ms` : 'Evaluating...'}
              </strong>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                Gemini Model API:
              </span>
              <span className="text-cyan-300 font-bold truncate max-w-[130px]">
                {syncState.model}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                Gemini Direct Ping:
              </span>
              <span className="text-slate-200 tabular-nums">
                {syncState.geminiLatency ? `${syncState.geminiLatency} ms` : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Last Synced:</span>
              <span className="text-slate-400 text-[10px]">{syncState.lastPingTime}</span>
            </div>
          </div>

          {/* Latency Threshold Reference Legend */}
          <div className="pt-2 border-t border-slate-800 text-[9px] space-y-1">
            <div className="text-slate-400 font-bold mb-1">LATENCY PERFORMANCE THRESHOLDS:</div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                &lt; 350ms (Optimal)
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                350–800ms (Nominal)
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                &gt; 800ms (High)
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[9px] text-slate-500">Auto-pings every 10s</span>
            <button
              onClick={pingNeuralSync}
              disabled={isPinging}
              className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] flex items-center gap-1 font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'PROBING...' : 'PING NOW'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
