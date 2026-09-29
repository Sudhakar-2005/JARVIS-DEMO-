// Spatial Screen Interaction Engine V1 - GestureInterpreter
// Anti-false-positive system: debounce, cooldown, hold duration, and semantic intent generation.

import { SpatialIntent, SpatialGestureType } from '../types';
import { RecognizedGesture } from './GestureRecognizer';

export interface InterpretedAction {
  intent: SpatialIntent;
  confidence: number;
  gesture: SpatialGestureType;
  screenX: number;
  screenY: number;
  metadata?: any;
}

export class GestureInterpreter {
  // Anti-false-positive parameters
  private pinchHoldStart: number | null = null;
  private pinchOrigin: { x: number; y: number } | null = null;
  private isPinchLatched: boolean = false;
  private lastSelectTimestamp: number = 0;
  private isDragging: boolean = false;

  private minPinchHoldDurationMs: number = 60; // Must hold pinch for at least 60ms to confirm intent
  private selectCooldownMs: number = 400; // Must wait 400ms before next selection
  private dragMovementThresholdPx: number = 18; // Distance moved to initiate drag

  public reset() {
    this.pinchHoldStart = null;
    this.pinchOrigin = null;
    this.isPinchLatched = false;
    this.isDragging = false;
  }

  public interpret(gesture: RecognizedGesture, screenX: number, screenY: number): InterpretedAction {
    const now = performance.now();

    // 1. Fist -> Cancel Interaction
    if (gesture.type === 'fist') {
      this.reset();
      return {
        intent: 'CANCEL_INTERACTION',
        confidence: gesture.confidence,
        gesture: 'fist',
        screenX,
        screenY,
      };
    }

    // 2. Open Palm -> Pause Interaction
    if (gesture.type === 'open_palm') {
      this.reset();
      return {
        intent: 'PAUSE_INTERACTION',
        confidence: gesture.confidence,
        gesture: 'open_palm',
        screenX,
        screenY,
      };
    }

    // 3. Two-Hand Actions
    if (gesture.type === 'two_hand_zoom_in') {
      return {
        intent: 'ZOOM_IN',
        confidence: gesture.confidence,
        gesture: 'two_hand_zoom_in',
        screenX,
        screenY,
        metadata: gesture.data,
      };
    }

    if (gesture.type === 'two_hand_zoom_out') {
      return {
        intent: 'ZOOM_OUT',
        confidence: gesture.confidence,
        gesture: 'two_hand_zoom_out',
        screenX,
        screenY,
        metadata: gesture.data,
      };
    }

    if (gesture.type === 'two_hand_rotate') {
      return {
        intent: 'ROTATE',
        confidence: gesture.confidence,
        gesture: 'two_hand_rotate',
        screenX,
        screenY,
        metadata: gesture.data,
      };
    }

    // 4. Pinch / Drag Handling
    if (gesture.type === 'pinch' || gesture.type === 'pinch_drag') {
      // First frame of pinch detected
      if (this.pinchHoldStart === null) {
        this.pinchHoldStart = now;
        this.pinchOrigin = { x: screenX, y: screenY };
      }

      const holdDuration = now - this.pinchHoldStart;

      // Check if moving while pinching -> DRAG
      if (this.pinchOrigin) {
        const dx = screenX - this.pinchOrigin.x;
        const dy = screenY - this.pinchOrigin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > this.dragMovementThresholdPx || this.isDragging) {
          this.isDragging = true;
          return {
            intent: 'DRAG',
            confidence: gesture.confidence,
            gesture: 'pinch_drag',
            screenX,
            screenY,
            metadata: { dx, dy, origin: this.pinchOrigin },
          };
        }
      }

      // If hold threshold satisfied and not yet triggered in this pinch cycle
      if (
        holdDuration >= this.minPinchHoldDurationMs &&
        !this.isPinchLatched &&
        now - this.lastSelectTimestamp > this.selectCooldownMs
      ) {
        this.isPinchLatched = true;
        this.lastSelectTimestamp = now;

        return {
          intent: 'SELECT',
          confidence: gesture.confidence,
          gesture: 'pinch',
          screenX,
          screenY,
        };
      }

      // Holding pinch but already clicked / not yet dragging
      return {
        intent: 'POINTER_MOVE',
        confidence: gesture.confidence,
        gesture: 'pinch',
        screenX,
        screenY,
      };
    }

    // 5. Release Pinch
    if (this.pinchHoldStart !== null || this.isPinchLatched || this.isDragging) {
      const wasDragging = this.isDragging;
      this.reset();

      if (wasDragging) {
        return {
          intent: 'DROP',
          confidence: gesture.confidence,
          gesture: 'point',
          screenX,
          screenY,
        };
      }
    }

    // 6. Point / Pointer Move
    return {
      intent: 'POINTER_MOVE',
      confidence: gesture.confidence,
      gesture: 'point',
      screenX,
      screenY,
    };
  }
}
