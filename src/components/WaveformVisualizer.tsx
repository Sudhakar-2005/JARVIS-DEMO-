import React, { useEffect, useRef } from 'react';
import { HUDTheme, JarvisState } from '../types';
import { THEMES } from '../utils/theme';

interface WaveformVisualizerProps {
  theme: HUDTheme;
  state: JarvisState;
  audioStream: MediaStream | null;
  audioLevel: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  theme,
  state,
  audioStream,
  audioLevel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const currentTheme = THEMES[theme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let dataArray: Uint8Array | null = null;

    if (audioStream && (state === 'listening' || state === 'speaking')) {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioCtxClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        source = audioCtx.createMediaStreamSource(audioStream);
        source.connect(analyser);
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      } catch (err) {
        // Fallback to simulated wave
      }
    }

    let phase = 0;

    const render = () => {
      phase += 0.08;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isLiveActive = (state === 'listening' || state === 'speaking');
      let frequencies: number[] = [];

      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray as any);
        frequencies = Array.from(dataArray);
      } else {
        // Synthetic harmonic audio waves
        const barCount = 48;
        for (let i = 0; i < barCount; i++) {
          if (isLiveActive) {
            const raw = Math.sin(phase + i * 0.3) * Math.cos(phase * 0.7 + i * 0.15);
            frequencies.push(Math.abs(raw) * 180 + audioLevel * 100);
          } else if (state === 'thinking') {
            const raw = Math.sin(phase * 2 + i * 0.4);
            frequencies.push(Math.abs(raw) * 70 + 20);
          } else {
            // Calm standby hum
            const raw = Math.sin(phase * 0.5 + i * 0.2);
            frequencies.push(Math.abs(raw) * 15 + 4);
          }
        }
      }

      // Draw background center hairline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw mirrored frequency spectrum bars
      const barsToDraw = Math.min(frequencies.length, 48);
      const barWidth = Math.max(2, (width / barsToDraw) - 3);

      for (let i = 0; i < barsToDraw; i++) {
        const value = frequencies[i] || 0;
        const normalized = Math.min(1, value / 220);
        const barHeight = Math.max(3, normalized * (height * 0.42));
        const x = i * (barWidth + 3) + 4;
        const centerY = height / 2;

        const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
        gradient.addColorStop(0, currentTheme.accent);
        gradient.addColorStop(0.5, currentTheme.primary);
        gradient.addColorStop(1, currentTheme.secondary);

        ctx.fillStyle = gradient;
        ctx.shadowColor = currentTheme.primary;
        ctx.shadowBlur = isLiveActive ? 8 : 2;

        // Symmetric rounded bar
        ctx.fillRect(x, centerY - barHeight, barWidth, barHeight * 2);
      }

      // Draw smooth overlay sine oscilloscope
      ctx.shadowBlur = 10;
      ctx.strokeStyle = currentTheme.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = width / 64;
      let x = 0;

      for (let i = 0; i < 64; i++) {
        const amp = isLiveActive ? 18 + audioLevel * 25 : state === 'thinking' ? 10 : 3;
        const y = height / 2 + Math.sin(phase * 1.5 + i * 0.25) * amp;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [theme, state, audioStream, audioLevel, currentTheme]);

  return (
    <div className="w-full relative px-2 py-1 bg-slate-950/70 border border-slate-800/80 rounded-lg overflow-hidden backdrop-blur-sm shadow-inner">
      <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-slate-400 mb-1">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              state === 'listening' ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          AUDIO TELEMETRY SPECTRUM
        </span>
        <span className="tabular-nums">
          {state === 'listening' ? 'MIC: ACTIVE (16kHz)' : state === 'speaking' ? 'VOX: OUTPUT (24kHz)' : 'STANDBY'}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={480}
        height={72}
        className="w-full h-16 block rounded"
      />
    </div>
  );
};
