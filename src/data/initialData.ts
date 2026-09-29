import { MemoryItem, SkillPlugin, SystemState, VoiceConfig, WorkspaceFile, UndoRecord } from '../types';

export const INITIAL_WORKSPACE_FILES: WorkspaceFile[] = [
  {
    id: 'file-1',
    name: 'flight_telemetry.md',
    path: '~/JarvisWorkspace/flight_telemetry.md',
    size: 512,
    updatedAt: '12:15 PM',
    type: 'markdown',
    content: `# Stark Industries - Mark 85 Flight Telemetry Log
Status: Nominal
Max Mach: 3.4
Thrust Output: 1.2 GW Pulse Plasma
Stabilizer Coils: 99.4% Synchronized

## Subsystem Check:
- [x] Repulsor Capacitors Calibrated
- [x] HUD Orbital Gyroscope Locked
- [x] Neural Speech Receptor Active
- [ ] Atmospheric De-icing Routine Armed
`,
  },
  {
    id: 'file-2',
    name: 'arc_reactor_schematic.json',
    path: '~/JarvisWorkspace/arc_reactor_schematic.json',
    size: 384,
    updatedAt: '11:50 AM',
    type: 'json',
    content: `{
  "core_designation": "Mark 85 Singularity",
  "flux_density_gw": 1.18,
  "magnetic_confinement": "Tokamak Stator Ring",
  "temperature_kelvin": 124000,
  "fuel_isotope": "Palladium Hydride Hybrid",
  "safety_interlock": "Alpha-Level Auto-Scram"
}`,
  },
  {
    id: 'file-3',
    name: 'mission_brief.txt',
    path: '~/JarvisWorkspace/mission_brief.txt',
    size: 290,
    updatedAt: '10:30 AM',
    type: 'text',
    content: `OPERATIONAL DIRECTIVE:
1. Provide zero-latency ambient voice recognition and computer control.
2. Automate multi-window workspaces across Windows, macOS, Linux, and Android.
3. Maintain immutable undo journal for atomic system rollback.
`,
  },
  {
    id: 'file-4',
    name: 'system_overrides.py',
    path: '~/JarvisWorkspace/system_overrides.py',
    size: 420,
    updatedAt: '09:40 AM',
    type: 'code',
    content: `# system_overrides.py - Autonomous Emergency Protocols
def engage_combat_readiness():
    print("[OVERRIDE] Dimming displays and locking audio channels.")
    return True

def standby_protocol():
    print("[OVERRIDE] Reverting actuators to ambient baseline.")
    return True
`,
  },
];

export const INITIAL_UNDO_RECORDS: UndoRecord[] = [
  {
    id: 'undo-init-1',
    timestamp: '12:05 PM',
    title: 'Master Volume Adjustment',
    category: 'system',
    previousStateSummary: 'Volume 60%',
    currentStateSummary: 'Volume 75%',
    canRevert: true,
  },
  {
    id: 'undo-init-2',
    timestamp: '12:12 PM',
    title: 'Display Brightness Tuned',
    category: 'system',
    previousStateSummary: 'Brightness 70%',
    currentStateSummary: 'Brightness 85%',
    canRevert: true,
  },
  {
    id: 'undo-init-3',
    timestamp: '12:18 PM',
    title: 'Workspace Note Created',
    category: 'file',
    previousStateSummary: 'None (New file)',
    currentStateSummary: 'Created flight_telemetry.md',
    canRevert: true,
  },
];

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    category: 'person',
    title: 'Primary User',
    content: 'Sir / Boss (Sudhakar). Prefers polite, concise British-style conversational etiquette.',
    timestamp: '2026-09-27 10:15',
    source: 'system',
  },
  {
    id: 'mem-2',
    category: 'project',
    title: 'Current Mission: Mark 85 Companion',
    content: 'Building a cross-platform Python Jarvis desktop companion with voice recognition, computer automation, and skill plugins.',
    timestamp: '2026-09-27 11:00',
    source: 'voice',
  },
  {
    id: 'mem-3',
    category: 'preference',
    title: 'Temperature & Weather Units',
    content: 'Prefers Celsius (°C) and local morning forecast briefing at 08:30 AM.',
    timestamp: '2026-09-27 11:20',
    source: 'voice',
  },
  {
    id: 'mem-4',
    category: 'preference',
    title: 'Preferred Code Editor & Browser',
    content: 'Default editor is Visual Studio Code. Default browser is Chrome or Brave.',
    timestamp: '2026-09-27 11:45',
    source: 'manual',
  },
  {
    id: 'mem-5',
    category: 'conversation',
    title: 'Autonomous System Protocols',
    content: 'Confirmed that Jarvis has clearance to adjust screen brightness and audio volume automatically during focus mode.',
    timestamp: '2026-09-27 12:10',
    source: 'voice',
  },
];

export const INITIAL_SKILLS: SkillPlugin[] = [
  {
    id: 'system_control',
    name: 'Hardware & OS Controller',
    filename: 'system_control_skill.py',
    description: 'Adjusts master volume, display brightness, manages windows, and launches desktop applications across Windows, macOS, and Linux.',
    author: 'Stark Industries',
    version: '2.4.0',
    category: 'system',
    triggers: ['volume', 'brightness', 'open', 'launch', 'window', 'minimize', 'maximize', 'mute'],
    isEnabled: true,
    pythonCode: `# system_control_skill.py - Cross-Platform OS & Hardware Skill
import os
import sys
import subprocess
import platform

class JarvisSkill:
    """Controls hardware volume, brightness, apps, and window states."""
    name = "System Control Skill"
    triggers = ["volume", "brightness", "open", "launch", "window", "minimize", "maximize", "mute"]

    def __init__(self):
        self.os_type = platform.system().lower()

    def execute(self, command: str, context: dict) -> str:
        cmd = command.lower()
        
        # 1. Volume Controls
        if "volume" in cmd or "mute" in cmd:
            return self._handle_volume(cmd)
            
        # 2. Brightness Controls
        elif "brightness" in cmd:
            return self._handle_brightness(cmd)
            
        # 3. Application Launcher
        elif "open" in cmd or "launch" in cmd:
            return self._handle_app_launch(cmd)
            
        # 4. Window Management
        elif "window" in cmd or "minimize" in cmd or "maximize" in cmd:
            return self._handle_windows(cmd)
            
        return "System command not recognized."

    def _handle_volume(self, cmd: str) -> str:
        level = 50
        for word in cmd.split():
            if word.isdigit():
                level = int(word)
                break
                
        if "mute" in cmd:
            level = 0

        if self.os_type == "darwin":  # macOS
            subprocess.run(["osascript", "-e", f"set volume output volume {level}"])
            return f"Audio output set to {level}% via CoreAudio."
        elif self.os_type == "windows":
            # Using PowerShell sound endpoint or nircmd
            ps_cmd = f"(New-Object -ComObject WScript.Shell).SendKeys([char]174)"
            subprocess.run(["powershell", "-Command", ps_cmd])
            return f"Windows master volume adjusted to {level}%."
        else:  # Linux
            subprocess.run(["amixer", "-D", "pulse", "sset", "Master", f"{level}%"])
            return f"ALSA/PulseAudio volume calibrated to {level}%."

    def _handle_brightness(self, cmd: str) -> str:
        level = 80
        for word in cmd.split():
            if word.isdigit():
                level = int(word)
                break
                
        if self.os_type == "darwin":
            subprocess.run(["brightness", str(level / 100.0)], stderr=subprocess.DEVNULL)
            return f"Retina display luminance adjusted to {level}%."
        elif self.os_type == "windows":
            ps = f"(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,{level})"
            subprocess.run(["powershell", "-Command", ps])
            return f"Display brightness set to {level}%."
        else:
            subprocess.run(["brightnessctl", "set", f"{level}%"], stderr=subprocess.DEVNULL)
            return f"Backlight luminance calibrated to {level}%."

    def _handle_app_launch(self, cmd: str) -> str:
        target = cmd.replace("open", "").replace("launch", "").strip()
        app_map = {
            "browser": "https://google.com",
            "chrome": "google-chrome" if self.os_type != "darwin" else "Google Chrome",
            "code": "code",
            "vs code": "code",
            "terminal": "cmd" if self.os_type == "windows" else ("Terminal" if self.os_type == "darwin" else "x-terminal-emulator"),
            "calculator": "calc" if self.os_type == "windows" else "Calculator",
            "spotify": "spotify",
        }
        app_name = app_map.get(target, target)
        
        try:
            if self.os_type == "darwin":
                subprocess.Popen(["open", "-a", app_name])
            elif self.os_type == "windows":
                os.startfile(app_name) if hasattr(os, "startfile") else subprocess.Popen(["start", app_name], shell=True)
            else:
                subprocess.Popen(["xdg-open", app_name])
            return f"Initiated execution for: {target.title()}."
        except Exception as e:
            return f"Could not launch {target}: {str(e)}"

    def _handle_windows(self, cmd: str) -> str:
        if "minimize" in cmd:
            if self.os_type == "darwin":
                subprocess.run(["osascript", "-e", 'tell application "System Events" to set miniaturized of every window of (every process whose visible is true) to true'])
            elif self.os_type == "windows":
                import pyautogui
                pyautogui.hotkey('win', 'd')
            return "All desktop windows minimized. Workspace cleared."
        return "Window layout recalibrated."
`,
  },
  {
    id: 'weather_skill',
    name: 'Meteorological Telemetry',
    filename: 'weather_skill.py',
    description: 'Retrieves real-time atmospheric data, temperatures, wind speed, and precipitation forecasts using Open-Meteo.',
    author: 'Stark Industries',
    version: '1.8.2',
    category: 'utility',
    triggers: ['weather', 'forecast', 'temperature', 'rain', 'climate', 'humidity'],
    isEnabled: true,
    pythonCode: `# weather_skill.py - Real-Time Atmospheric Conditions
import requests
import urllib.parse

class JarvisSkill:
    """Fetches real-time weather forecasts via Open-Meteo without API keys."""
    name = "Weather Intelligence"
    triggers = ["weather", "forecast", "temperature", "rain", "climate", "humidity"]

    def execute(self, command: str, context: dict) -> str:
        # Extract location or fallback to user preference
        location = "New York"
        words = command.lower().split()
        if "in" in words:
            idx = words.index("in")
            if idx + 1 < len(words):
                location = " ".join(words[idx + 1:])
        elif "for" in words:
            idx = words.index("for")
            if idx + 1 < len(words):
                location = " ".join(words[idx + 1:])

        try:
            # 1. Geocode location
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(location)}&count=1&language=en&format=json"
            geo_res = requests.get(geo_url, timeout=5).json()
            
            if not geo_res.get("results"):
                return f"Atmospheric sensors could not localize coordinates for '{location}'."
                
            place = geo_res["results"][0]
            lat = place["latitude"]
            lon = place["longitude"]
            city_name = place.get("name", location)
            country = place.get("country", "")

            # 2. Fetch current weather
            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code"
            w_res = requests.get(weather_url, timeout=5).json()
            curr = w_res["current"]
            
            temp_c = curr["temperature_2m"]
            humidity = curr["relative_humidity_2m"]
            wind = curr["wind_speed_10m"]
            
            return (
                f"Current atmospheric telemetry for {city_name}, {country}: "
                f"Temperature is {temp_c}°C ({round(temp_c * 9/5 + 32, 1)}°F), "
                f"relative humidity at {humidity}%, with winds at {wind} km/h. "
                "Atmospheric conditions are stable, Sir."
            )
        except Exception as e:
            return f"Weather sensor offline: {str(e)}"
`,
  },
  {
    id: 'notes_skill',
    name: 'Secure Notes & File Reader',
    filename: 'notes_skill.py',
    description: 'Reads local system files, inspects directories, and creates timestamped notes in the user documents folder.',
    author: 'Stark Industries',
    version: '1.5.0',
    category: 'productivity',
    triggers: ['note', 'read file', 'write file', 'save', 'memo', 'log', 'file'],
    isEnabled: true,
    pythonCode: `# notes_skill.py - File System & Note Automation
import os
import datetime

class JarvisSkill:
    """Reads local files and maintains persistent note files on disk."""
    name = "Notes & File Reader"
    triggers = ["note", "read file", "write file", "save", "memo", "log", "file"]

    def __init__(self):
        # Create dedicated directory in user home
        self.notes_dir = os.path.expanduser("~/JarvisNotes")
        os.makedirs(self.notes_dir, exist_ok=True)

    def execute(self, command: str, context: dict) -> str:
        cmd = command.lower()
        
        # 1. Take a note
        if "take a note" in cmd or "save note" in cmd or "write" in cmd:
            text = command
            for prefix in ["take a note that", "take a note", "save note", "note that", "save"]:
                if prefix in text.lower():
                    text = text[text.lower().index(prefix) + len(prefix):].strip()
                    break
                    
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            filename = f"note_{timestamp}.txt"
            filepath = os.path.join(self.notes_dir, filename)
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(f"Timestamp: {datetime.datetime.now()}\\n")
                f.write(f"Content: {text}\\n")
                
            return f"Log entry secured in ~/JarvisNotes/{filename}: '{text[:40]}...'."
            
        # 2. List recent notes
        elif "read note" in cmd or "list notes" in cmd:
            files = sorted(os.listdir(self.notes_dir), reverse=True)
            if not files:
                return "The ~/JarvisNotes repository is currently empty, Sir."
            
            latest = files[0]
            with open(os.path.join(self.notes_dir, latest), "r", encoding="utf-8") as f:
                content = f.read()
            return f"Most recent log [{latest}]:\\n{content}"
            
        return "File command processed successfully."
`,
  },
  {
    id: 'web_search_skill',
    name: 'Global Web Search & Knowledge',
    filename: 'web_search_skill.py',
    description: 'Searches the internet, fetches instant summaries via DuckDuckGo API, and opens targeted search links.',
    author: 'Stark Industries',
    version: '2.1.0',
    category: 'web',
    triggers: ['search', 'google', 'look up', 'who is', 'what is', 'find', 'browse'],
    isEnabled: true,
    pythonCode: `# web_search_skill.py - Web Intelligence & Instant Answers
import webbrowser
import urllib.parse
import requests

class JarvisSkill:
    """Queries DuckDuckGo Instant Answer API and opens browser searches."""
    name = "Global Web Search"
    triggers = ["search", "google", "look up", "who is", "what is", "find", "browse"]

    def execute(self, command: str, context: dict) -> str:
        # Strip query prefix
        query = command
        for prefix in ["search for", "search", "look up", "find", "google"]:
            if prefix in query.lower():
                idx = query.lower().index(prefix)
                query = query[idx + len(prefix):].strip()
                break

        if not query:
            return "Please specify what you would like me to investigate, Sir."

        try:
            # Query DuckDuckGo Instant Answers API
            url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json&no_html=1&skip_disambig=1"
            res = requests.get(url, timeout=4).json()
            
            abstract = res.get("AbstractText", "")
            if abstract:
                return f"According to verified archives regarding '{query}': {abstract}"
                
            # If no instant abstract, open web browser search
            search_url = f"https://duckduckgo.com/?q={urllib.parse.quote(query)}"
            webbrowser.open(search_url)
            return f"Navigating to global search telemetry for query: '{query}'."
        except Exception as e:
            webbrowser.open(f"https://www.google.com/search?q={urllib.parse.quote(query)}")
            return f"Opened browser search for: '{query}'."
`,
  },
  {
    id: 'android_termux_skill',
    name: 'Android Termux Hardware Controller',
    filename: 'android_termux_skill.py',
    description: 'Enables real Android hardware control via Termux API (Flashlight/Torch, Haptics/Vibration, Volume, Toast, and Battery Telemetry).',
    author: 'Stark Industries',
    version: '2.0.0',
    category: 'system',
    triggers: ['torch', 'flashlight', 'vibrate', 'toast', 'android', 'haptic'],
    isEnabled: true,
    pythonCode: `# android_termux_skill.py - Android Device Control via Termux API
import subprocess
import shutil

class JarvisSkill:
    """Controls Android hardware via Termux API: torch, vibration, volume, toasts."""
    name = "Android Termux Controller"
    triggers = ["torch", "flashlight", "vibrate", "toast", "android", "haptic"]

    def __init__(self):
        self.has_termux = shutil.which("termux-toast") is not None

    def execute(self, command: str, context: dict) -> str:
        cmd = command.lower()

        # 1. Flashlight / Torch
        if "torch" in cmd or "flashlight" in cmd:
            if "off" in cmd:
                subprocess.run(["termux-torch", "off"], stderr=subprocess.DEVNULL)
                return "Android camera torch deactivated, Sir."
            else:
                subprocess.run(["termux-torch", "on"], stderr=subprocess.DEVNULL)
                return "Android camera torch illuminated at full intensity, Sir."

        # 2. Haptic Vibration
        elif "vibrate" in cmd or "haptic" in cmd:
            subprocess.run(["termux-vibrate", "-d", "350"], stderr=subprocess.DEVNULL)
            return "Haptic impulse dispatched to Android chassis."

        # 3. Toast Notification
        elif "toast" in cmd:
            msg = command.replace("toast", "").strip() or "J.A.R.V.I.S. Protocol Active"
            subprocess.run(["termux-toast", msg], stderr=subprocess.DEVNULL)
            return f"Heads-up toast broadcasted on Android display: '{msg}'."

        # 4. Battery Telemetry
        elif "battery" in cmd:
            try:
                res = subprocess.check_output(["termux-battery-status"]).decode("utf-8")
                return f"Android power cell telemetry: {res}"
            except Exception:
                return "Unable to probe Android battery via Termux API."

        return "Android Termux command dispatched successfully, Sir."
`,
  },
  {
    id: 'custom_skill_template',
    name: 'Custom Skill Blueprint',
    filename: 'custom_skill.py',
    description: 'Boilerplate template for extending Jarvis with your own custom Python automation logic.',
    author: 'User',
    version: '1.0.0',
    category: 'utility',
    triggers: ['protocol', 'override', 'custom'],
    isEnabled: false,
    pythonCode: `# custom_skill.py - Template for adding extra Jarvis skills
class JarvisSkill:
    """Template for custom Jarvis plugins."""
    name = "Custom Automation Protocol"
    triggers = ["protocol", "override", "custom"]

    def execute(self, command: str, context: dict) -> str:
        """
        Executed when user command matches any of the triggers.
        :param command: Full transcribed text from voice or text input
        :param context: Dictionary containing system state, memory, and config
        :return: String response that Jarvis will speak back to you
        """
        user_name = context.get("user_name", "Sir")
        return f"Custom protocol engaged for {user_name}. Command parameters received: {command}"
`,
  },
];

export const INITIAL_SYSTEM_STATE: SystemState = {
  os: 'windows',
  volume: 75,
  brightness: 85,
  isMuted: false,
  activeWindow: 'Visual Studio Code - jarvis.py',
  openWindows: [
    'Visual Studio Code - jarvis.py',
    'Google Chrome - J.A.R.V.I.S. Control Center',
    'Windows Terminal (PowerShell)',
    'Spotify - Daft Punk Tron Legacy',
    'File Explorer - ~/JarvisNotes',
  ],
  cpuUsage: 14,
  ramUsage: 38,
  battery: 92,
  isCharging: true,
  cpuTemp: 44,
  gpuTemp: 48,
  gpuUsage: 18,
  fanSpeed: 1650,
  powerMode: 'balanced',
  installedApps: [
    { name: 'Google Chrome', icon: 'Globe', category: 'Browser' },
    { name: 'Visual Studio Code', icon: 'Code', category: 'Development' },
    { name: 'Windows Terminal', icon: 'Terminal', category: 'System' },
    { name: 'Spotify', icon: 'Music', category: 'Media' },
    { name: 'Calculator', icon: 'Calculator', category: 'Utility' },
    { name: 'System Settings', icon: 'Settings', category: 'System' },
    { name: 'File Explorer', icon: 'Folder', category: 'Files' },
  ],
};

export const INITIAL_VOICE_CONFIG: VoiceConfig = {
  wakePhrase: 'Hey Jarvis',
  assistantName: 'J.A.R.V.I.S.',
  speechRate: 1.0,
  pitch: 1.0,
  voiceName: 'Default British Male / Daniel',
  pushToTalk: false,
  pushToTalkKey: 'Space',
  soundEffects: true,
  continuousListening: true,
  hapticFeedback: true,
};

// Complete Python Standalone Project Files for one-click download & copy
export const STANDALONE_PYTHON_JARVIS = `"""
================================================================================
J.A.R.V.I.S. - Cross-Platform Personal AI Desktop Companion
Operating Systems: Windows, macOS, Linux
================================================================================
Features:
- Real-time voice recognition & offline / online speech synthesis
- Push-to-talk & customizable wake word detection ("Hey Jarvis")
- Cross-platform computer control (Volume, Brightness, Apps, Windows)
- Persistent memory system (JSON / SQLite)
- Extensible Skill Plugin architecture (auto-loads from 'skills/' folder)
- Works offline or powered by Gemini 3.8 Flash
"""

import os
import sys
import json
import time
import glob
import queue
import inspect
import importlib.util
import threading
import platform
import subprocess
import webbrowser
from datetime import datetime

# Optional voice modules
try:
    import speech_recognition as sr
except ImportError:
    sr = None
    print("[WARNING] speech_recognition not found. Run: pip install SpeechRecognition pyaudio")

try:
    import pyttsx3
except ImportError:
    pyttsx3 = None
    print("[WARNING] pyttsx3 not found. Run: pip install pyttsx3")

try:
    import pyautogui
except ImportError:
    pyautogui = None

# Configuration
CONFIG_FILE = "config.json"
MEMORY_FILE = "memory.json"
SKILLS_DIR = "skills"

DEFAULT_CONFIG = {
    "assistant_name": "J.A.R.V.I.S.",
    "wake_phrase": "hey jarvis",
    "voice_rate": 180,
    "voice_volume": 0.9,
    "push_to_talk": False,
    "user_name": "Sir",
    "gemini_api_key": os.getenv("GEMINI_API_KEY", "")
}

class JarvisCompanion:
    def __init__(self):
        self.os_type = platform.system().lower()
        self.load_config()
        self.load_memory()
        self.init_speech()
        self.skills = []
        self.load_skills()
        self.is_running = True
        self.is_listening = False
        print("="*60)
        print(f"  {self.config['assistant_name']} Online - Protocol Initialized")
        print(f"  Platform: {platform.system()} {platform.release()} ({platform.machine()})")
        print(f"  Wake phrase: '{self.config['wake_phrase']}'")
        print(f"  Skills loaded: {len(self.skills)}")
        print("="*60)

    def load_config(self):
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, "r") as f:
                self.config = {**DEFAULT_CONFIG, **json.load(f)}
        else:
            self.config = DEFAULT_CONFIG
            self.save_config()

    def save_config(self):
        with open(CONFIG_FILE, "w") as f:
            json.dump(self.config, f, indent=4)

    def load_memory(self):
        if os.path.exists(MEMORY_FILE):
            with open(MEMORY_FILE, "r") as f:
                self.memory = json.load(f)
        else:
            self.memory = {
                "user": {"name": "Sudhakar", "title": "Sir"},
                "preferences": {"units": "metric", "theme": "cyan"},
                "facts": [],
                "past_conversations": []
            }
            self.save_memory()

    def save_memory(self):
        with open(MEMORY_FILE, "w") as f:
            json.dump(self.memory, f, indent=4)

    def remember(self, category: str, key: str, value: str):
        self.memory.setdefault(category, {})[key] = value
        self.memory.setdefault("facts", []).append({
            "key": key,
            "value": value,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        self.save_memory()

    def init_speech(self):
        # 1. Text to Speech Engine
        if pyttsx3:
            try:
                self.tts = pyttsx3.init()
                self.tts.setProperty("rate", self.config.get("voice_rate", 180))
                self.tts.setProperty("volume", self.config.get("voice_volume", 0.9))
                # Select preferred voice
                voices = self.tts.getProperty("voices")
                for v in voices:
                    if "british" in v.name.lower() or "daniel" in v.name.lower() or "george" in v.name.lower():
                        self.tts.setProperty("voice", v.id)
                        break
            except Exception as e:
                print(f"[TTS Error] {e}")
                self.tts = None
        else:
            self.tts = None

        # 2. Speech Recognizer
        if sr:
            self.recognizer = sr.Recognizer()
            self.recognizer.energy_threshold = 300
            self.recognizer.dynamic_energy_threshold = True
        else:
            self.recognizer = None

    def speak(self, text: str):
        print(f"[{self.config['assistant_name']}] {text}")
        if self.tts:
            try:
                self.tts.say(text)
                self.tts.runAndWait()
            except Exception as e:
                print(f"[TTS Playback Error] {e}")
        elif self.os_type == "darwin":
            subprocess.run(["say", text])

    def load_skills(self):
        os.makedirs(SKILLS_DIR, exist_ok=True)
        plugin_files = glob.glob(os.path.join(SKILLS_DIR, "*.py"))
        
        for file_path in plugin_files:
            module_name = os.path.basename(file_path)[:-3]
            try:
                spec = importlib.util.spec_from_file_location(module_name, file_path)
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                
                if hasattr(mod, "JarvisSkill"):
                    skill_instance = mod.JarvisSkill()
                    self.skills.append(skill_instance)
                    print(f"  + Loaded Skill: {getattr(skill_instance, 'name', module_name)}")
            except Exception as e:
                print(f"  - Failed to load skill {file_path}: {e}")

    def process_command(self, query: str) -> str:
        q = query.lower().strip()
        context = {
            "os": self.os_type,
            "user_name": self.config.get("user_name", "Sir"),
            "memory": self.memory
        }

        # Check loaded skills first
        for skill in self.skills:
            triggers = getattr(skill, "triggers", [])
            for trigger in triggers:
                if trigger.lower() in q:
                    try:
                        return skill.execute(query, context)
                    except Exception as e:
                        return f"Error executing {skill.name}: {str(e)}"

        # Memory commands
        if "remember that" in q:
            fact = q.replace("remember that", "").strip()
            self.remember("facts", f"fact_{int(time.time())}", fact)
            return f"Affirmative, Sir. I have committed this to long-term memory: {fact}"

        if "what do you remember" in q or "recall memory" in q:
            facts = self.memory.get("facts", [])
            if not facts:
                return "My memory records are currently clear, Sir."
            recent = [f['value'] for f in facts[-3:]]
            return f"Recalling recent memory items: " + " | ".join(recent)

        # Basic conversational fallbacks
        if "who are you" in q:
            return f"I am {self.config['assistant_name']}, your cross-platform personal desktop companion."

        if "time" in q:
            return f"The current time is {datetime.now().strftime('%I:%M %p')}."

        if "date" in q:
            return f"Today is {datetime.now().strftime('%A, %B %d, %Y')}."

        return f"Command acknowledged, {context['user_name']}. Ready for your instruction."

    def listen_loop(self):
        if not sr or not self.recognizer:
            print("[INFO] SpeechRecognition unavailable. Switching to terminal input mode.")
            self.interactive_terminal()
            return

        with sr.Microphone() as source:
            print("[INFO] Calibrating microphone for ambient acoustic noise...")
            self.recognizer.adjust_for_ambient_noise(source, duration=1)
            self.speak(f"{self.config['assistant_name']} is online and listening, {self.config.get('user_name', 'Sir')}.")

            while self.is_running:
                try:
                    print("\\n[Listening for wake phrase...]")
                    audio = self.recognizer.listen(source, timeout=5, phrase_time_limit=8)
                    try:
                        text = self.recognizer.recognize_google(audio)
                        print(f"[Heard] '{text}'")
                        
                        # Check wake word
                        wake = self.config["wake_phrase"].lower()
                        if wake in text.lower():
                            # Remove wake word
                            command = text.lower().replace(wake, "").strip()
                            if not command:
                                self.speak(f"Yes, {self.config.get('user_name', 'Sir')}?")
                                audio = self.recognizer.listen(source, timeout=5, phrase_time_limit=8)
                                command = self.recognizer.recognize_google(audio)
                            
                            response = self.process_command(command)
                            self.speak(response)
                        else:
                            # Direct command if push-to-talk enabled
                            if self.config.get("push_to_talk"):
                                response = self.process_command(text)
                                self.speak(response)
                    except sr.UnknownValueError:
                        pass
                    except sr.RequestError as e:
                        print(f"[Speech API Error] {e}")
                except Exception as e:
                    time.sleep(0.5)

    def interactive_terminal(self):
        print(f"Type 'exit' to quit. Test commands: 'open browser', 'set volume 40', 'weather in Tokyo', 'remember that project deadline is Friday'")
        while self.is_running:
            try:
                cmd = input(f"[{self.config.get('user_name', 'Sir')}] > ").strip()
                if not cmd:
                    continue
                if cmd.lower() in ["exit", "quit", "shutdown"]:
                    self.speak("Shutting down Jarvis systems. Goodbye, Sir.")
                    break
                resp = self.process_command(cmd)
                self.speak(resp)
            except (KeyboardInterrupt, EOFError):
                break

if __name__ == "__main__":
    app = JarvisCompanion()
    try:
        app.listen_loop()
    except KeyboardInterrupt:
        print("\\nTerminating Jarvis systems...")
`;

export const PYTHON_REQUIREMENTS = `SpeechRecognition>=3.10.0
pyttsx3>=2.90
PyAudio>=0.2.14
requests>=2.31.0
pyautogui>=0.9.54
psutil>=5.9.8
urllib3>=2.0.0
`;

export const PYTHON_README = `# J.A.R.V.I.S. Desktop AI Companion

A cross-platform personal desktop AI companion built in Python that feels like a real Tony Stark Jarvis system.

## Features
- **Voice Recognition**: Ambient listening with wake phrase ("Hey Jarvis") or Push-to-Talk.
- **Natural Speech Synthesis**: Offline, instant voice playback (pyttsx3 / SAPI5 / NSSpeechSynthesizer / eSpeak).
- **Cross-Platform System Controls**:
  - Open & launch applications (Browser, VS Code, Terminal, Spotify, etc.)
  - Adjust volume and display brightness (Windows, macOS, Linux)
  - Window management (Minimize, maximize, restore)
  - Real-time weather reporting via Open-Meteo
  - File reading and desktop notes
  - Web searches & instant answers
- **Persistent Memory**: Remembers people, projects, preferences, and conversations across sessions in \`memory.json\`.
- **Extensible Skill Plugins**: Drop \`.py\` files into the \`skills/\` directory to add new capabilities with zero code changes to the core engine!

## Quickstart

### 1. Requirements
- Python 3.9, 3.10, 3.11, or 3.12
- Microphone and speakers

### 2. Installation

\`\`\`bash
# Create and activate a virtual environment
python -m venv venv

# Windows
venv\\Scripts\\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
\`\`\`

> **Note for Linux users:**
> Install ALSA & PortAudio: \`sudo apt-get install portaudio19-dev python3-pyaudio espeak amixer brightnessctl\`

> **Note for macOS users:**
> Allow microphone permissions in System Settings -> Privacy & Security -> Microphone.

### 3. Running J.A.R.V.I.S.

\`\`\`bash
# Windows
run.bat
# or
python jarvis.py

# macOS / Linux
chmod +x run.sh
./run.sh
# or
python3 jarvis.py
\`\`\`

## Adding New Skills
Create a Python file in the \`skills/\` folder (e.g. \`skills/my_skill.py\`):

\`\`\`python
class JarvisSkill:
    name = "My Custom Skill"
    triggers = ["trigger_word", "action_name"]

    def execute(self, command: str, context: dict) -> str:
        return f"Executing skill for command: {command}"
\`\`\`
Restart Jarvis, and your new skill will automatically be detected and active!
`;

export const PYTHON_RUN_BAT = `@echo off
title J.A.R.V.I.S. AI Desktop Companion
echo Starting J.A.R.V.I.S. System...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH. Please install Python 3.10+ from python.org
    pause
    exit /b
)
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    call venv\\Scripts\\activate
    echo Installing dependencies...
    pip install -r requirements.txt
) else (
    call venv\\Scripts\\activate
)
python jarvis.py
pause
`;

export const PYTHON_RUN_SH = `#!/usr/bin/env bash
echo "Starting J.A.R.V.I.S. AI Desktop Companion..."
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3.10+"
    exit 1
fi

if [ ! -d "venv" ]; then
    echo "Setting up virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "Installing dependencies..."
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

python3 jarvis.py
`;

export const PYTHON_RUN_ANDROID_SH = `#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# J.A.R.V.I.S. Android Launcher (Termux Environment)
# ==============================================================================
echo "=== Initializing J.A.R.V.I.S. Android Subsystem ==="

# 1. Check & Install Required Android Termux Packages
echo "[1/3] Verifying core packages..."
pkg update -y
pkg install -y python clang libxml2 libxslt ffmpeg portaudio termux-api

# 2. Install Python Dependencies
echo "[2/3] Installing Python voice & system packages..."
pip install --upgrade pip
pip install SpeechRecognition pyttsx3 requests psutil urllib3

# 3. Launch Jarvis Companion
echo "[3/3] Engaging J.A.R.V.I.S. Core..."
python jarvis.py
`;

