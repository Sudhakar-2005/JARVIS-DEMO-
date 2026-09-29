// Spatial Screen Interaction Engine V1 - LandmarkProcessor
// Viewport projection, mirroring, interaction boundary expansion, and 1€ low-pass filtering.

import { HandData } from '../types';

export interface ViewportCoord {
  x: number;
  y: number;
  rawNormalizedX: number;
  rawNormalizedY: number;
}

export class LandmarkProcessor {
  private mirrorMode: boolean = true;
  private sensitivity: number = 1.35; // 1.0 - 2.0 active zone scaling
  private prevScreenX: number = 0;
  private prevScreenY: number = 0;
  private prevTime: number = 0;
  private filteredScreenX: number = 0;
  private filteredScreenY: number = 0;

  constructor() {
    this.prevScreenX = window.innerWidth / 2;
    this.prevScreenY = window.innerHeight / 2;
    this.filteredScreenX = this.prevScreenX;
    this.filteredScreenY = this.prevScreenY;
    this.prevTime = performance.now();
  }

  public setMirrorMode(mirror: boolean) {
    this.mirrorMode = mirror;
  }

  public setSensitivity(sensitivity: number) {
    this.sensitivity = Math.max(0.5, Math.min(2.5, sensitivity));
  }

  /**
   * Projects a normalized camera coordinate [0, 1] into window viewport screen coordinates [0, innerWidth/innerHeight]
   * Applies mirroring, sensitivity scaling, and low-jitter filtering.
   */
  public projectToViewport(hand: HandData): ViewportCoord {
    const rawX = hand.indexTip.x;
    const rawY = hand.indexTip.y;

    // Apply mirror mode
    let mappedX = this.mirrorMode ? 1.0 - rawX : rawX;
    let mappedY = rawY;

    // Expand interaction zone using sensitivity so full screen can be reached comfortably
    // Camera center is at (0.5, 0.5)
    mappedX = (mappedX - 0.5) * this.sensitivity + 0.5;
    mappedY = (mappedY - 0.45) * this.sensitivity + 0.45;

    // Clamp to [0, 1]
    mappedX = Math.max(0.01, Math.min(0.99, mappedX));
    mappedY = Math.max(0.01, Math.min(0.99, mappedY));

    // Target screen coordinates
    const targetScreenX = mappedX * window.innerWidth;
    const targetScreenY = mappedY * window.innerHeight;

    // Dynamic Low-Pass 1-Euro style filter:
    // When moving slowly -> high smoothing to eliminate micro-jitter
    // When moving fast -> low smoothing to eliminate input lag
    const now = performance.now();
    const dt = Math.max(1, now - this.prevTime) / 1000;
    this.prevTime = now;

    const dx = targetScreenX - this.filteredScreenX;
    const dy = targetScreenY - this.filteredScreenY;
    const velocity = Math.sqrt(dx * dx + dy * dy) / dt;

    // Adaptive alpha
    const minCutoff = 1.0;
    const beta = 0.007;
    const cutoff = minCutoff + beta * velocity;
    const alpha = (2 * Math.PI * dt * cutoff) / (2 * Math.PI * dt * cutoff + 1);

    this.filteredScreenX = this.filteredScreenX + alpha * dx;
    this.filteredScreenY = this.filteredScreenY + alpha * dy;

    // Bound to current viewport
    const finalX = Math.max(4, Math.min(window.innerWidth - 4, this.filteredScreenX));
    const finalY = Math.max(4, Math.min(window.innerHeight - 4, this.filteredScreenY));

    return {
      x: finalX,
      y: finalY,
      rawNormalizedX: rawX,
      rawNormalizedY: rawY,
    };
  }

  public reset() {
    this.filteredScreenX = window.innerWidth / 2;
    this.filteredScreenY = window.innerHeight / 2;
  }
}
