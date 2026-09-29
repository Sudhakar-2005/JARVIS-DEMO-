import React, { useState, useEffect, useRef } from 'react';
import { HUDTheme, JarvisState, DiagramNodeId, SystemState } from '../types';
import { THEMES } from '../utils/theme';
import { ArchitectureGraphCanvas } from './ArchitectureGraphCanvas';
import {
  DIAGRAM_EDGES,
  DIAGRAM_SIMULATION_PRESETS,
  DiagramSimulationPreset,
} from '../data/architectureGraphData';
import {
  Cpu,
  Mic,
  Volume2,
  Brain,
  Wrench,
  Layers,
  Sparkles,
  Smartphone,
  Eye,
  FileText,
  Globe,
  Undo2,
  Database,
  Sliders,
  Monitor,
  Terminal,
  Server,
  Radio,
  ExternalLink,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Zap,
  Code2,
  Copy,
  Check,
  Activity,
  Folder,
  Network,
  LayoutGrid,
} from 'lucide-react';

interface ArchitectureFlowDiagramProps {
  theme: HUDTheme;
  jarvisState: JarvisState;
  activeNode?: DiagramNodeId;
  onSelectNode?: (nodeId: DiagramNodeId) => void;
  undoCount: number;
  memoryCount: number;
  fileCount: number;
  onNavigateTab?: (tab: 'hud' | 'flow' | 'planner' | 'files' | 'vision' | 'undo' | 'system' | 'memory' | 'skills') => void;
  onOpenPhoneRemote?: () => void;
  onExecuteCommand?: (command: string) => void;
  onSpeak?: (text: string) => void;
  systemState?: SystemState;
}

interface FlowSimulationPreset {
  id: string;
  name: string;
  directive: string;
  sequence: {
    nodeId: DiagramNodeId;
    actionLabel: string;
    details: string;
  }[];
}

export const ArchitectureFlowDiagram: React.FC<ArchitectureFlowDiagramProps> = ({
  theme,
  jarvisState,
  activeNode,
  onSelectNode,
  undoCount,
  memoryCount,
  fileCount,
  onNavigateTab,
  onOpenPhoneRemote,
  onExecuteCommand,
  onSpeak,
  systemState,
}) => {
  const currentTheme = THEMES[theme];
  const [selectedNode, setSelectedNode] = useState<DiagramNodeId>(activeNode || 'orchestrator');
  const [copiedCode, setCopiedCode] = useState(false);
  const [viewMode, setViewMode] = useState<'schematic' | 'matrix'>('schematic');

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSimulationPreset, setActiveSimulationPreset] = useState<number>(0);
  const [simStepIndex, setSimStepIndex] = useState<number>(-1);
  const simTimerRef = useRef<any>(null);

  const simulationPresets = DIAGRAM_SIMULATION_PRESETS;

  const currentPreset = simulationPresets[activeSimulationPreset];

  // Run or step simulation
  useEffect(() => {
    if (!isSimulating) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      return;
    }

    simTimerRef.current = setInterval(() => {
      setSimStepIndex((prev) => {
        const next = prev + 1;
        if (next >= currentPreset.sequence.length) {
          setIsSimulating(false);
          return prev;
        }
        setSelectedNode(currentPreset.sequence[next].nodeId);
        return next;
      });
    }, 1800);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating, currentPreset]);

  const handleStartSimulation = (presetIdx: number) => {
    setActiveSimulationPreset(presetIdx);
    setSimStepIndex(0);
    setSelectedNode(simulationPresets[presetIdx].sequence[0].nodeId);
    setIsSimulating(true);
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
    setSimStepIndex(-1);
  };

  const handleStepForward = () => {
    setSimStepIndex((prev) => {
      const next = Math.min(prev + 1, currentPreset.sequence.length - 1);
      setSelectedNode(currentPreset.sequence[next].nodeId);
      return next;
    });
  };

  const handleNodeClick = (nodeId: DiagramNodeId) => {
    setSelectedNode(nodeId);
    if (onSelectNode) onSelectNode(nodeId);
  };

  // Node telemetry details matching the complete architecture
  const nodeInfo: Record<
    DiagramNodeId,
    {
      title: string;
      file: string;
      cluster: string;
      desc: string;
      metrics: string;
      tabTarget?: 'hud' | 'flow' | 'planner' | 'files' | 'vision' | 'undo' | 'system' | 'memory' | 'skills';
      testDirective?: string;
      actionType?: 'tab' | 'phone' | 'command' | 'speech';
      actionLabel?: string;
      codeSnippet: string;
    }
  > = {
    user: {
      title: 'User Interface',
      file: 'client/user.tsx',
      cluster: 'External Actor',
      desc: 'Originator of human directives via natural spoken voice or keyboard console directives.',
      metrics: 'Input: Audio 16kHz PCM & UTF-8 Text',
      tabTarget: 'hud',
      actionLabel: 'Go to HUD Console',
      codeSnippet: `// User triggers input stream
sendDirective({ type: 'voice', speech: transcript });`,
    },
    stt: {
      title: 'Voice Input (STT)',
      file: 'stt.py',
      cluster: 'Interaction Subsystem',
      desc: 'Transcribes continuous acoustic audio waveforms into normalized tokenized text streams.',
      metrics: 'Engine: Web Speech API / Whisper API / PocketSphinx',
      testDirective: 'System status report',
      actionLabel: 'Test Voice Input',
      codeSnippet: `class VoiceInput:
    def __init__(self, sample_rate=16000):
        self.recognizer = sr.Recognizer()
    
    def transcribe(self, audio_chunk):
        return self.recognizer.recognize_google(audio_chunk)`,
    },
    wake_word: {
      title: 'Wake Word Engine',
      file: 'wake_word.py',
      cluster: 'Interaction Subsystem',
      desc: 'Gates listening pipeline until the calibrated keyphrase (e.g. "Hey Jarvis") is authenticated.',
      metrics: 'Latency: ~40ms · Threshold: 0.85',
      testDirective: 'Hey Jarvis',
      actionLabel: 'Test Wake Keyphrase',
      codeSnippet: `class WakeWordDetector:
    def check_wake(self, text, wake_phrase="hey jarvis"):
        cleaned = text.lower().strip()
        return wake_phrase.lower() in cleaned`,
    },
    orchestrator: {
      title: 'Session Orchestrator',
      file: 'main.py',
      cluster: 'Core Kernel',
      desc: 'Central command nexus coordinating intelligence, planning, automation, state history, and presentation.',
      metrics: `State: ${jarvisState.toUpperCase()} · Bus: Active`,
      tabTarget: 'hud',
      actionLabel: 'Inspect Kernel',
      codeSnippet: `class SessionOrchestrator:
    def route_directive(self, command: str):
        # 1. Check skill plugins
        # 2. Check system actuators
        # 3. Dispatch to Planning LLM
        plan = self.planner.decompose(command)
        return self.executor.run(plan)`,
    },
    tts: {
      title: 'Voice Output (TTS)',
      file: 'tts.py',
      cluster: 'Interaction Subsystem',
      desc: 'Converts generated neural response matrices into articulate synthesized voice audio.',
      metrics: 'Voice: British Accent · Rate: 1.0x',
      actionType: 'speech',
      actionLabel: 'Speak Test Phrase',
      codeSnippet: `class VoiceOutput:
    def speak(self, text: str):
        engine.say(text)
        engine.runAndWait()`,
    },
    action_loader: {
      title: 'Tool Loader',
      file: 'action_loader.py',
      cluster: 'Intelligence',
      desc: 'Dynamically imports and registers callable tool functions and execution schemas into Gemini.',
      metrics: 'Tools Loaded: 14 Hardware & OS Tools',
      tabTarget: 'skills',
      actionLabel: 'View Active Tools',
      codeSnippet: `def load_tools():
    return [
        control_hardware,
        manage_apps,
        file_operations,
        web_query,
        screen_analysis
    ]`,
    },
    llm_client: {
      title: 'Planning LLM',
      file: 'llm_client.py',
      cluster: 'Intelligence',
      desc: 'Decomposes complex multi-step directives into executable Directed Acyclic Graph (DAG) task plans.',
      metrics: 'Model: Gemini 3.8 Flash · Reasoning: Active',
      tabTarget: 'planner',
      testDirective: 'Prepare morning briefing: check weather and summarize tasks',
      actionLabel: 'Open DAG Planner',
      codeSnippet: `def plan_tasks(directive: str):
    # Generates step sequence with tool bindings & parameters
    prompt = f"Decompose directive into execution steps: {directive}"
    return gemini.generate_plan(prompt)`,
    },
    plugin_loader: {
      title: 'Plugin Loader',
      file: 'plugin_loader.py',
      cluster: 'Intelligence',
      desc: 'Hot-reloads extensible Python skills dynamically from the skills/ repository at runtime.',
      metrics: 'Skill Plugins: 5 Active Plugins',
      tabTarget: 'skills',
      actionLabel: 'Manage Skill Plugins',
      codeSnippet: `def load_plugins():
    for f in glob.glob("skills/*.py"):
        plugin = import_skill(f)
        register_triggers(plugin.triggers)`,
    },
    gemini_live: {
      title: 'Gemini Live / Service',
      file: 'gemini.py',
      cluster: 'Intelligence',
      desc: 'Full-duplex bidirectional streaming session with Google GenAI inference API.',
      metrics: 'Endpoint: models/gemini-3.8-flash',
      tabTarget: 'hud',
      actionLabel: 'Live API Interface',
      codeSnippet: `ai = GoogleGenAI(api_key=os.environ["GEMINI_API_KEY"])
response = ai.models.generate_content(
    model="gemini-3.8-flash",
    contents=user_prompt
)`,
    },
    system_actions: {
      title: 'System Actions',
      file: 'automation/system_actions.py',
      cluster: 'Automation Actuators',
      desc: 'Hardware actuator bus controlling volume, brightness, power state, and running processes.',
      metrics: `OS Adapter: ${systemState?.os?.toUpperCase() || 'WINDOWS'}`,
      tabTarget: 'system',
      testDirective: 'Set volume to 75%',
      actionLabel: 'Open OS Controls',
      codeSnippet: `def set_volume(val: int):
    if platform.system() == "Windows":
        set_win_volume(val)
    elif platform.system() == "Darwin":
        os.system(f"osascript -e 'set volume output volume {val}'")
    elif platform.system() == "Linux":
        subprocess.run(["amixer", "set", "Master", f"{val}%"])`,
    },
    file_controller: {
      title: 'File Actions',
      file: 'file_controller.py',
      cluster: 'Automation Actuators',
      desc: 'Automates filesystem operations: reading files, writing workspace notes, search, and directory auditing.',
      metrics: `Workspace: ~/JarvisWorkspace (${fileCount} files)`,
      tabTarget: 'files',
      testDirective: 'Create file test_memo.txt',
      actionLabel: 'Open Workspace Files',
      codeSnippet: `def write_file(filename: str, content: str):
    path = os.path.join(WORKSPACE_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    record_undo("create_file", path)`,
    },
    browser_control: {
      title: 'Browser Control',
      file: 'browser_control.py',
      cluster: 'Automation Actuators',
      desc: 'Controls active browser tabs, search query navigation, URL dispatch, and webpage automation.',
      metrics: 'Driver: System Default Browser & Chromium',
      testDirective: 'Open Google Chrome',
      actionLabel: 'Launch Browser Action',
      codeSnippet: `def open_url(url: str):
    webbrowser.open(url)
    return f"Navigated browser to {url}"`,
    },
    screen_vision: {
      title: 'Screen Vision',
      file: 'screen_vision.py',
      cluster: 'Automation Actuators',
      desc: 'Captures display frames and applies multimodal vision analysis to understand screen context.',
      metrics: 'Capture: Desktop & Window Framebuffer',
      tabTarget: 'vision',
      actionLabel: 'Open Screen Vision',
      codeSnippet: `def capture_and_analyze(prompt="Analyze active desktop"):
    img = ImageGrab.grab()
    return vision_model.analyze(img, prompt=prompt)`,
    },
    web_search: {
      title: 'Web Search',
      file: 'web_search.py',
      cluster: 'Automation Actuators',
      desc: 'Live intelligence gathering via DuckDuckGo Instant Answers and internet knowledge bases.',
      metrics: 'Protocol: DuckDuckGo Instant API & Scraper',
      testDirective: 'Search James Webb telescope latest discoveries',
      actionLabel: 'Execute Live Web Search',
      codeSnippet: `def search_web(query: str):
    res = requests.get(f"https://api.duckduckgo.com/?q={query}&format=json")
    return res.json().get("AbstractText")`,
    },
    memory_manager: {
      title: 'Persistent Memory',
      file: 'memory_manager.py',
      cluster: 'State & Rollback',
      desc: 'Stores long-term facts about people, projects, preferences, and conversations across sessions.',
      metrics: `Entries: ${memoryCount} Stored Entities`,
      tabTarget: 'memory',
      testDirective: 'Remember that project deployment is scheduled for Friday',
      actionLabel: 'Open Memory Matrix',
      codeSnippet: `def save_fact(category: str, title: str, content: str):
    entry = {"id": uuid.uuid4().hex, "title": title, "content": content}
    memories.append(entry)
    persist_json("memory.json", memories)`,
    },
    undo_history: {
      title: 'Undo History',
      file: 'undo.py',
      cluster: 'State & Rollback',
      desc: 'Maintains an immutable rollback journal of every executed system modification, file write, or setting change.',
      metrics: `Logged Actions: ${undoCount} Records`,
      tabTarget: 'undo',
      actionLabel: 'Open Rollback Journal',
      codeSnippet: `def record_change(action: str, prev_val, new_val):
    undo_stack.append({
        "timestamp": time.time(),
        "action": action,
        "revert_to": prev_val
    })`,
    },
    config_manager: {
      title: 'Runtime Configuration',
      file: 'config_manager.py',
      cluster: 'State & Rollback',
      desc: 'Dynamic configuration parameters for assistant designation, audio rates, thresholds, and HUD aesthetics.',
      metrics: 'Profile: Stark MK 85 Core',
      actionLabel: 'Inspect Config',
      codeSnippet: `def read_settings():
    with open("config.json", "r") as f:
        return json.load(f)`,
    },
    phone_user: {
      title: 'Phone User (Mobile Bridge)',
      file: 'mobile_bridge.py',
      cluster: 'Remote Interaction',
      desc: 'Allows remote mobile devices to queue voice and text commands into the desktop orchestrator.',
      metrics: 'Link: WebRTC / WebSocket / REST Relay',
      actionType: 'phone',
      actionLabel: 'Open Phone Remote',
      codeSnippet: `def queue_remote_command(device_id: str, command: str):
    orchestrator.enqueue({
        "source": f"phone:{device_id}",
        "command": command
    })`,
    },
    remote_dashboard: {
      title: 'Remote Dashboard',
      file: 'server.py',
      cluster: 'Presentation & Telemetry',
      desc: 'Express & WebSocket server publishing live session telemetry, states, and logs to connected devices.',
      metrics: 'Port: 3000 · Protocol: HTTP/WS',
      actionLabel: 'Inspect Telemetry API',
      codeSnippet: `app.get("/api/remote/status", (req, res) => {
    res.json({
        state: orchestrator.state,
        system: orchestrator.system_state,
        active_plan: orchestrator.current_plan
    });
});`,
    },
    animated_avatar: {
      title: 'Animated Avatar',
      file: 'avatar.py',
      cluster: 'Presentation & Telemetry',
      desc: 'Drives audio-reactive lip-sync, 3D gyroscopic ring physics, and holographic core animations.',
      metrics: 'FPS: 60 · Audio Reactive: Yes',
      tabTarget: 'hud',
      actionLabel: 'View Holographic Core',
      codeSnippet: `def update_avatar(audio_amplitude: float):
    rings.rotation_speed = base_speed + audio_amplitude * 2.5
    core_glow.intensity = 0.8 + audio_amplitude * 0.5`,
    },
    desktop_hud: {
      title: 'Desktop HUD',
      file: 'ui.py',
      cluster: 'Presentation & Telemetry',
      desc: 'Main holographic dashboard rendering the command stream, telemetry graphs, and automation panels.',
      metrics: `Theme: ${theme.toUpperCase()} · Mode: Standalone`,
      tabTarget: 'hud',
      actionLabel: 'Open Desktop HUD',
      codeSnippet: `def render_hud():
    draw_arc_reactor()
    draw_waveform_analyzer()
    draw_command_console()`,
    },
    echo_guard: {
      title: 'Echo Guard',
      file: 'echo.py',
      cluster: 'Interaction Subsystem',
      desc: 'Adaptive acoustic echo cancellation and self-audio filtration ensuring speaker playback never triggers microphone listening.',
      metrics: 'Attenuation: -42dB · Loopback Filter: Active',
      actionLabel: 'Test Echo Filtration',
      codeSnippet: `class EchoGuard:
    def filter_self_echo(self, mic_stream, speaker_stream):
        return adaptive_filter.cancel_echo(mic_stream, speaker_stream)`,
    },
    optional_skills: {
      title: 'Optional Skills',
      file: 'skills/*.py',
      cluster: 'Actions & Skills',
      desc: 'Extensible community and user-defined custom Python skill plugins loaded on-demand by plugin_loader.py.',
      metrics: 'Sandbox: Isolated Python Namespace · Plugins: 5 Active',
      tabTarget: 'skills',
      actionLabel: 'Inspect Optional Skills',
      codeSnippet: `class CommunitySkill:
    def execute(self, params):
        return execute_user_script(params)`,
    },
    built_in_skills: {
      title: 'Built-in Skills',
      file: 'skills/builtin/',
      cluster: 'Actions & Skills',
      desc: 'Core native hardware and operating system actuators: volume, brightness, power profiles, and window management.',
      metrics: 'Status: Built-in Subsystems Online · Actuators: 14',
      tabTarget: 'system',
      actionLabel: 'View Built-in Skills',
      codeSnippet: `class BuiltInHardwareSkills:
    def set_volume(self, level): ...
    def set_power_mode(self, mode): ...`,
    },
    computer_os: {
      title: 'Computer and OS',
      file: 'System Kernel',
      cluster: 'External Host System',
      desc: 'Underlying operating system bus: ACPI thermal sensors, CPU/GPU performance counters, display framebuffer, and audio HAL.',
      metrics: `OS: ${systemState?.os?.toUpperCase() || 'HOST OS'} · ACPI Active`,
      tabTarget: 'system',
      actionLabel: 'Open System Controls',
      codeSnippet: `# Computer & OS Subsystem
amixer / AudioEndpointVolume
cat /sys/class/thermal/thermal_zone0/temp`,
    },
    web_sources: {
      title: 'Web Sources',
      file: 'HTTPS / REST API',
      cluster: 'External Intelligence',
      desc: 'External internet endpoints, DuckDuckGo Instant Answers, Wikipedia knowledge entries, and live weather/telemetry feeds.',
      metrics: 'Internet: HTTPS TLS 1.3 Active',
      testDirective: 'Search James Webb telescope latest discoveries',
      actionLabel: 'Query Web Sources',
      codeSnippet: `# External Web Endpoints
GET https://api.duckduckgo.com/?format=json
GET https://en.wikipedia.org/w/api.php`,
    },
    gemini_service: {
      title: 'Gemini Service',
      file: 'Google GenAI Cloud',
      cluster: 'External Intelligence',
      desc: 'Google Gemini 3.8 Flash inference endpoint providing multimodal reasoning, task planning, and audio/text token generation.',
      metrics: 'Model: gemini-3.8-flash · Status: Connected',
      tabTarget: 'hud',
      actionLabel: 'Open Live AI Interface',
      codeSnippet: `ai = GoogleGenAI(api_key=os.environ["GEMINI_API_KEY"])
response = ai.models.generate_content(
    model="gemini-3.8-flash",
    contents=user_prompt
)`,
    },
  };

  const isNodeActive = (id: DiagramNodeId) => {
    if (isSimulating && simStepIndex >= 0 && currentPreset.sequence[simStepIndex]?.nodeId === id) {
      return true;
    }
    if (selectedNode === id) return true;
    if (jarvisState === 'listening' && (id === 'stt' || id === 'wake_word' || id === 'orchestrator')) return true;
    if (jarvisState === 'thinking' && (id === 'orchestrator' || id === 'llm_client' || id === 'gemini_live')) return true;
    if (jarvisState === 'speaking' && (id === 'tts' || id === 'animated_avatar')) return true;
    if (jarvisState === 'executing' && (id === 'system_actions' || id === 'file_controller' || id === 'undo_history')) return true;
    return false;
  };

  const handleCopyCode = () => {
    const code = nodeInfo[selectedNode]?.codeSnippet;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleExecuteAction = () => {
    const info = nodeInfo[selectedNode];
    if (!info) return;

    if (info.actionType === 'phone' && onOpenPhoneRemote) {
      onOpenPhoneRemote();
      return;
    }

    if (info.actionType === 'speech' && onSpeak) {
      onSpeak('Voice output and acoustic feedback channels operating at nominal parameters, Sir.');
      return;
    }

    if (info.testDirective && onExecuteCommand) {
      onExecuteCommand(info.testDirective);
      return;
    }

    if (info.tabTarget && onNavigateTab) {
      onNavigateTab(info.tabTarget);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
              J.A.R.V.I.S. ARCHITECTURE BLUEPRINT &amp; FLOW ORCHESTRATION
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              FULL TOPOLOGY
            </span>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('schematic')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'schematic'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              <span>SCHEMATIC BLUEPRINT</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span>SUBSYSTEM CARDS</span>
            </button>
          </div>
        </div>

        {/* Flow Simulation Preset Switcher */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 text-[11px] uppercase mr-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Flow:</span>
          </span>

          {simulationPresets.map((preset, idx) => (
            <button
              key={preset.id}
              onClick={() => handleStartSimulation(idx)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer border ${
                isSimulating && activeSimulationPreset === idx
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {preset.name}
            </button>
          ))}

          {isSimulating ? (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={handleStopSimulation}
                className="p-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 cursor-pointer"
                title="Stop Simulation"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleStepForward}
                className="p-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 cursor-pointer"
                title="Step Next"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleStartSimulation(activeSimulationPreset)}
              className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3" />
              <span>RUN PIPELINE</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Simulation Ticker Bar (if active) */}
      {isSimulating && simStepIndex >= 0 && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
            <span className="font-bold">
              STEP {simStepIndex + 1}/{currentPreset.sequence.length}:
            </span>
            <span className="text-white uppercase font-bold">
              [{currentPreset.sequence[simStepIndex]?.nodeId.toUpperCase()}]
            </span>
            <span className="text-amber-200">
              {currentPreset.sequence[simStepIndex]?.actionLabel} — {currentPreset.sequence[simStepIndex]?.details}
            </span>
          </div>

          <div className="text-[11px] text-amber-400/80">
            Directive: &ldquo;{currentPreset.directive}&rdquo;
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 flex-1 overflow-hidden min-h-[660px]">
        {/* Left / Top: Interactive Visual Diagram Canvas or Matrix */}
        {viewMode === 'schematic' ? (
          <div className="xl:col-span-8 bg-slate-950/40 border-r border-slate-800/60 overflow-hidden relative flex flex-col">
            <ArchitectureGraphCanvas
              theme={theme}
              selectedNode={selectedNode}
              onSelectNode={handleNodeClick}
              activeNodeId={isSimulating && simStepIndex >= 0 ? currentPreset.sequence[simStepIndex]?.nodeId : undefined}
              activeEdgeId={isSimulating && simStepIndex >= 0 ? (currentPreset.sequence[simStepIndex] as any)?.edgeId : undefined}
            />
          </div>
        ) : (
          <div className="xl:col-span-8 p-4 overflow-y-auto max-h-[660px] bg-slate-950/40 border-r border-slate-800/60 flex flex-col items-center justify-start space-y-4 select-none">
            {/* Top Layer: External Actors */}
          <div className="w-full flex items-center justify-center gap-8">
            <button
              onClick={() => handleNodeClick('user')}
              className={`px-4 py-2 rounded-xl border font-mono text-xs flex items-center gap-2.5 transition-all cursor-pointer shadow-md ${
                isNodeActive('user')
                  ? 'bg-blue-500/25 text-blue-200 border-blue-400 ring-2 ring-blue-500/40 scale-105'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
              <div className="text-left">
                <div className="font-bold">User Interface</div>
                <div className="text-[10px] text-slate-400 font-normal">speaks / console</div>
              </div>
            </button>

            <div className="text-slate-600 text-xs font-mono font-bold">◄ ── DUAL INGRESS ── ►</div>

            <button
              onClick={() => handleNodeClick('phone_user')}
              className={`px-4 py-2 rounded-xl border font-mono text-xs flex items-center gap-2.5 transition-all cursor-pointer shadow-md ${
                isNodeActive('phone_user')
                  ? 'bg-sky-500/25 text-sky-200 border-sky-400 ring-2 ring-sky-500/40 scale-105'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Smartphone className="w-4 h-4 text-sky-400" />
              <div className="text-left">
                <div className="font-bold">Phone User</div>
                <div className="text-[10px] text-slate-400 font-normal">mobile bridge / remote</div>
              </div>
            </button>
          </div>

          {/* Flow Connector Arrow */}
          <div className="h-4 w-0.5 bg-gradient-to-b from-blue-400 to-cyan-400" />

          {/* Cluster 1: Interaction Subsystem */}
          <div className="w-full max-w-3xl p-3.5 bg-slate-950/80 border border-cyan-500/30 rounded-xl relative shadow-lg">
            <div className="text-[10px] font-mono text-cyan-400 tracking-wider font-bold mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                INTERACTION SUBSYSTEM
              </span>
              <span className="text-slate-500">[stt.py · wake_word.py · main.py · tts.py]</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleNodeClick('stt')}
                className={`p-2.5 rounded-lg border text-left font-mono transition-all cursor-pointer ${
                  isNodeActive('stt')
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 ring-2 ring-cyan-500/30 shadow-md'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice Input</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">[stt.py]</div>
                <div className="text-[9px] text-slate-500 mt-1">transcribes audio PCM</div>
              </button>

              <button
                onClick={() => handleNodeClick('orchestrator')}
                className={`p-2.5 rounded-lg border text-left font-mono transition-all cursor-pointer relative overflow-hidden ${
                  isNodeActive('orchestrator')
                    ? 'bg-cyan-500/30 text-white border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg'
                    : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-cyan-500/60'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Session Orchestrator</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">[main.py]</div>
                <div className="text-[9px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Central Kernel Dispatcher</span>
                </div>
              </button>

              <button
                onClick={() => handleNodeClick('wake_word')}
                className={`p-2.5 rounded-lg border text-left font-mono transition-all cursor-pointer ${
                  isNodeActive('wake_word')
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 ring-2 ring-cyan-500/30 shadow-md'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Wake Word</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">[wake_word.py]</div>
                <div className="text-[9px] text-slate-500 mt-1">gates listening (&ldquo;Hey Jarvis&rdquo;)</div>
              </button>
            </div>

            {/* Voice Output Sub-row */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">Acoustic Feedback Synthesis:</span>
              <button
                onClick={() => handleNodeClick('tts')}
                className={`px-3 py-1.5 rounded border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                  isNodeActive('tts')
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-sm ring-1 ring-cyan-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Voice Output [tts.py]</span>
                <span className="text-[10px] text-slate-500">speaks result</span>
              </button>
            </div>
          </div>

          {/* Flow Connector Spoke */}
          <div className="w-full flex items-center justify-center gap-6 text-slate-600 text-xs font-mono">
            <span>↓ routes directives</span>
            <span>↓ plans &amp; invokes</span>
            <span>↓ journals rollbacks</span>
          </div>

          {/* Middle Row: Clusters (Intelligence, Automation, State) */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Cluster 2: Intelligence */}
            <div className="p-3 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-2">
              <div className="text-[10px] font-mono text-amber-400 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  <span>INTELLIGENCE</span>
                </span>
                <span className="text-[9px] text-slate-500">GEMINI 3.8</span>
              </div>

              <div className="space-y-1.5">
                {[
                  { id: 'action_loader' as DiagramNodeId, name: 'Tool Loader', file: '[action_loader.py]', tag: 'loads schemas' },
                  { id: 'llm_client' as DiagramNodeId, name: 'Planning LLM', file: '[llm_client.py]', tag: 'DAG planner' },
                  { id: 'plugin_loader' as DiagramNodeId, name: 'Plugin Loader', file: '[plugin_loader.py]', tag: 'hot-reloads' },
                  { id: 'gemini_live' as DiagramNodeId, name: 'Gemini Live', file: '[gemini.py]', tag: 'streaming session' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNodeClick(item.id)}
                    className={`w-full p-2 rounded border text-left text-[11px] font-mono flex items-center justify-between transition-all cursor-pointer ${
                      isNodeActive(item.id)
                        ? 'bg-amber-500/20 text-amber-200 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <div className="text-[9px] text-slate-400">{item.file}</div>
                    </div>
                    <span className="text-[9px] text-slate-500">{item.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cluster 3: Automation */}
            <div className="p-3 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-2">
              <div className="text-[10px] font-mono text-emerald-400 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>AUTOMATION</span>
                </span>
                <span className="text-[9px] text-slate-500">5 ACTUATORS</span>
              </div>

              <div className="space-y-1.5">
                {[
                  { id: 'system_actions' as DiagramNodeId, name: 'System Actions', file: 'OS Bus (Vol/Br/Apps)', tag: 'hardware' },
                  { id: 'file_controller' as DiagramNodeId, name: 'File Actions', file: '[file_controller.py]', tag: `${fileCount} files` },
                  { id: 'browser_control' as DiagramNodeId, name: 'Browser Control', file: '[browser_control.py]', tag: 'web tabs' },
                  { id: 'screen_vision' as DiagramNodeId, name: 'Screen Vision', file: 'multimodal scan', tag: 'framebuffer' },
                  { id: 'web_search' as DiagramNodeId, name: 'Web Search', file: '[web_search.py]', tag: 'DuckDuckGo' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNodeClick(item.id)}
                    className={`w-full p-2 rounded border text-left text-[11px] font-mono flex items-center justify-between transition-all cursor-pointer ${
                      isNodeActive(item.id)
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400 ring-1 ring-emerald-400'
                        : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <div className="text-[9px] text-slate-400">{item.file}</div>
                    </div>
                    <span className="text-[9px] text-slate-500">{item.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cluster 4: State */}
            <div className="p-3 bg-slate-950/80 border border-rose-500/30 rounded-xl space-y-2">
              <div className="text-[10px] font-mono text-rose-400 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>STATE &amp; ROLLBACK</span>
                </span>
                <span className="text-[9px] text-slate-500">IMMUTABLE</span>
              </div>

              <div className="space-y-1.5">
                {[
                  { id: 'memory_manager' as DiagramNodeId, name: 'Persistent Memory', file: '[memory_manager.py]', tag: `${memoryCount} facts` },
                  { id: 'undo_history' as DiagramNodeId, name: 'Undo History', file: '[undo.py]', tag: `${undoCount} changes` },
                  { id: 'config_manager' as DiagramNodeId, name: 'Runtime Config', file: '[config_manager.py]', tag: 'reads settings' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNodeClick(item.id)}
                    className={`w-full p-2 rounded border text-left text-[11px] font-mono flex items-center justify-between transition-all cursor-pointer ${
                      isNodeActive(item.id)
                        ? 'bg-rose-500/20 text-rose-200 border-rose-400 ring-1 ring-rose-400'
                        : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <div className="text-[9px] text-slate-400">{item.file}</div>
                    </div>
                    <span className="text-[9px] text-slate-500">{item.tag}</span>
                  </button>
                ))}
              </div>

              {/* Status Note */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>Rollback Journal:</span>
                <span className="text-rose-400 font-bold">1-Click Revert Ready</span>
              </div>
            </div>
          </div>

          {/* Cluster 5: Presentation */}
          <div className="w-full p-3 bg-slate-950/80 border border-violet-500/30 rounded-xl space-y-2">
            <div className="text-[10px] font-mono text-violet-400 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5" />
                <span>PRESENTATION &amp; TELEMETRY VIEWPORTS</span>
              </span>
              <span className="text-slate-500">[server.py · avatar.py · ui.py]</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleNodeClick('remote_dashboard')}
                className={`p-2.5 rounded border text-left text-[11px] font-mono transition-all cursor-pointer ${
                  isNodeActive('remote_dashboard')
                    ? 'bg-violet-500/20 text-violet-200 border-violet-400 ring-1 ring-violet-400'
                    : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-violet-300">
                  <Server className="w-3.5 h-3.5 text-violet-400" />
                  <span>Remote Dashboard</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">[server.py] · port 3000</div>
                <div className="text-[9px] text-slate-500 mt-1">publishes live session state</div>
              </button>

              <button
                onClick={() => handleNodeClick('animated_avatar')}
                className={`p-2.5 rounded border text-left text-[11px] font-mono transition-all cursor-pointer ${
                  isNodeActive('animated_avatar')
                    ? 'bg-violet-500/20 text-violet-200 border-violet-400 ring-1 ring-violet-400'
                    : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-violet-300">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>Animated Avatar</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">[avatar.py] · 3D Gyroscope</div>
                <div className="text-[9px] text-slate-500 mt-1">drives audio-reactive lip-sync</div>
              </button>

              <button
                onClick={() => handleNodeClick('desktop_hud')}
                className={`p-2.5 rounded border text-left text-[11px] font-mono transition-all cursor-pointer ${
                  isNodeActive('desktop_hud')
                    ? 'bg-violet-500/20 text-violet-200 border-violet-400 ring-1 ring-violet-400'
                    : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-violet-300">
                  <Monitor className="w-3.5 h-3.5 text-violet-400" />
                  <span>Desktop HUD</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">[ui.py] · Stark MK 85</div>
                <div className="text-[9px] text-slate-500 mt-1">renders visual core &amp; telemetry</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right: Module Telemetry & Direct Action Inspector */}
      <div className="xl:col-span-4 p-4 bg-slate-950 flex flex-col justify-between space-y-4 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold flex items-center gap-1">
              <Activity className="w-3 h-3" />
              NODE TELEMETRY INSPECTOR
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
              {nodeInfo[selectedNode]?.cluster}
            </span>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                <span>{nodeInfo[selectedNode]?.title}</span>
                <span className="text-[11px] text-cyan-400 font-mono font-normal">
                  {nodeInfo[selectedNode]?.file}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
                {nodeInfo[selectedNode]?.desc}
              </p>
            </div>

            {/* Runtime Metrics */}
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 uppercase mb-0.5">Runtime Metrics</div>
                <div className="text-emerald-400 font-bold">{nodeInfo[selectedNode]?.metrics}</div>
              </div>
              <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                ONLINE
              </div>
            </div>

            {/* Action Trigger Button */}
            {nodeInfo[selectedNode]?.actionLabel && (
              <div className="pt-1">
                <button
                  onClick={handleExecuteAction}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{nodeInfo[selectedNode]?.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            )}

            {/* Inter-Module Signal Routing from diagram edges */}
            {(() => {
              const inbound = DIAGRAM_EDGES.filter((e) => e.target === selectedNode);
              const outbound = DIAGRAM_EDGES.filter((e) => e.source === selectedNode);
              if (inbound.length === 0 && outbound.length === 0) return null;

              return (
                <div className="space-y-2 p-2.5 bg-slate-900/70 rounded-lg border border-slate-800">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Network className="w-3 h-3 text-cyan-400" />
                    <span>Signal Routing &amp; Data Flows</span>
                  </div>

                  {inbound.length > 0 && (
                    <div>
                      <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">
                        Inbound Feeds ({inbound.length})
                      </div>
                      <div className="space-y-1">
                        {inbound.map((edge) => {
                          const srcNode = nodeInfo[edge.source];
                          return (
                            <button
                              key={edge.id}
                              onClick={() => handleNodeClick(edge.source)}
                              className="w-full px-2 py-1 rounded bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left font-mono text-[10px] flex items-center justify-between text-slate-300 transition-colors cursor-pointer group"
                            >
                              <span className="font-bold text-cyan-300 group-hover:text-cyan-200 truncate">
                                ← {srcNode?.title || edge.source}
                              </span>
                              <span className="text-[9px] text-slate-400 italic font-sans shrink-0 ml-1">
                                {edge.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {outbound.length > 0 && (
                    <div>
                      <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">
                        Outbound Dispatches ({outbound.length})
                      </div>
                      <div className="space-y-1">
                        {outbound.map((edge) => {
                          const tgtNode = nodeInfo[edge.target];
                          return (
                            <button
                              key={edge.id}
                              onClick={() => handleNodeClick(edge.target)}
                              className="w-full px-2 py-1 rounded bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left font-mono text-[10px] flex items-center justify-between text-slate-300 transition-colors cursor-pointer group"
                            >
                              <span className="font-bold text-emerald-300 group-hover:text-emerald-200 truncate">
                                → {tgtNode?.title || edge.target}
                              </span>
                              <span className="text-[9px] text-slate-400 italic font-sans shrink-0 ml-1">
                                {edge.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

              {/* Python Source Live Code View */}
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Code2 className="w-3 h-3 text-cyan-400" />
                    Python / System Source
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-cyan-200 overflow-x-auto max-h-48 leading-relaxed">
                  <code>{nodeInfo[selectedNode]?.codeSnippet}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Quick Flow Insight */}
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg font-mono text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>FLOW ARCHITECTURE ADVANTAGES</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every voice directive follows this decoupled DAG pipeline: voice input is gated by wake-word authentication, routed to the Planning LLM for tool resolution, executed on the OS bus with automatic rollback journaling, and spoken back via articulate TTS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
