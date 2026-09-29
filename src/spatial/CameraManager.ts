// Spatial Screen Interaction Engine V1 - CameraManager
// Handles privacy-first camera lifecycle, device enumeration, and explicit access controls.

export type CameraStatus = 'OFF' | 'STARTING' | 'ACTIVE' | 'DENIED' | 'ERROR' | 'UNAVAILABLE';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private status: CameraStatus = 'OFF';
  private statusListeners: Array<(status: CameraStatus, error?: string) => void> = [];
  private currentDeviceId: string = '';

  constructor() {
    this.videoElement = document.createElement('video');
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
    this.videoElement.autoplay = true;
    // Hidden offscreen video element for frame analysis
    this.videoElement.style.position = 'fixed';
    this.videoElement.style.top = '-9999px';
    this.videoElement.style.left = '-9999px';
    this.videoElement.style.width = '320px';
    this.videoElement.style.height = '240px';
    this.videoElement.style.pointerEvents = 'none';
    this.videoElement.style.opacity = '0';
    document.body.appendChild(this.videoElement);
  }

  public getStatus(): CameraStatus {
    return this.status;
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  public onStatusChange(callback: (status: CameraStatus, error?: string) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.status);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyStatus(status: CameraStatus, error?: string) {
    this.status = status;
    for (const listener of this.statusListeners) {
      try {
        listener(status, error);
      } catch (err) {
        console.error('CameraManager listener error:', err);
      }
    }
  }

  public async getAvailableCameras(): Promise<CameraDevice[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === 'videoinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));
    } catch (err) {
      console.warn('Failed to enumerate video devices:', err);
      return [];
    }
  }

  public async start(deviceId?: string): Promise<boolean> {
    if (this.status === 'ACTIVE' && this.stream && this.stream.active) {
      if (!deviceId || deviceId === this.currentDeviceId) {
        return true;
      }
    }

    this.notifyStatus('STARTING');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.notifyStatus('UNAVAILABLE', 'getUserMedia is not supported on this platform');
      return false;
    }

    // Stop any existing stream
    this.stop();

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceId
          ? {
              deviceId: { exact: deviceId },
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30, max: 60 },
            }
          : {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30, max: 60 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = stream;
      this.currentDeviceId = deviceId || '';

      if (this.videoElement) {
        this.videoElement.srcObject = stream;
        await this.videoElement.play();
      }

      this.notifyStatus('ACTIVE');
      return true;
    } catch (err: any) {
      console.warn('Camera access denied or failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.notifyStatus('DENIED', 'Camera permission was denied by user.');
      } else {
        this.notifyStatus('ERROR', err.message || 'Failed to initialize camera.');
      }
      return false;
    }
  }

  public stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.notifyStatus('OFF');
  }

  public destroy(): void {
    this.stop();
    if (this.videoElement && this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
      this.videoElement = null;
    }
    this.statusListeners = [];
  }
}
