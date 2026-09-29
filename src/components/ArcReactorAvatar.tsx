import React, { useEffect, useRef, useState } from 'react';
import { JarvisState, HUDTheme } from '../types';
import { THEMES } from '../utils/theme';
import { Volume2, Sparkles, Radio, Eye, Layers } from 'lucide-react';

interface ArcReactorAvatarProps {
  state: JarvisState;
  theme: HUDTheme;
  audioLevel?: number; // 0 to 1
  onClick?: () => void;
  assistantName: string;
  isSpatialTrackingActive?: boolean;
  isSpatialPinching?: boolean;
}

export const ArcReactorAvatar: React.FC<ArcReactorAvatarProps> = ({
  state,
  theme,
  audioLevel = 0,
  onClick,
  assistantName,
  isSpatialTrackingActive = false,
  isSpatialPinching = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [coreMode, setCoreMode] = useState<'hologram' | 'reactor' | 'visor'>('hologram');
  const currentTheme = THEMES[theme];

  // Mouse move for subtle 3D parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMouseOffset({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  // Canvas 60fps rendering of actual Jarvis Holographic Core
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const particles: { angle: number; radius: number; speed: number; size: number; opacity: number }[] = [];

    // Initialize 45 orbiting holographic particles
    for (let i = 0; i < 45; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 40 + Math.random() * 110,
        speed: (Math.random() - 0.5) * 0.02,
        size: 1 + Math.random() * 2,
        opacity: 0.2 + Math.random() * 0.7,
      });
    }

    const render = () => {
      time += 0.025;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2 + mouseOffset.x * 12;
      const cy = height / 2 + mouseOffset.y * 12;

      ctx.clearRect(0, 0, width, height);

      // Dynamic responsiveness based on audio & state
      const isVoiceActive = state === 'speaking' || state === 'listening';
      const amp = isVoiceActive ? 0.35 + audioLevel * 0.65 : state === 'thinking' ? 0.45 : 0.15;
      const pulse = 1 + Math.sin(time * 3) * 0.04 * (1 + amp);

      const primary = currentTheme.primary;
      const accent = currentTheme.accent;

      // 1. Draw Background Hexagonal Holographic Grid
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const hexR = 24;
      for (let r = -4; r <= 4; r++) {
        for (let q = -4; q <= 4; q++) {
          const hx = cx + hexR * Math.sqrt(3) * (q + r / 2);
          const hy = cy + hexR * 1.5 * r;
          const dist = Math.hypot(hx - cx, hy - cy);
          if (dist < 155) {
            ctx.beginPath();
            for (let a = 0; a < 6; a++) {
              const angle = (Math.PI / 3) * a;
              const px = hx + (hexR - 2) * Math.cos(angle);
              const py = hy + (hexR - 2) * Math.sin(angle);
              if (a === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // 2. 3D Perspective Gyroscopic Orbital Rings (Real Jarvis Hologram)
      const ringTesselations = [
        { r: 138, rotX: 0.65 + mouseOffset.y * 0.2, rotY: time * 0.8 + mouseOffset.x * 0.2, width: 1.5, dash: [8, 12], alpha: 0.4 },
        { r: 118, rotX: -0.55 + mouseOffset.y * 0.2, rotY: -time * 1.1 + mouseOffset.x * 0.2, width: 2, dash: [40, 20, 8, 15], alpha: 0.65 },
        { r: 96, rotX: 0.85 + mouseOffset.y * 0.25, rotY: time * 1.6, width: 1.5, dash: [20, 8, 5, 8], alpha: 0.75 },
        { r: 76, rotX: -0.75, rotY: -time * 2.2, width: 2, dash: [15, 10], alpha: 0.85 },
      ];

      ringTesselations.forEach((ring) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, Math.cos(ring.rotX));
        ctx.rotate(ring.rotY);
        ctx.beginPath();
        ctx.arc(0, 0, ring.r * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = ring.alpha > 0.6 ? accent : primary;
        ctx.globalAlpha = ring.alpha * (state === 'thinking' ? 1 : 0.8);
        ctx.lineWidth = ring.width;
        ctx.setLineDash(ring.dash);
        ctx.stroke();

        // Little orbital beacon beads along the ring
        const beadAngle = (time * 2) % (Math.PI * 2);
        const bx = Math.cos(beadAngle) * ring.r * pulse;
        const by = Math.sin(beadAngle) * ring.r * pulse;
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = accent;
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.restore();
      });

      // 3. Audio-Reactive Vocal Modulation Wave Ribbon (Iconic Jarvis Voice Undulation)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      const waveRadius = 66 * pulse;
      const points = 72;
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        // Harmonic waveform modulation
        const waveFreq = Math.sin(theta * 6 + time * 6) * Math.cos(theta * 3 - time * 4);
        const deflection = waveFreq * (isVoiceActive ? 12 + audioLevel * 20 : state === 'thinking' ? 7 : 3);
        const r = waveRadius + deflection;
        const wx = Math.cos(theta) * r;
        const wy = Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.closePath();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = primary;
      ctx.shadowBlur = isVoiceActive ? 16 : 8;
      ctx.stroke();

      // Second harmonic inner wave ring
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        const waveFreq = Math.cos(theta * 8 - time * 8);
        const deflection = waveFreq * (isVoiceActive ? 8 + audioLevel * 14 : 2);
        const r = 52 * pulse + deflection;
        const wx = Math.cos(theta) * r;
        const wy = Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.closePath();
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 4. Stator Coils / Arc Reactor Core Aperture (Mark 85 Architecture)
      ctx.save();
      ctx.translate(cx, cy);
      const coils = 12;
      for (let i = 0; i < coils; i++) {
        const rot = (i * Math.PI * 2) / coils + (state === 'thinking' ? time * 1.5 : time * 0.3);
        ctx.save();
        ctx.rotate(rot);
        ctx.fillStyle = primary;
        ctx.globalAlpha = isVoiceActive ? 0.9 : 0.6;
        // Segmented trapezoid stator block
        ctx.fillRect(-4, 38 * pulse, 8, 14);
        // Copper winding stripe
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, 42 * pulse, 4, 6);
        ctx.restore();
      }
      ctx.restore();

      // 5. Central Plasma Singularity (Luminous Consciousness Core)
      ctx.save();
      ctx.translate(cx, cy);

      // Outer radial flare
      const flareRadius = 42 * (1 + amp * 0.4);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, flareRadius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, accent);
      grad.addColorStop(0.65, primary);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      ctx.shadowColor = accent;
      ctx.shadowBlur = isVoiceActive ? 30 : 15;
      ctx.beginPath();
      ctx.arc(0, 0, flareRadius, 0, Math.PI * 2);
      ctx.fill();

      // Central core node
      ctx.beginPath();
      ctx.arc(0, 0, 16 * (1 + amp * 0.2), 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.fill();

      // Target Crosshair / Reticle Marks
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Cardinal tick marks
      ctx.moveTo(-24, 0); ctx.lineTo(-12, 0);
      ctx.moveTo(12, 0); ctx.lineTo(24, 0);
      ctx.moveTo(0, -24); ctx.lineTo(0, -12);
      ctx.moveTo(0, 12); ctx.lineTo(0, 24);
      ctx.stroke();

      ctx.restore();

      // 6. Floating Holographic Particle Sparks
      ctx.save();
      particles.forEach((p) => {
        p.angle += p.speed * (state === 'thinking' ? 2.5 : 1);
        const px = cx + Math.cos(p.angle) * p.radius * pulse;
        const py = cy + Math.sin(p.angle) * p.radius * pulse;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.size > 1.8 ? '#ffffff' : accent;
        ctx.globalAlpha = p.opacity * (isVoiceActive ? 1 : 0.6);
        ctx.shadowColor = primary;
        ctx.shadowBlur = 6;
        ctx.fill();
      });
      ctx.restore();

      // 7. Outer Calibrated Compass Degree Ring & Degree Labels
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = primary;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 150, 0, Math.PI * 2);
      ctx.stroke();

      // Degree tick marks every 10 degrees
      for (let d = 0; d < 360; d += 10) {
        const rad = (d * Math.PI) / 180;
        const isMajor = d % 90 === 0;
        const isSemi = d % 30 === 0;
        const len = isMajor ? 10 : isSemi ? 6 : 3;

        const x1 = Math.cos(rad) * 150;
        const y1 = Math.sin(rad) * 150;
        const x2 = Math.cos(rad) * (150 - len);
        const y2 = Math.sin(rad) * (150 - len);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isMajor ? accent : primary;
        ctx.globalAlpha = isMajor ? 0.9 : isSemi ? 0.5 : 0.25;
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.stroke();

        // Print Cardinal Degree Text on Majors
        if (isMajor) {
          ctx.save();
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = accent;
          ctx.globalAlpha = 0.8;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const tx = Math.cos(rad) * 164;
          const ty = Math.sin(rad) * 164;
          ctx.fillText(`${d.toString().padStart(3, '0')}°`, tx, ty);
          ctx.restore();
        }
      }
      ctx.restore();

      // 8. Four Corner Tactical Brackets `[ ` and ` ]`
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.5;
      const bSize = 160;
      const bLen = 14;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(cx - bSize, cy - bSize + bLen);
      ctx.lineTo(cx - bSize, cy - bSize);
      ctx.lineTo(cx - bSize + bLen, cy - bSize);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(cx + bSize - bLen, cy - bSize);
      ctx.lineTo(cx + bSize, cy - bSize);
      ctx.lineTo(cx + bSize, cy - bSize + bLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(cx - bSize, cy + bSize - bLen);
      ctx.lineTo(cx - bSize, cy + bSize);
      ctx.lineTo(cx - bSize + bLen, cy + bSize);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(cx + bSize - bLen, cy + bSize);
      ctx.lineTo(cx + bSize, cy + bSize);
      ctx.lineTo(cx + bSize, cy + bSize - bLen);
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [theme, state, audioLevel, mouseOffset, currentTheme]);

  const stateLabels: Record<JarvisState, { text: string; sub: string; color: string }> = {
    idle: {
      text: 'SYSTEM STANDBY // READY',
      sub: 'AWAITING VOCAL DIRECTIVE',
      color: 'text-slate-400',
    },
    listening: {
      text: 'AUDIO RECEPTOR ENGAGED',
      sub: 'STREAMING SPECTRUM 16kHz',
      color: currentTheme.text,
    },
    thinking: {
      text: 'NEURAL COGNITION RUNNING',
      sub: 'GEMINI 3.8 FLASH INFERENCE',
      color: 'text-amber-400',
    },
    speaking: {
      text: 'VOCAL SYNTHESIZER ACTIVE',
      sub: 'TRANSMITTING ACOUSTIC CARRIER',
      color: currentTheme.text,
    },
    executing: {
      text: 'DIRECT SYSTEM OVERRIDE',
      sub: 'HARDWARE BUS DISPATCHED',
      color: 'text-emerald-400',
    },
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="flex flex-col items-center justify-center relative select-none w-full max-w-[360px] mx-auto"
    >
      {/* Cinematic Ambient Glow Bloom */}
      <div
        className="absolute w-80 h-80 rounded-full blur-3xl opacity-35 transition-all duration-700 pointer-events-none"
        style={{
          backgroundColor: currentTheme.primary,
          transform: `scale(${state === 'speaking' || state === 'listening' ? 1.25 : 1})`,
        }}
      />

      {/* Interactive Core Mode Badges */}
      <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1 px-2 z-10">
        <span className="flex items-center gap-1 text-slate-400">
          <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>STARK AI // CORE v85.4</span>
        </span>

        <span className="tabular-nums text-slate-400">
          FLUX: {(1.18 + audioLevel * 0.4).toFixed(2)} GW
        </span>
      </div>

      {/* Canvas Hologram Viewport */}
      <div
        onClick={onClick}
        data-gesture-interactive="true"
        aria-label="Engage Arc Reactor"
        className="relative w-[320px] h-[320px] sm:w-[350px] sm:h-[350px] flex items-center justify-center cursor-pointer group"
        title="Click to engage Jarvis audio receptor"
      >
        {/* Subtle Spatial Gesture Tracking Ring Response */}
        {isSpatialTrackingActive && (
          <div
            className={`absolute inset-4 rounded-full border border-dashed transition-all duration-300 pointer-events-none ${
              isSpatialPinching
                ? 'border-amber-400 scale-95 shadow-[0_0_25px_rgba(251,191,36,0.6)] animate-pulse'
                : 'border-cyan-400/40 scale-100 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-spin-slow'
            }`}
          />
        )}

        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="w-full h-full block transform transition-transform duration-200 group-hover:scale-[1.02]"
        />

        {/* Floating Telemetry Labels around the Core */}
        <div className="absolute top-4 left-4 text-[9px] font-mono tracking-wider text-cyan-400/80 pointer-events-none drop-shadow">
          <div>LOC: ORBIT_01</div>
          <div className="text-slate-500 text-[8px]">SYS_SYNC: 99.8%</div>
        </div>

        <div className="absolute top-4 right-4 text-[9px] font-mono tracking-wider text-right text-cyan-400/80 pointer-events-none drop-shadow">
          <div>VOCAL: 44.1kHz</div>
          <div className="text-slate-500 text-[8px]">BAND: HIGH-PASS</div>
        </div>

        <div className="absolute bottom-4 left-4 text-[9px] font-mono tracking-wider text-slate-400 pointer-events-none drop-shadow">
          <div className="text-emerald-400/90 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            CORE ACTIVE
          </div>
          <div className="text-slate-500 text-[8px]">SEC_LVL: ALPHA</div>
        </div>

        <div className="absolute bottom-4 right-4 text-[9px] font-mono tracking-wider text-right text-slate-400 pointer-events-none drop-shadow">
          <div>LATENCY: 0.04ms</div>
          <div className="text-slate-500 text-[8px]">BUS: QUANTUM</div>
        </div>

        {/* Center Hover Action Tag */}
        <div className="absolute bottom-16 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[10px] font-mono tracking-widest text-slate-200 bg-slate-950/90 px-2.5 py-1 rounded-full border border-cyan-500/40 shadow-lg pointer-events-none flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>CLICK TO ENGAGE</span>
        </div>
      </div>

      {/* State & Assistant Identity readout */}
      <div className="mt-1 text-center w-full z-10">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-widest text-slate-100 font-display">
            {assistantName}
          </h2>
          <span
            className="w-2.5 h-2.5 rounded-full shadow-lg"
            style={{
              backgroundColor: currentTheme.primary,
              boxShadow: `0 0 12px ${currentTheme.primary}`,
            }}
          />
        </div>

        <div className="flex flex-col items-center mt-0.5">
          <span className={`text-xs font-mono font-bold tracking-wider uppercase ${stateLabels[state].color}`}>
            {stateLabels[state].text}
          </span>
          <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">
            {stateLabels[state].sub}
          </span>
        </div>
      </div>
    </div>
  );
};
