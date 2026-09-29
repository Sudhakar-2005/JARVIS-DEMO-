import React from 'react';
import { HUDTheme, UndoRecord } from '../types';
import { THEMES } from '../utils/theme';
import {
  Undo2,
  RotateCcw,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  FileText,
  Brain,
  Monitor,
  Settings,
} from 'lucide-react';

interface UndoHistoryPanelProps {
  theme: HUDTheme;
  undoRecords: UndoRecord[];
  onRevertAction: (recordId: string) => void;
  onClearHistory: () => void;
}

export const UndoHistoryPanel: React.FC<UndoHistoryPanelProps> = ({
  theme,
  undoRecords,
  onRevertAction,
  onClearHistory,
}) => {
  const currentTheme = THEMES[theme];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <Sliders className="w-3.5 h-3.5 text-cyan-400" />;
      case 'file':
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
      case 'memory':
        return <Brain className="w-3.5 h-3.5 text-purple-400" />;
      case 'browser':
        return <Monitor className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Settings className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const activeReversible = undoRecords.filter((r) => r.canRevert && !r.reverted);

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Undo2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
            UNDO &amp; ROLLBACK TRANSACTION JOURNAL [undo.py]
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {activeReversible.length} REVERSIBLE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeReversible.length > 0 && (
            <button
              onClick={() => onRevertAction(activeReversible[0].id)}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>REVERT MOST RECENT</span>
            </button>
          )}

          {undoRecords.length > 0 && (
            <button
              onClick={onClearHistory}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Clear journal history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="p-4 flex-1 overflow-y-auto space-y-2.5 text-xs font-mono">
        {undoRecords.length === 0 ? (
          <div className="text-center p-8 space-y-2 text-slate-500">
            <Clock className="w-8 h-8 mx-auto text-slate-700" />
            <div className="text-slate-400">Transaction journal is empty</div>
            <div className="text-[11px]">
              Every system modification, file change, volume adjustment, and memory entry will be recorded here for instant rollback.
            </div>
          </div>
        ) : (
          undoRecords.map((record) => (
            <div
              key={record.id}
              className={`p-3.5 rounded-xl border transition-all ${
                record.reverted
                  ? 'bg-slate-950/40 border-slate-900 text-slate-500'
                  : 'bg-slate-950/80 border-slate-800/90 text-slate-200 hover:border-slate-700 shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 mt-0.5">
                    {getCategoryIcon(record.category)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{record.title}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {record.category}
                      </span>
                      {record.reverted && (
                        <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          REVERTED
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 mt-1">
                      <span>
                        Previous: <strong className="text-slate-300 font-normal">{record.previousStateSummary}</strong>
                      </span>
                      <span>&rarr;</span>
                      <span>
                        Current: <strong className="text-cyan-300 font-normal">{record.currentStateSummary}</strong>
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Logged at {record.timestamp}</span>
                    </div>
                  </div>
                </div>

                {record.canRevert && !record.reverted && (
                  <button
                    onClick={() => onRevertAction(record.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 hover:text-cyan-200 text-[11px] font-bold flex items-center gap-1.5 transition-all shrink-0 active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>UNDO</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span>UNDO MODULE: [undo.py] · ATOMIC LEDGER</span>
        <span>VOICE COMMAND: &ldquo;HEY JARVIS, UNDO THAT&rdquo;</span>
      </div>
    </div>
  );
};
