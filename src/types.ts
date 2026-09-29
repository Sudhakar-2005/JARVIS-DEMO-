export type JarvisState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing';

export type HUDTheme =
  | 'cyan'
  | 'crimson'
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'deep-space'
  | 'stark-mansion'
  | 'emergency';

export interface ThemeColors {
  name: string;
  primary: string;
  primaryGlow: string;
  secondary: string;
  border: string;
  bgGlow: string;
  accent: string;
  text: string;
  ringColor: string;
}

export interface MemoryItem {
  id: string;
  category: 'person' | 'project' | 'preference' | 'conversation' | 'note';
  title: string;
  content: string;
  timestamp: string;
  source: 'voice' | 'manual' | 'system';
}

export interface SkillPlugin {
  id: string;
  name: string;
  filename: string;
  description: string;
  author: string;
  version: string;
  triggers: string[];
  pythonCode: string;
  isEnabled: boolean;
  category: 'system' | 'web' | 'utility' | 'productivity' | 'entertainment';
}

export type PowerMode = 'balanced' | 'performance' | 'saver';

export interface SystemState {
  os: 'windows' | 'macos' | 'linux' | 'android';
  volume: number;
  brightness: number;
  isMuted: boolean;
  activeWindow: string;
  openWindows: string[];
  cpuUsage: number;
  ramUsage: number;
  battery: number;
  isCharging: boolean;
  installedApps: { name: string; icon: string; category: string }[];
  androidTorch?: boolean;
  cpuTemp?: number;
  gpuTemp?: number;
  gpuUsage?: number;
  fanSpeed?: number;
  powerMode?: PowerMode;
}

export interface ThermalTelemetryEntry {
  id: string;
  timestamp: string;
  cpuTemp: number;
  gpuTemp: number;
  cpuUsage: number;
  gpuUsage: number;
  fanSpeed: number;
  status: 'nominal' | 'elevated' | 'critical';
}

export interface VoiceConfig {
  wakePhrase: string;
  assistantName: string;
  speechRate: number;
  pitch: number;
  voiceName: string;
  pushToTalk: boolean;
  pushToTalkKey: string;
  soundEffects: boolean;
  continuousListening: boolean;
  hapticFeedback: boolean;
}

export interface CommandLogItem {
  id: string;
  timestamp: string;
  type: 'user' | 'assistant' | 'system' | 'command';
  text: string;
  details?: {
    action?: string;
    target?: string;
    params?: any;
    output?: string;
    flowPath?: DiagramNodeId[];
  };
  status?: 'success' | 'running' | 'failed' | 'info';
}

export interface WeatherData {
  location: string;
  temperature: number;
  unit: 'C' | 'F';
  condition: string;
  humidity: number;
  windSpeed: number;
  apparentTemp: number;
  isDay: boolean;
  description: string;
}

export interface UndoRecord {
  id: string;
  timestamp: string;
  title: string;
  category: 'system' | 'file' | 'memory' | 'browser' | 'config';
  previousStateSummary: string;
  currentStateSummary: string;
  canRevert: boolean;
  reverted?: boolean;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  content: string;
  size: number;
  updatedAt: string;
  type: 'code' | 'text' | 'json' | 'markdown';
}

export interface TaskPlanStep {
  id: string;
  title: string;
  module: 'action_loader' | 'file_controller' | 'browser_control' | 'screen_vision' | 'web_search' | 'memory_manager';
  tool: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
}

export interface TaskPlan {
  id: string;
  userDirective: string;
  status: 'planning' | 'executing' | 'completed';
  steps: TaskPlanStep[];
  timestamp: string;
}

export interface VisionAnalysis {
  timestamp: string;
  summary: string;
  elementsDetected: string[];
  suggestedAction: string;
  previewUrl?: string;
  rawAnalysis?: string;
}

export interface PhoneRemoteCommand {
  id: string;
  device: string;
  command: string;
  timestamp: string;
  status: 'queued' | 'executing' | 'completed';
}

export type DiagramNodeId =
  | 'user'
  | 'stt'
  | 'wake_word'
  | 'orchestrator'
  | 'tts'
  | 'echo_guard'
  | 'action_loader'
  | 'llm_client'
  | 'plugin_loader'
  | 'gemini_live'
  | 'gemini_service'
  | 'system_actions'
  | 'file_controller'
  | 'browser_control'
  | 'screen_vision'
  | 'web_search'
  | 'web_sources'
  | 'memory_manager'
  | 'undo_history'
  | 'config_manager'
  | 'phone_user'
  | 'remote_dashboard'
  | 'animated_avatar'
  | 'desktop_hud'
  | 'optional_skills'
  | 'built_in_skills'
  | 'computer_os';

// ==========================================
// SPATIAL SCREEN INTERACTION ENGINE V1 TYPES
// ==========================================

export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface HandData {
  handedness: 'left' | 'right';
  confidence: number;
  landmarks: HandLandmark[];
  palmCenter: { x: number; y: number };
  indexTip: { x: number; y: number };
  thumbTip: { x: number; y: number };
  pinchDistance: number;
  isPinching: boolean;
  isPointing: boolean;
  isOpenPalm: boolean;
  isFist: boolean;
}

export type SpatialGestureType =
  | 'none'
  | 'point'
  | 'pinch'
  | 'pinch_drag'
  | 'open_palm'
  | 'fist'
  | 'two_hand_zoom_in'
  | 'two_hand_zoom_out'
  | 'two_hand_rotate';

export type SpatialIntent =
  | 'NONE'
  | 'POINTER_MOVE'
  | 'SELECT'
  | 'DRAG'
  | 'DROP'
  | 'PAUSE_INTERACTION'
  | 'CANCEL_INTERACTION'
  | 'ZOOM_IN'
  | 'ZOOM_OUT'
  | 'ROTATE';

export type SpatialInteractionState =
  | 'INACTIVE'
  | 'ACTIVATING'
  | 'TRACKING'
  | 'HOVERING'
  | 'PINCH_DETECTED'
  | 'SELECTING'
  | 'DRAGGING'
  | 'PAUSED'
  | 'CANCELLED'
  | 'LOST_HAND'
  | 'CAMERA_ERROR';

export interface SpatialSettings {
  enabled: boolean;
  sensitivity: number;
  confidenceThreshold: number;
  smoothingFactor: number;
  mirrorMode: boolean;
  debugMode: boolean;
  selectedCameraId: string;
}

export interface SpatialPointerPosition {
  x: number;
  y: number;
  rawX: number;
  rawY: number;
  targetElementText?: string;
  isOverInteractiveElement: boolean;
}

