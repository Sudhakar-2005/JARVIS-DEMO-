import React, { useState, useEffect, useRef } from 'react';
import { HUDTheme, SystemState, ThermalTelemetryEntry, PowerMode } from '../types';
import { THEMES } from '../utils/theme';
import {
  Volume2,
  VolumeX,
  Sun,
  Layout,
  Minimize2,
  Maximize2,
  ExternalLink,
  Cpu,
  HardDrive,
  BatteryCharging,
  Layers,
  Monitor,
  Terminal,
  Smartphone,
  Zap,
  Vibrate,
  Eye,
  Camera,
  MessageCircle,
  Phone,
  Compass,
  Thermometer,
  Flame,
  Fan,
  Activity,
  Play,
  Pause,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Gauge,
  Leaf,
  Battery,
  ShieldCheck,
  Clock,
  BarChart2,
  TrendingUp,
  Sliders,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Timer,
  ZapOff,
} from 'lucide-react';

interface SystemControlPanelProps {
  systemState: SystemState;
  theme: HUDTheme;
  onUpdateVolume: (val: number) => void;
  onToggleMute: () => void;
  onUpdateBrightness: (val: number) => void;
  onLaunchApp: (appName: string) => void;
  onManageWindows: (action: string) => void;
  onChangeOS: (os: 'windows' | 'macos' | 'linux' | 'android') => void;
  onToggleTorch?: () => void;
  onTriggerVibration?: () => void;
  onToggleWakeLock?: () => void;
  wakeLockActive?: boolean;
  onUpdateThermals?: (cpuTemp: number, gpuTemp: number) => void;
  onSimulateBatteryLevel?: (level: number, isCharging: boolean) => void;
  onUpdatePowerMode?: (mode: PowerMode) => void;
}

export const SystemControlPanel: React.FC<SystemControlPanelProps> = ({
  systemState,
  theme,
  onUpdateVolume,
  onToggleMute,
  onUpdateBrightness,
  onLaunchApp,
  onManageWindows,
  onChangeOS,
  onToggleTorch,
  onTriggerVibration,
  onToggleWakeLock,
  wakeLockActive = false,
  onUpdateThermals,
  onSimulateBatteryLevel,
  onUpdatePowerMode,
}) => {
  const currentTheme = THEMES[theme];

  // Thermal Hardware Sensor Telemetry State
  const [cpuTemp, setCpuTemp] = useState<number>(systemState.cpuTemp ?? 44.2);
  const [gpuTemp, setGpuTemp] = useState<number>(systemState.gpuTemp ?? 48.5);
  const [gpuUsage, setGpuUsage] = useState<number>(systemState.gpuUsage ?? 21);
  const [fanSpeed, setFanSpeed] = useState<number>(systemState.fanSpeed ?? 1680);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [isStressTesting, setIsStressTesting] = useState<boolean>(false);
  const stressTimerRef = useRef<any>(null);

  const activePowerMode: PowerMode = systemState.powerMode || 'balanced';

  // Helper to get simulated OS power profile command
  const getOsPowerCommand = (os: string, mode: PowerMode) => {
    switch (os) {
      case 'windows':
        if (mode === 'performance') return 'powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c';
        if (mode === 'saver') return 'powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a';
        return 'powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e';
      case 'linux':
        if (mode === 'performance') return 'powerprofilesctl set performance && cpupower frequency-set -g performance';
        if (mode === 'saver') return 'powerprofilesctl set power-saver && cpupower frequency-set -g powersave';
        return 'powerprofilesctl set balanced && cpupower frequency-set -g schedutil';
      case 'macos':
        if (mode === 'performance') return 'sudo pmset -a highpowermode 1 && sudo pmset -a gpuswitch 2';
        if (mode === 'saver') return 'sudo pmset -a lowpowermode 1 && sudo pmset -a displaysleep 5';
        return 'sudo pmset -a lowpowermode 0 && sudo pmset -a gpuswitch 1';
      case 'android':
        if (mode === 'performance') return 'cmd power set-fixed-performance-mode-enabled true';
        if (mode === 'saver') return 'settings put global low_power 1 && cmd power set-mode 1';
        return 'cmd power set-adaptive-power-saver-enabled true';
      default:
        return 'powerprofilesctl set balanced';
    }
  };

  // Session Power Analytics State (accumulated seconds in each profile)
  // Seeded with representative session history: ~1.85 hrs Saver, ~1.15 hrs Performance, ~2.40 hrs Balanced
  const [saverSeconds, setSaverSeconds] = useState<number>(6660); // 1.85 hrs
  const [performanceSeconds, setPerformanceSeconds] = useState<number>(4140); // 1.15 hrs
  const [balancedSeconds, setBalancedSeconds] = useState<number>(8640); // 2.40 hrs
  const [sessionUptime, setSessionUptime] = useState<number>(19440); // 5.4 hrs total

  // Accumulate usage seconds in real time based on active power mode
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionUptime((prev) => prev + 1);
      if (activePowerMode === 'saver') {
        setSaverSeconds((prev) => prev + 1);
      } else if (activePowerMode === 'performance') {
        setPerformanceSeconds((prev) => prev + 1);
      } else {
        setBalancedSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activePowerMode]);

  const formatHours = (seconds: number) => (seconds / 3600).toFixed(2);
  const formatTimeHMS = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const handleResetPowerAnalytics = () => {
    setSaverSeconds(0);
    setPerformanceSeconds(0);
    setBalancedSeconds(0);
    setSessionUptime(0);
  };

  // Stacked Bar Chart Hover State
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Sub-navigation Tab within SystemControlPanel
  const [activeSubTab, setActiveSubTab] = useState<'controls' | 'efficiency'>('controls');

  // Interface & State for Power Consumption Line Graph
  const [powerHistory, setPowerHistory] = useState<Array<{
    id: string;
    timeLabel: string;
    watts: number;
    mode: PowerMode;
    cpuFreqGhz: number;
  }>>(() => {
    // Seed 22 realistic temporal data points representing session history
    const basePoints: Array<{ timeLabel: string; watts: number; mode: PowerMode; cpuFreqGhz: number }> = [
      { timeLabel: '13:40', watts: 62.4, mode: 'balanced', cpuFreqGhz: 3.4 },
      { timeLabel: '13:45', watts: 65.1, mode: 'balanced', cpuFreqGhz: 3.5 },
      { timeLabel: '13:50', watts: 68.3, mode: 'balanced', cpuFreqGhz: 3.6 },
      { timeLabel: '13:55', watts: 108.2, mode: 'performance', cpuFreqGhz: 4.8 },
      { timeLabel: '14:00', watts: 114.5, mode: 'performance', cpuFreqGhz: 4.9 },
      { timeLabel: '14:05', watts: 122.8, mode: 'performance', cpuFreqGhz: 5.1 },
      { timeLabel: '14:10', watts: 116.4, mode: 'performance', cpuFreqGhz: 4.9 },
      { timeLabel: '14:15', watts: 112.0, mode: 'performance', cpuFreqGhz: 4.8 },
      { timeLabel: '14:20', watts: 64.2, mode: 'balanced', cpuFreqGhz: 3.4 },
      { timeLabel: '14:25', watts: 66.8, mode: 'balanced', cpuFreqGhz: 3.5 },
      { timeLabel: '14:30', watts: 38.4, mode: 'saver', cpuFreqGhz: 1.8 },
      { timeLabel: '14:35', watts: 36.2, mode: 'saver', cpuFreqGhz: 1.6 },
      { timeLabel: '14:40', watts: 39.1, mode: 'saver', cpuFreqGhz: 1.9 },
      { timeLabel: '14:45', watts: 35.8, mode: 'saver', cpuFreqGhz: 1.7 },
      { timeLabel: '14:50', watts: 37.0, mode: 'saver', cpuFreqGhz: 1.8 },
      { timeLabel: '14:55', watts: 118.6, mode: 'performance', cpuFreqGhz: 5.0 },
      { timeLabel: '15:00', watts: 114.2, mode: 'performance', cpuFreqGhz: 4.9 },
      { timeLabel: '15:05', watts: 38.6, mode: 'saver', cpuFreqGhz: 1.8 },
      { timeLabel: '15:10', watts: 36.4, mode: 'saver', cpuFreqGhz: 1.7 },
      { timeLabel: '15:15', watts: 37.9, mode: 'saver', cpuFreqGhz: 1.8 },
    ];
    return basePoints.map((p, i) => ({ ...p, id: `pwr-hist-${i}` }));
  });

  const [hoveredPowerPoint, setHoveredPowerPoint] = useState<{
    id: string;
    timeLabel: string;
    watts: number;
    mode: PowerMode;
    cpuFreqGhz: number;
  } | null>(null);

  // Live real-time power draw telemetry interval
  useEffect(() => {
    const timer = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      let currentWatts = 65;
      let freq = 3.5;

      if (activePowerMode === 'performance') {
        currentWatts = +(108 + Math.random() * 15).toFixed(1);
        freq = +(4.7 + Math.random() * 0.4).toFixed(2);
      } else if (activePowerMode === 'saver') {
        currentWatts = +(34 + Math.random() * 6).toFixed(1);
        freq = +(1.6 + Math.random() * 0.3).toFixed(2);
      } else {
        currentWatts = +(62 + Math.random() * 8).toFixed(1);
        freq = +(3.2 + Math.random() * 0.4).toFixed(2);
      }

      setPowerHistory((prev) => [
        ...prev.slice(prev.length > 28 ? 1 : 0),
        {
          id: `pwr-${Date.now()}`,
          timeLabel: nowStr,
          watts: currentWatts,
          mode: activePowerMode,
          cpuFreqGhz: freq,
        },
      ]);
    }, 2500);

    return () => clearInterval(timer);
  }, [activePowerMode]);

  // Handler for switching Power Mode profile
  const handleSelectPowerMode = (mode: PowerMode) => {
    let nextCpuTemp = cpuTemp;
    let nextGpuTemp = gpuTemp;
    let nextCpuUsage = systemState.cpuUsage;
    let nextGpuUsage = gpuUsage;
    let nextFanSpeed = fanSpeed;

    if (mode === 'performance') {
      nextCpuTemp = +(52.5 + Math.random() * 2).toFixed(1);
      nextGpuTemp = +(54.8 + Math.random() * 2).toFixed(1);
      nextCpuUsage = 38;
      nextGpuUsage = 32;
      nextFanSpeed = 2850;
    } else if (mode === 'saver') {
      nextCpuTemp = +(38.2 + Math.random() * 1.5).toFixed(1);
      nextGpuTemp = +(40.6 + Math.random() * 1.5).toFixed(1);
      nextCpuUsage = 11;
      nextGpuUsage = 12;
      nextFanSpeed = 1120;
    } else {
      // Balanced
      nextCpuTemp = +(44.0 + Math.random() * 1.5).toFixed(1);
      nextGpuTemp = +(48.2 + Math.random() * 1.5).toFixed(1);
      nextCpuUsage = 19;
      nextGpuUsage = 20;
      nextFanSpeed = 1680;
    }

    setCpuTemp(nextCpuTemp);
    setGpuTemp(nextGpuTemp);
    setGpuUsage(nextGpuUsage);
    setFanSpeed(nextFanSpeed);

    onUpdateThermals?.(nextCpuTemp, nextGpuTemp);

    // Record into panel telemetry log
    setTelemetryLogs((prev) => [
      {
        id: `pwr-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cpuTemp: nextCpuTemp,
        gpuTemp: nextGpuTemp,
        cpuUsage: nextCpuUsage,
        gpuUsage: nextGpuUsage,
        fanSpeed: nextFanSpeed,
        status: mode === 'performance' ? 'elevated' : 'nominal',
      },
      ...prev.slice(0, 19),
    ]);

    // Dispatch to parent handler for global system state and telemetry command log
    onUpdatePowerMode?.(mode);
  };

  // Telemetry Log Feed
  const [telemetryLogs, setTelemetryLogs] = useState<ThermalTelemetryEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date(Date.now() - 6000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      cpuTemp: 43.8,
      gpuTemp: 47.9,
      cpuUsage: 14,
      gpuUsage: 18,
      fanSpeed: 1620,
      status: 'nominal',
    },
    {
      id: 'init-2',
      timestamp: new Date(Date.now() - 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      cpuTemp: 44.2,
      gpuTemp: 48.5,
      cpuUsage: 18,
      gpuUsage: 22,
      fanSpeed: 1680,
      status: 'nominal',
    },
  ]);

  // Performance Degradation Log Entry Interface
  interface PerformanceDegradationEntry {
    id: string;
    timestamp: string;
    type: 'throttle' | 'latency' | 'power' | 'spike' | 'recovery';
    title: string;
    severity: 'critical' | 'warning' | 'info';
    penalty: string;
    metric: string;
    mitigation: string;
  }

  // Thermal History for Real-Time Thermal Line Charts
  const [thermalHistory, setThermalHistory] = useState<Array<{
    timestamp: string;
    cpuTemp: number;
    gpuTemp: number;
    cpuUsage: number;
    fanSpeed: number;
    isStress: boolean;
  }>>(() => {
    const arr = [];
    const now = Date.now();
    for (let i = 15; i >= 0; i--) {
      const t = new Date(now - i * 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      arr.push({
        timestamp: t,
        cpuTemp: +(43.0 + Math.sin(i * 0.8) * 2.2).toFixed(1),
        gpuTemp: +(47.2 + Math.cos(i * 0.8) * 1.8).toFixed(1),
        cpuUsage: 18 + Math.floor(Math.sin(i) * 5),
        fanSpeed: 1650 + Math.floor(Math.sin(i) * 60),
        isStress: false,
      });
    }
    return arr;
  });

  // Degradation logs
  const [degradationLogs, setDegradationLogs] = useState<PerformanceDegradationEntry[]>([
    {
      id: 'deg-init-1',
      timestamp: new Date(Date.now() - 30000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'recovery',
      title: 'Nominal Governor Nominal Clocks',
      severity: 'info',
      penalty: '0% Throttling',
      metric: 'Load: 18% · 3.50 GHz · 44.2°C',
      mitigation: 'Full boost clock headroom available across all execution threads.',
    },
  ]);

  const [stressCountdown, setStressCountdown] = useState<number>(0);
  const [thermalActiveSubTab, setThermalActiveSubTab] = useState<'chart' | 'telemetry' | 'degradation'>('chart');
  const [hoveredThermalPoint, setHoveredThermalPoint] = useState<{
    timestamp: string;
    cpuTemp: number;
    gpuTemp: number;
    cpuUsage: number;
    fanSpeed: number;
    isStress: boolean;
  } | null>(null);

  // Periodic Sensor Probe Simulation
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      let nextCpuTemp: number;
      let nextGpuTemp: number;
      let nextGpuUsage: number;
      let nextFanSpeed: number;
      let status: 'nominal' | 'elevated' | 'critical' = 'nominal';

      if (isStressTesting) {
        // High load 100% CPU spike simulation
        nextCpuTemp = +(89.0 + Math.random() * 4.5).toFixed(1);
        nextGpuTemp = +(82.5 + Math.random() * 3.5).toFixed(1);
        nextGpuUsage = Math.floor(92 + Math.random() * 7);
        nextFanSpeed = Math.floor(4150 + Math.random() * 200);
        status = 'critical';
      } else {
        // Normal dynamic baseline probe
        const cpuJitter = (Math.random() - 0.48) * 1.2;
        const gpuJitter = (Math.random() - 0.48) * 1.0;
        const baseCpu = 41 + (systemState.cpuUsage * 0.22);
        const baseGpu = 44 + (gpuUsage * 0.18);

        nextCpuTemp = +(Math.max(38, Math.min(68, baseCpu + cpuJitter))).toFixed(1);
        nextGpuTemp = +(Math.max(40, Math.min(72, baseGpu + gpuJitter))).toFixed(1);
        nextGpuUsage = Math.floor(Math.max(12, Math.min(48, gpuUsage + (Math.random() - 0.5) * 6)));
        
        // Fan speed automatically scales with highest temperature
        const peakTemp = Math.max(nextCpuTemp, nextGpuTemp);
        nextFanSpeed = Math.floor(1400 + (peakTemp - 40) * 55 + (Math.random() - 0.5) * 40);

        if (peakTemp >= 75) status = 'critical';
        else if (peakTemp >= 60) status = 'elevated';
        else status = 'nominal';
      }

      setCpuTemp(nextCpuTemp);
      setGpuTemp(nextGpuTemp);
      setGpuUsage(nextGpuUsage);
      setFanSpeed(nextFanSpeed);

      if (onUpdateThermals) {
        onUpdateThermals(nextCpuTemp, nextGpuTemp);
      }

      // Add to telemetry log
      const newEntry: ThermalTelemetryEntry = {
        id: `sensor-${Date.now()}`,
        timestamp: nowStr,
        cpuTemp: nextCpuTemp,
        gpuTemp: nextGpuTemp,
        cpuUsage: isStressTesting ? 100 : systemState.cpuUsage,
        gpuUsage: nextGpuUsage,
        fanSpeed: nextFanSpeed,
        status,
      };

      setTelemetryLogs((prev) => [newEntry, ...prev.slice(0, 24)]);

      // Append to thermal history for thermal line charts
      setThermalHistory((prev) => [
        ...prev.slice(prev.length > 20 ? 1 : 0),
        {
          timestamp: nowStr,
          cpuTemp: nextCpuTemp,
          gpuTemp: nextGpuTemp,
          cpuUsage: isStressTesting ? 100 : systemState.cpuUsage,
          fanSpeed: nextFanSpeed,
          isStress: isStressTesting,
        },
      ]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isStreaming, isStressTesting, systemState.cpuUsage, gpuUsage, onUpdateThermals]);

  // Trigger simulated 100% CPU Load Spike Stress Test Utility
  const handleTriggerStressSpike = () => {
    if (isStressTesting) {
      // Abort stress test early
      setIsStressTesting(false);
      setStressCountdown(0);
      if (stressTimerRef.current) clearInterval(stressTimerRef.current);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setDegradationLogs((prev) => [
        {
          id: `deg-${Date.now()}-rec`,
          timestamp: nowStr,
          type: 'recovery',
          title: 'Stress Test Aborted // Workload Released',
          severity: 'info',
          penalty: 'Recovery Underway',
          metric: 'CPU Load releasing from 100% · Exhaust fan active (4100 RPM)',
          mitigation: 'ACPI Governor returning to nominal schedutil frequencies.',
        },
        ...prev.slice(0, 19),
      ]);
      return;
    }

    // Trigger 100% CPU Load Spike
    setIsStressTesting(true);
    setStressCountdown(12);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Instantly ramp telemetry values
    const spikeCpu = 91.8;
    const spikeGpu = 84.5;
    const spikeFan = 4250;
    setCpuTemp(spikeCpu);
    setGpuTemp(spikeGpu);
    setGpuUsage(95);
    setFanSpeed(spikeFan);
    onUpdateThermals?.(spikeCpu, spikeGpu);

    // Append immediate spike events to degradation log
    setDegradationLogs((prev) => [
      {
        id: `deg-${Date.now()}-1`,
        timestamp: nowStr,
        type: 'spike',
        title: 'Simulated 100% CPU Load Spike Initiated',
        severity: 'critical',
        penalty: '100% Thread Saturation',
        metric: '16 Cores / 32 Threads fully committed · TDP surge to 138.4W',
        mitigation: 'Acoustic fan curve commanded to 100% PWM (4250 RPM).',
      },
      {
        id: `deg-${Date.now()}-2`,
        timestamp: nowStr,
        type: 'throttle',
        title: 'Hardware PROCHOT Asserted (Thermal Throttling)',
        severity: 'critical',
        penalty: '-44.1% Frequency Degradation',
        metric: 'CPU Junction 91.8°C ≥ 89°C limit · Clocks throttled 5.10GHz → 2.85GHz',
        mitigation: 'Voltage decreased to 1.12V to arrest runaway junction temperatures.',
      },
      {
        id: `deg-${Date.now()}-3`,
        timestamp: nowStr,
        type: 'latency',
        title: 'System Dispatch Latency Degradation Spike',
        severity: 'warning',
        penalty: '+547% Frame Latency Surge',
        metric: 'Dispatch latency degraded 3.8ms → 24.6ms · VRM temperature 88.0°C',
        mitigation: 'Low-priority background worker threads descheduled.',
      },
      ...prev.slice(0, 16),
    ]);

    // Also inject into thermal telemetry logs
    setTelemetryLogs((prev) => [
      {
        id: `stress-${Date.now()}`,
        timestamp: nowStr,
        cpuTemp: spikeCpu,
        gpuTemp: spikeGpu,
        cpuUsage: 100,
        gpuUsage: 95,
        fanSpeed: spikeFan,
        status: 'critical',
      },
      ...prev.slice(0, 24),
    ]);

    // Update thermalHistory immediately with spike point
    setThermalHistory((prev) => [
      ...prev.slice(prev.length > 18 ? 1 : 0),
      {
        timestamp: nowStr,
        cpuTemp: spikeCpu,
        gpuTemp: spikeGpu,
        cpuUsage: 100,
        fanSpeed: spikeFan,
        isStress: true,
      },
    ]);

    // Countdown timer for 12 seconds
    let count = 12;
    if (stressTimerRef.current) clearInterval(stressTimerRef.current);
    stressTimerRef.current = setInterval(() => {
      count -= 1;
      setStressCountdown(count);
      if (count <= 0) {
        clearInterval(stressTimerRef.current);
        setIsStressTesting(false);
        const doneTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setDegradationLogs((p) => [
          {
            id: `deg-${Date.now()}-fin`,
            timestamp: doneTime,
            type: 'recovery',
            title: 'Stress Benchmark Cycle Completed // Dissipation Nominal',
            severity: 'info',
            penalty: 'Throttling Cleared',
            metric: 'Cores returning to nominal thermal curves · Clocks normalizing',
            mitigation: 'Hardware PROCHOT deasserted. System recovered.',
          },
          ...p.slice(0, 19),
        ]);
      }
    }, 1000);
  };

  const handleToggleStressTest = handleTriggerStressSpike;

  const handleClearTelemetry = () => {
    setTelemetryLogs([]);
  };

  const handleClearDegradationLogs = () => {
    setDegradationLogs([]);
  };

  // OS Native command preview
  const getOsCommandPreview = () => {
    switch (systemState.os) {
      case 'windows':
        return `PowerShell: Get-CimInstance MSAcpi_ThermalZoneTemperature | Brightness: WmiSetBrightness(1, ${systemState.brightness}) | amixer ${systemState.volume}%`;
      case 'macos':
        return `AppleScript: osascript -e "set volume output volume ${systemState.volume}" | sysctl machdep.xcpm.cpu_thermal_level`;
      case 'linux':
        return `Bash: sensors | grep 'Core 0' | amixer -D pulse sset Master ${systemState.volume}% | brightnessctl set ${systemState.brightness}%`;
      case 'android':
        return `Termux API: termux-battery-status | cat /sys/class/thermal/thermal_zone0/temp | termux-volume music ${systemState.volume}`;
    }
  };

  const androidApps = [
    { name: 'WhatsApp', category: 'Messaging', icon: 'MessageCircle', intent: 'whatsapp://send?text=Hello' },
    { name: 'Google Maps', category: 'Navigation', icon: 'Compass', intent: 'https://maps.google.com' },
    { name: 'Camera', category: 'Hardware', icon: 'Camera', intent: 'camera' },
    { name: 'Phone Dialer', category: 'Telephony', icon: 'Phone', intent: 'tel:' },
    { name: 'YouTube', category: 'Streaming', icon: 'Zap', intent: 'https://youtube.com' },
    { name: 'Spotify Mobile', category: 'Media', icon: 'Volume2', intent: 'spotify:' },
    { name: 'Chrome Mobile', category: 'Browser', icon: 'Monitor', intent: 'https://google.com' },
    { name: 'Android Settings', category: 'System', icon: 'Layout', intent: 'settings' },
  ];

  const displayedApps = systemState.os === 'android' ? androidApps : systemState.installedApps;

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Panel Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {systemState.os === 'android' ? (
            <Smartphone className="w-4 h-4 text-cyan-400" />
          ) : (
            <Monitor className="w-4 h-4 text-cyan-400" />
          )}
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
            {systemState.os === 'android' ? 'ANDROID DEVICE & HARDWARE BUS' : 'DESKTOP & HARDWARE CONTROLLER'}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            SENSORS ACTIVE
          </span>
        </div>

        {/* OS Switcher segmented buttons */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
          {(['windows', 'macos', 'linux', 'android'] as const).map((osName) => (
            <button
              key={osName}
              onClick={() => onChangeOS(osName)}
              className={`px-2.5 py-1 text-[10px] font-mono rounded transition-colors uppercase whitespace-nowrap flex items-center gap-1 ${
                systemState.os === osName
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {osName === 'android' && <Smartphone className="w-2.5 h-2.5" />}
              {osName === 'macos' ? 'macOS' : osName}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Theme Glowing Animation Definition */}
      <style>{`
        @keyframes breathe-glow {
          0%, 100% {
            box-shadow: 0 0 12px ${currentTheme.primary}40, inset 0 0 8px ${currentTheme.primary}20;
            border-color: ${currentTheme.primary}cc;
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 24px ${currentTheme.primary}90, inset 0 0 16px ${currentTheme.primary}40;
            border-color: ${currentTheme.primary};
            transform: scale(1.018);
          }
        }
      `}</style>

      {/* Primary Sub-Navigation Bar: Controls vs Efficiency Metrics */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/95 border-b border-slate-800/80 text-xs font-mono">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('controls')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'controls'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>HARDWARE &amp; OS CONTROLS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('efficiency')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'efficiency'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>EFFICIENCY METRICS</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border transition-colors ${
                activePowerMode === 'performance'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : activePowerMode === 'saver'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              }`}
            >
              {activePowerMode === 'performance' ? '114W (TURBO)' : activePowerMode === 'saver' ? '38W (ECO)' : '65W'}
            </span>
          </button>
        </div>

        {/* Real-time ACPI sampling rate pill */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-ping"
              style={{ backgroundColor: currentTheme.primary }}
            />
            <span>ACPI SAMPLING: REAL-TIME</span>
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
        {activeSubTab === 'efficiency' ? (
          <div className="space-y-4 font-mono">
            {/* Efficiency Metrics Header & Real-time Mode Quick Actions */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <div>
                    <span className="font-bold text-slate-100 text-xs tracking-wider">
                      EFFICIENCY METRICS // REAL-TIME POWER DRAW &amp; TDP TELEMETRY
                    </span>
                    <div className="text-[10px] text-slate-400">
                      Session power consumption trajectory &amp; mode switching impact analysis
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>SESSION: {formatTimeHMS(sessionUptime)}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold border ${
                      activePowerMode === 'performance'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse'
                        : activePowerMode === 'saver'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    }`}
                  >
                    {activePowerMode === 'performance'
                      ? 'HIGH PERFORMANCE [~114W]'
                      : activePowerMode === 'saver'
                      ? 'POWER SAVER [~38W]'
                      : 'BALANCED [~65W]'}
                  </span>
                </div>
              </div>

              {/* Mode Switching Quick Selector (Triggers live line graph shift immediately) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <span>TEST GOVERNOR PROFILE IMPACT:</span>
                </span>

                <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleSelectPowerMode('saver')}
                    style={
                      activePowerMode === 'saver'
                        ? {
                            borderColor: currentTheme.primary,
                            boxShadow: `0 0 16px ${currentTheme.primary}40`,
                            animation: 'breathe-glow 2.8s ease-in-out infinite',
                          }
                        : {}
                    }
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activePowerMode === 'saver'
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400'
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                    <span>POWER SAVER [35W]</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPowerMode('balanced')}
                    style={
                      activePowerMode === 'balanced'
                        ? {
                            borderColor: currentTheme.primary,
                            boxShadow: `0 0 16px ${currentTheme.primary}40`,
                            animation: 'breathe-glow 2.8s ease-in-out infinite',
                          }
                        : {}
                    }
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activePowerMode === 'balanced'
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400'
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>BALANCED [65W]</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPowerMode('performance')}
                    style={
                      activePowerMode === 'performance'
                        ? {
                            borderColor: currentTheme.primary,
                            boxShadow: `0 0 16px ${currentTheme.primary}40`,
                            animation: 'breathe-glow 2.8s ease-in-out infinite',
                          }
                        : {}
                    }
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activePowerMode === 'performance'
                        ? 'bg-amber-500/20 text-amber-200 border-amber-400'
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>HIGH PERFORMANCE [105W]</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Telemetry Impact Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Real-Time Consumption */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>REAL-TIME DRAW</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-cyan-300 tabular-nums">
                  {powerHistory[powerHistory.length - 1]?.watts.toFixed(1) || '65.0'}{' '}
                  <span className="text-xs font-normal text-slate-400">W</span>
                </div>
                <div className="text-[9px] text-slate-500">
                  {activePowerMode === 'performance'
                    ? '105W-125W Turbo Boost Band'
                    : activePowerMode === 'saver'
                    ? '35W-42W Low C-State Band'
                    : '65W Dynamic Baseline'}
                </div>
              </div>

              {/* 2. Session Average */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                <div className="text-[10px] text-slate-400">SESSION AVERAGE</div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-100 tabular-nums">
                  {(
                    powerHistory.reduce((acc, p) => acc + p.watts, 0) / Math.max(1, powerHistory.length)
                  ).toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400">W</span>
                </div>
                <div className="text-[9px] text-slate-500">
                  Nominal Mean ACPI Load
                </div>
              </div>

              {/* 3. Peak Spike */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>PEAK RECORDED</span>
                  <ArrowUpRight className="w-3 h-3 text-amber-400" />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-amber-400 tabular-nums">
                  {Math.max(...powerHistory.map((p) => p.watts), 122.8).toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400">W</span>
                </div>
                <div className="text-[9px] text-slate-500">
                  High Performance Surge
                </div>
              </div>

              {/* 4. Energy Conserved in Saver */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>SAVED IN SAVER</span>
                  <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 tabular-nums">
                  ~{(+(formatHours(saverSeconds)) * 70).toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400">Wh</span>
                </div>
                <div className="text-[9px] text-slate-500">
                  vs Max 105W TDP Load
                </div>
              </div>
            </div>

            {/* INTERACTIVE LINE GRAPH: POWER CONSUMPTION OVER SESSION DURATION */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3 shadow-xl relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="font-bold text-slate-100 text-xs tracking-wider">
                    POWER CONSUMPTION TRAJECTORY (WATTS OVER SESSION DURATION)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="w-2.5 h-1 bg-amber-400 inline-block rounded-full" />
                    <span>Turbo Peak (&gt;105W)</span>
                  </span>
                  <span className="flex items-center gap-1 text-cyan-300">
                    <span className="w-2.5 h-1 bg-cyan-400 inline-block rounded-full" />
                    <span>Balanced (65W)</span>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <span className="w-2.5 h-1 bg-emerald-400 inline-block rounded-full" />
                    <span>Power Saver (35W)</span>
                  </span>
                </div>
              </div>

              {/* SVG Line Graph Viewport */}
              <div className="relative w-full overflow-hidden">
                {(() => {
                  const svgWidth = 760;
                  const svgHeight = 220;
                  const padLeft = 50;
                  const padRight = 30;
                  const padTop = 25;
                  const padBottom = 35;
                  const plotWidth = svgWidth - padLeft - padRight;
                  const plotHeight = svgHeight - padTop - padBottom;
                  const maxWatts = 140;

                  const getX = (idx: number) =>
                    padLeft + (idx / Math.max(1, powerHistory.length - 1)) * plotWidth;
                  const getY = (watts: number) =>
                    padTop + plotHeight - (Math.min(maxWatts, Math.max(0, watts)) / maxWatts) * plotHeight;

                  const pathD = powerHistory
                    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.watts).toFixed(1)}`)
                    .join(' ');

                  const areaD = `${pathD} L ${getX(powerHistory.length - 1).toFixed(1)} ${padTop + plotHeight} L ${getX(0).toFixed(1)} ${padTop + plotHeight} Z`;

                  return (
                    <div className="relative">
                      <svg
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        className="w-full h-auto overflow-visible select-none"
                      >
                        <defs>
                          <linearGradient id="powerAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={currentTheme.primary} stopOpacity="0.4" />
                            <stop offset="60%" stopColor={currentTheme.primary} stopOpacity="0.08" />
                            <stop offset="100%" stopColor={currentTheme.primary} stopOpacity="0.0" />
                          </linearGradient>
                          <filter id="glowLine">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Shaded Threshold Operating Bands */}
                        {/* Upper High Performance Band (>105W) */}
                        <rect
                          x={padLeft}
                          y={getY(140)}
                          width={plotWidth}
                          height={getY(105) - getY(140)}
                          fill="rgba(245, 158, 11, 0.08)"
                        />
                        {/* Lower Power Saver Floor (<45W) */}
                        <rect
                          x={padLeft}
                          y={getY(45)}
                          width={plotWidth}
                          height={getY(0) - getY(45)}
                          fill="rgba(16, 185, 129, 0.08)"
                        />

                        {/* Horizontal Grid Guides */}
                        {[140, 105, 65, 35, 0].map((w) => {
                          const y = getY(w);
                          const isHigh = w === 105;
                          const isEco = w === 35;
                          const isBal = w === 65;
                          return (
                            <g key={w}>
                              <line
                                x1={padLeft}
                                y1={y}
                                x2={padLeft + plotWidth}
                                y2={y}
                                stroke={
                                  isHigh
                                    ? 'rgba(245, 158, 11, 0.45)'
                                    : isEco
                                    ? 'rgba(16, 185, 129, 0.45)'
                                    : isBal
                                    ? 'rgba(6, 182, 212, 0.35)'
                                    : 'rgba(51, 65, 85, 0.6)'
                                }
                                strokeDasharray={w > 0 && w < 140 ? '4 3' : undefined}
                                strokeWidth="1"
                              />
                              <text
                                x={padLeft - 8}
                                y={y + 3}
                                textAnchor="end"
                                className="text-[9px] fill-slate-500 font-mono"
                              >
                                {w}W
                              </text>
                            </g>
                          );
                        })}

                        {/* Guide Threshold Label Watermarks */}
                        <text
                          x={padLeft + plotWidth - 6}
                          y={getY(105) - 6}
                          textAnchor="end"
                          className="text-[9px] font-mono fill-amber-400/80 font-bold"
                        >
                          105W TURBO CEILING
                        </text>
                        <text
                          x={padLeft + plotWidth - 6}
                          y={getY(65) - 6}
                          textAnchor="end"
                          className="text-[9px] font-mono fill-cyan-400/70"
                        >
                          65W BALANCED
                        </text>
                        <text
                          x={padLeft + plotWidth - 6}
                          y={getY(35) + 12}
                          textAnchor="end"
                          className="text-[9px] font-mono fill-emerald-400/80 font-bold"
                        >
                          35W SAVER FLOOR
                        </text>

                        {/* Area Gradient Fill */}
                        <path d={areaD} fill="url(#powerAreaGrad)" />

                        {/* Main Power Trajectory Polyline */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={currentTheme.primary}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#glowLine)"
                        />

                        {/* Data Points with Mode Colors and Transition Glyphs */}
                        {powerHistory.map((p, idx) => {
                          const cx = getX(idx);
                          const cy = getY(p.watts);
                          const prev = powerHistory[idx - 1];
                          const hasTransition = prev && prev.mode !== p.mode;
                          const isPerf = p.mode === 'performance';
                          const isSaver = p.mode === 'saver';
                          const dotColor = isPerf ? '#f59e0b' : isSaver ? '#10b981' : '#06b6d4';
                          const isHovered = hoveredPowerPoint?.id === p.id;

                          return (
                            <g key={p.id}>
                              {/* Transition Callout Flag */}
                              {hasTransition && (
                                <g>
                                  <line
                                    x1={cx}
                                    y1={cy}
                                    x2={cx}
                                    y2={cy - 20}
                                    stroke={isPerf ? '#f59e0b' : '#10b981'}
                                    strokeWidth="1.5"
                                    strokeDasharray="2 2"
                                  />
                                  <rect
                                    x={cx - 36}
                                    y={cy - 34}
                                    width="72"
                                    height="15"
                                    rx="3"
                                    fill={isPerf ? 'rgba(245, 158, 11, 0.9)' : 'rgba(16, 185, 129, 0.9)'}
                                  />
                                  <text
                                    x={cx}
                                    y={cy - 23}
                                    textAnchor="middle"
                                    className="text-[8px] font-mono fill-slate-950 font-extrabold tracking-tight"
                                  >
                                    {isPerf ? '▲ TURBO ON' : '▼ ECO ON'}
                                  </text>
                                </g>
                              )}

                              {/* Interactive Dot */}
                              <circle
                                cx={cx}
                                cy={cy}
                                r={isHovered ? 6 : hasTransition ? 4.5 : 3}
                                fill={dotColor}
                                stroke="#020617"
                                strokeWidth="1.5"
                                className="cursor-pointer transition-all duration-200"
                                onMouseEnter={() => setHoveredPowerPoint(p)}
                                onMouseLeave={() => setHoveredPowerPoint(null)}
                              />
                            </g>
                          );
                        })}

                        {/* Hover Crosshair Guide */}
                        {hoveredPowerPoint && (() => {
                          const hoverIdx = powerHistory.findIndex((p) => p.id === hoveredPowerPoint.id);
                          if (hoverIdx === -1) return null;
                          const cx = getX(hoverIdx);
                          const cy = getY(hoveredPowerPoint.watts);
                          return (
                            <g>
                              <line
                                x1={cx}
                                y1={padTop}
                                x2={cx}
                                y2={padTop + plotHeight}
                                stroke="#38bdf8"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                              />
                              <circle
                                cx={cx}
                                cy={cy}
                                r="7"
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="2"
                                className="animate-ping"
                              />
                            </g>
                          );
                        })()}

                        {/* X-Axis Time Labels */}
                        {powerHistory.map((p, idx) => {
                          if (idx % 4 !== 0 && idx !== powerHistory.length - 1) return null;
                          const cx = getX(idx);
                          return (
                            <text
                              key={`t-${idx}`}
                              x={cx}
                              y={padTop + plotHeight + 16}
                              textAnchor="middle"
                              className="text-[9px] fill-slate-500 font-mono"
                            >
                              {p.timeLabel}
                            </text>
                          );
                        })}
                      </svg>

                      {/* Tooltip Overlay */}
                      {hoveredPowerPoint && (
                        <div
                          className="absolute z-30 bg-slate-950/95 border border-cyan-400 rounded-lg p-2.5 text-[10px] shadow-2xl backdrop-blur-md pointer-events-none transform -translate-y-28 -translate-x-1/2 ring-1 ring-cyan-500/40"
                          style={{
                            left: `${(getX(powerHistory.findIndex((p) => p.id === hoveredPowerPoint.id)) / svgWidth) * 100}%`,
                            top: `${(getY(hoveredPowerPoint.watts) / svgHeight) * 100}%`,
                          }}
                        >
                          <div className="font-bold text-cyan-300 pb-1 border-b border-slate-800 flex items-center justify-between gap-3">
                            <span>TIMESTEP: {hoveredPowerPoint.timeLabel}</span>
                            <span
                              className={`px-1 py-0.2 rounded text-[8px] uppercase font-bold ${
                                hoveredPowerPoint.mode === 'performance'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : hoveredPowerPoint.mode === 'saver'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              }`}
                            >
                              {hoveredPowerPoint.mode}
                            </span>
                          </div>
                          <div className="pt-1 space-y-0.5">
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Power Consumption:</span>
                              <span className="font-bold text-slate-100">{hoveredPowerPoint.watts.toFixed(1)} Watts</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Core Frequency:</span>
                              <span className="text-cyan-300 font-bold">{hoveredPowerPoint.cpuFreqGhz} GHz</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Current Draw (@19.5V):</span>
                              <span className="text-slate-300">{(hoveredPowerPoint.watts / 19.5).toFixed(2)} A</span>
                            </div>
                            <div className="flex justify-between gap-3 border-t border-slate-800/80 pt-0.5">
                              <span className="text-slate-400">Est. Discharge:</span>
                              <span
                                className={
                                  hoveredPowerPoint.mode === 'performance'
                                    ? 'text-amber-400 font-bold'
                                    : 'text-emerald-400 font-bold'
                                }
                              >
                                {hoveredPowerPoint.mode === 'performance' ? '~42% / hr' : '~14% / hr'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Bottom Insight Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] text-slate-400 gap-2">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    SWITCHING DELTA: Shifting from High Performance to Power Saver sheds <strong>~76.0W</strong> instantly from the power rail.
                  </span>
                </span>
                <span className="text-emerald-300 font-bold">
                  Autonomy Boost: +4h 15m runtime ceiling in Power Saver
                </span>
              </div>
            </div>

            {/* Switching Impact Comparison Matrix */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5 font-mono">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>GOVERNOR PROFILE IMPACT COMPARISON MATRIX</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px]">
                {/* 1. Power Saver Profile Card */}
                <div
                  className={`p-2.5 rounded-lg border space-y-1.5 ${
                    activePowerMode === 'saver'
                      ? 'bg-emerald-500/10 border-emerald-400/80 shadow-md ring-1 ring-emerald-400/30'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Leaf className="w-3 h-3" />
                      POWER SAVER
                    </span>
                    {activePowerMode === 'saver' && <span className="text-[9px] animate-pulse">ACTIVE</span>}
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">TDP Envelope:</span>
                      <span className="font-bold">35W C-States</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Typical Draw:</span>
                      <span className="text-emerald-300 font-bold">34W - 42W</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CPU Clocks:</span>
                      <span>1.6 - 2.0 GHz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cooling Acoustics:</span>
                      <span>Whisper (~1120 RPM)</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1">
                      <span className="text-slate-500">Autonomy Ceiling:</span>
                      <span className="text-emerald-300 font-bold">~6h 40m</span>
                    </div>
                  </div>
                </div>

                {/* 2. Balanced Profile Card */}
                <div
                  className={`p-2.5 rounded-lg border space-y-1.5 ${
                    activePowerMode === 'balanced'
                      ? 'bg-cyan-500/10 border-cyan-400/80 shadow-md ring-1 ring-cyan-400/30'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-cyan-400">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3" />
                      BALANCED
                    </span>
                    {activePowerMode === 'balanced' && <span className="text-[9px] animate-pulse">ACTIVE</span>}
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">TDP Envelope:</span>
                      <span className="font-bold">65W Standard</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Typical Draw:</span>
                      <span className="text-cyan-300 font-bold">60W - 70W</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CPU Clocks:</span>
                      <span>3.2 - 3.8 GHz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cooling Acoustics:</span>
                      <span>Nominal (~1680 RPM)</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1">
                      <span className="text-slate-500">Autonomy Ceiling:</span>
                      <span className="text-cyan-300 font-bold">~4h 10m</span>
                    </div>
                  </div>
                </div>

                {/* 3. High Performance Profile Card */}
                <div
                  className={`p-2.5 rounded-lg border space-y-1.5 ${
                    activePowerMode === 'performance'
                      ? 'bg-amber-500/10 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-amber-400">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      HIGH PERFORMANCE
                    </span>
                    {activePowerMode === 'performance' && <span className="text-[9px] animate-pulse">ACTIVE</span>}
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">TDP Envelope:</span>
                      <span className="font-bold">105W Turbo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Typical Draw:</span>
                      <span className="text-amber-300 font-bold">105W - 125W</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CPU Clocks:</span>
                      <span>4.6 - 5.1 GHz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cooling Acoustics:</span>
                      <span>High Velocity (~2850 RPM)</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1">
                      <span className="text-slate-500">Autonomy Ceiling:</span>
                      <span className="text-amber-300 font-bold">~1h 45m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
        {/* Hardware Sliders: Volume & Brightness */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Master Volume */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/70 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 font-mono flex items-center gap-1.5 text-[11px]">
                {systemState.isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                )}
                {systemState.os === 'android' ? 'MEDIA AUDIO VOLUME' : 'MASTER VOLUME'}
              </span>
              <span className="font-mono font-bold tabular-nums text-slate-200">
                {systemState.isMuted ? 'MUTED' : `${systemState.volume}%`}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="range"
                min="0"
                max="100"
                value={systemState.isMuted ? 0 : systemState.volume}
                onChange={(e) => onUpdateVolume(Number(e.target.value))}
                className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <button
                onClick={onToggleMute}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                  systemState.isMuted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {systemState.isMuted ? 'UNMUTE' : 'MUTE'}
              </button>
            </div>
          </div>

          {/* Display Luminance / Brightness */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/70 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 font-mono flex items-center gap-1.5 text-[11px]">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                {systemState.os === 'android' ? 'OLED DISPLAY BRIGHTNESS' : 'DISPLAY BRIGHTNESS'}
              </span>
              <span className="font-mono font-bold tabular-nums text-slate-200">
                {systemState.brightness}%
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="range"
                min="10"
                max="100"
                value={systemState.brightness}
                onChange={(e) => onUpdateBrightness(Number(e.target.value))}
                className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="text-[10px] font-mono text-slate-500">LUMEN</span>
            </div>
          </div>
        </div>

        {/* OS POWER PROFILE & PERFORMANCE GOVERNOR */}
        <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span className="font-mono font-bold text-slate-200 text-xs tracking-wider">
                OS POWER PROFILE &amp; PERFORMANCE GOVERNOR
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                {systemState.os.toUpperCase()} ACPI
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span
                className={`px-2 py-0.5 rounded font-bold border ${
                  activePowerMode === 'performance'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse'
                    : activePowerMode === 'saver'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                }`}
              >
                {activePowerMode === 'performance'
                  ? 'TURBO BOOST & MAX TDP'
                  : activePowerMode === 'saver'
                  ? 'LOW POWER CELL C-STATES'
                  : 'DYNAMIC SCALING PROFILE'}
              </span>
            </div>
          </div>

          {/* 3-State Power Mode Toggle Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
            {/* 1. Balanced Mode */}
            <button
              type="button"
              onClick={() => handleSelectPowerMode('balanced')}
              style={
                activePowerMode === 'balanced'
                  ? {
                      borderColor: currentTheme.primary,
                      boxShadow: `0 0 20px ${currentTheme.primary}4d, inset 0 0 14px ${currentTheme.primary}20`,
                      animation: 'breathe-glow 2.8s ease-in-out infinite',
                    }
                  : {}
              }
              className={`p-2.5 rounded-lg border text-left transition-all duration-500 cursor-pointer flex flex-col justify-between space-y-1.5 ${
                activePowerMode === 'balanced'
                  ? 'bg-cyan-500/15 text-cyan-200 shadow-md ring-1 ring-cyan-400/40'
                  : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                  <Gauge className={`w-3.5 h-3.5 ${activePowerMode === 'balanced' ? 'text-cyan-400' : 'text-slate-500'}`} />
                  BALANCED
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                    activePowerMode === 'balanced' ? 'animate-pulse' : 'bg-slate-700'
                  }`}
                  style={
                    activePowerMode === 'balanced'
                      ? {
                          backgroundColor: currentTheme.primary,
                          boxShadow: `0 0 10px ${currentTheme.primary}`,
                        }
                      : {}
                  }
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Nominal ACPI frequency scaling. Balances computing throughput with thermal acoustics.
              </p>
              <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                <span>TDP: 65W NOMINAL</span>
                <span
                  className={activePowerMode === 'balanced' ? 'font-bold' : ''}
                  style={activePowerMode === 'balanced' ? { color: currentTheme.primary } : {}}
                >
                  ACTIVE
                </span>
              </div>
            </button>

            {/* 2. High Performance Mode */}
            <button
              type="button"
              onClick={() => handleSelectPowerMode('performance')}
              style={
                activePowerMode === 'performance'
                  ? {
                      borderColor: currentTheme.primary,
                      boxShadow: `0 0 22px ${currentTheme.primary}55, inset 0 0 14px ${currentTheme.primary}26`,
                      animation: 'breathe-glow 2.8s ease-in-out infinite',
                    }
                  : {}
              }
              className={`p-2.5 rounded-lg border text-left transition-all duration-500 cursor-pointer flex flex-col justify-between space-y-1.5 ${
                activePowerMode === 'performance'
                  ? 'bg-amber-500/15 text-amber-200 shadow-md ring-1 ring-amber-400/40'
                  : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                  <Flame className={`w-3.5 h-3.5 ${activePowerMode === 'performance' ? 'text-amber-400' : 'text-slate-500'}`} />
                  HIGH PERFORMANCE
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                    activePowerMode === 'performance' ? 'animate-pulse' : 'bg-slate-700'
                  }`}
                  style={
                    activePowerMode === 'performance'
                      ? {
                          backgroundColor: currentTheme.primary,
                          boxShadow: `0 0 10px ${currentTheme.primary}`,
                        }
                      : {}
                  }
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Disables core sleep states. Maximizes CPU clock ceilings and cooling fan curves for intensive workloads.
              </p>
              <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                <span>TDP: 105W UNLOCKED</span>
                <span
                  className={activePowerMode === 'performance' ? 'font-bold' : ''}
                  style={activePowerMode === 'performance' ? { color: currentTheme.primary } : {}}
                >
                  MAX CLOCKS
                </span>
              </div>
            </button>

            {/* 3. Power Saver Mode */}
            <button
              type="button"
              onClick={() => handleSelectPowerMode('saver')}
              style={
                activePowerMode === 'saver'
                  ? {
                      borderColor: currentTheme.primary,
                      boxShadow: `0 0 20px ${currentTheme.primary}4d, inset 0 0 14px ${currentTheme.primary}20`,
                      animation: 'breathe-glow 2.8s ease-in-out infinite',
                    }
                  : {}
              }
              className={`p-2.5 rounded-lg border text-left transition-all duration-500 cursor-pointer flex flex-col justify-between space-y-1.5 ${
                activePowerMode === 'saver'
                  ? 'bg-emerald-500/15 text-emerald-200 shadow-md ring-1 ring-emerald-400/40'
                  : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                  <Leaf className={`w-3.5 h-3.5 ${activePowerMode === 'saver' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  POWER SAVER
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                    activePowerMode === 'saver' ? 'animate-pulse' : 'bg-slate-700'
                  }`}
                  style={
                    activePowerMode === 'saver'
                      ? {
                          backgroundColor: currentTheme.primary,
                          boxShadow: `0 0 10px ${currentTheme.primary}`,
                        }
                      : {}
                  }
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Caps core frequencies and engages deep C-state sleep. Minimizes power cell drain and fan noise.
              </p>
              <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                <span>TDP: 35W CONSTRAINED</span>
                <span
                  className={activePowerMode === 'saver' ? 'font-bold' : ''}
                  style={activePowerMode === 'saver' ? { color: currentTheme.primary } : {}}
                >
                  BATTERY LIFE
                </span>
              </div>
            </button>
          </div>

          {/* Simulated OS Command Line Preview & Telemetry Tuning Strip */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-2 overflow-hidden w-full sm:w-auto">
              <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 overflow-hidden">
                <span className="text-slate-500 font-bold uppercase shrink-0">
                  {systemState.os.toUpperCase()} DISPATCH:
                </span>
                <code className="text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-[9px] truncate max-w-[280px] sm:max-w-[420px]">
                  {getOsPowerCommand(systemState.os, activePowerMode)}
                </code>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto text-[9px]">
              <span className="text-slate-500">GOVERNOR:</span>
              <span className="text-cyan-300 font-bold">
                {activePowerMode === 'performance' ? 'PERFORMANCE' : activePowerMode === 'saver' ? 'POWERSAVE' : 'SCHEDUTIL'}
              </span>
            </div>
          </div>
        </div>

        {/* POWER ANALYTICS // SESSION LOGGED PROFILES SUMMARY PANEL */}
        <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-mono font-bold text-slate-200 text-xs tracking-wider">
                POWER ANALYTICS // SESSION USAGE AUDIT
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                CURRENT SESSION
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>UPTIME: {formatTimeHMS(sessionUptime)}</span>
              </span>
              <button
                type="button"
                onClick={handleResetPowerAnalytics}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Reset session power metrics"
              >
                RESET
              </button>
            </div>
          </div>

          {/* Primary Comparison Cards: Power Saver vs High Performance (plus Balanced) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
            {/* 1. Power Saver Session Usage */}
            <div
              className={`p-3 rounded-lg border flex flex-col justify-between space-y-2 transition-all ${
                activePowerMode === 'saver'
                  ? 'bg-emerald-500/10 border-emerald-400/80 shadow-md ring-1 ring-emerald-400/30'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5" />
                  POWER SAVER
                </span>
                {activePowerMode === 'saver' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse font-bold">
                    LOGGING NOW
                  </span>
                )}
              </div>

              <div>
                <div className="text-2xl font-extrabold text-slate-100 tracking-tight">
                  {formatHours(saverSeconds)} <span className="text-xs font-normal text-slate-400">hours</span>
                </div>
                <div className="text-[10px] text-slate-400">{formatTimeHMS(saverSeconds)} total logged</div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">TDP Profile:</span>
                  <span className="text-emerald-300 font-semibold">35W Constrained</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Est. Energy Saved:</span>
                  <span className="text-slate-200">~{(+(formatHours(saverSeconds)) * 30).toFixed(1)} Wh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Acoustic State:</span>
                  <span className="text-slate-300">Whisper / ~1120 RPM</span>
                </div>
              </div>
            </div>

            {/* 2. High Performance Session Usage */}
            <div
              className={`p-3 rounded-lg border flex flex-col justify-between space-y-2 transition-all ${
                activePowerMode === 'performance'
                  ? 'bg-amber-500/10 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  HIGH PERFORMANCE
                </span>
                {activePowerMode === 'performance' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse font-bold">
                    LOGGING NOW
                  </span>
                )}
              </div>

              <div>
                <div className="text-2xl font-extrabold text-slate-100 tracking-tight">
                  {formatHours(performanceSeconds)} <span className="text-xs font-normal text-slate-400">hours</span>
                </div>
                <div className="text-[10px] text-slate-400">{formatTimeHMS(performanceSeconds)} total logged</div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">TDP Profile:</span>
                  <span className="text-amber-300 font-semibold">105W Unconstrained</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thermal Envelope:</span>
                  <span className="text-slate-200">Turbo Frequency Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Acoustic State:</span>
                  <span className="text-slate-300">High Velocity / ~2850 RPM</span>
                </div>
              </div>
            </div>

            {/* 3. Balanced Baseline Usage */}
            <div
              className={`p-3 rounded-lg border flex flex-col justify-between space-y-2 transition-all ${
                activePowerMode === 'balanced'
                  ? 'bg-cyan-500/10 border-cyan-400/80 shadow-md ring-1 ring-cyan-400/30'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" />
                  BALANCED BASELINE
                </span>
                {activePowerMode === 'balanced' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse font-bold">
                    LOGGING NOW
                  </span>
                )}
              </div>

              <div>
                <div className="text-2xl font-extrabold text-slate-100 tracking-tight">
                  {formatHours(balancedSeconds)} <span className="text-xs font-normal text-slate-400">hours</span>
                </div>
                <div className="text-[10px] text-slate-400">{formatTimeHMS(balancedSeconds)} total logged</div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">TDP Profile:</span>
                  <span className="text-cyan-300 font-semibold">65W Standard</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Governor:</span>
                  <span className="text-slate-200">Schedutil Dynamic Scaling</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Acoustic State:</span>
                  <span className="text-slate-300">Nominal / ~1680 RPM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparative Distribution Bar: Power Saver vs High Performance */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2 font-mono text-[10px]">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-slate-300 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                SESSION PROFILE ALLOCATION &amp; EFFICIENCY RATIO
              </span>
              <span className="text-slate-500">
                Saver vs Performance Ratio: <strong className="text-emerald-400">{((saverSeconds / Math.max(1, performanceSeconds))).toFixed(2)}:1</strong>
              </span>
            </div>

            {/* Segmented Distribution Bar */}
            {(() => {
              const total = Math.max(1, saverSeconds + performanceSeconds + balancedSeconds);
              const saverPct = Math.round((saverSeconds / total) * 100);
              const perfPct = Math.round((performanceSeconds / total) * 100);
              const balPct = Math.max(0, 100 - saverPct - perfPct);
              return (
                <div className="space-y-1.5">
                  <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
                    <div
                      style={{ width: `${saverPct}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500"
                      title={`Power Saver: ${saverPct}%`}
                    />
                    <div
                      style={{ width: `${perfPct}%` }}
                      className="bg-amber-500 h-full transition-all duration-500"
                      title={`High Performance: ${perfPct}%`}
                    />
                    <div
                      style={{ width: `${balPct}%` }}
                      className="bg-cyan-500 h-full transition-all duration-500"
                      title={`Balanced: ${balPct}%`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Power Saver: {saverPct}% ({formatHours(saverSeconds)} hrs)
                    </span>
                    <span className="text-amber-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      High Performance: {perfPct}% ({formatHours(performanceSeconds)} hrs)
                    </span>
                    <span className="text-cyan-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                      Balanced: {balPct}% ({formatHours(balancedSeconds)} hrs)
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* VISUAL GRAPH: HIGH PERFORMANCE VS POWER SAVER STACKED BAR CHART */}
          <div className="p-3 bg-slate-900/95 border border-slate-800 rounded-xl space-y-3 font-mono">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  <span>SESSION DISTRIBUTION // HIGH PERFORMANCE VS POWER SAVER</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Stacked temporal comparison of active thermal governance profiles across session intervals
                </div>
              </div>

              {/* Legend & Summary Readout */}
              <div className="flex flex-wrap items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span>Power Saver ({formatHours(saverSeconds)} hrs)</span>
                </span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  <span>High Performance ({formatHours(performanceSeconds)} hrs)</span>
                </span>
              </div>
            </div>

            {/* Stacked Bar Chart Graphic Viewport */}
            {(() => {
              const saverHrs = +(saverSeconds / 3600);
              const perfHrs = +(performanceSeconds / 3600);

              const barsData = [
                {
                  label: 'Window 1 [T-4h]',
                  shortLabel: 'W1',
                  saver: Math.min(0.42, +(saverHrs * 0.23).toFixed(2)),
                  perf: Math.min(0.22, +(perfHrs * 0.17).toFixed(2)),
                },
                {
                  label: 'Window 2 [T-3h]',
                  shortLabel: 'W2',
                  saver: Math.min(0.32, +(saverHrs * 0.18).toFixed(2)),
                  perf: Math.min(0.38, +(perfHrs * 0.31).toFixed(2)),
                },
                {
                  label: 'Window 3 [T-2h]',
                  shortLabel: 'W3',
                  saver: Math.min(0.56, +(saverHrs * 0.28).toFixed(2)),
                  perf: Math.min(0.14, +(perfHrs * 0.12).toFixed(2)),
                },
                {
                  label: 'Window 4 [T-1h]',
                  shortLabel: 'W4',
                  saver: Math.min(0.38, +(saverHrs * 0.19).toFixed(2)),
                  perf: Math.min(0.26, +(perfHrs * 0.22).toFixed(2)),
                },
                {
                  label: 'Active Window [Now]',
                  shortLabel: 'Active',
                  saver: Math.max(0.12, +(saverHrs - saverHrs * 0.88).toFixed(2)),
                  perf: Math.max(0.08, +(perfHrs - perfHrs * 0.82).toFixed(2)),
                  isActive: true,
                },
                {
                  label: 'Cumulative Stack',
                  shortLabel: 'Total',
                  saver: +saverHrs.toFixed(2),
                  perf: +perfHrs.toFixed(2),
                  isCumulative: true,
                },
              ];

              return (
                <div className="relative pt-3">
                  {/* Background Grid Guide Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 text-[9px] text-slate-600">
                    <div className="border-b border-slate-800/60 w-full flex justify-between pr-2">
                      <span>1.0h+</span>
                      <span className="text-[8px] text-slate-700">PROFILE CEILING</span>
                    </div>
                    <div className="border-b border-slate-800/40 w-full flex justify-between pr-2">
                      <span>0.75h</span>
                    </div>
                    <div className="border-b border-slate-800/40 w-full flex justify-between pr-2">
                      <span>0.5h</span>
                      <span className="text-[8px] text-slate-700">MEDIAN INTERVAL</span>
                    </div>
                    <div className="border-b border-slate-800/40 w-full flex justify-between pr-2">
                      <span>0.25h</span>
                    </div>
                    <div className="border-b border-slate-700/80 w-full flex justify-between pr-2">
                      <span>0.0h</span>
                      <span className="text-[8px] text-slate-700">BASELINE</span>
                    </div>
                  </div>

                  {/* Bars Layout Container */}
                  <div className="relative z-10 grid grid-cols-6 gap-2 sm:gap-4 h-52 pt-4 pb-6 items-end">
                    {barsData.map((bar, idx) => {
                      const isHovered = hoveredBarIndex === idx;
                      const total = bar.saver + bar.perf;
                      // Interval bars scale relative to 1.0h, cumulative scales to total session non-nominal hours
                      const maxScale = bar.isCumulative ? Math.max(2.5, saverHrs + perfHrs) : 1.0;
                      const totalHeightPct = Math.min(100, Math.max(12, (total / maxScale) * 100));
                      const saverRatio = total > 0 ? (bar.saver / total) * 100 : 50;
                      const perfRatio = total > 0 ? (bar.perf / total) * 100 : 50;

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredBarIndex(idx)}
                          onMouseLeave={() => setHoveredBarIndex(null)}
                          className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                        >
                          {/* Hover Tooltip Card */}
                          {isHovered && (
                            <div className="absolute -top-20 z-40 whitespace-nowrap bg-slate-950/95 border border-cyan-400 rounded-lg p-2.5 text-[10px] shadow-2xl backdrop-blur-md pointer-events-none transform -translate-y-1 animate-fadeIn ring-1 ring-cyan-500/40">
                              <div className="font-bold text-cyan-300 pb-1 border-b border-slate-800 flex items-center justify-between gap-3">
                                <span>{bar.label}</span>
                                <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-400">
                                  {bar.isCumulative ? 'CUMULATIVE' : 'INTERVAL'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-emerald-400 pt-1">
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Power Saver:
                                </span>
                                <span className="font-bold">{bar.saver.toFixed(2)} hrs ({Math.round(saverRatio)}%)</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-amber-400">
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  High Performance:
                                </span>
                                <span className="font-bold">{bar.perf.toFixed(2)} hrs ({Math.round(perfRatio)}%)</span>
                              </div>
                              <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                                <span>Combined Logged:</span>
                                <span className="text-slate-200 font-bold">{total.toFixed(2)} hrs</span>
                              </div>
                            </div>
                          )}

                          {/* Stacked Bar Pillar */}
                          <div
                            style={{ height: `${totalHeightPct}%` }}
                            className={`w-full max-w-[44px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-300 border ${
                              bar.isCumulative
                                ? 'border-cyan-500/80 bg-slate-950 ring-1 ring-cyan-500/40'
                                : 'border-slate-700/80 bg-slate-950'
                            } ${
                              isHovered
                                ? 'ring-2 ring-cyan-400 scale-105 shadow-[0_0_20px_rgba(6,182,212,0.8)] border-cyan-300'
                                : 'shadow-md'
                            }`}
                          >
                            {/* Top Stack: High Performance (Amber) */}
                            <div
                              style={{ height: `${perfRatio}%` }}
                              className={`w-full transition-all duration-300 flex items-center justify-center text-[9px] font-bold ${
                                isHovered
                                  ? 'bg-amber-400 text-slate-950 shadow-[inset_0_0_10px_rgba(251,191,36,0.9)]'
                                  : 'bg-amber-500 hover:bg-amber-400 text-amber-950'
                              }`}
                              title={`High Performance: ${bar.perf.toFixed(2)} hrs`}
                            >
                              {perfRatio > 24 && <span>{bar.perf.toFixed(1)}h</span>}
                            </div>

                            {/* Bottom Stack: Power Saver (Emerald) */}
                            <div
                              style={{ height: `${saverRatio}%` }}
                              className={`w-full transition-all duration-300 flex items-center justify-center text-[9px] font-bold ${
                                isHovered
                                  ? 'bg-emerald-400 text-slate-950 shadow-[inset_0_0_10px_rgba(16,185,129,0.9)]'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950'
                              }`}
                              title={`Power Saver: ${bar.saver.toFixed(2)} hrs`}
                            >
                              {saverRatio > 24 && <span>{bar.saver.toFixed(1)}h</span>}
                            </div>
                          </div>

                          {/* X-Axis Interval Label */}
                          <div className="flex flex-col items-center mt-2 whitespace-nowrap">
                            <span
                              className={`text-[9px] font-bold transition-colors ${
                                bar.isCumulative
                                  ? 'text-cyan-400'
                                  : isHovered
                                  ? 'text-cyan-300 font-bold'
                                  : 'text-slate-400'
                              }`}
                            >
                              {bar.shortLabel}
                            </span>
                            <span className="text-[8px] text-slate-500 hidden sm:inline-block">
                              {total.toFixed(2)}h
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Bottom Insight Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] text-slate-400 gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>
                  STACKED TOTAL: <strong>{(+(formatHours(saverSeconds)) + +(formatHours(performanceSeconds))).toFixed(2)} hrs</strong> active across non-nominal governance
                </span>
              </span>
              <span className="text-emerald-400 font-bold">
                {+(formatHours(saverSeconds)) >= +(formatHours(performanceSeconds))
                  ? `Saver Dominance: +${(+(formatHours(saverSeconds)) - +(formatHours(performanceSeconds))).toFixed(2)} hrs net runtime`
                  : `High Performance Dominance: +${(+(formatHours(performanceSeconds)) - +(formatHours(saverSeconds))).toFixed(2)} hrs net runtime`}
              </span>
            </div>
          </div>
        </div>

        {/* CPU/GPU TEMPERATURE & HARDWARE SENSOR MONITORING SUITE */}
        <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3 shadow-lg">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Thermometer className={`w-4 h-4 ${isStressTesting ? 'text-rose-400 animate-bounce' : 'text-cyan-400 animate-pulse'}`} />
              <span className="font-mono font-bold text-slate-200 text-xs tracking-wider">
                THERMAL TELEMETRY &amp; HARDWARE SENSORS
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                isStressTesting
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                {isStressTesting ? '100% STRESS ACTIVE' : 'ACPI / I2C BUS'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono">
              <button
                onClick={handleToggleStressTest}
                className={`px-2.5 py-1 rounded font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isStressTesting
                    ? 'bg-rose-500/25 text-rose-300 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                }`}
                title={isStressTesting ? 'Click to abort stress test early' : 'Trigger simulated 100% CPU load spike'}
              >
                <Flame className={`w-3.5 h-3.5 ${isStressTesting ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
                <span>{isStressTesting ? `STRESS ACTIVE (${stressCountdown}s)` : 'STRESS TEST (100% CPU)'}</span>
              </button>

              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                title={isStreaming ? 'Pause sensor polling' : 'Resume sensor polling'}
              >
                {isStreaming ? <Pause className="w-3 h-3 text-cyan-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                <span>{isStreaming ? 'STREAMING' : 'PAUSED'}</span>
              </button>

              <button
                onClick={handleClearTelemetry}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                title="Clear thermal telemetry log"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Interactive Stress Test Utility HUD Banner */}
          {isStressTesting ? (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.25)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-pulse">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 shrink-0">
                  <Flame className="w-5 h-5 text-rose-400 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-rose-300 tracking-wider">
                      SIMULATED 100% CPU LOAD SPIKE IN PROGRESS
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 text-[10px] font-mono font-bold border border-rose-500">
                      T-MINUS {stressCountdown}s
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 font-mono">
                    All 16 cores (32 threads) at 100% saturation · TDP surged to 138.4W · Hardware PROCHOT asserted (-44.1% clock throttling: 5.10GHz → 2.85GHz).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleStressTest}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer self-end md:self-auto flex items-center gap-1.5"
              >
                <span>ABORT WORKLOAD</span>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-300 text-[11px]">
                  <strong>STRESS TEST UTILITY:</strong> Trigger a simulated 100% CPU load spike to evaluate thermal throttling line curves, PROCHOT activation, and system degradation logging.
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleStressTest}
                className="px-3 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>TRIGGER 100% CPU LOAD SPIKE</span>
              </button>
            </div>
          )}

          {/* Real-time Hardware Telemetry Dials Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono">
            {/* CPU Package Sensor */}
            <div className={`p-3 rounded-lg flex flex-col justify-between transition-colors border ${
              isStressTesting || cpuTemp > 75
                ? 'bg-rose-950/40 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'bg-slate-900/90 border-slate-800/90'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-bold">
                  <Cpu className={`w-3.5 h-3.5 ${isStressTesting || cpuTemp > 75 ? 'text-rose-400' : 'text-cyan-400'}`} />
                  CPU PACKAGE
                </span>
                <span
                  className={`text-[9px] px-1 rounded font-bold ${
                    isStressTesting || cpuTemp > 75
                      ? 'bg-rose-500/30 text-rose-300 animate-pulse border border-rose-500/50'
                      : cpuTemp > 60
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {isStressTesting ? '100% SPIKE' : cpuTemp > 75 ? 'THROTTLED' : cpuTemp > 60 ? 'WARM' : 'OPTIMAL'}
                </span>
              </div>

              <div className="my-2 flex items-baseline justify-between">
                <span className={`text-xl font-bold tabular-nums ${isStressTesting || cpuTemp > 75 ? 'text-rose-300 font-extrabold' : 'text-slate-100'}`}>
                  {cpuTemp}°C
                </span>
                <span className={`text-[10px] ${isStressTesting ? 'text-rose-300 font-bold' : 'text-slate-400'}`}>
                  {isStressTesting ? 100 : systemState.cpuUsage}% LOAD
                </span>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    isStressTesting || cpuTemp > 75 ? 'bg-rose-500' : cpuTemp > 60 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, (cpuTemp / 95) * 100))}%` }}
                />
              </div>
            </div>

            {/* GPU Core Diode Sensor */}
            <div className="p-3 bg-slate-900/90 border border-slate-800/90 rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  GPU DIODE
                </span>
                <span
                  className={`text-[9px] px-1 rounded font-bold ${
                    gpuTemp > 75 ? 'bg-rose-500/20 text-rose-300' : gpuTemp > 60 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {gpuTemp > 75 ? 'HOT' : gpuTemp > 60 ? 'WARM' : 'CHILL'}
                </span>
              </div>

              <div className="my-2 flex items-baseline justify-between">
                <span className="text-xl font-bold tabular-nums text-slate-100">{gpuTemp}°C</span>
                <span className="text-[10px] text-slate-400">{gpuUsage}% LOAD</span>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    gpuTemp > 75 ? 'bg-rose-500' : gpuTemp > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, (gpuTemp / 90) * 100))}%` }}
                />
              </div>
            </div>

            {/* Cooling Fan Array */}
            <div className="p-3 bg-slate-900/90 border border-slate-800/90 rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-bold">
                  <Fan className={`w-3.5 h-3.5 text-cyan-400 ${fanSpeed > 2500 ? 'animate-spin' : ''}`} />
                  COOLING ARRAY
                </span>
                <span className={`text-[9px] px-1 rounded font-bold ${
                  fanSpeed > 4000 ? 'bg-rose-500/30 text-rose-300' : fanSpeed > 3000 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {fanSpeed > 4000 ? 'EMERGENCY' : fanSpeed > 3000 ? 'BOOST' : fanSpeed > 2000 ? 'NORMAL' : 'SILENT'}
                </span>
              </div>

              <div className="my-2 flex items-baseline justify-between">
                <span className="text-xl font-bold tabular-nums text-slate-100">{fanSpeed}</span>
                <span className="text-[10px] text-slate-400">RPM</span>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${fanSpeed > 4000 ? 'bg-rose-500' : 'bg-cyan-400'}`}
                  style={{ width: `${Math.min(100, Math.max(15, (fanSpeed / 4500) * 100))}%` }}
                />
              </div>
            </div>

            {/* RAM Commit & Battery Summary */}
            <div className="p-3 bg-slate-900/90 border border-slate-800/90 rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-bold">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  MEMORY &amp; PWR
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    systemState.battery <= 20
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                      : 'text-amber-300'
                  }`}
                >
                  {systemState.battery}% BAT {systemState.battery <= 20 ? '(<20% ALERT)' : ''}
                </span>
              </div>

              <div className="my-1.5 flex items-baseline justify-between">
                <span className="text-xl font-bold tabular-nums text-slate-100">{systemState.ramUsage}%</span>
                <span className="text-[10px] text-slate-400">RAM COMMIT</span>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div
                  className="bg-emerald-400 h-full transition-all duration-700"
                  style={{ width: `${systemState.ramUsage}%` }}
                />
              </div>

              {/* Low Battery Test Action Buttons */}
              {onSimulateBatteryLevel && (
                <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[9px] font-mono">
                  <button
                    onClick={() => onSimulateBatteryLevel(18, false)}
                    className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors font-bold cursor-pointer"
                    title="Simulate low battery drop to 18% to trigger audible chime and log notification"
                  >
                    TEST &lt;20% ALERT
                  </button>
                  <button
                    onClick={() => onSimulateBatteryLevel(92, true)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title="Restore battery level to 92% (charging)"
                  >
                    RESTORE
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sub-Tab Navigation Strip: Thermal Charts vs Performance Degradation Log vs Telemetry Feed */}
          <div className="pt-2 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setThermalActiveSubTab('chart')}
                className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  thermalActiveSubTab === 'chart'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>THERMAL LINE CHARTS</span>
                {isStressTesting && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setThermalActiveSubTab('degradation')}
                className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  thermalActiveSubTab === 'degradation'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>DEGRADATION AUDIT LOG</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                  isStressTesting
                    ? 'bg-rose-500 text-slate-950 font-extrabold animate-pulse'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {degradationLogs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setThermalActiveSubTab('telemetry')}
                className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  thermalActiveSubTab === 'telemetry'
                    ? 'bg-slate-800 text-slate-200 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span>RAW SENSORS</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400">
                  {telemetryLogs.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span>JUNCTION LIMIT: <strong className="text-rose-400">90.0°C</strong></span>
              <span>·</span>
              <span>PROCHOT: <strong className={isStressTesting || cpuTemp > 75 ? 'text-rose-400' : 'text-emerald-400'}>
                {isStressTesting || cpuTemp > 75 ? 'TRIGGERED' : 'ARMED'}
              </strong></span>
            </div>
          </div>

          {/* TAB 1: Real-Time Visual Thermal Line Charts */}
          {thermalActiveSubTab === 'chart' && (
            <div className="space-y-2 pt-1 font-mono">
              {/* Chart Legend & Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px]">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${isStressTesting || cpuTemp > 75 ? 'bg-rose-500' : 'bg-cyan-400'}`} />
                    <span className="text-slate-300 font-bold">
                      CPU Temp: <strong className={isStressTesting || cpuTemp > 75 ? 'text-rose-400' : 'text-cyan-300'}>{cpuTemp}°C</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-slate-300 font-bold">
                      GPU Diode: <strong className="text-amber-300">{gpuTemp}°C</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-purple-400 border border-purple-400" />
                    <span className="text-slate-400">
                      CPU Load: <strong className="text-purple-300">{isStressTesting ? 100 : systemState.cpuUsage}%</strong>
                    </span>
                  </div>

                  {thermalHistory.some((h) => h.isStress) && (
                    <div className="flex items-center gap-1.5 text-rose-400 text-[10px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                      <span className="w-2 h-2 rounded bg-rose-500/40 border border-rose-500" />
                      <span>STRESS TEST IMPACT ZONE</span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-400">
                  {thermalHistory.length} data points (2.5s cadence)
                </div>
              </div>

              {/* High-Resolution SVG Thermal Line Chart */}
              <div className="relative bg-slate-900/90 border border-slate-800 rounded-lg p-3 overflow-hidden shadow-inner">
                {/* Visual Alert Banner inside Chart when Stress Spiking */}
                {isStressTesting && (
                  <div className="absolute top-2 right-4 z-20 flex items-center gap-1.5 bg-rose-500/25 border border-rose-500 text-rose-300 px-2.5 py-1 rounded text-[10px] font-bold animate-pulse backdrop-blur-sm">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>SIMULATED 100% CPU SPIKE IN PROGRESS</span>
                  </div>
                )}

                {(() => {
                  const svgWidth = 680;
                  const svgHeight = 180;
                  const padLeft = 44;
                  const padRight = 16;
                  const padTop = 18;
                  const padBottom = 26;
                  const chartW = svgWidth - padLeft - padRight;
                  const chartH = svgHeight - padTop - padBottom;

                  const minT = 30;
                  const maxT = 100;
                  const tempRange = maxT - minT;

                  const getYForTemp = (temp: number) => {
                    const clamped = Math.max(minT, Math.min(maxT, temp));
                    return padTop + chartH * (1 - (clamped - minT) / tempRange);
                  };

                  const getYForLoad = (load: number) => {
                    const clamped = Math.max(0, Math.min(100, load));
                    return padTop + chartH * (1 - clamped / 100);
                  };

                  const getX = (idx: number) => {
                    if (thermalHistory.length <= 1) return padLeft;
                    return padLeft + (idx / (thermalHistory.length - 1)) * chartW;
                  };

                  // Build path for CPU Temp
                  const cpuPoints = thermalHistory.map((pt, i) => `${getX(i)},${getYForTemp(pt.cpuTemp)}`);
                  const cpuPathStr = cpuPoints.length > 0 ? `M ${cpuPoints.join(' L ')}` : '';
                  const cpuAreaStr = cpuPoints.length > 0
                    ? `M ${getX(0)},${padTop + chartH} L ${cpuPoints.join(' L ')} L ${getX(cpuPoints.length - 1)},${padTop + chartH} Z`
                    : '';

                  // Build path for GPU Temp
                  const gpuPoints = thermalHistory.map((pt, i) => `${getX(i)},${getYForTemp(pt.gpuTemp)}`);
                  const gpuPathStr = gpuPoints.length > 0 ? `M ${gpuPoints.join(' L ')}` : '';

                  // Build path for CPU Load %
                  const loadPoints = thermalHistory.map((pt, i) => `${getX(i)},${getYForLoad(pt.cpuUsage)}`);
                  const loadPathStr = loadPoints.length > 0 ? `M ${loadPoints.join(' L ')}` : '';

                  // Locate contiguous stress test zones for shading
                  const stressZones: Array<{ startX: number; endX: number }> = [];
                  let currentStart: number | null = null;
                  thermalHistory.forEach((pt, i) => {
                    if (pt.isStress) {
                      if (currentStart === null) currentStart = getX(i);
                    } else {
                      if (currentStart !== null) {
                        stressZones.push({ startX: currentStart, endX: getX(i) });
                        currentStart = null;
                      }
                    }
                  });
                  if (currentStart !== null) {
                    stressZones.push({ startX: currentStart, endX: getX(thermalHistory.length - 1) });
                  }

                  return (
                    <div className="relative">
                      <svg
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        className="w-full h-44 sm:h-52 select-none overflow-visible"
                      >
                        <defs>
                          {/* Gradient under normal CPU curve */}
                          <linearGradient id="cpuGradientNominal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                          </linearGradient>

                          {/* Gradient under stressed CPU curve */}
                          <linearGradient id="cpuGradientStress" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                          </linearGradient>

                          {/* Stress Zone Pattern */}
                          <pattern id="stressStripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(244, 63, 94, 0.25)" strokeWidth="2" />
                          </pattern>
                        </defs>

                        {/* Y-Axis Horizontal Grid Reference Lines */}
                        {[
                          { t: 90, label: '90°C', desc: 'PROCHOT LIMIT', stroke: '#ef4444', dash: '3,3' },
                          { t: 75, label: '75°C', desc: 'THROTTLE', stroke: '#f59e0b', dash: '3,3' },
                          { t: 60, label: '60°C', desc: 'ELEVATED', stroke: '#eab308', dash: '2,4' },
                          { t: 40, label: '40°C', desc: 'NOMINAL', stroke: '#06b6d4', dash: '1,4' },
                        ].map((ref) => {
                          const y = getYForTemp(ref.t);
                          return (
                            <g key={ref.t}>
                              <line
                                x1={padLeft}
                                y1={y}
                                x2={svgWidth - padRight}
                                y2={y}
                                stroke={ref.stroke}
                                strokeDasharray={ref.dash}
                                strokeOpacity="0.4"
                                strokeWidth="1"
                              />
                              <text
                                x={padLeft - 6}
                                y={y + 3}
                                textAnchor="end"
                                fill={ref.stroke}
                                fontSize="9"
                                fontFamily="monospace"
                                opacity="0.8"
                              >
                                {ref.label}
                              </text>
                              <text
                                x={svgWidth - padRight - 4}
                                y={y - 3}
                                textAnchor="end"
                                fill={ref.stroke}
                                fontSize="7"
                                fontFamily="monospace"
                                opacity="0.5"
                              >
                                {ref.desc}
                              </text>
                            </g>
                          );
                        })}

                        {/* Baseline Zero-Temp / Bottom Line */}
                        <line
                          x1={padLeft}
                          y1={padTop + chartH}
                          x2={svgWidth - padRight}
                          y2={padTop + chartH}
                          stroke="#334155"
                          strokeWidth="1"
                        />

                        {/* Shaded Red Stress Test Zones */}
                        {stressZones.map((zone, zIdx) => {
                          const w = Math.max(16, zone.endX - zone.startX);
                          return (
                            <g key={`zone-${zIdx}`}>
                              <rect
                                x={zone.startX}
                                y={padTop}
                                width={w}
                                height={chartH}
                                fill="url(#stressStripe)"
                              />
                              <rect
                                x={zone.startX}
                                y={padTop}
                                width={w}
                                height={chartH}
                                fill="rgba(244, 63, 94, 0.12)"
                                stroke="rgba(244, 63, 94, 0.4)"
                                strokeWidth="1"
                                strokeDasharray="4 2"
                              />
                              <text
                                x={zone.startX + w / 2}
                                y={padTop + 12}
                                textAnchor="middle"
                                fill="#f43f5e"
                                fontSize="8"
                                fontWeight="bold"
                                fontFamily="monospace"
                              >
                                ⚡ 100% SPIKE
                              </text>
                            </g>
                          );
                        })}

                        {/* Area Fill for CPU Temp */}
                        {cpuAreaStr && (
                          <path
                            d={cpuAreaStr}
                            fill={isStressTesting || cpuTemp > 75 ? 'url(#cpuGradientStress)' : 'url(#cpuGradientNominal)'}
                          />
                        )}

                        {/* CPU Load Line (Purple Dashed) */}
                        {loadPathStr && (
                          <path
                            d={loadPathStr}
                            fill="none"
                            stroke="#c084fc"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                            opacity="0.75"
                          />
                        )}

                        {/* GPU Temp Line (Amber) */}
                        {gpuPathStr && (
                          <path
                            d={gpuPathStr}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {/* CPU Temp Line (Cyan or Rose during stress) */}
                        {cpuPathStr && (
                          <path
                            d={cpuPathStr}
                            fill="none"
                            stroke={isStressTesting || cpuTemp > 75 ? '#f43f5e' : '#06b6d4'}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter={
                              isStressTesting || cpuTemp > 75
                                ? 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.8))'
                                : 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))'
                            }
                          />
                        )}

                        {/* Data Points Interactive Hover Circles */}
                        {thermalHistory.map((pt, i) => {
                          const cx = getX(i);
                          const cyCpu = getYForTemp(pt.cpuTemp);
                          const isHovered = hoveredThermalPoint?.timestamp === pt.timestamp;

                          return (
                            <g
                              key={`pt-${i}`}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredThermalPoint(pt)}
                              onMouseLeave={() => setHoveredThermalPoint(null)}
                            >
                              {/* Transparent Hover Hitbox */}
                              <rect
                                x={cx - 10}
                                y={padTop}
                                width={20}
                                height={chartH}
                                fill="transparent"
                              />

                              {/* Circle on CPU Line */}
                              <circle
                                cx={cx}
                                cy={cyCpu}
                                r={isHovered ? 5.5 : pt.isStress ? 4 : 2.5}
                                fill={pt.isStress || pt.cpuTemp > 75 ? '#f43f5e' : '#06b6d4'}
                                stroke="#020617"
                                strokeWidth="1.5"
                                className="transition-all duration-150"
                              />

                              {/* Highlight Vertical Line on Hover */}
                              {isHovered && (
                                <line
                                  x1={cx}
                                  y1={padTop}
                                  x2={cx}
                                  y2={padTop + chartH}
                                  stroke="#38bdf8"
                                  strokeWidth="1"
                                  strokeDasharray="2 2"
                                />
                              )}
                            </g>
                          );
                        })}

                        {/* X-Axis Timestamps (First, Middle, Last) */}
                        {thermalHistory.length > 0 && (
                          <>
                            <text
                              x={getX(0)}
                              y={padTop + chartH + 15}
                              textAnchor="start"
                              fill="#64748b"
                              fontSize="9"
                              fontFamily="monospace"
                            >
                              {thermalHistory[0].timestamp}
                            </text>
                            {thermalHistory.length > 4 && (
                              <text
                                x={getX(Math.floor(thermalHistory.length / 2))}
                                y={padTop + chartH + 15}
                                textAnchor="middle"
                                fill="#64748b"
                                fontSize="9"
                                fontFamily="monospace"
                              >
                                {thermalHistory[Math.floor(thermalHistory.length / 2)].timestamp}
                              </text>
                            )}
                            <text
                              x={getX(thermalHistory.length - 1)}
                              y={padTop + chartH + 15}
                              textAnchor="end"
                              fill={isStressTesting ? '#f43f5e' : '#64748b'}
                              fontSize="9"
                              fontWeight={isStressTesting ? 'bold' : 'normal'}
                              fontFamily="monospace"
                            >
                              {thermalHistory[thermalHistory.length - 1].timestamp} (NOW)
                            </text>
                          </>
                        )}
                      </svg>

                      {/* Tooltip Card Overlay for Hovered Point */}
                      {hoveredThermalPoint && (
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-30 bg-slate-950/95 border border-cyan-400 rounded-lg p-2.5 text-[11px] shadow-2xl backdrop-blur-md pointer-events-none ring-1 ring-cyan-500/40 min-w-[210px]">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-800 font-bold">
                            <span className="text-cyan-300">{hoveredThermalPoint.timestamp}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              hoveredThermalPoint.isStress
                                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {hoveredThermalPoint.isStress ? '100% STRESS LOAD' : 'NOMINAL'}
                            </span>
                          </div>

                          <div className="pt-1.5 space-y-1 text-[10px]">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">CPU Junction:</span>
                              <strong className={hoveredThermalPoint.cpuTemp > 75 ? 'text-rose-400' : 'text-cyan-300'}>
                                {hoveredThermalPoint.cpuTemp}°C {hoveredThermalPoint.cpuTemp >= 89 ? '(PROCHOT)' : ''}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">GPU Diode:</span>
                              <strong className="text-amber-300">{hoveredThermalPoint.gpuTemp}°C</strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Thread Saturation:</span>
                              <strong className={hoveredThermalPoint.cpuUsage === 100 ? 'text-rose-400' : 'text-purple-300'}>
                                {hoveredThermalPoint.cpuUsage}% LOAD
                              </strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Cooling Fan Array:</span>
                              <strong className="text-slate-200">{hoveredThermalPoint.fanSpeed} RPM</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Bottom Telemetry Insight Summary */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] text-slate-400 gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isStressTesting ? 'bg-rose-500 animate-ping' : 'bg-cyan-400'}`} />
                    <span>
                      PEAK SESSION CPU: <strong className="text-slate-200">{Math.max(...thermalHistory.map((p) => p.cpuTemp), cpuTemp)}°C</strong>
                    </span>
                    <span>·</span>
                    <span>
                      AVG FAN SPEED: <strong className="text-slate-200">{Math.round(thermalHistory.reduce((acc, p) => acc + p.fanSpeed, 0) / Math.max(1, thermalHistory.length))} RPM</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">THERMAL GOVERNOR:</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                      isStressTesting || cpuTemp > 75
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {isStressTesting || cpuTemp > 75 ? 'HARDWARE THROTTLING (PROCHOT ACTIVE)' : 'OPTIMAL THERMAL HEADROOM'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: System Performance Degradation Audit Log */}
          {thermalActiveSubTab === 'degradation' && (
            <div className="space-y-2.5 pt-1 font-mono">
              <div className="flex items-center justify-between text-[11px] px-1">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>SYSTEM PERFORMANCE DEGRADATION AUDIT ({degradationLogs.length} EVENTS)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerStressSpike}
                    className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Flame className="w-3 h-3 text-rose-400" />
                    <span>{isStressTesting ? 'ABORT SPIKE' : 'TRIGGER NEW SPIKE'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearDegradationLogs}
                    className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                    title="Clear degradation log"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Degradation Events Stream Cards */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-800/80">
                {degradationLogs.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    Degradation audit log cleared. Trigger a Stress Test spike above to log system throttling events.
                  </div>
                ) : (
                  degradationLogs.map((log) => {
                    return (
                      <div
                        key={log.id}
                        className={`p-2.5 flex flex-col gap-1.5 transition-colors ${
                          log.severity === 'critical'
                            ? 'bg-rose-950/20 hover:bg-rose-950/30'
                            : log.severity === 'warning'
                            ? 'bg-amber-950/20 hover:bg-amber-950/30'
                            : 'hover:bg-slate-850/60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 tabular-nums text-[10px]">{log.timestamp}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider ${
                              log.type === 'spike'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : log.type === 'throttle'
                                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50'
                                : log.type === 'latency'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {log.type}
                            </span>
                            <strong className="text-slate-200 text-xs">{log.title}</strong>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              log.severity === 'critical'
                                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                                : log.severity === 'warning'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {log.penalty}
                            </span>
                          </div>
                        </div>

                        {/* Metric & Mitigation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] bg-slate-950/60 p-2 rounded border border-slate-850 font-mono">
                          <div>
                            <span className="text-slate-500 block">OBSERVED METRIC IMPACT:</span>
                            <span className="text-slate-300 font-bold">{log.metric}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">ACTIVE ACPI HARDWARE MITIGATION:</span>
                            <span className="text-cyan-300">{log.mitigation}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Raw Hardware Sensor Polling Feed */}
          {thermalActiveSubTab === 'telemetry' && (
            <div className="space-y-2 pt-1 font-mono">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 px-1">
                <span className="uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  Live Sensor Polling Stream ({telemetryLogs.length} events)
                </span>
                <span className="text-slate-500">2.5s POLLING INTERVAL</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-800/60 font-mono text-[11px]">
                {telemetryLogs.length === 0 ? (
                  <div className="p-3 text-center text-slate-500 text-xs">
                    Telemetry stream cleared. Standing by for next hardware poll...
                  </div>
                ) : (
                  telemetryLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 flex items-center justify-between gap-2 hover:bg-slate-850/60 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 tabular-nums text-[10px]">{log.timestamp}</span>
                        <span className="text-slate-300">
                          CPU: <strong className={log.cpuTemp > 75 ? 'text-rose-400 font-bold' : log.cpuTemp > 60 ? 'text-amber-300 font-bold' : 'text-cyan-300'}>{log.cpuTemp}°C</strong>
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-300">
                          GPU: <strong className={log.gpuTemp > 75 ? 'text-rose-400 font-bold' : log.gpuTemp > 60 ? 'text-amber-300 font-bold' : 'text-emerald-300'}>{log.gpuTemp}°C</strong>
                        </span>
                        <span className="text-slate-600 hidden sm:inline">·</span>
                        <span className="text-slate-400 hidden sm:inline">
                          Fan: <strong className="text-slate-200">{log.fanSpeed} RPM</strong>
                        </span>
                        <span className="text-slate-600 hidden md:inline">·</span>
                        <span className="text-slate-400 hidden md:inline">
                          Load: <strong className={log.cpuUsage === 100 ? 'text-rose-400' : 'text-slate-200'}>{log.cpuUsage}%</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                            log.status === 'critical'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : log.status === 'elevated'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Android Hardware Sensors & Actuators Bar (When Android or mobile controls) */}
        {systemState.os === 'android' && (
          <div className="p-3 bg-slate-950/80 border border-cyan-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyan-400 font-mono font-bold flex items-center gap-1.5 text-[11px]">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                ANDROID SENSORS &amp; PHYSICAL ACTUATORS
              </span>
              <span className="text-[10px] font-mono text-slate-400">HARDWARE API</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Flashlight Torch */}
              <button
                onClick={onToggleTorch}
                className={`p-2 rounded-lg border font-mono text-[11px] flex items-center justify-center gap-2 transition-all ${
                  systemState.androidTorch
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md ring-1 ring-amber-400/40'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${systemState.androidTorch ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>TORCH: {systemState.androidTorch ? 'ACTIVE (ON)' : 'OFF'}</span>
              </button>

              {/* Haptic Vibration */}
              <button
                onClick={onTriggerVibration}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white font-mono text-[11px] flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Vibrate className="w-3.5 h-3.5 text-cyan-400" />
                <span>PULSE HAPTICS</span>
              </button>

              {/* Screen Wake Lock */}
              <button
                onClick={onToggleWakeLock}
                className={`p-2 rounded-lg border font-mono text-[11px] flex items-center justify-center gap-2 transition-all ${
                  wakeLockActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
                }`}
              >
                <Eye className={`w-3.5 h-3.5 ${wakeLockActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>WAKE LOCK: {wakeLockActive ? 'KEEP ON' : 'AUTO'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Window Layout Actions (Desktop) or App Switching (Android) */}
        <div className="p-3 bg-slate-950/70 border border-slate-800/70 rounded-lg">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-slate-400 font-mono flex items-center gap-1.5 text-[11px]">
              <Layout className="w-3.5 h-3.5 text-cyan-400" />
              {systemState.os === 'android' ? 'TASK SWITCHER & MULTI-WINDOW' : 'WINDOW WORKSPACE AUTOMATION'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              ACTIVE: {systemState.openWindows.length} TASKS
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => onManageWindows('minimize_all')}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 font-mono text-[11px] transition-colors"
            >
              <Minimize2 className="w-3 h-3 text-cyan-400" />
              <span>{systemState.os === 'android' ? 'HOME SCREEN' : 'MINIMIZE ALL'}</span>
            </button>

            <button
              onClick={() => onManageWindows('maximize')}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 font-mono text-[11px] transition-colors"
            >
              <Maximize2 className="w-3 h-3 text-cyan-400" />
              <span>FULLSCREEN</span>
            </button>

            <button
              onClick={() => onManageWindows('snap_split')}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 font-mono text-[11px] transition-colors"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>SPLIT SCREEN</span>
            </button>

            <button
              onClick={() => onManageWindows('close_active')}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-300 hover:text-rose-200 flex items-center justify-center gap-1.5 font-mono text-[11px] transition-colors"
            >
              <span className="text-rose-400">×</span>
              <span>SWIPE KILL</span>
            </button>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>FOREGROUND ACTIVITY:</span>
            <span className="text-cyan-300 truncate max-w-[220px]">{systemState.activeWindow}</span>
          </div>
        </div>

        {/* Quick Launch Applications & Android Intents */}
        <div className="p-3 bg-slate-950/70 border border-slate-800/70 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-mono flex items-center gap-1.5 text-[11px]">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              {systemState.os === 'android' ? 'ANDROID INTENT LAUNCHER' : 'APPLICATION LAUNCHER'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">VOICE COMMAND: &ldquo;OPEN &lt;APP&gt;&rdquo;</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {displayedApps.map((app) => (
              <button
                key={app.name}
                onClick={() => onLaunchApp(app.name)}
                className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-mono text-[11px] text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {app.name}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">{app.category}</div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Operating System Bridge Details */}
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[10px] text-slate-400">
          <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
            <span className="flex items-center gap-1 text-cyan-400">
              <Terminal className="w-3 h-3" />
              NATIVE OS SUBSYSTEM ADAPTER
            </span>
            <span className="text-[9px] text-slate-500">AUTONOMOUS</span>
          </div>
          <div className="text-slate-400 truncate bg-slate-900/80 p-1.5 rounded border border-slate-800">
            {getOsCommandPreview()}
          </div>
        </div>
      </div>
    )}
  </div>
</div>
  );
};
