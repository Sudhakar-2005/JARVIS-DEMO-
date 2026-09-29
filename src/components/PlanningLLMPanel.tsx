import React, { useState } from 'react';
import { HUDTheme, TaskPlan, TaskPlanStep } from '../types';
import { THEMES } from '../utils/theme';
import {
  Brain,
  Wrench,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  Sparkles,
  Terminal,
  RefreshCw,
  Sliders,
  FileText,
  Eye,
  Globe,
  Database,
} from 'lucide-react';

interface PlanningLLMPanelProps {
  theme: HUDTheme;
  activePlan: TaskPlan | null;
  onExecuteDirective: (directive: string) => void;
}

export const PlanningLLMPanel: React.FC<PlanningLLMPanelProps> = ({
  theme,
  activePlan,
  onExecuteDirective,
}) => {
  const currentTheme = THEMES[theme];
  const [testDirective, setTestDirective] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);

  // Pre-loaded tool registry matching action_loader.py
  const toolRegistry = [
    {
      name: 'system.control_hardware',
      module: 'system_actions.py',
      category: 'Automation',
      desc: 'Controls physical system volume, display luminance, audio mute, and hardware actuator bus.',
      params: 'action: "set_volume" | "set_brightness" | "mute" | "unmute", value: number',
      icon: Sliders,
    },
    {
      name: 'files.workspace_controller',
      module: 'file_controller.py',
      category: 'Automation',
      desc: 'Performs filesystem read, write, create, append, and delete operations on ~/JarvisWorkspace.',
      params: 'action: "read" | "write" | "create" | "delete", filename: string, content?: string',
      icon: FileText,
    },
    {
      name: 'vision.capture_and_analyze',
      module: 'screen_vision.py',
      category: 'Automation',
      desc: 'Captures desktop / window framebuffer and performs multimodal OCR and UI element detection.',
      params: 'target_display: number, query_prompt: string',
      icon: Eye,
    },
    {
      name: 'web.telemetry_search',
      module: 'web_search.py',
      category: 'Automation',
      desc: 'Queries DuckDuckGo Instant Answers API and live web services for instant intelligence summaries.',
      params: 'query: string, max_results?: number',
      icon: Globe,
    },
    {
      name: 'state.memory_matrix',
      module: 'memory_manager.py',
      category: 'State',
      desc: 'Stores, searches, recalls, and prunes long-term memory facts about people, projects, and conversations.',
      params: 'category: "person" | "project" | "preference" | "note", title: string, content: string',
      icon: Database,
    },
  ];

  // Default sample plan if none currently executing
  const displayPlan: TaskPlan = activePlan || {
    id: 'sample-plan-1',
    userDirective: 'Analyze display framebuffer, search latest quantum battery breakthroughs, and log summary into flight_telemetry.md',
    status: 'completed',
    timestamp: 'Just now',
    steps: [
      {
        id: 'step-1',
        title: 'Capture and inspect active screen framebuffer',
        module: 'screen_vision',
        tool: 'vision.capture_and_analyze',
        status: 'completed',
        output: 'Framebuffer captured: 1920x1080. Active IDE window verified.',
      },
      {
        id: 'step-2',
        title: 'Dispatch global intelligence query for quantum battery research',
        module: 'web_search',
        tool: 'web.telemetry_search',
        status: 'completed',
        output: 'Located MIT & Nature Energy breakthroughs: Solid-state electrolyte stability improved 40%.',
      },
      {
        id: 'step-3',
        title: 'Append research findings into ~/JarvisWorkspace/flight_telemetry.md',
        module: 'file_controller',
        tool: 'files.workspace_controller',
        status: 'completed',
        output: 'Successfully appended 320 bytes to flight_telemetry.md.',
      },
      {
        id: 'step-4',
        title: 'Synthesize vocal confirmation to User via TTS pipeline',
        module: 'action_loader',
        tool: 'voice.synthesize_speech',
        status: 'completed',
        output: 'Acoustic carrier transmitted.',
      },
    ],
  };

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testDirective.trim()) return;
    setIsPlanning(true);
    onExecuteDirective(testDirective.trim());
    setTimeout(() => {
      setIsPlanning(false);
      setTestDirective('');
    }, 1200);
  };

  const sampleDirectives = [
    'Check Tokyo weather, set master volume to 80%, and write a note in workspace',
    'Capture screen context, search latest AI models, and append to flight_telemetry.md',
    'Prepare standby protocol: minimize all windows, mute audio, and save memory',
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
            PLANNING LLM [llm_client.py] &amp; TOOL REGISTRY [action_loader.py]
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            TASK DECOMPOSITION
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span>MODEL: GEMINI 3.8 FLASH</span>
          <span>·</span>
          <span className="text-emerald-400">DAG ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden font-mono text-xs">
        {/* Left Column: Active Task Plan Breakdown */}
        <div className="lg:col-span-7 p-4 bg-slate-950/50 border-r border-slate-800/80 flex flex-col justify-between space-y-4 overflow-y-auto">
          <div className="space-y-3">
            {/* Directive Box */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="text-[10px] text-amber-400 font-bold uppercase flex items-center justify-between">
                <span>ACTIVE USER DIRECTIVE</span>
                <span className="text-slate-500">{displayPlan.timestamp}</span>
              </div>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                &ldquo;{displayPlan.userDirective}&rdquo;
              </p>
            </div>

            {/* Task Steps Sequence */}
            <div className="space-y-2">
              <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>DECOMPOSED EXECUTION PLAN (DAG)</span>
                <span className="text-emerald-400 font-bold uppercase text-[9px]">
                  STATUS: {displayPlan.status}
                </span>
              </div>

              <div className="space-y-2">
                {displayPlan.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-200">{step.title}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>COMPLETED</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 pl-7">
                      <span>
                        Tool: <strong className="text-amber-300 font-normal">{step.tool}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Module: <strong className="text-slate-300 font-normal">{step.module}.py</strong>
                      </span>
                    </div>

                    {step.output && (
                      <div className="mt-1 pl-7 text-[10px] text-slate-400 bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                        {step.output}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Compound Directive Input */}
          <form onSubmit={handleTestSubmit} className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="text-[10px] text-slate-400 uppercase font-bold">
              TEST COMPOUND MULTI-STEP DIRECTIVE
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={testDirective}
                onChange={(e) => setTestDirective(e.target.value)}
                placeholder="Enter compound directive for LLM planner..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={isPlanning}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isPlanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>PLAN &amp; RUN</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {sampleDirectives.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTestDirective(s)}
                  className="text-[10px] text-slate-400 hover:text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-left truncate max-w-full"
                >
                  &ldquo;{s.slice(0, 48)}...&rdquo;
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Right Column: Registered Tool Loader Inventory */}
        <div className="lg:col-span-5 p-4 bg-slate-950 flex flex-col justify-between space-y-3 overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                <Wrench className="w-3.5 h-3.5" />
                <span>TOOL INVENTORY [action_loader.py]</span>
              </div>
              <span className="text-[10px] text-slate-500">{toolRegistry.length} TOOLS REGISTERED</span>
            </div>

            <div className="space-y-2.5">
              {toolRegistry.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <div
                    key={tool.name}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-[11px]">
                        <IconComponent className="w-3.5 h-3.5 text-amber-400" />
                        <span>{tool.name}</span>
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                        {tool.category}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed">{tool.desc}</p>

                    <div className="text-[9px] text-slate-500 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 truncate">
                      {tool.params}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span>LLM PROTOCOL: GEMINI FUNCTION CALLING</span>
            <span>AUTONOMOUS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
