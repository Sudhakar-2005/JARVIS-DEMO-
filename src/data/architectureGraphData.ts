import { DiagramNodeId } from '../types';

export interface DiagramCluster {
  id: string;
  name: string;
  color: 'blue' | 'yellow' | 'pink' | 'green' | 'purple';
  borderColor: string;
  bgColor: string;
  textColor: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiagramNodeDef {
  id: DiagramNodeId;
  label: string;
  fileName?: string;
  shape: 'rect' | 'circle' | 'cylinder';
  clusterId?: string;
  colorType: 'blue' | 'orange' | 'yellow' | 'red' | 'green' | 'purple' | 'slate';
  x: number;
  y: number;
  width: number;
  height: number;
  desc: string;
  metrics: string;
  tabTarget?: 'hud' | 'flow' | 'planner' | 'files' | 'vision' | 'undo' | 'system' | 'memory' | 'skills';
  testDirective?: string;
  actionType?: 'tab' | 'phone' | 'command' | 'speech';
  actionLabel?: string;
  codeSnippet: string;
}

export interface DiagramEdgeDef {
  id: string;
  source: DiagramNodeId;
  target: DiagramNodeId;
  label: string;
  style?: 'solid' | 'dashed';
  arrowDirection?: 'forward' | 'both';
  path?: string;
}

// Subsystem clusters from diagram (1).png
export const DIAGRAM_CLUSTERS: DiagramCluster[] = [
  {
    id: 'user_interaction',
    name: 'User interaction',
    color: 'blue',
    borderColor: 'border-blue-500/40',
    bgColor: 'bg-blue-950/20',
    textColor: 'text-blue-300',
    x: 270,
    y: 120,
    width: 540,
    height: 90,
  },
  {
    id: 'assistant_runtime',
    name: 'Assistant runtime',
    color: 'yellow',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-950/20',
    textColor: 'text-amber-300',
    x: 350,
    y: 280,
    width: 480,
    height: 240,
  },
  {
    id: 'context_memory',
    name: 'Context and memory',
    color: 'pink',
    borderColor: 'border-rose-500/40',
    bgColor: 'bg-rose-950/20',
    textColor: 'text-rose-300',
    x: 30,
    y: 600,
    width: 250,
    height: 120,
  },
  {
    id: 'actions_skills',
    name: 'Actions and skills',
    color: 'green',
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-950/20',
    textColor: 'text-emerald-300',
    x: 310,
    y: 600,
    width: 580,
    height: 120,
  },
  {
    id: 'display_remote',
    name: 'Display and remote',
    color: 'purple',
    borderColor: 'border-indigo-500/40',
    bgColor: 'bg-indigo-950/20',
    textColor: 'text-indigo-300',
    x: 920,
    y: 600,
    width: 230,
    height: 170,
  },
];

export const DIAGRAM_NODES: DiagramNodeDef[] = [
  // Top External Actor
  {
    id: 'user',
    label: 'User',
    shape: 'circle',
    colorType: 'blue',
    x: 520,
    y: 20,
    width: 68,
    height: 68,
    desc: 'Primary human operator issuing natural spoken voice directives and command instructions.',
    metrics: 'Ingress: 16kHz PCM Audio & UTF-8 Text',
    tabTarget: 'hud',
    actionLabel: 'Go to HUD Console',
    codeSnippet: `# User interaction entrypoint
def capture_user_input():
    stream = audio_device.open_stream(rate=16000)
    return stream.read()`,
  },

  // 1. User Interaction Subsystem
  {
    id: 'tts',
    label: 'Speech synthesis',
    fileName: '[tts.py]',
    shape: 'rect',
    clusterId: 'user_interaction',
    colorType: 'blue',
    x: 285,
    y: 145,
    width: 110,
    height: 48,
    desc: 'Synthesizes neural spoken voice confirmation responses from generated response texts.',
    metrics: 'Voice: Mark 85 British Accent · Rate: 1.0x',
    actionType: 'speech',
    actionLabel: 'Speak Test Phrase',
    codeSnippet: `class VoiceOutput:
    def speak(self, text: str):
        engine.say(text)
        engine.runAndWait()`,
  },
  {
    id: 'wake_word',
    label: 'Wake word',
    fileName: '[wake_word.py]',
    shape: 'rect',
    clusterId: 'user_interaction',
    colorType: 'blue',
    x: 415,
    y: 145,
    width: 105,
    height: 48,
    desc: 'Gating mechanism ensuring the listening pipeline only opens when the calibrated wake keyphrase is spoken.',
    metrics: 'Keyphrase: "Hey Jarvis" · Latency: ~38ms',
    testDirective: 'Hey Jarvis',
    actionLabel: 'Test Wake Keyphrase',
    codeSnippet: `class WakeWordDetector:
    def check_wake(self, text, wake_phrase="hey jarvis"):
        return wake_phrase.lower() in text.lower()`,
  },
  {
    id: 'stt',
    label: 'Speech recognition',
    fileName: '[stt.py]',
    shape: 'rect',
    clusterId: 'user_interaction',
    colorType: 'blue',
    x: 540,
    y: 145,
    width: 120,
    height: 48,
    desc: 'Converts continuous acoustic microphone audio into normalized, tokenized transcript strings.',
    metrics: 'Engine: Web Speech API / Whisper Live API',
    testDirective: 'System status report',
    actionLabel: 'Test Voice Input',
    codeSnippet: `class VoiceInput:
    def transcribe(self, audio_chunk):
        return recognizer.recognize_google(audio_chunk)`,
  },
  {
    id: 'echo_guard',
    label: 'Echo guard',
    fileName: '[echo.py]',
    shape: 'rect',
    clusterId: 'user_interaction',
    colorType: 'blue',
    x: 680,
    y: 145,
    width: 110,
    height: 48,
    desc: 'Acoustic echo cancellation and self-audio filtration preventing the assistant from triggering its own receptors.',
    metrics: 'Attenuation: -42dB · Self-Filter: Active',
    actionLabel: 'Test Echo Cancellation',
    codeSnippet: `class EchoGuard:
    def filter_self_echo(self, mic_stream, speaker_stream):
        return adaptive_filter.cancel_echo(mic_stream, speaker_stream)`,
  },

  // 2. Assistant Runtime Subsystem
  {
    id: 'orchestrator',
    label: 'Assistant runtime',
    fileName: '[main.py]',
    shape: 'rect',
    clusterId: 'assistant_runtime',
    colorType: 'orange',
    x: 520,
    y: 305,
    width: 140,
    height: 52,
    desc: 'Central kernel coordinating intelligence, task decomposition, skill dispatching, and system state.',
    metrics: 'Kernel: Active · Bus: Non-blocking Event Loop',
    tabTarget: 'hud',
    actionLabel: 'Inspect Kernel State',
    codeSnippet: `class AssistantRuntime:
    def route_directive(self, text: str):
        if self.wake_word.verify(text):
            plan = self.planner.plan(text)
            return self.executor.run(plan)`,
  },
  {
    id: 'llm_client',
    label: 'Model client',
    fileName: '[llm_client.py]',
    shape: 'rect',
    clusterId: 'assistant_runtime',
    colorType: 'yellow',
    x: 370,
    y: 440,
    width: 100,
    height: 48,
    desc: 'Requests planning decomposition and constructs structured task steps from natural language requests.',
    metrics: 'Model: Gemini 3.8 Flash · DAG Planner: Active',
    tabTarget: 'planner',
    testDirective: 'Prepare morning briefing: check weather and summarize tasks',
    actionLabel: 'Open DAG Planner',
    codeSnippet: `def plan_tasks(directive: str):
    prompt = f"Decompose directive into execution steps: {directive}"
    return model_client.generate_plan(prompt)`,
  },
  {
    id: 'plugin_loader',
    label: 'Plugin discovery',
    fileName: '[plugin_loader.py]',
    shape: 'rect',
    clusterId: 'assistant_runtime',
    colorType: 'yellow',
    x: 490,
    y: 440,
    width: 110,
    height: 48,
    desc: 'Discovers and hot-reloads extensible community and user-defined Python skill plugins dynamically.',
    metrics: 'Plugin System: Hot-Reload Enabled',
    tabTarget: 'skills',
    actionLabel: 'Manage Skill Plugins',
    codeSnippet: `def discover_plugins():
    for path in glob.glob("skills/*.py"):
        plugin = importlib.import_module(path)
        register_triggers(plugin.triggers)`,
  },
  {
    id: 'action_loader',
    label: 'Action discovery',
    fileName: '[action_loader.py]',
    shape: 'rect',
    clusterId: 'assistant_runtime',
    colorType: 'yellow',
    x: 620,
    y: 440,
    width: 110,
    height: 48,
    desc: 'Loads built-in hardware actions, OS bindings, and tool function schemas for dispatching.',
    metrics: 'Built-in Actions: 14 OS & Hardware Bindings',
    tabTarget: 'skills',
    actionLabel: 'View Active Actions',
    codeSnippet: `def load_actions():
    return [volume_action, brightness_action, power_mode_action]`,
  },
  {
    id: 'gemini_live',
    label: 'Live AI',
    fileName: '[gemini.py]',
    shape: 'rect',
    clusterId: 'assistant_runtime',
    colorType: 'yellow',
    x: 745,
    y: 440,
    width: 90,
    height: 48,
    desc: 'Manages conversational context streams and bidirectional real-time audio/text requests with Google GenAI.',
    metrics: 'Protocol: Full-duplex Streaming WebSocket',
    tabTarget: 'hud',
    actionLabel: 'Live AI Interface',
    codeSnippet: `class LiveAISession:
    async def stream_conversation(self, prompt):
        return await gemini_service.stream_generate(prompt)`,
  },

  // 3. Context and Memory Subsystem
  {
    id: 'config_manager',
    label: 'Assistant settings',
    fileName: '[config_manager.py]',
    shape: 'cylinder',
    clusterId: 'context_memory',
    colorType: 'red',
    x: 45,
    y: 635,
    width: 105,
    height: 60,
    desc: 'Reads and stores operational parameters: voice pitch, assistant designation, and optical HUD themes.',
    metrics: 'Format: Persistent JSON · Auto-sync: Enabled',
    actionLabel: 'Inspect Configuration',
    codeSnippet: `def read_settings():
    with open("config.json", "r") as f:
        return json.load(f)`,
  },
  {
    id: 'memory_manager',
    label: 'Persistent memory',
    fileName: '[memory_manager.py]',
    shape: 'cylinder',
    clusterId: 'context_memory',
    colorType: 'red',
    x: 165,
    y: 635,
    width: 105,
    height: 60,
    desc: 'Reads, vectorizes, and updates long-term facts regarding projects, people, preferences, and conversations.',
    metrics: 'Storage: IndexedDB & Persistent Storage Matrix',
    tabTarget: 'memory',
    testDirective: 'Remember that project deployment is scheduled for Friday',
    actionLabel: 'Open Memory Matrix',
    codeSnippet: `def save_memory(fact: str, category: str):
    record = {"id": uuid4().hex, "fact": fact, "ts": time.time()}
    store.append(record)`,
  },

  // 4. Actions and Skills Subsystem
  {
    id: 'web_search',
    label: 'Web search',
    fileName: '[web_search.py]',
    shape: 'rect',
    clusterId: 'actions_skills',
    colorType: 'green',
    x: 325,
    y: 640,
    width: 105,
    height: 48,
    desc: 'Queries internet knowledge bases and search engines for up-to-the-minute global information.',
    metrics: 'Sources: DuckDuckGo Instant & Real-Time Scrapers',
    testDirective: 'Search James Webb telescope latest discoveries',
    actionLabel: 'Execute Live Web Search',
    codeSnippet: `def search_web(query: str):
    res = requests.get(f"https://api.duckduckgo.com/?q={query}&format=json")
    return res.json().get("AbstractText")`,
  },
  {
    id: 'file_controller',
    label: 'File operations',
    fileName: '[file_controller.py]',
    shape: 'rect',
    clusterId: 'actions_skills',
    colorType: 'green',
    x: 445,
    y: 640,
    width: 115,
    height: 48,
    desc: 'Automates filesystem reads, note creation, file inspection, and workspace audits with rollback tokens.',
    metrics: 'Workspace: ~/JarvisWorkspace',
    tabTarget: 'files',
    testDirective: 'Create file test_memo.txt',
    actionLabel: 'Open Workspace Files',
    codeSnippet: `def file_operation(action, filename, content=None):
    if action == "write":
        with open(filename, "w") as f:
            f.write(content)
        undo_journal.record("file_write", filename)`,
  },
  {
    id: 'screen_vision',
    label: 'Screen processing',
    fileName: '[screen_vision.py]',
    shape: 'rect',
    clusterId: 'actions_skills',
    colorType: 'green',
    x: 575,
    y: 640,
    width: 110,
    height: 48,
    desc: 'Captures display frames and applies multimodal vision analysis to understand active desktop state.',
    metrics: 'Capture: 60 FPS Framebuffer Hook',
    tabTarget: 'vision',
    actionLabel: 'Open Screen Vision',
    codeSnippet: `def capture_screen():
    frame = ImageGrab.grab()
    return gemini_vision.inspect(frame)`,
  },
  {
    id: 'optional_skills',
    label: 'Optional skills',
    shape: 'rect',
    clusterId: 'actions_skills',
    colorType: 'green',
    x: 700,
    y: 640,
    width: 90,
    height: 48,
    desc: 'Community and custom external tool plugins loaded dynamically by plugin_loader.py.',
    metrics: 'Sandbox: Isolated Python Namespace',
    tabTarget: 'skills',
    actionLabel: 'Inspect Optional Skills',
    codeSnippet: `class CommunitySkill:
    def execute(self, params):
        return execute_user_script(params)`,
  },
  {
    id: 'built_in_skills',
    label: 'Built-in skills',
    shape: 'rect',
    clusterId: 'actions_skills',
    colorType: 'green',
    x: 800,
    y: 640,
    width: 90,
    height: 48,
    desc: 'Core native skills: volume, brightness, power profiles, window management, and hardware sensors.',
    metrics: 'Status: Built-in Subsystems Online',
    tabTarget: 'system',
    actionLabel: 'View Built-in Skills',
    codeSnippet: `class BuiltInHardwareSkills:
    def set_volume(self, level): ...
    def set_power_mode(self, mode): ...`,
  },

  // 5. Display and Remote Subsystem
  {
    id: 'desktop_hud',
    label: 'Desktop HUD',
    fileName: '[ui.py]',
    shape: 'rect',
    clusterId: 'display_remote',
    colorType: 'blue',
    x: 935,
    y: 630,
    width: 95,
    height: 48,
    desc: 'Primary holographic viewport rendering the command stream, telemetry graphs, and spatial interaction.',
    metrics: 'Interface: Stark HUD MK 85',
    tabTarget: 'hud',
    actionLabel: 'Open Desktop HUD',
    codeSnippet: `def update_hud(telemetry_data):
    ui.render_stream(telemetry_data)
    ui.draw_arc_reactor()`,
  },
  {
    id: 'animated_avatar',
    label: 'Holographic avatar',
    fileName: '[avatar.py]',
    shape: 'rect',
    clusterId: 'display_remote',
    colorType: 'blue',
    x: 935,
    y: 710,
    width: 105,
    height: 48,
    desc: 'Audio-reactive lip-sync, 3D gyroscopic ring physics, and holographic core visualizer.',
    metrics: 'Render: WebGL / HTML5 60 FPS Core',
    tabTarget: 'hud',
    actionLabel: 'View Holographic Core',
    codeSnippet: `def render_avatar(audio_energy):
    gyros.rotate(speed=audio_energy * 3)
    core.pulse(intensity=audio_energy)`,
  },
  {
    id: 'remote_dashboard',
    label: 'Phone dashboard',
    fileName: '[server.py]',
    shape: 'rect',
    clusterId: 'display_remote',
    colorType: 'blue',
    x: 1045,
    y: 630,
    width: 95,
    height: 48,
    desc: 'Web & WebSocket server allowing remote smartphone dashboards to query and trigger assistant actions.',
    metrics: 'Port: 3000 · Protocol: HTTP/WS',
    actionType: 'phone',
    actionLabel: 'Open Phone Remote',
    codeSnippet: `app.post("/api/command", (req, res) => {
    orchestrator.enqueue(req.body.command);
    res.json({ status: "queued" });
});`,
  },

  // External Entities
  {
    id: 'phone_user',
    label: 'Phone user',
    shape: 'circle',
    colorType: 'blue',
    x: 885,
    y: 435,
    width: 68,
    height: 68,
    desc: 'Remote operator interacting via StarkPhone Android mobile companion app.',
    metrics: 'Remote: WebSocket & PWA Client',
    actionType: 'phone',
    actionLabel: 'Open Phone Remote',
    codeSnippet: `// Mobile Client
phoneBridge.dispatchCommand("Jarvis, check telemetry");`,
  },
  {
    id: 'web_sources',
    label: 'Web sources',
    shape: 'rect',
    colorType: 'purple',
    x: 230,
    y: 810,
    width: 100,
    height: 42,
    desc: 'External internet endpoints, DuckDuckGo APIs, RSS feeds, and online knowledge graphs.',
    metrics: 'Internet: HTTPS Queries Active',
    codeSnippet: `// Web Sources
https://api.duckduckgo.com/`,
  },
  {
    id: 'computer_os',
    label: 'Computer and OS',
    shape: 'rect',
    colorType: 'purple',
    x: 570,
    y: 810,
    width: 120,
    height: 42,
    desc: 'Native operating system subsystem: process tree, ACPI thermal sensors, display buffer, and audio drivers.',
    metrics: 'Kernel Drivers & ACPI Telemetry',
    tabTarget: 'system',
    actionLabel: 'Open OS Controls',
    codeSnippet: `# Computer & OS Subsystem
amixer / AudioEndpointVolume
cat /sys/class/thermal/thermal_zone0/temp`,
  },
  {
    id: 'gemini_service',
    label: 'Gemini service',
    shape: 'rect',
    colorType: 'purple',
    x: 980,
    y: 540,
    width: 105,
    height: 42,
    desc: 'Cloud foundation model endpoint: models/gemini-3.8-flash providing reasoning and generative speech.',
    metrics: 'Cloud: Google GenAI Streaming API',
    codeSnippet: `# Cloud Gemini Service
ai.models.generate_content(
    model="gemini-3.8-flash",
    contents=prompt
)`,
  },
];

// All labeled connections matching diagram (1).png
export const DIAGRAM_EDGES: DiagramEdgeDef[] = [
  { id: 'e1', source: 'user', target: 'wake_word', label: 'speaks' },
  { id: 'e2', source: 'wake_word', target: 'orchestrator', label: 'gates listening' },
  { id: 'e3', source: 'stt', target: 'orchestrator', label: 'transcribes' },
  { id: 'e4', source: 'orchestrator', target: 'tts', label: 'synthesizes replies' },
  { id: 'e5', source: 'tts', target: 'echo_guard', label: 'filters self-echo' },
  { id: 'e6', source: 'orchestrator', target: 'llm_client', label: 'requests planning' },
  { id: 'e7', source: 'llm_client', target: 'orchestrator', label: 'task dag', style: 'dashed' },
  { id: 'e8', source: 'orchestrator', target: 'plugin_loader', label: 'loads plugins' },
  { id: 'e9', source: 'plugin_loader', target: 'optional_skills', label: 'dispatches tools' },
  { id: 'e10', source: 'optional_skills', target: 'plugin_loader', label: 'discovers' },
  { id: 'e11', source: 'orchestrator', target: 'action_loader', label: 'loads skills' },
  { id: 'e12', source: 'action_loader', target: 'built_in_skills', label: 'dispatches tools' },
  { id: 'e13', source: 'built_in_skills', target: 'action_loader', label: 'discovers' },
  { id: 'e14', source: 'orchestrator', target: 'gemini_live', label: 'sends conversation' },
  { id: 'e15', source: 'gemini_live', target: 'gemini_service', label: 'streams requests' },
  { id: 'e16', source: 'gemini_service', target: 'orchestrator', label: 'returns responses' },
  { id: 'e17', source: 'orchestrator', target: 'config_manager', label: 'reads settings' },
  { id: 'e18', source: 'orchestrator', target: 'memory_manager', label: 'reads and updates' },
  { id: 'e19', source: 'orchestrator', target: 'web_search', label: 'requests information' },
  { id: 'e20', source: 'web_search', target: 'web_sources', label: 'searches sources' },
  { id: 'e21', source: 'orchestrator', target: 'screen_vision', label: 'requests perception' },
  { id: 'e22', source: 'screen_vision', target: 'computer_os', label: 'captures screen' },
  { id: 'e23', source: 'orchestrator', target: 'desktop_hud', label: 'updates HUD' },
  { id: 'e24', source: 'desktop_hud', target: 'animated_avatar', label: 'renders face' },
  { id: 'e25', source: 'phone_user', target: 'remote_dashboard', label: 'sends commands' },
  { id: 'e26', source: 'remote_dashboard', target: 'orchestrator', label: 'queues commands' },
  { id: 'e27', source: 'phone_user', target: 'computer_os', label: 'controls computer' },
];

export interface DiagramSimulationPreset {
  id: string;
  name: string;
  directive: string;
  sequence: {
    nodeId: DiagramNodeId;
    edgeId?: string;
    actionLabel: string;
    details: string;
  }[];
}

export const DIAGRAM_SIMULATION_PRESETS: DiagramSimulationPreset[] = [
  {
    id: 'voice_pipeline',
    name: 'Voice Ingress & Synthesis',
    directive: 'Jarvis, adjust volume and report acoustic latency',
    sequence: [
      { nodeId: 'user', actionLabel: 'Spoken Directive', details: 'Acoustic waveform emitted by user' },
      { nodeId: 'wake_word', edgeId: 'e1', actionLabel: 'Keyphrase Verification', details: 'wake_word.py verifies "Hey Jarvis"' },
      { nodeId: 'stt', edgeId: 'e1', actionLabel: 'Speech Tokenization', details: 'stt.py transcribes audio into text stream' },
      { nodeId: 'orchestrator', edgeId: 'e3', actionLabel: 'Central Routing', details: 'main.py parses intent and dispatches tasks' },
      { nodeId: 'action_loader', edgeId: 'e11', actionLabel: 'Tool Discovery', details: 'action_loader.py resolves hardware skills' },
      { nodeId: 'built_in_skills', edgeId: 'e12', actionLabel: 'Hardware Binding', details: 'Built-in audio actuator adjusts system volume' },
      { nodeId: 'tts', edgeId: 'e4', actionLabel: 'Acoustic Synthesis', details: 'tts.py synthesizes confirmation response' },
      { nodeId: 'echo_guard', edgeId: 'e5', actionLabel: 'Echo Filtration', details: 'echo.py cancels self-audio loopback' },
      { nodeId: 'desktop_hud', edgeId: 'e23', actionLabel: 'HUD Sync', details: 'ui.py updates active volume and telemetry display' },
      { nodeId: 'animated_avatar', edgeId: 'e24', actionLabel: 'Face Rendering', details: 'avatar.py renders audio-reactive lip-sync rings' },
    ],
  },
  {
    id: 'gemini_live_flow',
    name: 'Live AI Cloud Reasoning',
    directive: 'Jarvis, analyze multi-vector aerospace trajectory',
    sequence: [
      { nodeId: 'user', actionLabel: 'Complex Directive', details: 'User queries complex multi-variable problem' },
      { nodeId: 'stt', edgeId: 'e1', actionLabel: 'Transcription', details: 'Audio stream transcribed to prompt buffer' },
      { nodeId: 'orchestrator', edgeId: 'e3', actionLabel: 'Route to Live AI', details: 'main.py directs stream to gemini.py' },
      { nodeId: 'gemini_live', edgeId: 'e14', actionLabel: 'Session Stream', details: 'gemini.py opens bidirectional websocket payload' },
      { nodeId: 'gemini_service', edgeId: 'e15', actionLabel: 'Cloud Inference', details: 'Google GenAI models/gemini-3.8-flash generates response' },
      { nodeId: 'orchestrator', edgeId: 'e16', actionLabel: 'Response Enqueue', details: 'Stream returned to main.py kernel' },
      { nodeId: 'tts', edgeId: 'e4', actionLabel: 'Audible Playback', details: 'Synthesizes articulate analytical breakdown' },
    ],
  },
  {
    id: 'screen_perception',
    name: 'Screen Perception & OS Control',
    directive: 'Jarvis, inspect active code editor window for syntax bugs',
    sequence: [
      { nodeId: 'user', actionLabel: 'Perception Request', details: 'User commands screen inspection' },
      { nodeId: 'orchestrator', actionLabel: 'Intent Dispatch', details: 'main.py requests visual perception pipeline' },
      { nodeId: 'screen_vision', edgeId: 'e21', actionLabel: 'Screen Processing', details: 'screen_vision.py requests desktop framebuffer' },
      { nodeId: 'computer_os', edgeId: 'e22', actionLabel: 'Display Capture', details: 'Captures display screen buffer from OS' },
      { nodeId: 'llm_client', edgeId: 'e6', actionLabel: 'Model Planning', details: 'llm_client.py structures multimodal prompt' },
      { nodeId: 'tts', edgeId: 'e4', actionLabel: 'Vocal Report', details: 'tts.py announces syntax inspection findings' },
    ],
  },
  {
    id: 'phone_remote_flow',
    name: 'Phone User Remote Bridge',
    directive: 'StarkPhone Remote: "Lock desktop and engage power saver"',
    sequence: [
      { nodeId: 'phone_user', actionLabel: 'Mobile Trigger', details: 'Phone user sends directive via companion app' },
      { nodeId: 'remote_dashboard', edgeId: 'e25', actionLabel: 'Server Socket', details: 'server.py accepts remote command packet' },
      { nodeId: 'orchestrator', edgeId: 'e26', actionLabel: 'Queue Ingestion', details: 'main.py validates signature and enqueues action' },
      { nodeId: 'computer_os', edgeId: 'e27', actionLabel: 'OS Execution', details: 'Native OS locks workstation & triggers power saving' },
      { nodeId: 'desktop_hud', edgeId: 'e23', actionLabel: 'HUD State Update', details: 'ui.py switches to power saver HUD theme' },
    ],
  },
  {
    id: 'knowledge_memory_flow',
    name: 'Web Search & Persistent Memory',
    directive: 'Jarvis, search Mars sample return status and remember summary',
    sequence: [
      { nodeId: 'user', actionLabel: 'Fact Storage Directive', details: 'User requests web research and long-term memory update' },
      { nodeId: 'orchestrator', actionLabel: 'Kernel Routing', details: 'main.py dispatches web query and memory pipeline' },
      { nodeId: 'web_search', edgeId: 'e19', actionLabel: 'Information Request', details: 'web_search.py executes query request' },
      { nodeId: 'web_sources', edgeId: 'e20', actionLabel: 'Internet Ingress', details: 'Queries DuckDuckGo & online knowledge bases' },
      { nodeId: 'memory_manager', edgeId: 'e18', actionLabel: 'State Journal', details: 'memory_manager.py vectorizes & writes to memory' },
      { nodeId: 'tts', edgeId: 'e4', actionLabel: 'Voice Feedback', details: 'tts.py articulates concise research summary' },
    ],
  },
];

