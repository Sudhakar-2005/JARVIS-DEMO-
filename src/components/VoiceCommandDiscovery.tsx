import React, { useState, useMemo } from 'react';
import {
  Search,
  Mic,
  Terminal,
  Volume2,
  Sun,
  Layout,
  CloudRain,
  Globe,
  Database,
  FileText,
  Eye,
  Thermometer,
  BatteryCharging,
  Zap,
  Play,
  Copy,
  Check,
  Sparkles,
  Sliders,
  Filter,
} from 'lucide-react';

export interface VoiceTriggerCommand {
  id: string;
  trigger: string;
  aliases: string[];
  actionName: string;
  category:
    | 'Hardware & OS'
    | 'Windows & Apps'
    | 'Atmospheric'
    | 'Web Intelligence'
    | 'Memory & Notes'
    | 'Multimodal Vision'
    | 'Diagnostics & Thermals';
  description: string;
  subsystem: string;
  sampleVoicePrompt: string;
  parameters: string;
}

export const VOICE_COMMANDS_CATALOG: VoiceTriggerCommand[] = [
  {
    id: 'vol_set',
    trigger: 'Set volume to [0-100]%',
    aliases: ['volume up', 'volume down', 'mute audio', 'unmute', 'sound level 50%'],
    actionName: 'control_hardware',
    category: 'Hardware & OS',
    subsystem: 'Core Audio Endpoint / ALSA / PulseAudio',
    description: 'Directly adjusts master output volume or media audio levels across the operating system bus.',
    sampleVoicePrompt: 'Hey Jarvis, set master volume to 75 percent',
    parameters: "{ action: 'set_volume' | 'mute', value: 0-100 }",
  },
  {
    id: 'brightness_set',
    trigger: 'Set brightness to [10-100]%',
    aliases: ['dim the display', 'max brightness', 'screen luminance 80%', 'brighten screen'],
    actionName: 'control_hardware',
    category: 'Hardware & OS',
    subsystem: 'WmiSetBrightness / brightnessctl / Android Display API',
    description: 'Calibrates hardware monitor backlight luminance or mobile OLED panel output.',
    sampleVoicePrompt: 'Hey Jarvis, set display brightness to 90%',
    parameters: "{ action: 'set_brightness', value: 10-100 }",
  },
  {
    id: 'torch_toggle',
    trigger: 'Turn on / off flashlight',
    aliases: ['torch on', 'torch off', 'flashlight toggle', 'disable torch'],
    actionName: 'control_hardware',
    category: 'Hardware & OS',
    subsystem: 'Android Camera2 Torch API / Hardware Actuator',
    description: 'Toggles device physical LED flashlight torch on supported Android hardware.',
    sampleVoicePrompt: 'Hey Jarvis, toggle flashlight on',
    parameters: "{ action: 'torch_toggle' }",
  },
  {
    id: 'haptics_pulse',
    trigger: 'Pulse haptics / vibrate',
    aliases: ['vibrate device', 'tactile feedback', 'pulse motor'],
    actionName: 'control_hardware',
    category: 'Hardware & OS',
    subsystem: 'Web Vibration API / Android Haptic Driver',
    description: 'Executes physical tactile vibration feedback sequence for action confirmation.',
    sampleVoicePrompt: 'Hey Jarvis, pulse haptic feedback',
    parameters: "{ action: 'vibrate' }",
  },
  {
    id: 'wake_lock',
    trigger: 'Keep screen awake / wake lock',
    aliases: ['toggle wake lock', 'prevent screen timeout', 'keep display on'],
    actionName: 'control_hardware',
    category: 'Hardware & OS',
    subsystem: 'Screen Wake Lock API / OS Power Policy',
    description: 'Prevents display from dimming or locking during critical monitoring sessions.',
    sampleVoicePrompt: 'Hey Jarvis, keep display awake',
    parameters: "{ action: 'toggle_wake_lock' }",
  },
  {
    id: 'app_launch',
    trigger: 'Open [App Name]',
    aliases: ['launch Chrome', 'start VS Code', 'open Spotify', 'launch Terminal', 'open YouTube'],
    actionName: 'manage_apps_windows',
    category: 'Windows & Apps',
    subsystem: 'OS Process Subsystem / Android Deep-Link Intent Bus',
    description: 'Spawns local desktop application executables or dispatches mobile app intents.',
    sampleVoicePrompt: 'Hey Jarvis, launch Visual Studio Code',
    parameters: "{ action: 'launch_app', target: '<app_name>' }",
  },
  {
    id: 'window_workspace',
    trigger: 'Minimize all / Fullscreen / Split',
    aliases: ['minimize all windows', 'fullscreen', 'split screen', 'close active window', 'home screen'],
    actionName: 'manage_apps_windows',
    category: 'Windows & Apps',
    subsystem: 'Desktop Window Manager / Android Task Switcher',
    description: 'Automates window workspace layouts: tiling, minimize all, maximize, and process termination.',
    sampleVoicePrompt: 'Hey Jarvis, snap split screen layout',
    parameters: "{ action: 'minimize_all' | 'maximize' | 'snap_split' | 'close_active' }",
  },
  {
    id: 'weather_check',
    trigger: 'Check weather in [City / Region]',
    aliases: ["what's the forecast in Tokyo", 'is it raining in London', 'temperature outside'],
    actionName: 'check_weather',
    category: 'Atmospheric',
    subsystem: 'Open-Meteo High-Resolution Meteorological Radar',
    description: 'Retrieves live atmospheric forecast including temperature, humidity, wind speed, and precipitation.',
    sampleVoicePrompt: 'Hey Jarvis, check current weather in Tokyo',
    parameters: "{ location: '<city_name>' }",
  },
  {
    id: 'web_search',
    trigger: 'Search web for [Query]',
    aliases: ['look up latest news', 'who is Tony Stark', 'what is quantum computing', 'search global web'],
    actionName: 'search_web',
    category: 'Web Intelligence',
    subsystem: 'DuckDuckGo Intelligence Bus / Gemini Knowledge Grounding',
    description: 'Dispatches real-time web intelligence query and synthesizes concise executive brief.',
    sampleVoicePrompt: 'Hey Jarvis, search web for James Webb Space Telescope discoveries',
    parameters: "{ query: '<search_string>' }",
  },
  {
    id: 'memory_store',
    trigger: 'Remember that [Fact / Directive]',
    aliases: ['store preference', 'note that my favorite project is Mark 85', 'save memory'],
    actionName: 'manage_memory',
    category: 'Memory & Notes',
    subsystem: 'Persistent Memory Matrix (memory.json / IndexedDB Storage)',
    description: 'Encodes personalized facts, preferences, project targets, or associates into permanent memory.',
    sampleVoicePrompt: 'Hey Jarvis, remember that our primary project is Iron Man Mark 85',
    parameters: "{ action: 'add', category: 'preference' | 'project', content: '<text>' }",
  },
  {
    id: 'file_note',
    trigger: 'Take a note: [Note Content]',
    aliases: ['save note', 'record memo in ~/JarvisNotes', 'create desktop note'],
    actionName: 'file_operations',
    category: 'Memory & Notes',
    subsystem: 'Workspace File Controller / ~/JarvisNotes',
    description: 'Appends structured timestamped markdown note directly into local filesystem notes repository.',
    sampleVoicePrompt: 'Hey Jarvis, take a note that flight thrusters need thermal recalibration',
    parameters: "{ action: 'create_note', note_content: '<text>' }",
  },
  {
    id: 'screen_vision',
    trigger: 'Analyze my screen / Scan display',
    aliases: ['scan screen for errors', 'inspect visual display', 'what is on my screen'],
    actionName: 'screen_vision',
    category: 'Multimodal Vision',
    subsystem: 'Screen Capture API & Gemini 2.5/3.8 Flash Vision Model',
    description: 'Captures viewport frame to identify open code editors, terminal output, and suggested actions.',
    sampleVoicePrompt: 'Hey Jarvis, analyze my screen and suggest next steps',
    parameters: "{ prompt: '<analysis_goal>', image: '<base64>' }",
  },
  {
    id: 'thermal_sensors',
    trigger: 'Check system thermals',
    aliases: ['cpu temperature', 'gpu diode status', 'run stress test', 'fan array rpm'],
    actionName: 'system_diagnostics',
    category: 'Diagnostics & Thermals',
    subsystem: 'ACPI / I2C Hardware Bus & Recharts Telemetry Chart',
    description: 'Probes real-time CPU package & GPU diode temperatures, cooling fan RPM, and thermal limits.',
    sampleVoicePrompt: 'Hey Jarvis, check CPU package and GPU thermal levels',
    parameters: "{ action: 'probe_thermals' }",
  },
  {
    id: 'battery_surveillance',
    trigger: 'Battery status report',
    aliases: ['power reserve', 'is device charging', 'check battery level', 'power cell status'],
    actionName: 'control_hardware',
    category: 'Diagnostics & Thermals',
    subsystem: 'Battery Status API & Automated <20% Audible Alert',
    description: 'Inspects power cell percentage, charging state, and triggers audible chime if power drops < 20%.',
    sampleVoicePrompt: 'Hey Jarvis, what is current power cell status?',
    parameters: "{ action: 'check_battery' }",
  },
  {
    id: 'vocal_tuning',
    trigger: 'Tune vocal pitch / speech rate',
    aliases: ['adjust voice cadence', 'calibrate vocal synthesizer', 'audition test voice'],
    actionName: 'control_hardware',
    category: 'Hardware & OS',
    subsystem: 'Web SpeechSynthesis Engine & Audition Controller',
    description: 'Configures assistant voice rate (0.5x–2.0x), vocal pitch (0.5x–1.8x), and audio beeps in real time.',
    sampleVoicePrompt: 'Hey Jarvis, set vocal pitch to 1.05x and cadence rate to 1.25x',
    parameters: "{ speechRate: 0.5-2.0, pitch: 0.5-1.8 }",
  },
  {
    id: 'power_mode',
    trigger: 'Set power mode to [High Performance | Balanced | Power Saver]',
    aliases: ['high performance mode', 'power saver mode', 'balanced power plan', 'turbo boost', 'battery conservation'],
    actionName: 'control_hardware',
    category: 'Hardware & OS',
    subsystem: 'OS Power Subsystem (powercfg / powerprofilesctl / pmset)',
    description: 'Switches between High Performance (turbo/unconstrained TDP), Balanced, and Power Saver (low TDP/quiet fan).',
    sampleVoicePrompt: 'Hey Jarvis, switch power mode to High Performance',
    parameters: "{ action: 'set_power_mode', mode: 'performance' | 'balanced' | 'saver' }",
  },
];

interface VoiceCommandDiscoveryProps {
  onAuditionPhrase?: (text: string) => void;
}

export const VoiceCommandDiscovery: React.FC<VoiceCommandDiscoveryProps> = ({
  onAuditionPhrase,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    return [
      'All',
      'Hardware & OS',
      'Windows & Apps',
      'Atmospheric',
      'Web Intelligence',
      'Memory & Notes',
      'Multimodal Vision',
      'Diagnostics & Thermals',
    ];
  }, []);

  // Filter commands by search and category
  const filteredCommands = useMemo(() => {
    return VOICE_COMMANDS_CATALOG.filter((cmd) => {
      const matchesCategory =
        selectedCategory === 'All' || cmd.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inTrigger = cmd.trigger.toLowerCase().includes(q);
      const inAction = cmd.actionName.toLowerCase().includes(q);
      const inSubsystem = cmd.subsystem.toLowerCase().includes(q);
      const inDesc = cmd.description.toLowerCase().includes(q);
      const inAliases = cmd.aliases.some((a) => a.toLowerCase().includes(q));

      return inTrigger || inAction || inSubsystem || inDesc || inAliases;
    });
  }, [searchQuery, selectedCategory]);

  const handleCopy = (cmd: VoiceTriggerCommand) => {
    navigator.clipboard.writeText(cmd.sampleVoicePrompt);
    setCopiedId(cmd.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Hardware & OS':
        return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Windows & Apps':
        return <Layout className="w-3.5 h-3.5 text-purple-400" />;
      case 'Atmospheric':
        return <CloudRain className="w-3.5 h-3.5 text-blue-400" />;
      case 'Web Intelligence':
        return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Memory & Notes':
        return <Database className="w-3.5 h-3.5 text-amber-400" />;
      case 'Multimodal Vision':
        return <Eye className="w-3.5 h-3.5 text-pink-400" />;
      case 'Diagnostics & Thermals':
        return <Thermometer className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search voice triggers, system actions, or keywords (e.g. 'volume', 'weather', 'screen')..."
          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1"
          >
            ×
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] text-slate-500 uppercase mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-cyan-400" />
          CATEGORY:
        </span>
        {categories.map((cat) => {
          const count =
            cat === 'All'
              ? VOICE_COMMANDS_CATALOG.length
              : VOICE_COMMANDS_CATALOG.filter((c) => c.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[9px] px-1 rounded ${
                  isSelected ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Commands Counter Banner */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 border-b border-slate-800/80 pb-2">
        <span className="flex items-center gap-1.5 text-cyan-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          AVAILABLE AI VOICE CAPABILITIES ({filteredCommands.length} ACTIVE TRIGGERS)
        </span>
        <span className="text-slate-500 text-[10px]">
          PREFIX WITH &ldquo;HEY JARVIS&rdquo; OR HOLD SPACE
        </span>
      </div>

      {/* Command Cards List */}
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
        {filteredCommands.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <Mic className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-bold">No voice triggers match &ldquo;{searchQuery}&rdquo;</p>
            <p className="text-slate-500 text-[11px]">
              Try searching for general keywords like &ldquo;audio&rdquo;, &ldquo;search&rdquo;, &ldquo;note&rdquo;, or &ldquo;battery&rdquo;.
            </p>
          </div>
        ) : (
          filteredCommands.map((cmd) => (
            <div
              key={cmd.id}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-cyan-500/40 transition-all space-y-2.5 shadow-lg group"
            >
              {/* Header: Trigger Phrase & Badges */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-slate-900 border border-slate-800 text-cyan-400 shrink-0">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-bold text-slate-100 text-xs sm:text-[13px] tracking-wide group-hover:text-cyan-300 transition-colors">
                    &ldquo;{cmd.trigger}&rdquo;
                  </h4>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-300 font-mono text-[10px] font-bold">
                    {cmd.actionName}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[9px] hidden sm:inline-flex items-center gap-1">
                    {getCategoryIcon(cmd.category)}
                    {cmd.category}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {cmd.description}
              </p>

              {/* Subsystem & Parameters metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-900">
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-slate-500 font-bold">SUBSYSTEM:</span>
                  <span className="text-cyan-400/90 truncate">{cmd.subsystem}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 truncate">
                  <span className="text-slate-500 font-bold">DISPATCH ARGS:</span>
                  <code className="text-slate-300 font-mono text-[9px] bg-slate-900 px-1 rounded truncate">
                    {cmd.parameters}
                  </code>
                </div>
              </div>

              {/* Variations / Aliases */}
              <div className="flex flex-wrap items-center gap-1 text-[10px] pt-1">
                <span className="text-slate-500">Also triggers on:</span>
                {cmd.aliases.map((alias, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[9px]"
                  >
                    &ldquo;{alias}&rdquo;
                  </span>
                ))}
              </div>

              {/* Sample Prompt & Audition Actions */}
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono overflow-hidden">
                  <span className="text-cyan-400 font-bold shrink-0">SAMPLE:</span>
                  <span className="text-slate-200 truncate italic">
                    &ldquo;{cmd.sampleVoicePrompt}&rdquo;
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {onAuditionPhrase && (
                    <button
                      onClick={() => onAuditionPhrase(cmd.sampleVoicePrompt)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Audition this voice prompt through vocal synthesizer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>HEAR PROMPT</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCopy(cmd)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Copy sample voice command to clipboard"
                  >
                    {copiedId === cmd.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
