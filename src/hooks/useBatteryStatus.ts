/**
 * J.A.R.V.I.S. Battery Status API Hook
 * 
 * Tracks the laptop or mobile device's power level and charging status in real time
 * using the W3C Battery Status API (navigator.getBattery).
 */

import { useState, useEffect } from 'react';

export interface BatteryState {
  level: number; // 0 to 100 percentage
  isCharging: boolean;
  isSupported: boolean;
  chargingTime: number; // seconds until fully charged
  dischargingTime: number; // seconds until fully discharged
}

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

export function useBatteryStatus(initialFallback: number = 88): BatteryState {
  const [batteryState, setBatteryState] = useState<BatteryState>({
    level: initialFallback,
    isCharging: true,
    isSupported: false,
    chargingTime: 0,
    dischargingTime: Infinity,
  });

  useEffect(() => {
    let batteryManager: BatteryManager | null = null;
    let isMounted = true;

    const updateBatteryInfo = (battery: BatteryManager) => {
      if (!isMounted) return;
      const levelPct = Math.round(battery.level * 100);
      setBatteryState({
        level: isNaN(levelPct) ? initialFallback : Math.min(100, Math.max(0, levelPct)),
        isCharging: Boolean(battery.charging),
        isSupported: true,
        chargingTime: battery.chargingTime ?? 0,
        dischargingTime: battery.dischargingTime ?? Infinity,
      });
    };

    const handleLevelChange = () => {
      if (batteryManager) updateBatteryInfo(batteryManager);
    };

    const handleChargingChange = () => {
      if (batteryManager) updateBatteryInfo(batteryManager);
    };

    const handleChargingTimeChange = () => {
      if (batteryManager) updateBatteryInfo(batteryManager);
    };

    const handleDischargingTimeChange = () => {
      if (batteryManager) updateBatteryInfo(batteryManager);
    };

    // Check if navigator.getBattery is supported
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: BatteryManager) => {
          if (!isMounted) return;
          batteryManager = battery;
          updateBatteryInfo(battery);

          battery.addEventListener('levelchange', handleLevelChange);
          battery.addEventListener('chargingchange', handleChargingChange);
          battery.addEventListener('chargingtimechange', handleChargingTimeChange);
          battery.addEventListener('dischargingtimechange', handleDischargingTimeChange);
        })
        .catch((err: any) => {
          console.warn('[J.A.R.V.I.S.] Battery Status API probe error:', err);
        });
    }

    return () => {
      isMounted = false;
      if (batteryManager) {
        batteryManager.removeEventListener('levelchange', handleLevelChange);
        batteryManager.removeEventListener('chargingchange', handleChargingChange);
        batteryManager.removeEventListener('chargingtimechange', handleChargingTimeChange);
        batteryManager.removeEventListener('dischargingtimechange', handleDischargingTimeChange);
      }
    };
  }, [initialFallback]);

  return batteryState;
}
