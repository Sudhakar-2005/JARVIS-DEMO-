// Spatial Screen Interaction Engine V1 - SpatialInteractionController
// Master coordinator unifying camera, hand tracking, gesture interpretation, and UI targeting.

import {
  SpatialSettings,
  SpatialInteractionState,
  SpatialGestureType,
  SpatialPointerPosition,
  HandData,
} from '../types';
import { CameraManager, CameraStatus } from './CameraManager';
import { HandTracker } from './HandTracker';
import { LandmarkProcessor } from './LandmarkProcessor';
import { GestureRecognizer } from './GestureRecognizer';
import { GestureInterpreter, InterpretedAction } from './GestureInterpreter';
import { InteractionStateManager } from './InteractionStateManager';
import { playJarvisChime } from '../utils/audioEffects';

export interface SpatialTelemetry {
  state: SpatialInteractionState;
  cameraStatus: CameraStatus;
  handCount: number;
  currentGesture: SpatialGestureType;
  confidence: number;
  pointer: SpatialPointerPosition;
  fps: number;
  latencyMs: number;
  hands: HandData[];
}

export class SpatialInteractionController {
  private cameraManager: CameraManager;
  private handTracker: HandTracker;
  private landmarkProcessor: LandmarkProcessor;
  private gestureRecognizer: GestureRecognizer;
  private gestureInterpreter: GestureInterpreter;
  private stateManager: InteractionStateManager;

  private settings: SpatialSettings = {
    enabled: false,
    sensitivity: 1.35,
    confidenceThreshold: 0.65,
    smoothingFactor: 0.65,
    mirrorMode: true,
    debugMode: false,
    selectedCameraId: '',
  };

  private currentPointer: SpatialPointerPosition = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    rawX: 0.5,
    rawY: 0.5,
    isOverInteractiveElement: false,
  };

  private telemetryListeners: Array<(telemetry: SpatialTelemetry) => void> = [];
  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();
  private currentFps: number = 60;
  private lastLatencyMs: number = 3.5;
  private currentGesture: SpatialGestureType = 'none';
  private currentConfidence: number = 0;
  private latestHands: HandData[] = [];

  constructor() {
    this.cameraManager = new CameraManager();
    this.handTracker = new HandTracker();
    this.landmarkProcessor = new LandmarkProcessor();
    this.gestureRecognizer = new GestureRecognizer();
    this.gestureInterpreter = new GestureInterpreter();
    this.stateManager = new InteractionStateManager();

    this.setupPipeline();
  }

  private setupPipeline() {
    // 1. Camera status updates
    this.cameraManager.onStatusChange((status, error) => {
      if (status === 'ACTIVE') {
        const video = this.cameraManager.getVideoElement();
        if (video) {
          this.handTracker.start(video);
          this.stateManager.transition('TRACKING');
        }
      } else if (status === 'OFF') {
        this.handTracker.stop();
        this.stateManager.transition('INACTIVE');
      } else if (status === 'ERROR' || status === 'DENIED') {
        this.handTracker.stop();
        this.stateManager.transition('CAMERA_ERROR');
      }
      this.emitTelemetry();
    });

    // 2. Hand tracking frame processing
    this.handTracker.onHandsDetected((hands, latencyMs) => {
      this.latestHands = hands;
      this.lastLatencyMs = latencyMs;

      // Update FPS counter
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsTime >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
        this.frameCount = 0;
        this.lastFpsTime = now;
      }

      if (hands.length === 0) {
        this.currentGesture = 'none';
        this.currentConfidence = 0;
        this.stateManager.updateFromIntent('NONE', false, false);
        this.emitTelemetry();
        return;
      }

      const primaryHand = hands[0];

      // Project index tip to viewport screen coordinates
      const viewportCoord = this.landmarkProcessor.projectToViewport(primaryHand);

      // Perform UI Hit-Testing
      const hitTestResult = this.evaluateHitTarget(viewportCoord.x, viewportCoord.y);

      this.currentPointer = {
        x: viewportCoord.x,
        y: viewportCoord.y,
        rawX: viewportCoord.rawNormalizedX,
        rawY: viewportCoord.rawNormalizedY,
        isOverInteractiveElement: !!hitTestResult.target,
        targetElementText: hitTestResult.label,
      };

      // Recognize Gesture
      const isDragging = this.stateManager.getState() === 'DRAGGING';
      const recognized = this.gestureRecognizer.recognize(hands, isDragging);
      this.currentGesture = recognized.type;
      this.currentConfidence = recognized.confidence;

      // Interpret Semantic Intent with Anti-False-Positive Engine
      const action = this.gestureInterpreter.interpret(
        recognized,
        viewportCoord.x,
        viewportCoord.y
      );

      // Update State Machine
      this.stateManager.updateFromIntent(
        action.intent,
        !!hitTestResult.target,
        hands.length > 0
      );

      // Execute UI Action
      this.dispatchUIIntent(action, hitTestResult.target);

      this.emitTelemetry();
    });
  }

  /**
   * UI Hit-Testing: Finds interactive targets under the pointer.
   * Prioritizes elements with [data-gesture-interactive="true"], buttons, tabs, inputs, and links.
   */
  private evaluateHitTarget(x: number, y: number): { target: HTMLElement | null; label?: string } {
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) {
      return { target: null };
    }

    // Ignore spatial cursor itself during hit testing
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return { target: null };

    // Traverse upwards to locate interactive target
    const interactiveTarget = el.closest(
      '[data-gesture-interactive="true"], button, a, input, select, textarea, [role="button"], [role="tab"], .interactive-card'
    ) as HTMLElement | null;

    if (interactiveTarget) {
      const label =
        interactiveTarget.getAttribute('aria-label') ||
        interactiveTarget.getAttribute('title') ||
        interactiveTarget.innerText?.slice(0, 24) ||
        interactiveTarget.tagName.toLowerCase();

      return { target: interactiveTarget, label };
    }

    return { target: null };
  }

  /**
   * Dispatches semantic UI intents to targeted elements
   */
  private dispatchUIIntent(action: InterpretedAction, target: HTMLElement | null) {
    if (action.intent === 'SELECT' && target) {
      // 1. Visual click animation
      target.classList.add('ring-2', 'ring-cyan-400', 'scale-[0.98]');
      setTimeout(() => {
        target.classList.remove('ring-2', 'ring-cyan-400', 'scale-[0.98]');
      }, 180);

      // 2. Play subtle spatial chime
      try {
        playJarvisChime('execute');
      } catch (e) {
        // ignore audio error
      }

      // 3. Trigger synthetic DOM click
      try {
        target.click();
      } catch (err) {
        console.warn('Gesture click dispatch failed:', err);
      }
    } else if (action.intent === 'CANCEL_INTERACTION') {
      // Fist gesture triggers cancel / close active modal or clear focus
      const activeModalClose = document.querySelector('[data-gesture-cancel="true"], [aria-label="Close"]') as HTMLElement;
      if (activeModalClose) {
        activeModalClose.click();
      }
    }
  }

  public getSettings(): SpatialSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<SpatialSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    if (newSettings.sensitivity !== undefined) {
      this.landmarkProcessor.setSensitivity(newSettings.sensitivity);
    }
    if (newSettings.confidenceThreshold !== undefined) {
      this.gestureRecognizer.setConfidenceThreshold(newSettings.confidenceThreshold);
    }
    if (newSettings.smoothingFactor !== undefined) {
      this.handTracker.setSmoothing(newSettings.smoothingFactor);
    }
    if (newSettings.mirrorMode !== undefined) {
      this.landmarkProcessor.setMirrorMode(newSettings.mirrorMode);
    }

    // Toggle camera state based on enabled flag
    if (newSettings.enabled !== undefined) {
      if (newSettings.enabled) {
        this.cameraManager.start(this.settings.selectedCameraId);
      } else {
        this.cameraManager.stop();
        this.stateManager.transition('INACTIVE');
      }
    }
  }

  public async getAvailableCameras() {
    return this.cameraManager.getAvailableCameras();
  }

  public emergencyStop(): void {
    this.updateSettings({ enabled: false });
    this.cameraManager.stop();
    this.handTracker.stop();
    this.gestureInterpreter.reset();
    this.stateManager.transition('INACTIVE');
  }

  public onTelemetry(callback: (telemetry: SpatialTelemetry) => void): () => void {
    this.telemetryListeners.push(callback);
    this.emitTelemetry();
    return () => {
      this.telemetryListeners = this.telemetryListeners.filter((cb) => cb !== callback);
    };
  }

  private emitTelemetry() {
    const telemetry: SpatialTelemetry = {
      state: this.stateManager.getState(),
      cameraStatus: this.cameraManager.getStatus(),
      handCount: this.latestHands.length,
      currentGesture: this.currentGesture,
      confidence: this.currentConfidence,
      pointer: this.currentPointer,
      fps: this.currentFps,
      latencyMs: +(this.lastLatencyMs).toFixed(1),
      hands: this.latestHands,
    };

    for (const listener of this.telemetryListeners) {
      try {
        listener(telemetry);
      } catch (err) {
        console.error('SpatialInteractionController telemetry error:', err);
      }
    }
  }

  public destroy() {
    this.emergencyStop();
    this.cameraManager.destroy();
    this.telemetryListeners = [];
  }
}

// Singleton instance for app-wide spatial coordination
export const spatialController = new SpatialInteractionController();
