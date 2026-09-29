import React, { useState } from 'react';
import { SkillPlugin, HUDTheme } from '../types';
import { THEMES } from '../utils/theme';
import {
  Puzzle,
  Code,
  Play,
  Plus,
  CheckCircle2,
  XCircle,
  FileCode,
  Tag,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';

interface SkillPluginManagerProps {
  skills: SkillPlugin[];
  theme: HUDTheme;
  onToggleSkill: (id: string) => void;
  onUpdateSkillCode: (id: string, code: string) => void;
  onAddSkill: (skill: SkillPlugin) => void;
  onTestTrigger: (trigger: string) => void;
}

export const SkillPluginManager: React.FC<SkillPluginManagerProps> = ({
  skills,
  theme,
  onToggleSkill,
  onUpdateSkillCode,
  onAddSkill,
  onTestTrigger,
}) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0]?.id || '');
  const [editingCode, setEditingCode] = useState<string>('');
  const [isModified, setIsModified] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New skill form
  const [newSkillName, setNewSkillName] = useState('');
  const [newFilename, setNewFilename] = useState('');
  const [newTriggers, setNewTriggers] = useState('');

  const currentTheme = THEMES[theme];
  const activeSkill = skills.find((s) => s.id === selectedSkillId) || skills[0];

  const handleSelectSkill = (skill: SkillPlugin) => {
    setSelectedSkillId(skill.id);
    setEditingCode(skill.pythonCode);
    setIsModified(false);
  };

  const handleSaveCode = () => {
    if (!activeSkill) return;
    onUpdateSkillCode(activeSkill.id, editingCode);
    setIsModified(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editingCode || activeSkill?.pythonCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const baseName = newSkillName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = newFilename.trim() || `${baseName}_skill.py`;
    const triggerArray = newTriggers
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const templateCode = `# ${filename} - Custom Extension Skill
class JarvisSkill:
    """Automated custom skill plugin for Jarvis."""
    name = "${newSkillName.trim()}"
    triggers = ${JSON.stringify(triggerArray.length ? triggerArray : [baseName])}

    def execute(self, command: str, context: dict) -> str:
        user = context.get("user_name", "Sir")
        return f"${newSkillName} executed successfully for {user}. Input received: '{command}'"
`;

    const newPlugin: SkillPlugin = {
      id: `custom_${Date.now()}`,
      name: newSkillName.trim(),
      filename,
      description: `Custom automation plugin triggered by: ${triggerArray.join(', ')}`,
      author: 'User',
      version: '1.0.0',
      category: 'utility',
      triggers: triggerArray.length ? triggerArray : [baseName],
      pythonCode: templateCode,
      isEnabled: true,
    };

    onAddSkill(newPlugin);
    setSelectedSkillId(newPlugin.id);
    setEditingCode(templateCode);
    setIsCreating(false);
    setNewSkillName('');
    setNewFilename('');
    setNewTriggers('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Puzzle className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
            PYTHON SKILLS &amp; EXTENSION PLUGINS
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            AUTO-LOADED FROM /skills/
          </span>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-2.5 py-1 text-[11px] font-mono rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>NEW PLUGIN</span>
        </button>
      </div>

      {/* New Plugin Modal/Inline */}
      {isCreating && (
        <form onSubmit={handleCreateSkill} className="p-3.5 bg-slate-950 border-b border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-cyan-400 text-[11px]">
              CREATE NEW PYTHON PLUGIN SCRIPT
            </span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-200 font-mono text-xs"
            >
              CANCEL
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Plugin Name (e.g. Spotify DJ)"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
              required
            />
            <input
              type="text"
              placeholder="Filename (e.g. spotify_dj.py)"
              value={newFilename}
              onChange={(e) => setNewFilename(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              placeholder="Triggers (comma separated: play, track, song)"
              value={newTriggers}
              onChange={(e) => setNewTriggers(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold"
            >
              GENERATE PYTHON SCRIPT
            </button>
          </div>
        </form>
      )}

      {/* Main Split: Skills List on Left, Live Python Editor on Right */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left: Plugin list */}
        <div className="md:col-span-4 border-r border-slate-800/80 p-2.5 space-y-1.5 overflow-y-auto bg-slate-950/40">
          {skills.map((skill) => {
            const isSelected = skill.id === (activeSkill?.id || '');
            return (
              <div
                key={skill.id}
                onClick={() => handleSelectSkill(skill)}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/50 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/70 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-200">
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{skill.name}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSkill(skill.id);
                    }}
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors ${
                      skill.isEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {skill.isEnabled ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>ACTIVE</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-2.5 h-2.5" />
                        <span>DISABLED</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[10px] font-mono text-slate-400 line-clamp-1 mb-1.5">
                  {skill.filename}
                </div>

                {/* Triggers tags */}
                <div className="flex flex-wrap gap-1">
                  {skill.triggers.slice(0, 3).map((trig, i) => (
                    <span
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTestTrigger(`Test ${trig}`);
                      }}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-cyan-300 hover:bg-cyan-950 transition-colors flex items-center gap-0.5"
                      title="Click to test trigger command"
                    >
                      <Tag className="w-2 h-2 text-cyan-400" />
                      {trig}
                    </span>
                  ))}
                  {skill.triggers.length > 3 && (
                    <span className="text-[9px] font-mono text-slate-500 self-center">
                      +{skill.triggers.length - 3}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Live Python Editor & Inspector */}
        <div className="md:col-span-8 flex flex-col bg-slate-950 overflow-hidden">
          {activeSkill ? (
            <>
              {/* Editor Bar */}
              <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold text-slate-200">{activeSkill.filename}</span>
                  <span className="text-[10px] text-slate-400">({activeSkill.category})</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-[11px]"
                    title="Copy Python Code"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'COPIED' : 'COPY'}</span>
                  </button>

                  <button
                    onClick={() => onTestTrigger(`Run ${activeSkill.triggers[0]}`)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1 text-[11px] transition-colors"
                  >
                    <Play className="w-3 h-3 text-cyan-400" />
                    <span>TEST RUN</span>
                  </button>

                  {isModified && (
                    <button
                      onClick={handleSaveCode}
                      className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition-colors shadow-sm"
                    >
                      SAVE CODE
                    </button>
                  )}
                </div>
              </div>

              {/* Description & Triggers banner */}
              <div className="px-3 py-1.5 bg-slate-900/40 border-b border-slate-800/60 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>{activeSkill.description}</span>
                <span className="text-slate-500">v{activeSkill.version}</span>
              </div>

              {/* Code Textarea */}
              <div className="flex-1 relative p-2 font-mono text-xs">
                <textarea
                  value={editingCode !== '' ? editingCode : activeSkill.pythonCode}
                  onChange={(e) => {
                    setEditingCode(e.target.value);
                    setIsModified(true);
                  }}
                  spellCheck={false}
                  className="w-full h-full bg-slate-950 text-cyan-200/90 font-mono text-[11px] leading-relaxed p-2.5 rounded border border-slate-800/80 focus:outline-none focus:border-cyan-500 resize-none selection:bg-cyan-500/30 selection:text-white"
                />
              </div>

              {/* Footer Status */}
              <div className="px-3 py-1.5 bg-slate-900/80 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>PYTHON 3 COMPATIBLE · AUTONOMOUS DISCOVERY</span>
                <span>STATE: {activeSkill.isEnabled ? 'LINKED TO CORE' : 'SUSPENDED'}</span>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              Select a skill to inspect its Python code.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
