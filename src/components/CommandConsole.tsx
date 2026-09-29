import React, { useState, useRef, useEffect } from 'react';
import { CommandLogItem, HUDTheme, JarvisState, VoiceConfig, DiagramNodeId } from '../types';
import { THEMES } from '../utils/theme';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Play,
  Network,
  Database,
  WifiOff,
  History,
  RotateCcw,
  CornerDownLeft,
} from 'lucide-react';

interface CommandConsoleProps {
  logs: CommandLogItem[];
  state: JarvisState;
  theme: HUDTheme;
  voiceConfig: VoiceConfig;
  onSendMessage: (text: string) => void;
  onToggleListening: () => void;
  isListening: boolean;
  onClearLogs: () => void;
  onNavigateToDiagramNode?: (nodeId: DiagramNodeId) => void;
  isOffline?: boolean;
}

export const CommandConsole: React.FC<CommandConsoleProps> = ({
  logs,
  state,
  theme,
  voiceConfig,
  onSendMessage,
  onToggleListening,
  isListening,
  onClearLogs,
  onNavigateToDiagramNode,
  isOffline = false,
}) => {
  const [inputText, setInputText] = useState('');
  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const currentTheme = THEMES[theme];

  // Recent commands list (last 5 commands for quick re-execution)
  const [recentCommands, setRecentCommands] = useState<string[]>([
    'Set power mode to High Performance',
    'Set power mode to Power Saver',
    'Activate gesture control',
    'Check weather in London',
    'Set volume to 80%',
  ]);

  // Visual trigger confirmation animation state for recent commands
  const [reexecutingCmd, setReexecutingCmd] = useState<string | null>(null);

  const handleReexecuteCommand = (cmd: string) => {
    setReexecutingCmd(cmd);
    onSendMessage(cmd);
    setTimeout(() => {
      setReexecutingCmd(null);
    }, 600);
  };

  // Synchronize recent voice and typed commands dynamically from conversation logs
  useEffect(() => {
    const userCommands = logs
      .filter((item) => item.type === 'user')
      .map((item) => item.text.trim())
      .filter(Boolean);

    if (userCommands.length > 0) {
      setRecentCommands((prev) => {
        // Collect commands in reverse chronological order (newest first)
        const reversed = [...userCommands].reverse();
        const combined = [...reversed, ...prev];
        const unique = Array.from(new Set(combined));
        return unique.slice(0, 5);
      });
    }
  }, [logs]);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs, state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const sampleCommands = [
    'Check weather in London',
    'Set volume to 80%',
    'Launch Visual Studio Code',
    'Minimize all windows',
    'Remember that project launch is next Tuesday',
    'Search quantum computing milestones',
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Console Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
            DIALOGUE & TELEMETRY STREAM
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            WAKE: &ldquo;{voiceConfig.wakePhrase}&rdquo;
          </span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 cursor-help"
            title="Chat conversation history cached in browser IndexedDB for offline persistence"
          >
            <Database className="w-2.5 h-2.5 text-emerald-400" />
            <span>IDB: {logs.length} CACHED</span>
          </span>
          {isOffline && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse"
              title="Session offline - Autonomous rules & cached IndexedDB conversation active"
            >
              <WifiOff className="w-2.5 h-2.5 text-amber-400" />
              <span>OFFLINE CONTEXT</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          >
            CLEAR LOGS
          </button>
        </div>
      </div>

      {/* Transcript Log Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs select-text min-h-[220px]">
        {logs.map((log) => {
          if (log.type === 'user') {
            return (
              <div key={log.id} className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                  <span>USER // VOICE INPUT</span>
                  <span>·</span>
                  <span className="tabular-nums">{log.timestamp}</span>
                </div>
                <div className="px-3.5 py-2 rounded-lg bg-slate-800/90 text-slate-100 max-w-[85%] border border-slate-700/60 shadow-sm">
                  {log.text}
                </div>
              </div>
            );
          }

          if (log.type === 'assistant') {
            return (
              <div key={log.id} className="flex flex-col items-start">
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 mb-1">
                  <Volume2 className="w-3 h-3" />
                  <span className="font-bold">{voiceConfig.assistantName}</span>
                  <span>·</span>
                  <span className="tabular-nums">{log.timestamp}</span>
                </div>
                <div
                  className="px-3.5 py-2.5 rounded-lg bg-slate-950/80 text-cyan-100 max-w-[88%] border border-cyan-500/25 shadow-md leading-relaxed"
                  style={{ borderColor: currentTheme.primaryGlow }}
                >
                  {log.text}
                </div>
              </div>
            );
          }

          if (log.type === 'command') {
            return (
              <div
                key={log.id}
                className="px-3 py-2 rounded-md bg-slate-950/90 border border-slate-800/90 text-slate-300 text-[11px] flex items-start gap-2.5 my-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{log.text}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">STATUS: EXECUTED</span>
                  </div>
                  {log.details && (
                    <div className="text-[10px] text-slate-400 mt-1 pl-2 border-l border-slate-700">
                      {log.details.action && <div>Protocol: {log.details.action}</div>}
                      {log.details.target && <div>Target: {log.details.target}</div>}
                      {log.details.output && <div>Output: {log.details.output}</div>}
                      {log.details.flowPath && log.details.flowPath.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5 pt-1.5 border-t border-slate-800/80">
                          <span className="text-[9px] text-cyan-400 uppercase font-mono mr-0.5 flex items-center gap-1">
                            <Network className="w-2.5 h-2.5" />
                            Flow:
                          </span>
                          {log.details.flowPath.map((node, i) => (
                            <React.Fragment key={node + i}>
                              <button
                                type="button"
                                onClick={() => onNavigateToDiagramNode && onNavigateToDiagramNode(node)}
                                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-slate-800 hover:border-cyan-500/50 text-[9px] font-mono transition-colors cursor-pointer"
                                title={`Inspect ${node} in Architecture Flow Diagram`}
                              >
                                {node}
                              </button>
                              {i < log.details!.flowPath!.length - 1 && (
                                <span className="text-slate-600 text-[9px]">→</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={log.id} className="text-[11px] text-slate-500 italic py-0.5">
              [SYSTEM] {log.text}
            </div>
          );
        })}

        {state === 'thinking' && (
          <div className="flex items-center gap-2 text-xs text-amber-400 py-1 font-mono animate-pulse">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>{voiceConfig.assistantName} is analyzing neural telemetry & synthesizing reply...</span>
          </div>
        )}

        <div ref={logsEndRef} />
      </div>

      {/* Recent Voice & Text Commands Scrollable List for Quick Re-Execution */}
      <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800/90 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 font-bold shrink-0 uppercase tracking-wider">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Recent Commands:</span>
          </div>

          {recentCommands.slice(0, 5).map((cmd, idx) => {
            const isTriggered = reexecutingCmd === cmd;
            return (
              <button
                key={`recent-${idx}-${cmd}`}
                onClick={() => handleReexecuteCommand(cmd)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-sm group shrink-0 will-change-transform ${
                  isTriggered
                    ? 'scale-105 bg-cyan-400 text-slate-950 font-bold border-cyan-200 ring-2 ring-cyan-400/90 shadow-[0_0_18px_rgba(6,182,212,0.9)] animate-pulse'
                    : 'bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-200 hover:text-white border border-cyan-500/30 hover:border-cyan-400/80 active:scale-95'
                }`}
                title={`Click to re-execute directive: "${cmd}"`}
              >
                <RotateCcw
                  className={`w-2.5 h-2.5 transition-transform duration-500 shrink-0 ${
                    isTriggered
                      ? 'text-slate-950 rotate-180 animate-spin'
                      : 'text-cyan-400 opacity-75 group-hover:rotate-180'
                  }`}
                />
                <span className="truncate max-w-[200px]">{cmd}</span>
                {isTriggered ? (
                  <span className="text-[9px] bg-slate-950 text-cyan-300 px-1 py-0.2 rounded uppercase tracking-wider font-extrabold shadow-inner">
                    DISPATCHED
                  </span>
                ) : (
                  <CornerDownLeft className="w-2.5 h-2.5 text-cyan-400/60 group-hover:text-cyan-300 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggested Quick Command Prompts */}
      <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/60 overflow-x-auto">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Suggested:</span>
          {sampleCommands.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(cmd)}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-colors flex items-center gap-1"
            >
              <Play className="w-2.5 h-2.5 text-cyan-400" />
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Voice & Text Input Bar */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-2.5">
        {/* Main Microphone Button */}
        <button
          onClick={onToggleListening}
          className={`relative p-3 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700'
          }`}
          title={isListening ? 'Click to stop listening' : 'Click to start voice listening'}
        >
          {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-slate-400" />}
        </button>

        {/* Text Input for Typing Commands */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? 'Listening to your voice... or type here' : `Say "${voiceConfig.wakePhrase}" or type a command...`}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>SEND</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
