import React, { useState, useEffect } from 'react';
import { HUDTheme, VoiceConfig, SpatialSettings } from '../types';
import { THEMES } from '../utils/theme';
import { VoiceCommandDiscovery } from './VoiceCommandDiscovery';
import { spatialController } from '../spatial/SpatialInteractionController';
import {
  Settings,
  X,
  Mic,
  Volume2,
  VolumeX,
  Palette,
  Bot,
  Radio,
  Sliders,
  Play,
  Square,
  Check,
  Gauge,
  Sparkles,
  RotateCcw,
  AudioLines,
  Compass,
  Hand,
  Camera,
  ShieldAlert,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceConfig: VoiceConfig;
  onUpdateVoiceConfig: (config: Partial<VoiceConfig>) => void;
  theme: HUDTheme;
  onChangeTheme: (theme: HUDTheme) => void;
  onTestVoice: (text?: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  voiceConfig,
  onUpdateVoiceConfig,
  theme,
  onChangeTheme,
  onTestVoice,
}) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedSamplePhraseIndex, setSelectedSamplePhraseIndex] = useState(0);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'config' | 'spatial' | 'discovery'>('config');
  const [spatialSettings, setSpatialSettings] = useState<SpatialSettings>(() => spatialController.getSettings());
  const [cameraDevices, setCameraDevices] = useState<{ deviceId: string; label: string }[]>([]);
  const currentTheme = THEMES[theme];

  // Refresh available camera devices
  useEffect(() => {
    spatialController.getAvailableCameras().then(setCameraDevices);
    setSpatialSettings(spatialController.getSettings());
  }, [isOpen]);

  const handleUpdateSpatialSettings = (partial: Partial<SpatialSettings>) => {
    setSpatialSettings((prev) => {
      const updated = { ...prev, ...partial };
      spatialController.updateSettings(updated);
      return updated;
    });
  };

  const samplePhrases = [
    `Greetings, Sir. This audio sample demonstrates pitch at ${voiceConfig.pitch.toFixed(2)}x and cadence rate at ${voiceConfig.speechRate.toFixed(2)}x. All Mark 85 subroutines are online.`,
    `Good day, Sir. All Stark defenses, flight stabilizers, and neural processors are operating at peak efficiency.`,
    `Acoustic calibration complete. Standing by for voice directive or automation instructions.`,
  ];

  const handlePlayTestAudio = (customText?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onTestVoice(customText || samplePhrases[selectedSamplePhraseIndex]);
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = customText || samplePhrases[selectedSamplePhraseIndex];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = voiceConfig.speechRate;
    utterance.pitch = voiceConfig.pitch;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.name === voiceConfig.voiceName);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100">
                JARVIS COMPANION CONFIGURATION
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Persona, audio receptors, vocal pitch, HUD optics, and voice discovery
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs: Core Configuration vs Voice Command Discovery */}
        <div className="px-5 pt-2 pb-0 bg-slate-950 border-b border-slate-800 flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSettingsTab('config')}
            className={`px-3 py-2 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSettingsTab === 'config'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>CORE CONFIGURATION</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('spatial')}
            className={`px-3 py-2 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSettingsTab === 'spatial'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hand className="w-3.5 h-3.5 text-cyan-400" />
            <span>SPATIAL GESTURES</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${
                spatialSettings.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {spatialSettings.enabled ? 'ACTIVE' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('discovery')}
            className={`px-3 py-2 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSettingsTab === 'discovery'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>VOICE COMMAND DISCOVERY</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              15 TRIGGERS
            </span>
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 overflow-y-auto max-h-[75vh] text-xs font-mono">
          {activeSettingsTab === 'discovery' ? (
            <VoiceCommandDiscovery onAuditionPhrase={handlePlayTestAudio} />
          ) : activeSettingsTab === 'spatial' ? (
            <div className="space-y-4">
              {/* Master Gesture Engine Toggle Card */}
              <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg border transition-colors ${
                        spatialSettings.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 text-sm">
                        CAMERA HAND GESTURE CONTROL (V1)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Control AETHER-I desktop interface using real-time local webcam tracking
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateSpatialSettings({ enabled: !spatialSettings.enabled })
                    }
                    className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer shadow-md ${
                      spatialSettings.enabled
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {spatialSettings.enabled ? 'GESTURES ACTIVE [ON]' : 'GESTURES DISABLED [OFF]'}
                  </button>
                </div>

                {/* Privacy Badge */}
                <div className="flex items-center gap-2 p-2 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>
                    <strong className="text-slate-200">PRIVACY SHIELD:</strong> Video frames are analyzed in local volatile memory at 60 FPS. No camera footage or telemetry is ever stored, recorded, or transmitted to any external server.
                  </span>
                </div>
              </div>

              {/* Hardware Camera Selector & Mirroring */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-cyan-400 font-bold">
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    VIDEO RECEPTOR &amp; PROJECTION
                  </span>
                  <button
                    type="button"
                    onClick={() => spatialController.getAvailableCameras().then(setCameraDevices)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-300 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    SCAN DEVICES
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">OPTICAL SENSOR (WEBCAM)</label>
                    <select
                      value={spatialSettings.selectedCameraId}
                      onChange={(e) =>
                        handleUpdateSpatialSettings({ selectedCameraId: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="">Default Front Optical Sensor</option>
                      {cameraDevices.map((dev) => (
                        <option key={dev.deviceId} value={dev.deviceId}>
                          {dev.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSpatialSettings({ mirrorMode: !spatialSettings.mirrorMode })
                      }
                      className={`w-full py-2 px-3 rounded-lg border text-left font-bold flex items-center justify-between transition-colors ${
                        spatialSettings.mirrorMode
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>MIRROR PROJECTION MODE</span>
                      <span className="text-[10px]">{spatialSettings.mirrorMode ? 'ACTIVE' : 'NATURAL'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tuning: Sensitivity, Smoothing, Confidence */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div className="text-cyan-400 font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  DYNAMIC SPATIAL CALIBRATION
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Sensitivity */}
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Interaction Zone (Reach)</span>
                      <span className="text-cyan-300 font-bold">{spatialSettings.sensitivity.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="2.2"
                      step="0.05"
                      value={spatialSettings.sensitivity}
                      onChange={(e) =>
                        handleUpdateSpatialSettings({ sensitivity: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="text-[9px] text-slate-500">
                      Lower = precise; Higher = effortless full-screen reach
                    </div>
                  </div>

                  {/* Smoothing Filter */}
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">1€ Jitter Filter</span>
                      <span className="text-cyan-300 font-bold">{spatialSettings.smoothingFactor.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="0.9"
                      step="0.05"
                      value={spatialSettings.smoothingFactor}
                      onChange={(e) =>
                        handleUpdateSpatialSettings({ smoothingFactor: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="text-[9px] text-slate-500">
                      Rejects micro-tremors while maintaining low latency
                    </div>
                  </div>

                  {/* Confidence Threshold */}
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Confidence Gate</span>
                      <span className="text-cyan-300 font-bold">{(spatialSettings.confidenceThreshold * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="0.9"
                      step="0.05"
                      value={spatialSettings.confidenceThreshold}
                      onChange={(e) =>
                        handleUpdateSpatialSettings({ confidenceThreshold: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="text-[9px] text-slate-500">
                      Anti-false-positive rejection threshold
                    </div>
                  </div>
                </div>

                {/* Developer Telemetry Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <div className="text-slate-200 font-bold">Developer Telemetry Overlay</div>
                    <div className="text-[10px] text-slate-500">
                      Renders live FPS, pipeline latency, and confidence meters on the desktop HUD
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateSpatialSettings({ debugMode: !spatialSettings.debugMode })
                    }
                    className={`px-3 py-1 rounded text-[10px] font-mono transition-colors ${
                      spatialSettings.debugMode
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {spatialSettings.debugMode ? 'ACTIVE (DEBUG)' : 'INACTIVE'}
                  </button>
                </div>
              </div>

              {/* Spatial Gesture Vocabulary Reference Matrix */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5">
                <div className="text-cyan-400 font-bold flex items-center gap-2">
                  <Hand className="w-4 h-4" />
                  GESTURE VOCABULARY REFERENCE MATRIX (V1)
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-cyan-300 font-bold">1. POINT</div>
                    <div className="text-slate-400">One index finger extended. Moves holographic cursor over UI.</div>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-amber-300 font-bold">2. PINCH</div>
                    <div className="text-slate-400">Thumb + index tips touch. Clicks / selects highlighted element.</div>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-emerald-300 font-bold">3. PINCH + MOVE</div>
                    <div className="text-slate-400">Hold pinch and displace hand. Drags supported cards or AI Core.</div>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-blue-300 font-bold">4. OPEN PALM</div>
                    <div className="text-slate-400">All 5 fingers open. Pauses spatial interaction to prevent accidental clicks.</div>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-rose-300 font-bold">5. FIST</div>
                    <div className="text-slate-400">Closed hand. Cancels active drag or dismisses current modal.</div>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-purple-300 font-bold">6. TWO-HAND SPREAD</div>
                    <div className="text-slate-400">Both hands detected, distance expands. Triggers Zoom In.</div>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-purple-300 font-bold">7. TWO-HAND CONTRACT</div>
                    <div className="text-slate-400">Both hands detected, distance contracts. Triggers Zoom Out.</div>
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-yellow-300 font-bold">8. TWO-HAND ROTATE</div>
                    <div className="text-slate-400">Both hands rotate in relation to each other. Rotates supported elements.</div>
                  </div>
                </div>

                {/* Emergency Stop Button */}
                <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                  <span className="text-[10px] text-slate-500">
                    Emergency Disengage: Press <strong>ESC</strong> on keyboard at any time.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      spatialController.emergencyStop();
                      setSpatialSettings(spatialController.getSettings());
                    }}
                    className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    DISENGAGE GESTURE ENGINE
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 1. Identity & Name */}
          <div className="space-y-3 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Bot className="w-4 h-4" />
              <span>ASSISTANT PERSONA &amp; IDENTITY</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">ASSISTANT DESIGNATION</label>
                <input
                  type="text"
                  value={voiceConfig.assistantName}
                  onChange={(e) => onUpdateVoiceConfig({ assistantName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  placeholder="J.A.R.V.I.S."
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">VOICE WAKE PHRASE</label>
                <input
                  type="text"
                  value={voiceConfig.wakePhrase}
                  onChange={(e) => onUpdateVoiceConfig({ wakePhrase: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  placeholder="Hey Jarvis"
                />
              </div>
            </div>
          </div>

          {/* 2. Theme & Optical Glow */}
          <div className="space-y-3.5 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Palette className="w-4 h-4" />
                <span>HOLOGRAPHIC HUD THEME SYSTEM</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                ACTIVE: {THEMES[theme]?.name || theme}
              </span>
            </div>

            {/* High-Contrast Presets Visual Toggle Banner */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  HIGH-CONTRAST TACTICAL PRESETS
                </span>
                <span className="text-[9px] text-slate-500 font-normal">ENHANCED HUD VISIBILITY</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Deep Space Preset */}
                <button
                  type="button"
                  onClick={() => onChangeTheme('deep-space')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-1.5 ${
                    theme === 'deep-space'
                      ? 'bg-indigo-950/60 border-indigo-400 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.4)] ring-1 ring-indigo-400'
                      : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 border border-slate-950 shadow-sm" />
                        <span className="w-3.5 h-3.5 rounded-full bg-purple-500 border border-slate-950 shadow-sm" />
                      </div>
                      <span className="font-bold text-xs text-indigo-300">Deep Space</span>
                    </div>
                    {theme === 'deep-space' && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Dark blue &amp; purple nebula contrast for low-light environments.
                  </p>
                  <div className="text-[9px] text-indigo-400 font-semibold pt-1 border-t border-slate-800/80 flex justify-between">
                    <span>#6366F1 / #A855F7</span>
                    {theme === 'deep-space' && <span>ACTIVE</span>}
                  </div>
                </button>

                {/* 2. Stark Mansion Preset */}
                <button
                  type="button"
                  onClick={() => onChangeTheme('stark-mansion')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-1.5 ${
                    theme === 'stark-mansion'
                      ? 'bg-amber-950/40 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.4)] ring-1 ring-amber-400'
                      : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-slate-950 shadow-sm" />
                        <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-950 shadow-sm" />
                      </div>
                      <span className="font-bold text-xs text-amber-300">Stark Mansion</span>
                    </div>
                    {theme === 'stark-mansion' && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Champagne gold &amp; pure white high-lux executive aesthetic.
                  </p>
                  <div className="text-[9px] text-amber-400 font-semibold pt-1 border-t border-slate-800/80 flex justify-between">
                    <span>#FBBF24 / #FFFFFF</span>
                    {theme === 'stark-mansion' && <span>ACTIVE</span>}
                  </div>
                </button>

                {/* 3. Emergency Preset */}
                <button
                  type="button"
                  onClick={() => onChangeTheme('emergency')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-1.5 ${
                    theme === 'emergency'
                      ? 'bg-red-950/50 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.5)] ring-1 ring-red-400'
                      : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-slate-950 shadow-sm" />
                        <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-slate-950 shadow-sm" />
                      </div>
                      <span className="font-bold text-xs text-red-400">Emergency</span>
                    </div>
                    {theme === 'emergency' && <Check className="w-4 h-4 text-red-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Alert red &amp; blaze orange tactical hazard contrast.
                  </p>
                  <div className="text-[9px] text-red-400 font-semibold pt-1 border-t border-slate-800/80 flex justify-between">
                    <span>#EF4444 / #F97316</span>
                    {theme === 'emergency' && <span>ACTIVE</span>}
                  </div>
                </button>
              </div>
            </div>

            {/* Standard Palettes Grid */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Standard HUD Palettes</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['cyan', 'crimson', 'emerald', 'violet', 'amber'] as HUDTheme[]).map((thm) => {
                  const t = THEMES[thm];
                  const isSelected = theme === thm;
                  return (
                    <button
                      key={thm}
                      onClick={() => onChangeTheme(thm)}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 border-cyan-400 shadow-md ring-1 ring-cyan-400/40 text-white'
                          : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: t.primary }}
                        />
                        <span className="text-[11px] font-mono capitalize truncate">{thm}</span>
                      </div>
                      {isSelected && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Audio & Voice Synthesis */}
          <div className="space-y-3 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Volume2 className="w-4 h-4" />
                <span>SPEECH SYNTHESIS &amp; VOCAL ENGINE</span>
              </div>
              <button
                type="button"
                onClick={() => handlePlayTestAudio()}
                className={`px-3 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isPlayingAudio
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}
                title="Audition voice synthesis using current pitch and rate"
              >
                {isPlayingAudio ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>STOP</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>PLAY TEST AUDIO</span>
                  </>
                )}
              </button>
            </div>

            {/* Voice Dropdown */}
            {availableVoices.length > 0 && (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">SYNTHESIZER VOICE</label>
                <select
                  value={voiceConfig.voiceName}
                  onChange={(e) => onUpdateVoiceConfig({ voiceName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {availableVoices.map((v, i) => (
                    <option key={i} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Visual Real-Time Tuning Sliders: Speed & Pitch */}
            <div className="space-y-4 pt-1">
              {/* Presets Row */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Presets:
                </span>
                {[
                  { label: 'Standard J.A.R.V.I.S.', rate: 1.0, pitch: 1.0 },
                  { label: 'Tactical Briefing', rate: 1.25, pitch: 1.05 },
                  { label: 'Deep Resonance', rate: 0.9, pitch: 0.85 },
                  { label: 'High Velocity', rate: 1.45, pitch: 1.15 },
                ].map((preset) => {
                  const isMatch =
                    Math.abs(voiceConfig.speechRate - preset.rate) < 0.05 &&
                    Math.abs(voiceConfig.pitch - preset.pitch) < 0.05;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => {
                        onUpdateVoiceConfig({ speechRate: preset.rate, pitch: preset.pitch });
                        onTestVoice(`Acoustic profile set to ${preset.label}, Sir.`);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                        isMatch
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Speech Rate Visual Slider */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SPEECH CADENCE RATE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      {voiceConfig.speechRate < 0.9
                        ? 'Deliberate / Slow'
                        : voiceConfig.speechRate > 1.2
                        ? 'Accelerated Pace'
                        : 'Natural Cadence'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs tabular-nums">
                      {voiceConfig.speechRate.toFixed(2)}x
                    </span>
                  </div>
                </div>

                {/* Visual Slider Track */}
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={voiceConfig.speechRate}
                    onChange={(e) => onUpdateVoiceConfig({ speechRate: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
                  <span>0.5x (Slow)</span>
                  <span className="text-cyan-400/80 font-bold">1.0x (Nominal)</span>
                  <span>1.5x (Fast)</span>
                  <span>2.0x (Max)</span>
                </div>
              </div>

              {/* Vocal Pitch Visual Slider */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>VOCAL FREQUENCY PITCH</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      {voiceConfig.pitch < 0.9
                        ? 'Deep Baritone'
                        : voiceConfig.pitch > 1.15
                        ? 'Higher Register'
                        : 'Balanced Harmonic'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs tabular-nums">
                      {voiceConfig.pitch.toFixed(2)}x
                    </span>
                  </div>
                </div>

                {/* Visual Slider Track */}
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.05"
                    value={voiceConfig.pitch}
                    onChange={(e) => onUpdateVoiceConfig({ pitch: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
                  <span>0.5x (Sub-bass)</span>
                  <span className="text-cyan-400/80 font-bold">1.0x (Standard)</span>
                  <span>1.4x (High)</span>
                  <span>1.8x (Apex)</span>
                </div>
              </div>
            </div>

            {/* Play Test Audio Audition Panel */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-cyan-500/30 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200">
                  <AudioLines className={`w-4 h-4 ${isPlayingAudio ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
                  <span>ACOUSTIC AUDITION // SPEECH SYNTHESIS TEST</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                  {voiceConfig.speechRate.toFixed(2)}x RATE · {voiceConfig.pitch.toFixed(2)}x PITCH
                </span>
              </div>

              {/* Sample phrase selector buttons */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>SELECT SAMPLE PHRASE:</span>
                  <span className="text-slate-500">PHRASE {selectedSamplePhraseIndex + 1} OF {samplePhrases.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {samplePhrases.map((phrase, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedSamplePhraseIndex(idx);
                        if (isPlayingAudio) handlePlayTestAudio(phrase);
                      }}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-mono transition-colors border text-left truncate cursor-pointer flex items-center justify-between ${
                        selectedSamplePhraseIndex === idx
                          ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/50 shadow-sm'
                          : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">&ldquo;{phrase}&rdquo;</span>
                      {selectedSamplePhraseIndex === idx && <Check className="w-3 h-3 text-cyan-400 shrink-0 ml-1.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Play Test Audio Action Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handlePlayTestAudio()}
                  className={`px-4 py-2 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                    isPlayingAudio
                      ? 'bg-rose-500 hover:bg-rose-600 text-white border border-rose-400 animate-pulse'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-cyan-300 font-bold'
                  }`}
                  title="Audition current speech synthesis rate and pitch settings in real time"
                >
                  {isPlayingAudio ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>STOP AUDIO PLAYBACK</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>PLAY TEST AUDIO</span>
                    </>
                  )}
                </button>

                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 justify-center sm:justify-end">
                  {isPlayingAudio ? (
                    <span className="text-amber-300 flex items-center gap-1.5 font-semibold">
                      <Volume2 className="w-3.5 h-3.5 animate-ping text-amber-400" />
                      Reading sample via Web SpeechSynthesis...
                    </span>
                  ) : (
                    <span className="text-slate-500">Tune sliders above and click to hear difference</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sound effects toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-300 text-[11px]">HUD Audio Synthesizer Beeps &amp; Chimes</span>
              <button
                onClick={() => onUpdateVoiceConfig({ soundEffects: !voiceConfig.soundEffects })}
                className={`px-3 py-1 rounded text-[10px] font-mono transition-colors ${
                  voiceConfig.soundEffects
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {voiceConfig.soundEffects ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* 4. Microphone & Listening Mode */}
          <div className="space-y-3 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Mic className="w-4 h-4" />
              <span>AUDIO RECEPTOR &amp; INPUT CONTROLS</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-200 text-xs font-semibold">Continuous Wake Phrase Mode</div>
                <div className="text-[10px] text-slate-500">
                  Always listens for &ldquo;{voiceConfig.wakePhrase}&rdquo; in the background
                </div>
              </div>

              <button
                onClick={() =>
                  onUpdateVoiceConfig({
                    continuousListening: !voiceConfig.continuousListening,
                  })
                }
                className={`px-3 py-1 rounded text-[10px] font-mono transition-colors ${
                  voiceConfig.continuousListening
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {voiceConfig.continuousListening ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <div className="text-slate-200 text-xs font-semibold">Push to Talk Mode</div>
                <div className="text-[10px] text-slate-500">
                  Hold Spacebar or Click Mic button to transmit voice instructions
                </div>
              </div>

              <button
                onClick={() =>
                  onUpdateVoiceConfig({
                    pushToTalk: !voiceConfig.pushToTalk,
                  })
                }
                className={`px-3 py-1 rounded text-[10px] font-mono transition-colors ${
                  voiceConfig.pushToTalk
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {voiceConfig.pushToTalk ? 'ACTIVE (SPACE)' : 'INACTIVE'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <div className="text-slate-200 text-xs font-semibold">Android Haptic Impulse Vibration</div>
                <div className="text-[10px] text-slate-500">
                  Tactile feedback vibration on voice wake and hardware command completion
                </div>
              </div>

              <button
                onClick={() =>
                  onUpdateVoiceConfig({
                    hapticFeedback: !voiceConfig.hapticFeedback,
                  })
                }
                className={`px-3 py-1 rounded text-[10px] font-mono transition-colors ${
                  voiceConfig.hapticFeedback
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {voiceConfig.hapticFeedback ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-colors"
          >
            CONFIRM &amp; SAVE
          </button>
        </div>
      </div>
    </div>
  );
};
