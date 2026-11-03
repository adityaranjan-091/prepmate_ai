import { VisionMetrics } from '../types/interview';

export class VisionService {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private onMetricsUpdate: ((metrics: VisionMetrics) => void) | null = null;

  // Smoothing buffers
  private baselineY: number | null = null;
  private eyeContactHistory: number[] = [];
  private isRunning: boolean = false;

  /**
   * Initializes webcam and sets up the canvas analysis loop.
   */
  public async startCamera(
    videoElement: HTMLVideoElement,
    deviceId?: string,
    onMetricsUpdate?: (metrics: VisionMetrics) => void
  ): Promise<MediaStream> {
    this.videoElement = videoElement;
    this.onMetricsUpdate = onMetricsUpdate || null;

    const constraints: MediaStreamConstraints = {
      video: deviceId ? { deviceId: { exact: deviceId }, width: 640, height: 480 } : { width: 640, height: 480 },
      audio: false,
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      this.canvasElement = document.createElement('canvas');
      this.canvasElement.width = 160; // Low resolution for ultra-fast, zero-lag frame processing
      this.canvasElement.height = 120;

      this.isRunning = true;
      this.startAnalysisLoop();

      return this.stream;
    } catch (err: any) {
      console.error('Failed to start camera:', err);
      throw new Error(`Camera access denied or unavailable: ${err.message}`);
    }
  }

  /**
   * Stops camera stream and terminates frame processing loop.
   */
  public stopCamera() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.baselineY = null;
    this.eyeContactHistory = [];
  }

  private startAnalysisLoop() {
    let lastProcessed = 0;
    const FPS_LIMIT = 15; // 15 FPS is optimal for telemetry without burning CPU

    const loop = (timestamp: number) => {
      if (!this.isRunning) return;

      if (timestamp - lastProcessed >= 1000 / FPS_LIMIT) {
        lastProcessed = timestamp;
        this.processFrame();
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Client-side fast heuristic analysis of face presence, gaze direction, and posture.
   */
  private processFrame() {
    if (!this.videoElement || !this.canvasElement) return;

    const ctx = this.canvasElement.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const w = this.canvasElement.width;
    const h = this.canvasElement.height;

    ctx.drawImage(this.videoElement, 0, 0, w, h);
    const frame = ctx.getImageData(0, 0, w, h);
    const data = frame.data;

    let skinPixelCount = 0;
    let sumX = 0;
    let sumY = 0;

    // Skin-tone & luminosity centroid detection
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Color chromaticity heuristic for human skin tone ranges
      const isSkin =
        r > 60 &&
        g > 40 &&
        b > 20 &&
        r > g &&
        r > b &&
        r - g > 15 &&
        Math.abs(r - g) > 15;

      if (isSkin) {
        const pixelIndex = i / 4;
        const x = pixelIndex % w;
        const y = Math.floor(pixelIndex / w);

        sumX += x;
        sumY += y;
        skinPixelCount++;
      }
    }

    let eyeContactScore = 80;
    let headPose: VisionMetrics['headPose'] = 'good';
    let postureAlert = false;
    let confidenceScore = 85;

    if (skinPixelCount > 30) {
      const centerX = sumX / skinPixelCount;
      const centerY = sumY / skinPixelCount;

      const normX = centerX / w; // 0 (left) to 1 (right), center is 0.5
      const normY = centerY / h; // 0 (top) to 1 (bottom), center is ~0.45

      // Calibrate posture baseline
      if (this.baselineY === null) {
        this.baselineY = normY;
      } else {
        // Posture check: if current Y dropped significantly below baseline -> slouching
        if (normY > this.baselineY + 0.15) {
          postureAlert = true;
          confidenceScore -= 20;
        }
      }

      // Gaze & Eye Contact check
      const horizontalOffset = Math.abs(normX - 0.5);
      const verticalOffset = normY - 0.45;

      if (horizontalOffset > 0.18) {
        headPose = 'looking_away';
        eyeContactScore = Math.max(20, Math.round(90 - horizontalOffset * 250));
      } else if (verticalOffset > 0.15) {
        headPose = 'looking_down';
        eyeContactScore = Math.max(30, Math.round(85 - verticalOffset * 200));
      } else if (Math.abs(verticalOffset) > 0.22) {
        headPose = 'tilted';
        eyeContactScore = 65;
      } else {
        headPose = 'good';
        eyeContactScore = Math.min(100, Math.round(95 - horizontalOffset * 60));
      }
    } else {
      // Face not clearly centered or low light
      eyeContactScore = 50;
      confidenceScore = 60;
    }

    // Maintain running window of eye contact
    this.eyeContactHistory.push(eyeContactScore);
    if (this.eyeContactHistory.length > 20) {
      this.eyeContactHistory.shift();
    }

    const smoothedEyeContact = Math.round(
      this.eyeContactHistory.reduce((a, b) => a + b, 0) / this.eyeContactHistory.length
    );

    const metrics: VisionMetrics = {
      eyeContactScore: smoothedEyeContact,
      headPose,
      postureAlert,
      confidenceScore: Math.min(100, Math.max(20, confidenceScore)),
      smileDetected: skinPixelCount > 50 && smoothedEyeContact > 75,
      timestamp: Date.now(),
    };

    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(metrics);
    }
  }
}

export const visionService = new VisionService();

