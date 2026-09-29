import React, { useState } from 'react';
import { HUDTheme, WorkspaceFile } from '../types';
import { THEMES } from '../utils/theme';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Volume2,
  Folder,
  Search,
  Check,
  Code,
  FileCode,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface FileActionsManagerProps {
  theme: HUDTheme;
  files: WorkspaceFile[];
  onSaveFile: (file: WorkspaceFile) => void;
  onCreateFile: (name: string, content: string) => void;
  onDeleteFile: (fileId: string) => void;
  onReadAloud: (content: string) => void;
}

export const FileActionsManager: React.FC<FileActionsManagerProps> = ({
  theme,
  files,
  onSaveFile,
  onCreateFile,
  onDeleteFile,
  onReadAloud,
}) => {
  const currentTheme = THEMES[theme];
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [activeContent, setActiveContent] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  const selectedFile = files.find((f) => f.id === selectedFileId) || files[0];

  // Sync content when selected file changes
  React.useEffect(() => {
    if (selectedFile) {
      setActiveContent(selectedFile.content);
    }
  }, [selectedFileId, selectedFile]);

  const handleSave = () => {
    if (!selectedFile) return;
    onSaveFile({
      ...selectedFile,
      content: activeContent,
      size: new Blob([activeContent]).size,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim(), newFileContent);
    setNewFileName('');
    setNewFileContent('');
    setIsCreating(false);
  };

  const filteredFiles = files.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
            FILESYSTEM ACTIONS &amp; WORKSPACE MANAGER [file_controller.py]
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ~/JarvisWorkspace
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW FILE</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden font-mono text-xs">
        {/* Left Column: File Explorer Tree */}
        <div className="md:col-span-4 p-3 bg-slate-950/60 border-r border-slate-800/80 flex flex-col space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`w-full p-2.5 rounded-lg border text-left flex items-start justify-between transition-all cursor-pointer ${
                  selectedFile?.id === file.id
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-900/70 text-slate-300 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-2 overflow-hidden">
                  <FileCode className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="truncate">
                    <div className="font-bold truncate text-[11px]">{file.name}</div>
                    <div className="text-[9px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{file.size} B</span>
                      <span>·</span>
                      <span>{file.updatedAt}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
            <span>FILES: {files.length}</span>
            <span>OS BUS: SYNCHRONIZED</span>
          </div>
        </div>

        {/* Right Column: Code / Text Editor */}
        <div className="md:col-span-8 p-4 bg-slate-950 flex flex-col justify-between space-y-3">
          {selectedFile ? (
            <>
              {/* File Meta Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {selectedFile.type}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onReadAloud(activeContent)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors cursor-pointer"
                    title="Read file contents aloud with Jarvis voice"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaved ? 'SAVED' : 'SAVE CHANGES'}</span>
                  </button>

                  <button
                    onClick={() => onDeleteFile(selectedFile.id)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors cursor-pointer"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Textarea Editor */}
              <div className="flex-1 relative min-h-[300px]">
                <textarea
                  value={activeContent}
                  onChange={(e) => setActiveContent(e.target.value)}
                  className="w-full h-full bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-cyan-500 resize-none selection:bg-cyan-500/30"
                  placeholder="Enter file text or code..."
                />
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                <span>PATH: ~/JarvisWorkspace/{selectedFile.name}</span>
                <span>STATUS: READY FOR VOICE QUERY</span>
              </div>
            </>
          ) : (
            <div className="text-center p-12 text-slate-500">
              <Folder className="w-10 h-10 mx-auto text-slate-700" />
              <div>No file selected</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create File */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl font-mono text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-200 font-bold">
              <span>CREATE WORKSPACE FILE</span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">FILE NAME (e.g. quantum_telemetry.json)</label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="filename.ext"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">INITIAL CONTENT</label>
              <textarea
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="Enter file data..."
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
              >
                CREATE FILE
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
