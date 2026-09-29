import React, { useState } from 'react';
import { HUDTheme, PhoneRemoteCommand, SystemState, JarvisState } from '../types';
import { THEMES } from '../utils/theme';
import {
  Smartphone,
  Send,
  QrCode,
  Wifi,
  X,
  Volume2,
  VolumeX,
  Sun,
  Eye,
  FileText,
  Mic,
  CheckCircle2,
  Server,
  Play,
  RotateCcw,
} from 'lucide-react';

interface PhoneRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: HUDTheme;
  systemState: SystemState;
  jarvisState: JarvisState;
  onQueueRemoteCommand: (command: string, deviceName?: string) => void;
}

export const PhoneRemoteModal: React.FC<PhoneRemoteModalProps> = ({
  isOpen,
  onClose,
  theme,
  systemState,
  jarvisState,
  onQueueRemoteCommand,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [recentPhoneCommands, setRecentPhoneCommands] = useState<PhoneRemoteCommand[]>([
    {
      id: 'cmd-1',
      device: 'Tony’s StarkPhone (Android)',
      command: 'Check weather in Malibu',
      timestamp: '11:42 AM',
      status: 'completed',
    },
    {
      id: 'cmd-2',
      device: 'Tony’s StarkPhone (Android)',
      command: 'Set volume to 80%',
      timestamp: '11:44 AM',
      status: 'completed',
    },
  ]);

  if (!isOpen) return null;

  const handleSendFromPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    const cmdText = phoneInput.trim();
    const newCmd: PhoneRemoteCommand = {
      id: `phone-${Date.now()}`,
      device: 'Paired StarkPhone (Mobile)',
      command: cmdText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'executing',
    };

    setRecentPhoneCommands((prev) => [newCmd, ...prev]);
    onQueueRemoteCommand(cmdText, 'StarkPhone Mobile');
    setPhoneInput('');

    setTimeout(() => {
      setRecentPhoneCommands((prev) =>
        prev.map((c) => (c.id === newCmd.id ? { ...c, status: 'completed' } : c)),
      );
    }, 1500);
  };

  const quickRemoteDirectives = [
    'Mute desktop audio',
    'Set brightness to 90%',
    'Capture screen context',
    'Read flight notes',
    'Undo last action',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>PHONE USER &amp; REMOTE DASHBOARD BRIDGE</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LINK ACTIVE
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Remote companion control queueing directives to Session Orchestrator [server.py &rarr; main.py]
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto p-5 gap-6">
          {/* Left Column: Interactive Mobile Phone Simulator */}
          <div className="md:col-span-6 flex flex-col items-center justify-center">
            {/* Phone Chassis */}
            <div className="w-[300px] h-[520px] bg-slate-950 border-4 border-slate-800 rounded-[38px] p-3 shadow-2xl flex flex-col justify-between relative overflow-hidden ring-1 ring-cyan-500/30">
              {/* Dynamic Island / Speaker Notch */}
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>

              {/* Mobile Screen Header */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-1 text-cyan-300 font-bold">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  JARVIS REMOTE
                </span>
                <span>DESKTOP: {systemState.os.toUpperCase()}</span>
              </div>

              {/* Live Desktop Telemetry mirror */}
              <div className="my-2 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                  <span>ORCHESTRATOR STATUS</span>
                  <span className="text-emerald-400 font-bold">{jarvisState.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                  <div className="bg-slate-950 p-1.5 rounded">VOL: {systemState.volume}%</div>
                  <div className="bg-slate-950 p-1.5 rounded">BRIGHT: {systemState.brightness}%</div>
                </div>
              </div>

              {/* Quick Action Buttons on Phone */}
              <div className="space-y-1.5">
                <div className="text-[9px] text-slate-500 uppercase">QUICK COMMAND DIRECTIVES</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {quickRemoteDirectives.map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => onQueueRemoteCommand(cmd, 'StarkPhone Quick')}
                      className="p-1.5 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-300 hover:text-cyan-300 text-left truncate transition-colors cursor-pointer"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Mic & Input */}
              <form onSubmit={handleSendFromPhone} className="mt-auto space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Type command on phone..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Phone Home Bar */}
              <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
            </div>
          </div>

          {/* Right Column: Server.py & Remote Bridge Telemetry */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                  <Server className="w-4 h-4" />
                  <span>REMOTE DASHBOARD SERVICE [server.py]</span>
                </div>
                <span className="text-emerald-400 text-[10px]">LISTENING :3000</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] text-slate-500 uppercase">SYNCHRONIZED COMMAND QUEUE</div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {recentPhoneCommands.map((cmd) => (
                    <div
                      key={cmd.id}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{cmd.command}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          {cmd.device} · {cmd.timestamp}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {cmd.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pairing QR Code Mockup */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-4">
                <div className="w-16 h-16 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center">
                  <QrCode className="w-14 h-14 text-slate-950" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-200 text-xs">PAIR MOBILE DEVICE</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Scan with your Android camera or visit{' '}
                    <strong className="text-cyan-300 font-mono">http://localhost:3000</strong> on your phone.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                CLOSE BRIDGE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
