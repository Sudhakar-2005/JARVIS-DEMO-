// Spatial Screen Interaction Engine V1 - GestureRecognizer
// Detects point, pinch, pinch+drag, open palm, fist, two-hand zoom, and two-hand rotation.

import { HandData, SpatialGestureType } from '../types';

export interface RecognizedGesture {
  type: SpatialGestureType;
  confidence: number;
  data?: {
    pinchDistance?: number;
    zoomDelta?: number;
    rotationDelta?: number;
    dragVector?: { dx: number; dy: number };
  };
}

export class GestureRecognizer {
  private confidenceThreshold: number = 0.7;
  private pinchThreshold: number = 0.38;
  private prevTwoHandDistance: number | null = null;
  private prevTwoHandAngle: number | null = null;

  public setConfidenceThreshold(threshold: number) {
    this.confidenceThreshold = Math.max(0.4, Math.min(0.95, threshold));
  }

  public setPinchThreshold(threshold: number) {
    this.pinchThreshold = Math.max(0.15, Math.min(0.6, threshold));
  }

  public recognize(hands: HandData[], isCurrentlyDragging: boolean): RecognizedGesture {
    if (!hands || hands.length === 0) {
      this.prevTwoHandDistance = null;
      this.prevTwoHandAngle = null;
      return { type: 'none', confidence: 0 };
    }

    // 1. Two-Hand Gestures (Zoom In, Zoom Out, Rotate)
    if (hands.length >= 2) {
      const h1 = hands[0];
      const h2 = hands[1];
      const dx = h2.palmCenter.x - h1.palmCenter.x;
      const dy = h2.palmCenter.y - h1.palmCenter.y;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      const currentAngle = Math.atan2(dy, dx);

      if (this.prevTwoHandDistance !== null && this.prevTwoHandAngle !== null) {
        const distDelta = currentDist - this.prevTwoHandDistance;
        const angleDelta = currentAngle - this.prevTwoHandAngle;

        this.prevTwoHandDistance = currentDist;
        this.prevTwoHandAngle = currentAngle;

        // Check Rotation
        if (Math.abs(angleDelta) > 0.08) {
          return {
            type: 'two_hand_rotate',
            confidence: 0.9,
            data: { rotationDelta: angleDelta },
          };
        }

        // Check Zoom
        if (distDelta > 0.02) {
          return {
            type: 'two_hand_zoom_in',
            confidence: 0.92,
            data: { zoomDelta: distDelta * 10 },
          };
        } else if (distDelta < -0.02) {
          return {
            type: 'two_hand_zoom_out',
            confidence: 0.92,
            data: { zoomDelta: distDelta * 10 },
          };
        }
      } else {
        this.prevTwoHandDistance = currentDist;
        this.prevTwoHandAngle = currentAngle;
      }
    } else {
      this.prevTwoHandDistance = null;
      this.prevTwoHandAngle = null;
    }

    // 2. Single-Hand Gestures
    const primaryHand = hands[0];

    // Filter out low confidence detections
    if (primaryHand.confidence < this.confidenceThreshold) {
      return { type: 'none', confidence: primaryHand.confidence };
    }

    // A. Fist (Cancel Interaction)
    if (primaryHand.isFist) {
      return {
        type: 'fist',
        confidence: 0.88,
      };
    }

    // B. Open Palm (Pause Interaction)
    if (primaryHand.isOpenPalm && !primaryHand.isPinching) {
      return {
        type: 'open_palm',
        confidence: 0.92,
      };
    }

    // C. Pinch or Pinch+Drag (Select / Drag)
    if (primaryHand.pinchDistance < this.pinchThreshold || primaryHand.isPinching) {
      if (isCurrentlyDragging) {
        return {
          type: 'pinch_drag',
          confidence: 0.95,
          data: { pinchDistance: primaryHand.pinchDistance },
        };
      }
      return {
        type: 'pinch',
        confidence: 0.94,
        data: { pinchDistance: primaryHand.pinchDistance },
      };
    }

    // D. Point (Pointer Move / Hover)
    if (primaryHand.isPointing) {
      return {
        type: 'point',
        confidence: 0.9,
      };
    }

    // Default to point if hand is tracked
    return {
      type: 'point',
      confidence: 0.8,
    };
  }
}
