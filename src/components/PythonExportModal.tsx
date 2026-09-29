import React, { useState } from 'react';
import {
  STANDALONE_PYTHON_JARVIS,
  PYTHON_REQUIREMENTS,
  PYTHON_README,
  PYTHON_RUN_BAT,
  PYTHON_RUN_SH,
  PYTHON_RUN_ANDROID_SH,
} from '../data/initialData';
import {
  Download,
  FileCode,
  Check,
  Copy,
  X,
  Terminal,
  Monitor,
  Apple,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

interface PythonExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonExportModal: React.FC<PythonExportModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<string>('jarvis.py');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const fileContents: Record<string, { name: string; content: string; lang: string }> = {
    'jarvis.py': { name: 'jarvis.py (Main Engine)', content: STANDALONE_PYTHON_JARVIS, lang: 'python' },
    'requirements.txt': { name: 'requirements.txt', content: PYTHON_REQUIREMENTS, lang: 'text' },
    'README.md': { name: 'README.md (Setup Guide)', content: PYTHON_README, lang: 'markdown' },
    'run_android.sh': { name: 'run_android.sh (Android Termux 1-Click)', content: PYTHON_RUN_ANDROID_SH, lang: 'bash' },
    'run.bat': { name: 'run.bat (Windows 1-Click)', content: PYTHON_RUN_BAT, lang: 'bat' },
    'run.sh': { name: 'run.sh (macOS / Linux)', content: PYTHON_RUN_SH, lang: 'bash' },
  };

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/download-python-app');
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jarvis_cross_platform_companion.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not generate zip archive. You can copy the python code directly from the tabs.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileContents[selectedFile]?.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                <span>EXPORT PYTHON STANDALONE COMPANION</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Runs on Android (Termux), Windows, macOS, and Linux without powerful GPU requirements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'COMPILING ZIP...' : 'DOWNLOAD .ZIP PACKAGE'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick OS Instructions Pills */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-300">
          <span className="text-slate-500 uppercase text-[11px]">Platform Runners:</span>
          <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-cyan-500/30 text-cyan-300">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Android: <strong className="text-white font-semibold">./run_android.sh</strong> in Termux</span>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
            <Monitor className="w-3.5 h-3.5 text-sky-400" />
            <span>Windows: <strong className="text-cyan-300 font-semibold">run.bat</strong></span>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
            <Apple className="w-3.5 h-3.5 text-slate-200" />
            <span>macOS: <strong className="text-cyan-300 font-semibold">./run.sh</strong></span>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Linux: <strong className="text-cyan-300 font-semibold">./run.sh</strong></span>
          </span>
        </div>

        {/* File Navigator Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/90 overflow-x-auto px-4 gap-1">
          {Object.keys(fileContents).map((fileKey) => (
            <button
              key={fileKey}
              onClick={() => setSelectedFile(fileKey)}
              className={`px-3 py-2 text-xs font-mono border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                selectedFile === fileKey
                  ? 'border-cyan-400 text-cyan-300 bg-slate-900/80 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-slate-500" />
              <span>{fileKey}</span>
            </button>
          ))}
        </div>

        {/* Code Content Viewer */}
        <div className="flex-1 relative p-4 bg-slate-950 overflow-hidden flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] font-mono text-slate-400">
            <span>{fileContents[selectedFile]?.name}</span>
            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-[11px] transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY FILE'}</span>
            </button>
          </div>

          <pre className="flex-1 overflow-auto p-3 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed selection:bg-cyan-500/30">
            <code>{fileContents[selectedFile]?.content}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Runs locally with zero cloud GPU lock-in. Android Termux API enabled.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
