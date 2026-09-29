/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  JarvisState,
  HUDTheme,
  MemoryItem,
  SkillPlugin,
  SystemState,
  VoiceConfig,
  CommandLogItem,
  WorkspaceFile,
  UndoRecord,
  TaskPlan,
  DiagramNodeId,
  PowerMode,
} from './types';
import { THEMES } from './utils/theme';
import { playJarvisChime } from './utils/audioEffects';
import {
  INITIAL_MEMORIES,
  INITIAL_SKILLS,
  INITIAL_SYSTEM_STATE,
  INITIAL_VOICE_CONFIG,
  INITIAL_WORKSPACE_FILES,
  INITIAL_UNDO_RECORDS,
} from './data/initialData';
import { ArcReactorAvatar } from './components/ArcReactorAvatar';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { CommandConsole } from './components/CommandConsole';
import { SystemControlPanel } from './components/SystemControlPanel';
import { MemoryDashboard } from './components/MemoryDashboard';
import { SkillPluginManager } from './components/SkillPluginManager';
import { SettingsModal } from './components/SettingsModal';
import { PythonExportModal } from './components/PythonExportModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ArchitectureFlowDiagram } from './components/ArchitectureFlowDiagram';
import { ScreenVisionPanel } from './components/ScreenVisionPanel';
import { UndoHistoryPanel } from './components/UndoHistoryPanel';
import { FileActionsManager } from './components/FileActionsManager';
import { PlanningLLMPanel } from './components/PlanningLLMPanel';
import { PhoneRemoteModal } from './components/PhoneRemoteModal';
import { FooterBatteryIndicator } from './components/FooterBatteryIndicator';
import { NeuralSyncIndicator } from './components/NeuralSyncIndicator';
import { ThermalHistoryChart } from './components/ThermalHistoryChart';
import { TechnicalDataGridOverlay } from './components/TechnicalDataGridOverlay';
import { spatialController, SpatialTelemetry } from './spatial/SpatialInteractionController';
import { SpatialCursor } from './spatial/SpatialCursor';
import { SpatialGestureHUD } from './spatial/SpatialGestureHUD';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useBatteryStatus } from './hooks/useBatteryStatus';
import {
  saveAllChatMessages,
  loadAllChatMessages,
  clearChatDBCache,
} from './services/indexedDbChatService';
import confetti from 'canvas-confetti';
import {
  Shield,
  Activity,
  Sliders,
  Brain,
  Puzzle,
  Download,
  Settings,
  Mic,
  MicOff,
  Volume2,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  Smartphone,
  Eye,
  Undo2,
  Folder,
  Network,
  Wrench,
  Radio,
  Database,
  Wifi,
  WifiOff,
  BatteryCharging,
  Zap,
} from 'lucide-react';

export default function App() {
  // State management
  const [jarvisState, setJarvisState] = useState<JarvisState>('idle');
  const [theme, setTheme] = useState<HUDTheme>('cyan');
  const [activeTab, setActiveTab] = useState<
    'hud' | 'flow' | 'planner' | 'files' | 'vision' | 'undo' | 'system' | 'memory' | 'skills'
  >('hud');

  // Architecture Diagram selected node
  const [diagramSelectedNode, setDiagramSelectedNode] = useState<DiagramNodeId>('orchestrator');

  // Filesystem Workspace [file_controller.py]
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>(() => {
    const saved = localStorage.getItem('jarvis_workspace_files');
    return saved ? JSON.parse(saved) : INITIAL_WORKSPACE_FILES;
  });

  // Undo History [undo.py]
  const [undoRecords, setUndoRecords] = useState<UndoRecord[]>(() => {
    const saved = localStorage.getItem('jarvis_undo_records');
    return saved ? JSON.parse(saved) : INITIAL_UNDO_RECORDS;
  });

  // Task Planner DAG [llm_client.py]
  const [activeTaskPlan, setActiveTaskPlan] = useState<TaskPlan | null>(null);

  // Phone Remote Modal [server.py & Phone User]
  const [isPhoneRemoteOpen, setIsPhoneRemoteOpen] = useState(false);

  // Memories & Skills
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    const saved = localStorage.getItem('jarvis_memories');
    return saved ? JSON.parse(saved) : INITIAL_MEMORIES;
  });

  const [skills, setSkills] = useState<SkillPlugin[]>(() => {
    const saved = localStorage.getItem('jarvis_skills');
    return saved ? JSON.parse(saved) : INITIAL_SKILLS;
  });

  const [systemState, setSystemState] = useState<SystemState>(() => {
    const saved = localStorage.getItem('jarvis_system_state');
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_STATE;
  });

  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(() => {
    const saved = localStorage.getItem('jarvis_voice_config');
    return saved ? JSON.parse(saved) : INITIAL_VOICE_CONFIG;
  });

  // Battery Status API (tracks real-time laptop & mobile device power level)
  const batteryState = useBatteryStatus(systemState.battery);

  // Network offline state & IndexedDB chat caching state
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [isIndexedDBLoaded, setIsIndexedDBLoaded] = useState(false);

  // Logs stream
  const [logs, setLogs] = useState<CommandLogItem[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'assistant',
      text: 'Good day, Sir. All Mark 85 subroutines are online. Standing by for voice or command instructions.',
    },
  ]);

  // Spatial Interaction Engine Telemetry State
  const [spatialTelemetry, setSpatialTelemetry] = useState<SpatialTelemetry>({
    state: 'INACTIVE',
    cameraStatus: 'OFF',
    handCount: 0,
    currentGesture: 'none',
    confidence: 0,
    pointer: {
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
      y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
      rawX: 0.5,
      rawY: 0.5,
      isOverInteractiveElement: false,
    },
    fps: 60,
    latencyMs: 0,
    hands: [],
  });

  useEffect(() => {
    const unsubscribe = spatialController.onTelemetry((t) => {
      setSpatialTelemetry(t);
    });
    return () => unsubscribe();
  }, []);

  // Emergency Stop Keyboard Shortcut: ESC key instantly disengages spatial gesture engine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        spatialController.emergencyStop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Synchronize live Battery Status API with systemState
  useEffect(() => {
    setSystemState((prev) => {
      if (prev.battery !== batteryState.level || prev.isCharging !== batteryState.isCharging) {
        return { ...prev, battery: batteryState.level, isCharging: batteryState.isCharging };
      }
      return prev;
    });
  }, [batteryState.level, batteryState.isCharging]);

  // Listen to network online / offline transitions
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Restore cached conversation history from IndexedDB on initial mount
  useEffect(() => {
    loadAllChatMessages()
      .then((cachedLogs) => {
        if (cachedLogs && cachedLogs.length > 0) {
          setLogs(cachedLogs);
        }
        setIsIndexedDBLoaded(true);
      })
      .catch((err) => {
        console.warn('[J.A.R.V.I.S.] IndexedDB initial load failed:', err);
        setIsIndexedDBLoaded(true);
      });
  }, []);

  // Persist conversation history to IndexedDB whenever logs update
  useEffect(() => {
    if (isIndexedDBLoaded && logs.length > 0) {
      saveAllChatMessages(logs).catch((err) => {
        console.warn('[J.A.R.V.I.S.] IndexedDB save error:', err);
      });
    }
  }, [logs, isIndexedDBLoaded]);

  // Clear logs & wipe IndexedDB chat cache
  const handleClearLogs = useCallback(() => {
    setLogs([]);
    clearChatDBCache().catch(console.warn);
  }, []);

  // Audio / Speech State
  const [isListening, setIsListening] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // PWA & Android Installation Hook
  const {
    isInstallable,
    isInstalled,
    isAndroid,
    isIOS,
    wakeLockActive,
    install,
    vibrate,
    toggleScreenWakeLock,
  } = usePWAInstall();

  // If on Android, default OS profile to android
  useEffect(() => {
    if (isAndroid) {
      setSystemState((prev) => (prev.os !== 'android' ? { ...prev, os: 'android' } : prev));
    }
  }, [isAndroid]);

  // Speech Recognition ref
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('jarvis_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('jarvis_skills', JSON.stringify(skills));
  }, [skills]);

  useEffect(() => {
    localStorage.setItem('jarvis_system_state', JSON.stringify(systemState));
  }, [systemState]);

  useEffect(() => {
    localStorage.setItem('jarvis_voice_config', JSON.stringify(voiceConfig));
  }, [voiceConfig]);

  useEffect(() => {
    localStorage.setItem('jarvis_workspace_files', JSON.stringify(workspaceFiles));
  }, [workspaceFiles]);

  useEffect(() => {
    localStorage.setItem('jarvis_undo_records', JSON.stringify(undoRecords));
  }, [undoRecords]);

  // Init browser speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Text to Speech playback function
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!synthRef.current) {
        if (onEnd) onEnd();
        return;
      }

      try {
        synthRef.current.cancel(); // Stop current speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = voiceConfig.speechRate;
        utterance.pitch = voiceConfig.pitch;

        // Try to pick selected voice
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find((v) => v.name === voiceConfig.voiceName);
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        } else {
          // Look for British or Daniel or natural English voice
          const britishVoice = voices.find(
            (v) =>
              v.name.toLowerCase().includes('british') ||
              v.name.toLowerCase().includes('daniel') ||
              v.name.toLowerCase().includes('george') ||
              v.lang === 'en-GB',
          );
          if (britishVoice) utterance.voice = britishVoice;
        }

        setJarvisState('speaking');
        if (voiceConfig.soundEffects) {
          playJarvisChime('ack');
        }

        utterance.onstart = () => {
          setJarvisState('speaking');
          setAudioLevel(0.65);
        };

        utterance.onend = () => {
          setJarvisState('idle');
          setAudioLevel(0);
          if (onEnd) onEnd();
        };

        utterance.onerror = () => {
          setJarvisState('idle');
          setAudioLevel(0);
          if (onEnd) onEnd();
        };

        synthRef.current.speak(utterance);
      } catch (err) {
        console.error('Speech synthesis error:', err);
        setJarvisState('idle');
        if (onEnd) onEnd();
      }
    },
    [voiceConfig],
  );

  // Low battery threshold surveillance (< 20% audible alert & telemetry log notification)
  const lowBatteryAlertFiredRef = useRef<boolean>(false);

  useEffect(() => {
    const currentLevel = systemState.battery;
    const isCharging = systemState.isCharging;

    // Trigger alert when battery drops to or below 20% while discharging
    if (currentLevel <= 20 && !isCharging) {
      if (!lowBatteryAlertFiredRef.current) {
        lowBatteryAlertFiredRef.current = true;

        // 1. Audible alert leveraging existing audio effects
        if (voiceConfig.soundEffects) {
          playJarvisChime('low_battery');
        }

        // 2. Log notification in telemetry stream
        setLogs((prev) => [
          ...prev,
          {
            id: `battery-alert-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'command',
            text: `CRITICAL POWER CELL ALERT: Battery level dropped to ${currentLevel}%. Auxiliary subroutines throttled. Connect AC power adapter.`,
            details: {
              action: 'battery_surveillance_trigger',
              target: 'power_management_bus',
              output: `Battery at ${currentLevel}% (Discharging). Level < 20% critical threshold reached. Audible alert sounded.`,
              flowPath: ['orchestrator', 'system_actions', 'tts', 'desktop_hud'],
            },
          },
        ]);

        // Spoken verbal advisory
        speak(`Warning, Sir. Auxiliary power cells have depleted to ${currentLevel} percent. Connect AC charging source.`);
      }
    } else if (currentLevel > 20 || isCharging) {
      // Reset trigger latch once battery recovers above 20% or connects to AC power
      lowBatteryAlertFiredRef.current = false;
    }
  }, [systemState.battery, systemState.isCharging, voiceConfig.soundEffects, speak]);

  // Critical thermal threshold surveillance (>= 85°C alert & telemetry log notification)
  const criticalThermalAlertFiredRef = useRef<boolean>(false);

  const handleCriticalThermalAlert = useCallback(
    (cpu: number, gpu: number) => {
      if (criticalThermalAlertFiredRef.current) return;
      criticalThermalAlertFiredRef.current = true;

      // 1. Audible alert chime leveraging existing audio effects
      if (voiceConfig.soundEffects) {
        playJarvisChime('alert');
      }

      // 2. Warning entry in the telemetry command log
      setLogs((prev) => [
        ...prev,
        {
          id: `thermal-alert-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'command',
          text: `CRITICAL THERMAL ALERT: Hardware sensors breached 85°C safety limit (CPU: ${cpu.toFixed(1)}°C, GPU: ${gpu.toFixed(1)}°C). Immediate cooling dissipation subroutines engaged.`,
          details: {
            action: 'thermal_runaway_protection',
            target: 'acpi_cooling_bus',
            output: `Thermal breach detected (>= 85°C). CPU: ${cpu.toFixed(1)}°C, GPU: ${gpu.toFixed(1)}°C. High-velocity cooling fan array engaged to 100% duty cycle.`,
            flowPath: ['orchestrator', 'system_actions', 'tts', 'desktop_hud'],
          },
        },
      ]);

      // 3. Spoken verbal advisory
      speak(
        `Warning, Sir. Hardware core temperatures have exceeded critical eighty-five degrees Celsius. Engaging emergency cooling.`
      );
    },
    [voiceConfig.soundEffects, speak],
  );

  // Monitor systemState thermals directly
  useEffect(() => {
    const cpu = systemState.cpuTemp ?? 44;
    const gpu = systemState.gpuTemp ?? 48;

    if (cpu >= 85 || gpu >= 85) {
      handleCriticalThermalAlert(cpu, gpu);
    } else if (cpu < 80 && gpu < 80) {
      // Re-arm latch when cooled back down below 80°C
      criticalThermalAlertFiredRef.current = false;
    }
  }, [systemState.cpuTemp, systemState.gpuTemp, handleCriticalThermalAlert]);

  // Forward ref for handleUpdatePowerMode so executeSystemAction can call it safely
  const handleUpdatePowerModeRef = useRef<(mode: PowerMode) => void>(() => {});

  // Execute system or skill action in the client
  const executeSystemAction = useCallback(
    (actionName: string, args: any) => {
      setJarvisState('executing');
      if (voiceConfig.soundEffects) {
        playJarvisChime('execute');
      }

      if (actionName === 'control_hardware') {
        const { action, value } = args;
        if (action === 'set_volume') {
          const newVol = typeof value === 'number' ? Math.min(100, Math.max(0, value)) : 50;
          setSystemState((prev) => ({ ...prev, volume: newVol, isMuted: false }));
          setLogs((prev) => [
            ...prev,
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'command',
              text: `CALIBRATE MASTER VOLUME TO ${newVol}%`,
              details: {
                action: 'control_hardware',
                target: 'audio_subsystem',
                output: `Volume: ${newVol}%`,
                flowPath: ['user', 'stt', 'wake_word', 'orchestrator', 'action_loader', 'system_actions', 'undo_history', 'tts'],
              },
            },
          ]);
        } else if (action === 'mute') {
          setSystemState((prev) => ({ ...prev, isMuted: true }));
          setLogs((prev) => [
            ...prev,
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'command',
              text: 'AUDIO OUTPUT MUTED',
              details: {
                action: 'control_hardware',
                target: 'audio_subsystem',
                output: 'Muted',
                flowPath: ['user', 'orchestrator', 'system_actions', 'tts'],
              },
            },
          ]);
        } else if (action === 'unmute') {
          setSystemState((prev) => ({ ...prev, isMuted: false }));
        } else if (action === 'set_brightness') {
          const newBri = typeof value === 'number' ? Math.min(100, Math.max(10, value)) : 80;
          setSystemState((prev) => ({ ...prev, brightness: newBri }));
          setLogs((prev) => [
            ...prev,
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'command',
              text: `DISPLAY LUMINANCE SET TO ${newBri}%`,
              details: {
                action: 'control_hardware',
                target: 'display_backlight',
                output: `Luminance: ${newBri}%`,
                flowPath: ['user', 'orchestrator', 'action_loader', 'system_actions', 'tts'],
              },
            },
          ]);
        } else if (action === 'set_power_mode' || action === 'power_mode') {
          const modeVal = String(value || args.mode || 'balanced').toLowerCase();
          const pMode: PowerMode = modeVal.includes('perf')
            ? 'performance'
            : modeVal.includes('save')
            ? 'saver'
            : 'balanced';
          handleUpdatePowerModeRef.current(pMode);
        } else if (action === 'check_battery') {
          setLogs((prev) => [
            ...prev,
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'command',
              text: `POWER CELL TELEMETRY: ${systemState.battery}% (${systemState.isCharging ? 'CHARGING' : 'DISCHARGING'})`,
              details: {
                action: 'control_hardware',
                target: 'battery_manager',
                output: `Level: ${systemState.battery}%, Charging: ${systemState.isCharging ? 'Yes' : 'No'} (Live Battery API)`,
                flowPath: ['user', 'orchestrator', 'action_loader', 'system_actions', 'tts'],
              },
            },
          ]);
        }
      } else if (actionName === 'manage_apps_windows') {
        const { action, target } = args;
        if (action === 'open_app') {
          const appName = target || 'Application';
          setSystemState((prev) => ({
            ...prev,
            activeWindow: `${appName.toUpperCase()} - Running`,
            openWindows: Array.from(new Set([...prev.openWindows, `${appName.toUpperCase()} - Running`])),
          }));
          setLogs((prev) => [
            ...prev,
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'command',
              text: `LAUNCHED APPLICATION: ${appName.toUpperCase()}`,
              details: {
                action: 'open_app',
                target: appName,
                output: `Process spawned on ${systemState.os}`,
                flowPath: ['user', 'orchestrator', 'action_loader', 'system_actions', 'desktop_hud'],
              },
            },
          ]);
        } else if (action === 'minimize_all') {
          setSystemState((prev) => ({ ...prev, activeWindow: 'Desktop Workspace' }));
          setLogs((prev) => [
            ...prev,
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'command',
              text: 'DESKTOP WORKSPACE CLEARED - ALL WINDOWS MINIMIZED',
              details: {
                action: 'minimize_all',
                output: 'Workspace cleared',
                flowPath: ['user', 'orchestrator', 'system_actions', 'desktop_hud'],
              },
            },
          ]);
        } else if (action === 'maximize') {
          setLogs((prev) => [
            ...prev,
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'command',
              text: `MAXIMIZED FOCUSED WINDOW: ${systemState.activeWindow}`,
              details: {
                action: 'maximize',
                flowPath: ['user', 'orchestrator', 'system_actions', 'desktop_hud'],
              },
            },
          ]);
        }
      } else if (actionName === 'manage_memory') {
        const { action, category, title, content } = args;
        if (action === 'add' && content) {
          const newMem: MemoryItem = {
            id: `mem-${Date.now()}`,
            category: category || 'note',
            title: title || 'Voice Record',
            content,
            timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            source: 'voice',
          };
          setMemories((prev) => [newMem, ...prev]);
          setLogs((prev) => [
            ...prev,
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'command',
              text: `PERSISTED MEMORY ENTRY: "${newMem.title}"`,
              details: {
                action: 'store_memory',
                output: content,
                flowPath: ['user', 'orchestrator', 'action_loader', 'memory_manager', 'undo_history', 'tts'],
              },
            },
          ]);
        }
      } else if (actionName === 'check_weather') {
        const loc = args.location || 'London';
        fetch(`/api/weather?location=${encodeURIComponent(loc)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.description) {
              speak(data.description);
              setLogs((prev) => [
                ...prev,
                {
                  id: `log-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  type: 'command',
                  text: `WEATHER TELEMETRY: ${data.location} (${data.temperature}°C, ${data.condition})`,
                  details: {
                    action: 'get_weather',
                    output: `Temp: ${data.temperature}°C, Humidity: ${data.humidity}%, Wind: ${data.windSpeed}km/h`,
                    flowPath: ['user', 'stt', 'orchestrator', 'web_search', 'tts', 'animated_avatar'],
                  },
                },
              ]);
            }
          })
          .catch((err) => console.error(err));
      } else if (actionName === 'search_web') {
        const q = args.query;
        if (q) {
          fetch('/api/web-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.summary) {
                speak(`Sir, telemetry for ${q}: ${data.summary.slice(0, 150)}`);
                setLogs((prev) => [
                  ...prev,
                  {
                    id: `log-${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: 'command',
                    text: `WEB INTEL: ${q}`,
                    details: {
                      action: 'web_search',
                      output: data.summary,
                      flowPath: ['user', 'orchestrator', 'llm_client', 'web_search', 'tts', 'desktop_hud'],
                    },
                  },
                ]);
              }
            })
            .catch((err) => console.error(err));
        }
      } else if (actionName === 'file_operations') {
        const { action, note_content } = args;
        if (action === 'create_note' && note_content) {
          const newMem: MemoryItem = {
            id: `note-${Date.now()}`,
            category: 'note',
            title: `Note: ${note_content.slice(0, 20)}...`,
            content: note_content,
            timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            source: 'voice',
          };
          setMemories((prev) => [newMem, ...prev]);
          setLogs((prev) => [
            ...prev,
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'command',
              text: `SAVED TO ~/JarvisNotes/note_${Date.now()}.txt`,
              details: {
                action: 'create_note',
                output: note_content,
                flowPath: ['user', 'orchestrator', 'action_loader', 'file_controller', 'undo_history', 'tts'],
              },
            },
          ]);
        }
      }
    },
    [systemState.os, systemState.activeWindow, voiceConfig.soundEffects, speak],
  );

  // Main User Message Handler
  const handleUserMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Add user message to log
      setLogs((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          timestamp: timeStr,
          type: 'user',
          text,
        },
      ]);

      setJarvisState('thinking');
      if (voiceConfig.soundEffects) {
        playJarvisChime('ack');
      }

      // Check skill plugin triggers first
      const lower = text.toLowerCase();

      // Flow diagram & module intent routing
      if (lower.includes('undo') || lower.includes('revert')) {
        const active = undoRecords.filter((r) => r.canRevert && !r.reverted);
        if (active.length > 0) {
          handleRevertAction(active[0].id);
          setJarvisState('idle');
          return;
        } else {
          const emptyMsg = 'No reversible actions recorded in the transaction journal, Sir.';
          speak(emptyMsg);
          setLogs((prev) => [
            ...prev,
            {
              id: `jarvis-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'assistant',
              text: emptyMsg,
            },
          ]);
          setJarvisState('idle');
          return;
        }
      }

      // Spatial gesture activation & deactivation voice commands
      if (
        lower.includes('activate gesture') ||
        lower.includes('enable gesture') ||
        lower.includes('start gesture') ||
        lower.includes('turn on hand tracking') ||
        lower.includes('start hand tracking') ||
        lower.includes('enable camera control')
      ) {
        spatialController.updateSettings({ enabled: true });
        const resp = 'Activating camera-based spatial gesture interaction engine, Sir.';
        speak(resp);
        setLogs((prev) => [
          ...prev,
          {
            id: `spatial-on-${Date.now()}`,
            timestamp: timeStr,
            type: 'command',
            text: 'SPATIAL SCREEN INTERACTION ENGINE ONLINE // WEBCAM GESTURE TRACKING ENGAGED',
            details: {
              action: 'activate_spatial_gestures',
              target: 'Optical Receptors & Gesture Recognizer',
              output: 'Camera stream initialized. Hand landmark detection active at 60 FPS.',
              flowPath: ['user', 'stt', 'orchestrator', 'desktop_hud'],
            },
          },
        ]);
        setJarvisState('idle');
        return;
      }

      if (
        lower.includes('deactivate gesture') ||
        lower.includes('disable gesture') ||
        lower.includes('stop gesture') ||
        lower.includes('turn off hand tracking') ||
        lower.includes('stop hand tracking') ||
        lower.includes('disable camera control')
      ) {
        spatialController.emergencyStop();
        const resp = 'Spatial gesture engine disengaged, Sir.';
        speak(resp);
        setLogs((prev) => [
          ...prev,
          {
            id: `spatial-off-${Date.now()}`,
            timestamp: timeStr,
            type: 'command',
            text: 'SPATIAL SCREEN INTERACTION ENGINE OFFLINE // WEBCAM RELEASED',
            details: {
              action: 'deactivate_spatial_gestures',
              target: 'Optical Receptors',
              output: 'Camera stream terminated. All spatial tracking subroutines halted.',
              flowPath: ['user', 'stt', 'orchestrator', 'desktop_hud'],
            },
          },
        ]);
        setJarvisState('idle');
        return;
      }

      if (lower.includes('screen') || lower.includes('vision') || lower.includes('look at')) {
        setActiveTab('vision');
      } else if (lower.includes('diagram') || lower.includes('architecture') || lower.includes('flow')) {
        setActiveTab('flow');
      } else if (lower.includes('plan') || lower.includes('decompose')) {
        setActiveTab('planner');
      } else if (lower.includes('workspace') || (lower.includes('file') && !lower.includes('explorer'))) {
        setActiveTab('files');
      } else if (lower.includes('phone') || lower.includes('remote')) {
        setIsPhoneRemoteOpen(true);
      }

      let matchedSkill: SkillPlugin | null = null;
      for (const sk of skills) {
        if (!sk.isEnabled) continue;
        if (sk.triggers.some((trig) => lower.includes(trig.toLowerCase()))) {
          matchedSkill = sk;
          break;
        }
      }

      try {
        const response = await fetch('/api/jarvis/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversationHistory: logs.slice(-10).map((l) => ({ role: l.type, content: l.text })),
            memories,
            assistantName: voiceConfig.assistantName,
            systemState,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Uplink unavailable`);
        }

        const data = await response.json();
        const replyText = data.reply || `Right away, Sir. Execution protocol engaged.`;
        const actions = data.actions || [];

        // Log assistant reply
        setLogs((prev) => [
          ...prev,
          {
            id: `jarvis-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'assistant',
            text: replyText,
          },
        ]);

        // Speak reply
        speak(replyText);

        // Execute any returned actions
        for (const act of actions) {
          executeSystemAction(act.name, act.args);
        }

        // If a custom skill matched, log its execution
        if (matchedSkill && actions.length === 0) {
          setLogs((prev) => [
            ...prev,
            {
              id: `skill-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'command',
              text: `SKILL ACTIVATED: [${matchedSkill.name}] via ${matchedSkill.filename}`,
            },
          ]);
        }
      } catch (err) {
        console.warn('Network / API unavailable. Operating in Autonomous Offline Mode:', err);
        let offlineReply = '';

        // Handle battery inquiries offline using real Battery Status API telemetry
        if (lower.includes('battery') || lower.includes('power') || lower.includes('charge') || lower.includes('percentage') || lower.includes('level')) {
          offlineReply = `Sir, internal device telemetry reports the battery is currently at ${batteryState.level}% and ${
            batteryState.isCharging ? 'actively charging on AC power' : 'discharging on battery reserve'
          }.`;
          executeSystemAction('control_hardware', { action: 'check_battery', value: batteryState.level });
        } else if (lower.includes('volume')) {
          const matchNum = lower.match(/\d+/);
          const targetVol = matchNum ? parseInt(matchNum[0], 10) : 70;
          executeSystemAction('control_hardware', { action: 'set_volume', value: targetVol });
          offlineReply = `Master volume calibrated to ${targetVol}%, Sir.`;
        } else if (lower.includes('brightness')) {
          const matchNum = lower.match(/\d+/);
          const targetBri = matchNum ? parseInt(matchNum[0], 10) : 80;
          executeSystemAction('control_hardware', { action: 'set_brightness', value: targetBri });
          offlineReply = `Display luminance calibrated to ${targetBri}%, Sir.`;
        } else if (matchedSkill) {
          offlineReply = `Skill protocol [${matchedSkill.name}] engaged locally, Sir.`;
        } else {
          offlineReply = `I am operating in offline autonomous mode, Sir. I have restored our conversation context (${logs.length} logged turns retrieved from IndexedDB cache). Local hardware actuators, volume, brightness, battery diagnostics, and file workspaces remain fully operational.`;
        }

        setLogs((prev) => [
          ...prev,
          {
            id: `jarvis-offline-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'assistant',
            text: offlineReply,
            details: {
              action: 'offline_autonomous_eval',
              output: 'Response generated via local offline engine with IndexedDB context cache',
              flowPath: ['user', 'orchestrator', 'tts'],
            },
          },
        ]);
        speak(offlineReply);
      }
    },
    [logs, memories, voiceConfig.assistantName, voiceConfig.soundEffects, systemState, skills, speak, executeSystemAction],
  );

  // Setup Web Speech API for voice listening & wake word
  const startListening = useCallback(async () => {
    try {
      // Get microphone media stream for audio waveform
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
      }
    } catch (e) {
      console.warn('Microphone stream access not granted:', e);
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Web Speech Recognition API is not supported in this browser. You can type commands in the console.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setJarvisState('listening');
        if (voiceConfig.soundEffects) {
          playJarvisChime('wake');
        }
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.trim();
        if (!transcript) return;

        console.log('[Speech Recognized]:', transcript);

        const wake = voiceConfig.wakePhrase.toLowerCase();
        const lowerTranscript = transcript.toLowerCase();

        // If continuous listening is on and wake phrase is set:
        if (voiceConfig.continuousListening) {
          if (lowerTranscript.includes(wake)) {
            const command = transcript.slice(lowerTranscript.indexOf(wake) + wake.length).trim();
            if (command) {
              handleUserMessage(command);
            } else {
              speak(`At your service, Sir.`);
            }
          } else if (voiceConfig.pushToTalk) {
            handleUserMessage(transcript);
          } else {
            // Direct processing if wake word not strictly required or matches
            handleUserMessage(transcript);
          }
        } else {
          // Direct speech
          handleUserMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('[Speech Error]:', event.error);
        }
      };

      recognition.onend = () => {
        // If continuous listening is enabled and user hasn't explicitly stopped, restart
        if (isListening && voiceConfig.continuousListening) {
          try {
            recognition.start();
          } catch {
            // ignore restart collision
          }
        } else {
          setIsListening(false);
          setJarvisState('idle');
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Recognition start error:', err);
    }
  }, [voiceConfig, isListening, handleUserMessage, speak]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setJarvisState('idle');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
    }
  }, [audioStream]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Push to talk keyboard shortcut (Hold Spacebar)
  useEffect(() => {
    if (!voiceConfig.pushToTalk) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (!isListening) {
          startListening();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (isListening) {
          stopListening();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [voiceConfig.pushToTalk, isListening, startListening, stopListening]);

  const recordUndoAction = (
    title: string,
    category: 'system' | 'file' | 'memory' | 'browser' | 'config',
    previousSummary: string,
    currentSummary: string,
  ) => {
    const newRecord: UndoRecord = {
      id: `undo-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title,
      category,
      previousStateSummary: previousSummary,
      currentStateSummary: currentSummary,
      canRevert: true,
      reverted: false,
    };
    setUndoRecords((prev) => [newRecord, ...prev]);
  };

  const handleRevertAction = (recordId: string) => {
    const target = undoRecords.find((r) => r.id === recordId);
    if (!target || target.reverted) return;

    if (voiceConfig.hapticFeedback) vibrate([40, 60, 40]);

    if (target.title.includes('Volume')) {
      const match = target.previousStateSummary.match(/\d+/);
      const prevVol = match ? parseInt(match[0], 10) : 50;
      setSystemState((prev) => ({ ...prev, volume: prevVol, isMuted: false }));
      speak(`Reverting master volume back to ${prevVol} percent, Sir.`);
    } else if (target.title.includes('Brightness')) {
      const match = target.previousStateSummary.match(/\d+/);
      const prevBrt = match ? parseInt(match[0], 10) : 75;
      setSystemState((prev) => ({ ...prev, brightness: prevBrt }));
      speak(`Reverting display brightness back to ${prevBrt} percent, Sir.`);
    } else if (target.title.includes('Mute')) {
      setSystemState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
      speak('Reverting audio mute state, Sir.');
    } else if (target.title.includes('Power Profile')) {
      const isPerf = target.previousStateSummary.includes('performance') || target.previousStateSummary.includes('High Performance');
      const isSave = target.previousStateSummary.includes('saver') || target.previousStateSummary.includes('Power Saver');
      const prevMode: PowerMode = isPerf ? 'performance' : isSave ? 'saver' : 'balanced';
      setSystemState((prev) => ({ ...prev, powerMode: prevMode }));
      speak(`Reverting operating system power profile back to ${prevMode}, Sir.`);
    } else if (target.category === 'file') {
      speak(`Reverting filesystem change for ${target.title}, Sir.`);
    } else {
      speak(`Reverted transaction: ${target.title}, Sir.`);
    }

    setUndoRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, reverted: true } : r)),
    );

    setLogs((prev) => [
      ...prev,
      {
        id: `undo-log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'command',
        text: `TRANSACTION REVERTED [undo.py]: ${target.title} -> Restored ${target.previousStateSummary}`,
        details: { action: 'undo_rollback', output: 'State restored successfully' },
      },
    ]);
  };

  const handleClearUndoHistory = () => {
    setUndoRecords([]);
  };

  // Filesystem handlers [file_controller.py]
  const handleSaveFile = (file: WorkspaceFile) => {
    setWorkspaceFiles((prev) => prev.map((f) => (f.id === file.id ? file : f)));
    recordUndoAction(`Modified file ${file.name}`, 'file', 'Previous buffer', 'Updated content');
    speak(`Saved changes to ${file.name}, Sir.`);
  };

  const handleCreateFile = (name: string, content: string) => {
    const ext = name.split('.').pop() || 'txt';
    const type: 'code' | 'text' | 'json' | 'markdown' =
      ext === 'py' || ext === 'ts' || ext === 'js'
        ? 'code'
        : ext === 'json'
        ? 'json'
        : ext === 'md'
        ? 'markdown'
        : 'text';

    const newF: WorkspaceFile = {
      id: `file-${Date.now()}`,
      name,
      path: `~/JarvisWorkspace/${name}`,
      content,
      size: new Blob([content]).size,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
    };

    setWorkspaceFiles((prev) => [newF, ...prev]);
    recordUndoAction(`Created file ${name}`, 'file', 'None (New file)', `Created ${name}`);
    speak(`Created new workspace file: ${name}, Sir.`);
  };

  const handleDeleteFile = (fileId: string) => {
    const target = workspaceFiles.find((f) => f.id === fileId);
    if (!target) return;
    setWorkspaceFiles((prev) => prev.filter((f) => f.id !== fileId));
    recordUndoAction(`Deleted file ${target.name}`, 'file', target.name, 'Deleted');
    speak(`Removed ${target.name} from workspace, Sir.`);
  };

  // Remote Phone Bridge handler [Phone User -> server.py -> main.py]
  const handleQueueRemoteCommand = (cmd: string, deviceName = 'Phone User') => {
    setLogs((prev) => [
      ...prev,
      {
        id: `phone-relay-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'user',
        text: `[REMOTE DISPATCH: ${deviceName}] ${cmd}`,
      },
    ]);
    handleUserMessage(cmd);
  };

  // Handler helpers
  const handleUpdateVolume = (val: number) => {
    const prevVol = systemState.volume;
    executeSystemAction('control_hardware', { action: 'set_volume', value: val });
    recordUndoAction('Master Volume Adjustment', 'system', `Volume ${prevVol}%`, `Volume ${val}%`);
  };

  const handleToggleMute = () => {
    const wasMuted = systemState.isMuted;
    executeSystemAction('control_hardware', { action: wasMuted ? 'unmute' : 'mute' });
    recordUndoAction(
      'Audio Mute State Toggle',
      'system',
      wasMuted ? 'Muted' : 'Unmuted',
      wasMuted ? 'Unmuted' : 'Muted',
    );
  };

  const handleUpdateBrightness = (val: number) => {
    const prevBrt = systemState.brightness;
    executeSystemAction('control_hardware', { action: 'set_brightness', value: val });
    recordUndoAction('Display Brightness Tuned', 'system', `Brightness ${prevBrt}%`, `Brightness ${val}%`);
  };

  const handleLaunchApp = (appName: string) => {
    if (voiceConfig.hapticFeedback) vibrate(30);
    const lower = appName.toLowerCase();

    // Android Intent and Deep link handling
    if (systemState.os === 'android') {
      if (lower.includes('whatsapp')) {
        window.open('whatsapp://send?text=Hello', '_blank');
      } else if (lower.includes('map')) {
        window.open('https://maps.google.com', '_blank');
      } else if (lower.includes('phone') || lower.includes('dialer')) {
        window.location.href = 'tel:';
      } else if (lower.includes('youtube')) {
        window.open('https://youtube.com', '_blank');
      } else if (lower.includes('spotify')) {
        window.open('spotify:', '_blank');
      } else if (lower.includes('chrome')) {
        window.open('https://google.com', '_blank');
      }
    }

    executeSystemAction('manage_apps_windows', { action: 'open_app', target: appName });
    speak(`Launching ${appName}, Sir.`);
  };

  const handleManageWindows = (action: string) => {
    if (voiceConfig.hapticFeedback) vibrate(25);
    executeSystemAction('manage_apps_windows', { action });
  };

  const handleChangeOS = (os: 'windows' | 'macos' | 'linux' | 'android') => {
    setSystemState((prev) => ({ ...prev, os }));
    if (voiceConfig.hapticFeedback) vibrate(35);
    speak(
      `Operating system profile switched to ${
        os === 'android' ? 'Android Device' : os === 'macos' ? 'macOS' : os.toUpperCase()
      }, Sir.`,
    );
  };

  const handleToggleTorch = () => {
    const nextState = !systemState.androidTorch;
    setSystemState((prev) => ({ ...prev, androidTorch: nextState }));
    if (voiceConfig.hapticFeedback) vibrate(45);
    speak(`Android camera torch ${nextState ? 'illuminated' : 'deactivated'}, Sir.`);
    setLogs((prev) => [
      ...prev,
      {
        id: `torch-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'command',
        text: `ANDROID CAMERA TORCH: ${nextState ? 'ON' : 'OFF'}`,
        details: { action: 'android_hardware', output: `Torch ${nextState ? 'Engaged' : 'Disengaged'}` },
      },
    ]);
  };

  const handleTriggerVibration = () => {
    vibrate([70, 90, 70]);
    speak('Haptic impulse dispatched to Android chassis.');
  };

  const handleToggleWakeLock = async () => {
    await toggleScreenWakeLock();
    if (voiceConfig.hapticFeedback) vibrate(35);
    speak(wakeLockActive ? 'Screen wake lock released.' : 'Screen wake lock active, Sir.');
  };

  const handleUpdatePowerMode = useCallback(
    (mode: PowerMode) => {
      let nextCpuUsage = systemState.cpuUsage;
      let nextCpuTemp = systemState.cpuTemp ?? 44;
      let nextGpuTemp = systemState.gpuTemp ?? 48;
      let nextFanSpeed = systemState.fanSpeed ?? 1680;

      let profileTitle = 'Balanced';
      let osCommand = '';
      let thermalSummary = '';

      if (mode === 'performance') {
        profileTitle = 'High Performance';
        nextCpuUsage = 36;
        nextCpuTemp = +(52.5 + Math.random() * 2).toFixed(1);
        nextGpuTemp = +(54.8 + Math.random() * 2).toFixed(1);
        nextFanSpeed = 2850;
        thermalSummary = 'Unconstrained TDP. Turbo boost engaged. High-velocity cooling fan array ramped to ~2850 RPM.';
      } else if (mode === 'saver') {
        profileTitle = 'Power Saver';
        nextCpuUsage = 11;
        nextCpuTemp = +(38.2 + Math.random() * 1.5).toFixed(1);
        nextGpuTemp = +(40.6 + Math.random() * 1.5).toFixed(1);
        nextFanSpeed = 1120;
        thermalSummary = 'TDP constrained to 35W. Aggressive C-states engaged. Acoustic fan profile throttled to ~1120 RPM.';
      } else {
        profileTitle = 'Balanced';
        nextCpuUsage = 19;
        nextCpuTemp = +(44.0 + Math.random() * 1.5).toFixed(1);
        nextGpuTemp = +(48.2 + Math.random() * 1.5).toFixed(1);
        nextFanSpeed = 1680;
        thermalSummary = 'Dynamic OS scheduler engaged. Nominal 65W TDP acoustic envelope active.';
      }

      switch (systemState.os) {
        case 'windows':
          osCommand =
            mode === 'performance'
              ? 'powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'
              : mode === 'saver'
              ? 'powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a'
              : 'powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e';
          break;
        case 'linux':
          osCommand =
            mode === 'performance'
              ? 'powerprofilesctl set performance && cpupower frequency-set -g performance'
              : mode === 'saver'
              ? 'powerprofilesctl set power-saver && cpupower frequency-set -g powersave'
              : 'powerprofilesctl set balanced && cpupower frequency-set -g schedutil';
          break;
        case 'macos':
          osCommand =
            mode === 'performance'
              ? 'sudo pmset -a highpowermode 1 && sudo pmset -a gpuswitch 2'
              : mode === 'saver'
              ? 'sudo pmset -a lowpowermode 1 && sudo pmset -a displaysleep 5'
              : 'sudo pmset -a lowpowermode 0 && sudo pmset -a gpuswitch 1';
          break;
        case 'android':
          osCommand =
            mode === 'performance'
              ? 'cmd power set-fixed-performance-mode-enabled true'
              : mode === 'saver'
              ? 'settings put global low_power 1 && cmd power set-mode 1'
              : 'cmd power set-adaptive-power-saver-enabled true';
          break;
      }

      const prevMode = systemState.powerMode || 'balanced';
      setSystemState((prev) => ({
        ...prev,
        powerMode: mode,
        cpuUsage: nextCpuUsage,
        cpuTemp: nextCpuTemp,
        gpuTemp: nextGpuTemp,
        fanSpeed: nextFanSpeed,
      }));

      if (voiceConfig.soundEffects) {
        playJarvisChime('execute');
      }

      setLogs((prev) => [
        ...prev,
        {
          id: `power-mode-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'command',
          text: `OS POWER PROFILE ENGAGED: [${profileTitle.toUpperCase()}]`,
          details: {
            action: 'configure_power_plan',
            target: `${systemState.os.toUpperCase()} ACPI Power Subsystem`,
            output: `Command dispatched: ${osCommand}\n${thermalSummary}`,
            flowPath: ['orchestrator', 'system_actions', 'desktop_hud'],
          },
        },
      ]);

      recordUndoAction(
        `Power Profile: ${profileTitle}`,
        'system',
        `Power Mode ${prevMode}`,
        `Power Mode ${mode}`,
      );

      speak(`Switching operating system power profile to ${profileTitle}, Sir.`);
    },
    [systemState.os, systemState.powerMode, systemState.cpuUsage, systemState.cpuTemp, systemState.gpuTemp, systemState.fanSpeed, voiceConfig.soundEffects, speak],
  );

  useEffect(() => {
    handleUpdatePowerModeRef.current = handleUpdatePowerMode;
  }, [handleUpdatePowerMode]);

  const handleAddMemory = (mem: Omit<MemoryItem, 'id' | 'timestamp'>) => {
    const newItem: MemoryItem = {
      ...mem,
      id: `mem-${Date.now()}`,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setMemories((prev) => [newItem, ...prev]);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearAllMemories = () => {
    if (window.confirm('Purge all stored memories from the neural matrix?')) {
      setMemories([]);
    }
  };

  const handleToggleSkill = (id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEnabled: !s.isEnabled } : s)),
    );
  };

  const handleUpdateSkillCode = (id: string, code: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pythonCode: code } : s)),
    );
    speak('Skill Python code updated and hot-reloaded into core.');
  };

  const handleAddSkill = (skill: SkillPlugin) => {
    setSkills((prev) => [...prev, skill]);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } });
    speak(`New skill ${skill.name} successfully registered.`);
  };

  const currentTheme = THEMES[theme];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col bg-grid-pattern relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Holographic Spatial Cursor */}
      <SpatialCursor telemetry={spatialTelemetry} themeColor={currentTheme.primary} />

      {/* Spatial Screen Interaction Status HUD & Skeletal Monitor */}
      <SpatialGestureHUD
        telemetry={spatialTelemetry}
        onToggleEnabled={(enabled) => spatialController.updateSettings({ enabled })}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Background Radial Glow */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-700 opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${currentTheme.primary} 0%, transparent 70%)`,
        }}
      />

      {/* Top Holographic Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        {/* Brand & Designation */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-extrabold text-sm border shadow-lg cursor-pointer"
            style={{
              borderColor: currentTheme.primary,
              backgroundColor: `${currentTheme.primary}20`,
              color: currentTheme.accent,
            }}
            onClick={() => setActiveTab('hud')}
          >
            <Shield className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-sm tracking-wider text-slate-100 flex items-center gap-1.5">
                <span>{voiceConfig.assistantName}</span>
                <span className="text-[10px] font-mono text-cyan-400 font-normal">MK 85</span>
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                PYTHON COMPANION
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Activity className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                SYSTEMS OPERATIONAL
              </span>
              <span>·</span>
              <span className="uppercase text-cyan-300">{systemState.os}</span>
            </div>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto max-w-2xl">
          <button
            onClick={() => setActiveTab('hud')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'hud'
                ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>HUD CORE</span>
          </button>

          <button
            onClick={() => setActiveTab('flow')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'flow'
                ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>FLOW DIAGRAM</span>
          </button>

          <button
            onClick={() => setActiveTab('planner')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'planner'
                ? 'bg-slate-800 text-amber-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>PLANNER</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'files'
                ? 'bg-slate-800 text-emerald-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-emerald-400" />
            <span>FILES ({workspaceFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vision')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'vision'
                ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>VISION</span>
          </button>

          <button
            onClick={() => setActiveTab('undo')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'undo'
                ? 'bg-slate-800 text-rose-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5 text-rose-400" />
            <span>UNDO ({undoRecords.filter((r) => r.canRevert && !r.reverted).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'system'
                ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>OS</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'memory'
                ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>MEM</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'skills'
                ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Puzzle className="w-3.5 h-3.5" />
            <span>SKILLS</span>
          </button>
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Push to talk state badge */}
          <button
            onClick={toggleListening}
            className={`px-2.5 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white font-bold ring-2 ring-rose-500/40'
                : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800'
            }`}
            title="Toggle Microphone Listening"
          >
            {isListening ? (
              <>
                <Mic className="w-3.5 h-3.5 animate-pulse" />
                <span>LISTENING</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-slate-500" />
                <span>MIC STANDBY</span>
              </>
            )}
          </button>

          {/* Phone Remote Bridge button */}
          <button
            onClick={() => setIsPhoneRemoteOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-mono text-xs flex items-center gap-1.5 transition-colors font-bold cursor-pointer"
            title="Open Phone User Remote Bridge"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">PHONE REMOTE</span>
          </button>

          {/* Android PWA Install button */}
          {!isInstalled && (
            <button
              onClick={install}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-1.5 transition-colors font-bold cursor-pointer"
              title="Install J.A.R.V.I.S. on Android / Desktop"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">INSTALL APP</span>
            </button>
          )}

          {/* Export Python App button */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-colors font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GET PYTHON APP</span>
          </button>

          {/* Settings button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Open Jarvis Configuration"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex items-center gap-1 bg-slate-950 border-b border-slate-800 px-2 py-1.5 text-[11px] font-mono overflow-x-auto">
        {[
          { id: 'hud', label: 'HUD' },
          { id: 'flow', label: 'DIAGRAM' },
          { id: 'planner', label: 'PLANNER' },
          { id: 'files', label: 'FILES' },
          { id: 'vision', label: 'VISION' },
          { id: 'undo', label: 'UNDO' },
          { id: 'system', label: 'OS' },
          { id: 'memory', label: 'MEMORIES' },
          { id: 'skills', label: 'SKILLS' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`py-1 px-2.5 rounded shrink-0 whitespace-nowrap transition-colors ${
              activeTab === t.id ? 'text-cyan-400 font-bold bg-slate-900 border border-cyan-500/30' : 'text-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Workspace Frame */}
      <main className="flex-1 p-3 sm:p-5 max-w-7xl mx-auto w-full flex flex-col">
        {/* Android PWA Install Banner */}
        <PWAInstallBanner />

        {activeTab === 'hud' && (
          <div className="flex flex-col gap-5 flex-1 relative">
            {/* Transparent Technical Data Grid & Simulated Scanning Overlay */}
            <TechnicalDataGridOverlay
              cpuTemp={systemState.cpuTemp ?? 44}
              gpuTemp={systemState.gpuTemp ?? 48}
              cpuUsage={systemState.cpuUsage ?? 20}
              gpuUsage={systemState.gpuUsage ?? 22}
              theme={theme}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch z-0">
              {/* Left Holographic HUD & Reactor Visualizer */}
              <div className="lg:col-span-5 flex flex-col justify-between items-center p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-2xl relative overflow-hidden">
                {/* Top telemetry tags */}
                <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    ARC REACTOR HUD
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
                    HOLD SPACE TO TALK
                  </span>
                </div>

                {/* Animated Arc Reactor Core Avatar */}
                <div className="my-auto py-2">
                  <ArcReactorAvatar
                    state={jarvisState}
                    theme={theme}
                    audioLevel={audioLevel}
                    onClick={toggleListening}
                    assistantName={voiceConfig.assistantName}
                    isSpatialTrackingActive={
                      spatialTelemetry.cameraStatus === 'ACTIVE' && spatialTelemetry.state !== 'INACTIVE'
                    }
                    isSpatialPinching={
                      spatialTelemetry.currentGesture === 'pinch' || spatialTelemetry.state === 'SELECTING'
                    }
                  />
                </div>

                {/* Real-time live audio waveform visualizer */}
                <div className="w-full mt-4">
                  <WaveformVisualizer
                    theme={theme}
                    state={jarvisState}
                    audioStream={audioStream}
                    audioLevel={audioLevel}
                  />
                </div>
              </div>

              {/* Right Dialogue & Telemetry Console */}
              <div className="lg:col-span-7 flex flex-col min-h-[460px]">
                <CommandConsole
                  logs={logs}
                  state={jarvisState}
                  theme={theme}
                  voiceConfig={voiceConfig}
                  onSendMessage={handleUserMessage}
                  onToggleListening={toggleListening}
                  isListening={isListening}
                  onClearLogs={handleClearLogs}
                  onNavigateToDiagramNode={(node) => {
                    setDiagramSelectedNode(node);
                    setActiveTab('flow');
                  }}
                  isOffline={isOffline}
                />
              </div>
            </div>

            {/* Recharts Historical Trend Line Chart for CPU & GPU Temperatures */}
            <ThermalHistoryChart
              currentCpuTemp={systemState.cpuTemp ?? 44}
              currentGpuTemp={systemState.gpuTemp ?? 48}
              theme={theme}
              onCriticalThermalAlert={handleCriticalThermalAlert}
            />
          </div>
        )}

        {activeTab === 'system' && (
          <div className="flex-1 min-h-[500px]">
            <SystemControlPanel
              systemState={systemState}
              theme={theme}
              onUpdateVolume={handleUpdateVolume}
              onToggleMute={handleToggleMute}
              onUpdateBrightness={handleUpdateBrightness}
              onLaunchApp={handleLaunchApp}
              onManageWindows={handleManageWindows}
              onChangeOS={handleChangeOS}
              onToggleTorch={handleToggleTorch}
              onTriggerVibration={handleTriggerVibration}
              onToggleWakeLock={handleToggleWakeLock}
              wakeLockActive={wakeLockActive}
              onUpdateThermals={(cTemp, gTemp) => {
                setSystemState((prev) => {
                  if (prev.cpuTemp !== cTemp || prev.gpuTemp !== gTemp) {
                    return { ...prev, cpuTemp: cTemp, gpuTemp: gTemp };
                  }
                  return prev;
                });
              }}
              onSimulateBatteryLevel={(level, isCharging) => {
                setSystemState((prev) => ({ ...prev, battery: level, isCharging }));
              }}
              onUpdatePowerMode={handleUpdatePowerMode}
            />
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="flex-1 min-h-[500px]">
            <MemoryDashboard
              memories={memories}
              theme={theme}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
              onClearAllMemories={handleClearAllMemories}
            />
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="flex-1 min-h-[500px]">
            <SkillPluginManager
              skills={skills}
              theme={theme}
              onToggleSkill={handleToggleSkill}
              onUpdateSkillCode={handleUpdateSkillCode}
              onAddSkill={handleAddSkill}
              onTestTrigger={handleUserMessage}
            />
          </div>
        )}

        {/* 5 Architecture Clusters from Diagram */}
        {activeTab === 'flow' && (
          <div className="flex-1 min-h-[500px]">
            <ArchitectureFlowDiagram
              theme={theme}
              jarvisState={jarvisState}
              activeNode={diagramSelectedNode}
              onSelectNode={(node) => setDiagramSelectedNode(node)}
              undoCount={undoRecords.length}
              memoryCount={memories.length}
              fileCount={workspaceFiles.length}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenPhoneRemote={() => setIsPhoneRemoteOpen(true)}
              onExecuteCommand={handleUserMessage}
              onSpeak={speak}
              systemState={systemState}
            />
          </div>
        )}

        {activeTab === 'planner' && (
          <div className="flex-1 min-h-[500px]">
            <PlanningLLMPanel
              theme={theme}
              activePlan={activeTaskPlan}
              onExecuteDirective={handleUserMessage}
            />
          </div>
        )}

        {activeTab === 'files' && (
          <div className="flex-1 min-h-[500px]">
            <FileActionsManager
              theme={theme}
              files={workspaceFiles}
              onSaveFile={handleSaveFile}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              onReadAloud={(txt) => speak(txt)}
            />
          </div>
        )}

        {activeTab === 'vision' && (
          <div className="flex-1 min-h-[500px]">
            <ScreenVisionPanel
              theme={theme}
              onExecuteAction={handleUserMessage}
              onVoiceAnnounce={(txt) => speak(txt)}
            />
          </div>
        )}

        {activeTab === 'undo' && (
          <div className="flex-1 min-h-[500px]">
            <UndoHistoryPanel
              theme={theme}
              undoRecords={undoRecords}
              onRevertAction={handleRevertAction}
              onClearHistory={handleClearUndoHistory}
            />
          </div>
        )}
      </main>

      {/* Footer System Status Bar */}
      <footer className="border-t border-slate-900 bg-slate-950/90 px-4 py-2 text-[10px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <span>J.A.R.V.I.S. DESKTOP ASSISTANT</span>
          <span>·</span>
          <span>PLATFORM: {systemState.os.toUpperCase()}</span>
          <span>·</span>
          <span>VOL: {systemState.isMuted ? 'MUTED' : `${systemState.volume}%`}</span>
          <span>·</span>
          <span>BRIGHTNESS: {systemState.brightness}%</span>
          <span>·</span>
          <span className="text-slate-400">
            CPU: <strong className={systemState.cpuTemp && systemState.cpuTemp > 75 ? 'text-rose-400' : 'text-cyan-300'}>{systemState.cpuTemp ?? 44}°C</strong>
          </span>
          <span>·</span>
          <span className="text-slate-400">
            GPU: <strong className={systemState.gpuTemp && systemState.gpuTemp > 75 ? 'text-rose-400' : 'text-emerald-300'}>{systemState.gpuTemp ?? 48}°C</strong>
          </span>
          <span>·</span>
          {/* Battery Status API Real-Time Indicator */}
          <FooterBatteryIndicator battery={batteryState} />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Neural Sync Real-Time Gemini Connection Latency Indicator */}
          <NeuralSyncIndicator />
          <span>·</span>
          {/* IndexedDB Context Cache Telemetry */}
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 cursor-help"
            title="LLM Chat History cached locally in browser IndexedDB database"
          >
            <Database className="w-3 h-3 text-emerald-400" />
            <span>IDB: {logs.length} CACHED</span>
          </span>
          <span>·</span>
          {/* Offline / Online Network Indicator */}
          <span
            className={`flex items-center gap-1 ${
              isOffline ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-400'
            }`}
            title={isOffline ? 'Offline mode active: Autonomous rules & cached context' : 'Network uplink active'}
          >
            {isOffline ? <WifiOff className="w-3 h-3 text-amber-400" /> : <Wifi className="w-3 h-3 text-emerald-400" />}
            <span>{isOffline ? 'OFFLINE' : 'ONLINE'}</span>
          </span>
          <span>·</span>
          <span>MEMORIES: {memories.length}</span>
          <span>·</span>
          <span>SKILLS: {skills.filter((s) => s.isEnabled).length} ACTIVE</span>
          <span>·</span>
          <span className="text-cyan-400">READY FOR VOICE COMMAND</span>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        voiceConfig={voiceConfig}
        onUpdateVoiceConfig={(cfg) => setVoiceConfig((prev) => ({ ...prev, ...cfg }))}
        theme={theme}
        onChangeTheme={(t) => setTheme(t)}
        onTestVoice={(txt) =>
          speak(
            txt ||
              `Greetings, Sir. All systems for ${voiceConfig.assistantName} are operating at peak efficiency.`,
          )
        }
      />

      {/* Phone Remote Bridge Modal */}
      <PhoneRemoteModal
        isOpen={isPhoneRemoteOpen}
        onClose={() => setIsPhoneRemoteOpen(false)}
        theme={theme}
        systemState={systemState}
        jarvisState={jarvisState}
        onQueueRemoteCommand={(cmd) => handleUserMessage(cmd)}
      />

      {/* Python Standalone Exporter Modal */}
      <PythonExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
}
