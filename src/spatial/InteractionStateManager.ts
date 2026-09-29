// Spatial Screen Interaction Engine V1 - InteractionStateManager
// Finite State Machine governing the gesture interaction lifecycle.

import { SpatialInteractionState, SpatialIntent } from '../types';

export class InteractionStateManager {
  private currentState: SpatialInteractionState = 'INACTIVE';
  private listeners: Array<(state: SpatialInteractionState, prevState: SpatialInteractionState) => void> = [];

  public getState(): SpatialInteractionState {
    return this.currentState;
  }

  public onStateChange(
    callback: (state: SpatialInteractionState, prevState: SpatialInteractionState) => void
  ): () => void {
    this.listeners.push(callback);
    callback(this.currentState, this.currentState);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public transition(nextState: SpatialInteractionState): void {
    if (this.currentState === nextState) return;

    const prevState = this.currentState;
    this.currentState = nextState;

    for (const listener of this.listeners) {
      try {
        listener(nextState, prevState);
      } catch (err) {
        console.error('InteractionStateManager listener error:', err);
      }
    }
  }

  public updateFromIntent(intent: SpatialIntent, isOverInteractive: boolean, hasHands: boolean): void {
    if (!hasHands) {
      if (this.currentState !== 'INACTIVE' && this.currentState !== 'CAMERA_ERROR') {
        this.transition('LOST_HAND');
      }
      return;
    }

    switch (intent) {
      case 'CANCEL_INTERACTION':
        this.transition('CANCELLED');
        break;

      case 'PAUSE_INTERACTION':
        this.transition('PAUSED');
        break;

      case 'SELECT':
        this.transition('SELECTING');
        break;

      case 'DRAG':
        this.transition('DRAGGING');
        break;

      case 'DROP':
        this.transition(isOverInteractive ? 'HOVERING' : 'TRACKING');
        break;

      case 'POINTER_MOVE':
      default:
        if (this.currentState === 'PAUSED') {
          // Stay paused until released
          return;
        }
        this.transition(isOverInteractive ? 'HOVERING' : 'TRACKING');
        break;
    }
  }
}
