import React, { useState } from 'react';
import { MemoryItem, HUDTheme } from '../types';
import { THEMES } from '../utils/theme';
import {
  Brain,
  Search,
  Trash2,
  Plus,
  User,
  FolderGit2,
  Sliders,
  MessageSquare,
  FileText,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';

interface MemoryDashboardProps {
  memories: MemoryItem[];
  theme: HUDTheme;
  onAddMemory: (item: Omit<MemoryItem, 'id' | 'timestamp'>) => void;
  onDeleteMemory: (id: string) => void;
  onClearAllMemories: () => void;
}

export const MemoryDashboard: React.FC<MemoryDashboardProps> = ({
  memories,
  theme,
  onAddMemory,
  onDeleteMemory,
  onClearAllMemories,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New Memory form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('person');

  const currentTheme = THEMES[theme];

  const categoryIcons: Record<MemoryItem['category'], React.ReactNode> = {
    person: <User className="w-3.5 h-3.5 text-sky-400" />,
    project: <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />,
    preference: <Sliders className="w-3.5 h-3.5 text-emerald-400" />,
    conversation: <MessageSquare className="w-3.5 h-3.5 text-purple-400" />,
    note: <FileText className="w-3.5 h-3.5 text-rose-400" />,
  };

  const filteredMemories = memories.filter((mem) => {
    const matchesCategory = selectedCategory === 'all' || mem.category === selectedCategory;
    const matchesSearch =
      mem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    onAddMemory({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      source: 'manual',
    });

    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
            NEURAL MEMORY MATRIX
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
            {memories.length} RECORDS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-2.5 py-1 text-[11px] font-mono rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>RECORD FACT</span>
          </button>
        </div>
      </div>

      {/* Add Memory Form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="p-3.5 bg-slate-950 border-b border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-cyan-400 flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              RECORD NEW SYSTEM MEMORY
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-200 text-xs font-mono"
            >
              CANCEL
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="person">Person</option>
              <option value="project">Project</option>
              <option value="preference">Preference</option>
              <option value="conversation">Past Conversation</option>
              <option value="note">System Note</option>
            </select>

            <input
              type="text"
              placeholder="Memory Title / Subject..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="md:col-span-2 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <textarea
            placeholder="Fact content, details, or preference to persist across sessions..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              SAVE TO MATRIX
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800/60 flex flex-col sm:flex-row items-center gap-2">
        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Filter memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-0.5 bg-slate-900 rounded-lg border border-slate-800">
          {['all', 'person', 'project', 'preference', 'conversation', 'note'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 text-[10px] font-mono rounded capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memory List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            No memories match query parameters.
          </div>
        ) : (
          filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-slate-900 border border-slate-800">
                    {categoryIcons[mem.category]}
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-slate-100">{mem.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <span className="capitalize">{mem.category}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {mem.timestamp}
                      </span>
                      <span>·</span>
                      <span className="text-slate-400 uppercase">via {mem.source}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteMemory(mem.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                  title="Delete memory record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-300 font-mono bg-slate-900/60 p-2 rounded border border-slate-800/80 leading-relaxed select-text">
                {mem.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>PERSISTENCE: SYNCED (LOCALSTORAGE &amp; PYTHON JSON)</span>
        {memories.length > 0 && (
          <button
            onClick={onClearAllMemories}
            className="text-slate-500 hover:text-rose-400 transition-colors"
          >
            PURGE ALL MEMORIES
          </button>
        )}
      </div>
    </div>
  );
};
