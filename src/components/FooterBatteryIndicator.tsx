import React from 'react';
import { BatteryState } from '../hooks/useBatteryStatus';
import { Battery, BatteryCharging, BatteryWarning, Zap } from 'lucide-react';

interface FooterBatteryIndicatorProps {
  battery: BatteryState;
}

export const FooterBatteryIndicator: React.FC<FooterBatteryIndicatorProps> = ({ battery }) => {
  const { level, isCharging, isSupported } = battery;

  // Determine color theme based on battery level
  let textColor = 'text-emerald-400';
  let borderColor = 'border-emerald-500/30';
  let bgColor = 'bg-emerald-500/10';

  if (level <= 20) {
    textColor = 'text-rose-400';
    borderColor = 'border-rose-500/30';
    bgColor = 'bg-rose-500/10';
  } else if (level <= 50) {
    textColor = 'text-amber-400';
    borderColor = 'border-amber-500/30';
    bgColor = 'bg-amber-500/10';
  }

  const tooltipText = isSupported
    ? `Hardware Battery Status API: ${level}% (${isCharging ? 'Charging' : 'Discharging'})`
    : `Device Battery Telemetry: ${level}% (${isCharging ? 'AC Powered' : 'Discharging'})`;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${borderColor} ${bgColor} ${textColor} font-mono text-[10px] transition-all cursor-help select-none`}
      title={tooltipText}
    >
      {/* Battery Icon with Charging Animation */}
      {isCharging ? (
        <span className="relative flex items-center">
          <BatteryCharging className="w-3.5 h-3.5 animate-pulse text-amber-300" />
          <Zap className="w-2 h-2 absolute -top-0.5 -right-1 text-yellow-300" />
        </span>
      ) : level <= 20 ? (
        <BatteryWarning className="w-3.5 h-3.5 animate-bounce text-rose-400" />
      ) : (
        <Battery className="w-3.5 h-3.5" />
      )}

      {/* Percentage Readout */}
      <span className="font-bold tracking-tight">{level}%</span>

      {/* Status Pill */}
      {isCharging && (
        <span className="text-[9px] uppercase tracking-wider text-amber-300 font-semibold hidden sm:inline">
          CHRG
        </span>
      )}

      {/* API Source Indicator */}
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isSupported ? (isCharging ? 'bg-amber-400 animate-ping' : 'bg-emerald-400') : 'bg-slate-500'
        }`}
        title={isSupported ? 'Real-time Battery Status API link established' : 'Telemetry profile fallback'}
      />
    </div>
  );
};
