import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import { HUDTheme } from '../types';
import { THEMES } from '../utils/theme';
import {
  Thermometer,
  Flame,
  Activity,
  Maximize2,
  RefreshCw,
  TrendingUp,
  Cpu,
  Zap,
  Pause,
  Play,
  AlertTriangle,
  Download,
  Share2,
  Check,
  FileSpreadsheet,
  ShieldAlert,
} from 'lucide-react';

export interface ThermalDataPoint {
  time: string;
  timestamp: number;
  cpu: number;
  gpu: number;
  cpuLoad?: number;
  gpuLoad?: number;
}

interface ThermalHistoryChartProps {
  currentCpuTemp?: number;
  currentGpuTemp?: number;
  theme?: HUDTheme;
  isStreaming?: boolean;
  onCriticalThermalAlert?: (cpu: number, gpu: number) => void;
}

// Generate realistic initial historical trend leading to current temperature
function generateInitialHistory(baseCpu: number = 44, baseGpu: number = 48): ThermalDataPoint[] {
  const points: ThermalDataPoint[] = [];
  const now = Date.now();
  const count = 16;

  for (let i = count - 1; i >= 0; i--) {
    const pointTime = new Date(now - i * 3000);
    const timeStr = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const progress = 1 - i / count;
    // Organic wave curve
    const wave = Math.sin(i * 0.7) * 2.5;
    const cpuVal = +(baseCpu - 4 + progress * 4 + wave + (Math.random() - 0.5) * 1.5).toFixed(1);
    const gpuVal = +(baseGpu - 3 + progress * 3 + wave * 0.8 + (Math.random() - 0.5) * 1.8).toFixed(1);

    points.push({
      time: timeStr,
      timestamp: pointTime.getTime(),
      cpu: Math.max(35, Math.min(85, cpuVal)),
      gpu: Math.max(38, Math.min(88, gpuVal)),
      cpuLoad: Math.floor(15 + Math.random() * 20),
      gpuLoad: Math.floor(18 + Math.random() * 25),
    });
  }
  return points;
}

export const ThermalHistoryChart: React.FC<ThermalHistoryChartProps> = ({
  currentCpuTemp = 44.5,
  currentGpuTemp = 48.2,
  theme = 'cyan',
  isStreaming = true,
  onCriticalThermalAlert,
}) => {
  const currentTheme = THEMES[theme] || THEMES.cyan;
  const [data, setData] = useState<ThermalDataPoint[]>(() =>
    generateInitialHistory(currentCpuTemp, currentGpuTemp)
  );
  const [autoScroll, setAutoScroll] = useState(true);
  const [stressPulseActive, setStressPulseActive] = useState(false);
  const [snapshotExported, setSnapshotExported] = useState(false);
  const stressTimerRef = useRef<any>(null);

  // Periodic historical point recorder
  useEffect(() => {
    if (!autoScroll) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      let targetCpu = currentCpuTemp;
      let targetGpu = currentGpuTemp;

      if (stressPulseActive) {
        // High compute spike deliberately exceeding 85°C to demonstrate critical runaway protection
        targetCpu = +(86.5 + Math.random() * 2.5).toFixed(1);
        targetGpu = +(85.2 + Math.random() * 2.8).toFixed(1);
      } else {
        // Natural sensor fluctuation
        const jitterCpu = (Math.random() - 0.49) * 1.2;
        const jitterGpu = (Math.random() - 0.49) * 1.4;
        targetCpu = +(Math.max(38, Math.min(79, currentCpuTemp + jitterCpu))).toFixed(1);
        targetGpu = +(Math.max(40, Math.min(82, currentGpuTemp + jitterGpu))).toFixed(1);
      }

      // If temperature exceeds 85°C, notify parent alert handler
      if (targetCpu >= 85 || targetGpu >= 85) {
        onCriticalThermalAlert?.(targetCpu, targetGpu);
      }

      setData((prev) => {
        const next: ThermalDataPoint = {
          time: timeStr,
          timestamp: now.getTime(),
          cpu: targetCpu,
          gpu: targetGpu,
          cpuLoad: stressPulseActive ? 94 : Math.floor(18 + Math.random() * 15),
          gpuLoad: stressPulseActive ? 92 : Math.floor(20 + Math.random() * 18),
        };
        // Keep last 20 samples for high resolution trending
        return [...prev.slice(-19), next];
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [autoScroll, currentCpuTemp, currentGpuTemp, stressPulseActive, onCriticalThermalAlert]);

  // Temporary stress pulse trigger to demonstrate dynamic chart reaction and >= 85°C critical threshold
  const handleTriggerStressPulse = () => {
    if (stressPulseActive) {
      setStressPulseActive(false);
      if (stressTimerRef.current) clearTimeout(stressTimerRef.current);
    } else {
      setStressPulseActive(true);
      // Immediately notify parent if spike initiated
      onCriticalThermalAlert?.(87.2, 85.8);
      stressTimerRef.current = setTimeout(() => {
        setStressPulseActive(false);
      }, 7500);
    }
  };

  const handleResetHistory = () => {
    setData(generateInitialHistory(currentCpuTemp, currentGpuTemp));
  };

  // 'Share Snapshot' function to export CPU/GPU trend data as a CSV file
  const handleExportCsv = () => {
    if (data.length === 0) return;

    const headers = [
      'Timestamp_Unix',
      'Local_Time',
      'CPU_Package_Temp_C',
      'GPU_Diode_Temp_C',
      'CPU_Load_Pct',
      'GPU_Load_Pct',
      'Thermal_Delta_C',
      'Operational_Status',
    ];

    const rows = data.map((d) => {
      const delta = Math.abs(+(d.cpu - d.gpu).toFixed(1));
      const status =
        d.cpu >= 85 || d.gpu >= 85
          ? 'CRITICAL_EXCEEDED_85C'
          : d.cpu >= 75 || d.gpu >= 75
          ? 'THROTTLE_WARNING_75C'
          : d.cpu >= 60 || d.gpu >= 60
          ? 'ELEVATED_WARM'
          : 'NOMINAL';

      return [
        d.timestamp,
        `"${d.time}"`,
        d.cpu,
        d.gpu,
        d.cpuLoad ?? 0,
        d.gpuLoad ?? 0,
        delta,
        status,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    link.setAttribute('href', url);
    link.setAttribute('download', `jarvis-thermal-snapshot-${nowStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSnapshotExported(true);
    setTimeout(() => setSnapshotExported(false), 2400);
  };

  // Compute stats
  const latestPoint = data[data.length - 1] || { cpu: currentCpuTemp, gpu: currentGpuTemp };
  const cpuValues = data.map((d) => d.cpu);
  const gpuValues = data.map((d) => d.gpu);
  const maxCpu = Math.max(...cpuValues, currentCpuTemp);
  const maxGpu = Math.max(...gpuValues, currentGpuTemp);
  const avgCpu = (cpuValues.reduce((a, b) => a + b, 0) / (cpuValues.length || 1)).toFixed(1);
  const avgGpu = (gpuValues.reduce((a, b) => a + b, 0) / (gpuValues.length || 1)).toFixed(1);

  // Critical 85°C Threshold Condition Check
  const isCritical85Breached = latestPoint.cpu >= 85 || latestPoint.gpu >= 85;
  const isHistorical85Breached = maxCpu >= 85 || maxGpu >= 85;

  // Custom HUD Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const cpuVal = payload.find((p: any) => p.dataKey === 'cpu')?.value;
      const gpuVal = payload.find((p: any) => p.dataKey === 'gpu')?.value;
      const isOver85 = cpuVal >= 85 || gpuVal >= 85;

      return (
        <div className={`p-2.5 rounded-lg shadow-2xl backdrop-blur-md text-[11px] font-mono space-y-1.5 min-w-[190px] border ${
          isOver85
            ? 'bg-rose-950/95 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]'
            : 'bg-slate-950/95 border-cyan-500/40'
        }`}>
          <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 flex justify-between items-center">
            <span className={isOver85 ? 'text-rose-400 font-bold' : 'text-cyan-400 font-bold'}>
              {isOver85 ? 'CRITICAL SENSOR PROBE' : 'SENSOR PROBE'}
            </span>
            <span className="text-slate-300">{label}</span>
          </div>

          <div className="flex items-center justify-between text-slate-200">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className={`w-2 h-2 rounded-full inline-block ${cpuVal >= 85 ? 'bg-rose-500 animate-ping' : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'}`} />
              CPU Core:
            </span>
            <span className={`font-bold tabular-nums ${cpuVal >= 85 ? 'text-rose-400 text-xs' : 'text-slate-100'}`}>
              {cpuVal}°C {cpuVal >= 85 ? '(CRITICAL)' : ''}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-200">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className={`w-2 h-2 rounded-full inline-block ${gpuVal >= 85 ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`} />
              GPU Diode:
            </span>
            <span className={`font-bold tabular-nums ${gpuVal >= 85 ? 'text-rose-400 text-xs' : 'text-slate-100'}`}>
              {gpuVal}°C {gpuVal >= 85 ? '(CRITICAL)' : ''}
            </span>
          </div>

          {isOver85 ? (
            <div className="pt-1.5 border-t border-rose-900 text-[10px] text-rose-300 flex items-center gap-1 font-bold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              CRITICAL 85°C THRESHOLD BREACHED!
            </div>
          ) : cpuVal >= 75 || gpuVal >= 75 ? (
            <div className="pt-1 text-[9px] text-amber-400 flex items-center gap-1 font-bold">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              THERMAL THROTTLE WARNING (75°C)
            </div>
          ) : (
            <div className="pt-1 text-[9px] text-slate-500 flex items-center justify-between">
              <span>STATUS:</span>
              <span className="text-emerald-400 font-semibold">NOMINAL OPTICS</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom Dot renderer highlighting critical 85°C points on the Line
  const renderCpuDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload && payload.cpu >= 85) {
      return (
        <g key={`cpu-crit-${props.index}`}>
          <circle cx={cx} cy={cy} r={7} fill="#ef4444" opacity={0.3} className="animate-ping" />
          <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
        </g>
      );
    }
    return <circle key={`cpu-dot-${props.index}`} cx={cx} cy={cy} r={2.5} fill="#06b6d4" stroke="#083344" strokeWidth={1.5} />;
  };

  const renderGpuDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload && payload.gpu >= 85) {
      return (
        <g key={`gpu-crit-${props.index}`}>
          <circle cx={cx} cy={cy} r={7} fill="#ef4444" opacity={0.3} className="animate-ping" />
          <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
        </g>
      );
    }
    return <circle key={`gpu-dot-${props.index}`} cx={cx} cy={cy} r={2.5} fill="#10b981" stroke="#064e3b" strokeWidth={1.5} />;
  };

  return (
    <div
      className={`w-full rounded-xl p-4 backdrop-blur-md shadow-2xl space-y-3 font-mono transition-all duration-300 ${
        isCritical85Breached
          ? 'bg-rose-950/40 border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.45)]'
          : 'bg-slate-900/60 border border-slate-800/80'
      }`}
    >
      {/* Critical Overheat Warning Banner (Visible when temperatures exceed 85°C) */}
      {isCritical85Breached && (
        <div className="p-2.5 rounded-lg bg-rose-900/80 border border-rose-500 text-rose-100 flex items-center justify-between gap-2 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide">
            <Flame className="w-4 h-4 text-rose-300 animate-bounce" />
            <span>CRITICAL THERMAL ALERT // 85°C THRESHOLD BREACHED:</span>
            <span className="text-white font-mono bg-rose-950 px-1.5 py-0.5 rounded border border-rose-600">
              CPU: {latestPoint.cpu}°C | GPU: {latestPoint.gpu}°C
            </span>
          </div>
          <span className="text-[10px] font-bold text-rose-200 hidden sm:inline">
            EMERGENCY DISSIPATION ENGAGED
          </span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border transition-colors ${
              isCritical85Breached
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}
          >
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100 tracking-wider">
                THERMAL DYNAMICS // RECHARTS HISTORICAL STREAM
              </h3>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                  isCritical85Breached
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                }`}
              >
                {isCritical85Breached ? 'CRITICAL (≥85°C)' : 'REAL-TIME'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Continuous hardware sensor telemetry tracking CPU package &amp; GPU diode temperature trends
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {/* 'Share Snapshot' CSV Export Button */}
          <button
            onClick={handleExportCsv}
            className={`px-2.5 py-1 rounded font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              snapshotExported
                ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400'
                : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400'
            }`}
            title="Export full historical CPU and GPU trend points as a CSV file for external telemetry analysis"
          >
            {snapshotExported ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>EXPORTED (CSV)</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>SHARE SNAPSHOT</span>
              </>
            )}
          </button>

          {/* Simulate Spike Button */}
          <button
            onClick={handleTriggerStressPulse}
            className={`px-2 py-1 rounded border font-bold flex items-center gap-1 transition-all cursor-pointer ${
              stressPulseActive
                ? 'bg-rose-500/30 text-rose-200 border-rose-400 shadow-md animate-pulse'
                : 'bg-slate-900 hover:bg-slate-850 text-amber-300 border-amber-500/40'
            }`}
            title="Inject temporary compute load (88°C) to visualize thermal spike, critical 85°C alerts, and dissipation curve"
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>{stressPulseActive ? 'RAMPING (88°C)' : 'SIMULATE SPIKE'}</span>
          </button>

          {/* Stream Pause / Resume */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
            title={autoScroll ? 'Pause live polling' : 'Resume live polling'}
          >
            {autoScroll ? <Pause className="w-3 h-3 text-cyan-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            <span>{autoScroll ? 'STREAMING' : 'PAUSED'}</span>
          </button>

          {/* Reset History */}
          <button
            onClick={handleResetHistory}
            className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
            title="Reset temperature trend points"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Key Metric Telemetry Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        {/* Current CPU */}
        <div
          className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
            latestPoint.cpu >= 85
              ? 'bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse'
              : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
              <Cpu className={`w-3 h-3 ${latestPoint.cpu >= 85 ? 'text-rose-400' : 'text-cyan-400'}`} />
              CPU CURRENT
            </div>
            <div className={`text-lg font-bold tabular-nums ${latestPoint.cpu >= 85 ? 'text-rose-300' : 'text-cyan-300'}`}>
              {latestPoint.cpu}°C
            </div>
          </div>
          <div className="text-right text-[9px] text-slate-500">
            <div className={maxCpu >= 85 ? 'text-rose-400 font-bold' : ''}>PEAK: {maxCpu}°C</div>
            <div>AVG: {avgCpu}°C</div>
          </div>
        </div>

        {/* Current GPU */}
        <div
          className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
            latestPoint.gpu >= 85
              ? 'bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse'
              : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
              <Flame className={`w-3 h-3 ${latestPoint.gpu >= 85 ? 'text-rose-400' : 'text-emerald-400'}`} />
              GPU CURRENT
            </div>
            <div className={`text-lg font-bold tabular-nums ${latestPoint.gpu >= 85 ? 'text-rose-300' : 'text-emerald-300'}`}>
              {latestPoint.gpu}°C
            </div>
          </div>
          <div className="text-right text-[9px] text-slate-500">
            <div className={maxGpu >= 85 ? 'text-rose-400 font-bold' : ''}>PEAK: {maxGpu}°C</div>
            <div>AVG: {avgGpu}°C</div>
          </div>
        </div>

        {/* Differential */}
        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              THERMAL DELTA
            </div>
            <div className="text-lg font-bold text-amber-300 tabular-nums">
              {Math.abs(+(latestPoint.cpu - latestPoint.gpu).toFixed(1))}°C
            </div>
          </div>
          <div className="text-right text-[9px] text-slate-500">
            <div>{latestPoint.cpu > latestPoint.gpu ? 'CPU LEAD' : 'GPU LEAD'}</div>
            <div className={isCritical85Breached ? 'text-rose-400 font-bold' : 'text-emerald-400 font-semibold'}>
              {isCritical85Breached ? 'UNSTABLE' : 'STABLE'}
            </div>
          </div>
        </div>

        {/* Operational Envelope */}
        <div
          className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
            isCritical85Breached
              ? 'bg-rose-950/80 border-rose-500 text-rose-200'
              : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
              <Zap className={`w-3 h-3 ${isCritical85Breached ? 'text-rose-400' : 'text-cyan-400'}`} />
              THERMAL ENVELOPE
            </div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-1 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCritical85Breached
                    ? 'bg-rose-500 animate-ping'
                    : latestPoint.cpu >= 75 || latestPoint.gpu >= 75
                    ? 'bg-amber-400'
                    : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                }`}
              />
              <span className={`uppercase text-xs font-bold ${isCritical85Breached ? 'text-rose-300' : ''}`}>
                {isCritical85Breached
                  ? 'CRITICAL (≥85°C)'
                  : latestPoint.cpu >= 75 || latestPoint.gpu >= 75
                  ? 'ELEVATED'
                  : latestPoint.cpu >= 60 || latestPoint.gpu >= 60
                  ? 'WARM'
                  : 'NOMINAL'}
              </span>
            </div>
          </div>
          <div className="text-right text-[9px]">
            <div className={isCritical85Breached ? 'text-rose-400 font-bold' : 'text-slate-500'}>
              LIMIT: 85°C
            </div>
            <div className={isCritical85Breached ? 'text-rose-300 font-bold' : 'text-cyan-400'}>
              {isCritical85Breached ? 'THROTTLING' : 'TDP SAFE'}
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Historical Trend Line Chart */}
      <div className="w-full h-56 sm:h-64 bg-slate-950/80 border border-slate-800/90 rounded-xl p-2 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 12, right: 16, left: -18, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              interval="preserveStartEnd"
              tickFormatter={(val) => {
                return val ? val.slice(-5) : '';
              }}
            />

            <YAxis
              domain={[30, 95]}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              tickFormatter={(val) => `${val}°`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              height={26}
              iconType="circle"
              wrapperStyle={{
                fontSize: '11px',
                fontFamily: 'monospace',
                paddingBottom: '4px',
              }}
              formatter={(value) => (
                <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  {value === 'cpu' ? 'CPU Package (°C)' : 'GPU Diode (°C)'}
                </span>
              )}
            />

            {/* Warning Throttle Reference Line (75°C) */}
            <ReferenceLine
              y={75}
              stroke="#fbbf24"
              strokeDasharray="4 4"
              label={{
                value: 'THROTTLE 75°C',
                fill: '#fbbf24',
                fontSize: 9,
                position: 'insideTopRight',
              }}
            />

            {/* Critical Red Threshold Reference Line (85°C) */}
            <ReferenceLine
              y={85}
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{
                value: 'CRITICAL 85°C // DISSIPATION LIMIT',
                fill: '#f43f5e',
                fontSize: 9,
                fontWeight: 'bold',
                position: 'insideTopRight',
              }}
            />

            {/* CPU Line */}
            <Line
              type="monotone"
              dataKey="cpu"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={renderCpuDot}
              activeDot={{ r: 5, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />

            {/* GPU Line */}
            <Line
              type="monotone"
              dataKey="gpu"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={renderGpuDot}
              activeDot={{ r: 5, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Watermark in bottom corner */}
        <div className="absolute bottom-2 right-3 text-[9px] text-slate-600 font-mono pointer-events-none select-none">
          STARK MK 85 THERMAL PROBE // I2C BUS
        </div>
      </div>
    </div>
  );
};

