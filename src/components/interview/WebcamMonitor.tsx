import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Eye, ShieldAlert, Sparkles, Smile } from 'lucide-react';
import { visionService } from '../../services/visionService';
import { useInterviewStore } from '../../store/interviewStore';

interface WebcamMonitorProps {
  enabled: boolean;
}

export const WebcamMonitor: React.FC<WebcamMonitorProps> = ({ enabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { latestVisionMetrics, updateVisionMetrics, settings } = useInterviewStore();

  useEffect(() => {
    if (!enabled) {
      visionService.stopCamera();
      return;
    }

    if (videoRef.current) {
      visionService
        .startCamera(videoRef.current, settings.webcamDeviceId || undefined, (metrics) => {
          updateVisionMetrics(metrics);
        })
        .then(() => {
          setHasCameraAccess(true);
          setErrorMessage(null);
        })
        .catch((err) => {
          console.warn('Camera initialization error:', err);
          setHasCameraAccess(false);
          setErrorMessage(err.message);
        });
    }

    return () => {
      visionService.stopCamera();
    };
  }, [enabled, settings.webcamDeviceId]);

  const eyeScore = latestVisionMetrics?.eyeContactScore ?? 80;
  const confidence = latestVisionMetrics?.confidenceScore ?? 85;
  const isSlouching = latestVisionMetrics?.postureAlert ?? false;

  return (
    <div className="relative w-full aspect-video rounded-2xl bg-gray-950 border border-gray-800 flex items-center justify-center overflow-hidden shadow-2xl">
      {enabled ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {/* Fallback if no camera permission or error */}
          {hasCameraAccess === false && (
            <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center p-4 text-center space-y-2">
              <CameraOff className="w-8 h-8 text-gray-500" />
              <p className="text-xs text-gray-300 font-medium">Camera Not Available</p>
              <p className="text-[10px] text-gray-500 max-w-xs">{errorMessage || 'Check camera permissions'}</p>
            </div>
          )}

          {/* Live Telemetry HUD Overlay */}
          {hasCameraAccess && settings.showTelemetryOverlay && (
            <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
              {/* Top HUD: Eye Contact & Posture Alert */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900/80 backdrop-blur-md border border-gray-700/60 text-[11px] text-gray-200 shadow-md">
                  <Eye className={`w-3.5 h-3.5 ${eyeScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span>Eye Contact: <strong className="text-white">{eyeScore}%</strong></span>
                </div>

                {isSlouching && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/50 text-[11px] text-amber-300 font-medium animate-pulse shadow-md">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Straighten Posture</span>
                  </div>
                )}
              </div>

              {/* Bottom HUD: Confidence & Smile tracker */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900/80 backdrop-blur-md border border-gray-700/60 text-[11px] text-gray-200 shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Confidence: <strong className="text-white">{confidence}%</strong></span>
                </div>

                {latestVisionMetrics?.smileDetected && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] text-emerald-300">
                    <Smile className="w-3 h-3" />
                    <span>Engaged</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
          <CameraOff className="w-8 h-8" />
          <p className="text-xs">Camera Feed Disabled</p>
        </div>
      )}
    </div>
  );
};

