import React, { useEffect, useRef, useState } from 'react';
import { CameraOff, Eye, ShieldAlert, Sparkles, Smile } from 'lucide-react';
import { visionService } from '../../services/visionService';
import { useInterviewStore } from '../../store/interviewStore';

interface WebcamMonitorProps {
  enabled: boolean;
  compact?: boolean;
}

export const WebcamMonitor: React.FC<WebcamMonitorProps> = ({ enabled, compact = false }) => {
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
  }, [enabled, settings.webcamDeviceId, updateVisionMetrics]);

  const eyeScore = latestVisionMetrics?.eyeContactScore ?? 80;
  const confidence = latestVisionMetrics?.confidenceScore ?? 85;
  const isSlouching = latestVisionMetrics?.postureAlert ?? false;

  // Compact Dock Mode (Slim telemetry strip with thumbnail)
  if (compact) {
    return (
      <div className="flex-1 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 shadow-md select-none">
        <div className="flex items-center gap-3 min-w-0">
          {enabled ? (
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-gray-700/80 bg-gray-950 shrink-0">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-gray-950" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gray-800/90 border border-gray-700/70 grid place-items-center text-gray-500 shrink-0">
              <CameraOff className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              Candidate Telemetry
            </p>
            <p
              className={`text-[11px] truncate mt-0.5 ${
                enabled
                  ? isSlouching
                    ? 'text-amber-300 font-medium'
                    : 'text-gray-400'
                  : 'text-gray-500'
              }`}
            >
              {enabled ? (isSlouching ? 'Adjust posture' : 'Posture optimal') : 'Camera feed off'}
            </p>
          </div>
        </div>

        {/* Live telemetry badges */}
        <div className="flex items-center gap-1.5 shrink-0 font-mono tabular-nums">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-950/80 border border-gray-800 text-[11px] font-medium text-gray-200"
            title="Eye Contact"
          >
            <Eye
              className={`w-3 h-3 shrink-0 ${
                eyeScore >= 70 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            />
            <span>{eyeScore}%</span>
          </div>

          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-950/80 border border-gray-800 text-[11px] font-medium text-gray-200"
            title="Confidence"
          >
            <Sparkles className="w-3 h-3 shrink-0 text-blue-400" />
            <span>{confidence}%</span>
          </div>

          {isSlouching && (
            <div
              className="flex items-center justify-center p-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse"
              title="Straighten Posture"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Expanded Stage Mode
  return (
    <div className="relative w-full aspect-video rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 ring-1 ring-inset ring-white/5 flex items-center justify-center overflow-hidden shadow-2xl select-none">
      {enabled ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {/* Subtle edge vignette for HUD legibility */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-gray-950/40" />

          {/* Fallback if no camera permission or error */}
          {hasCameraAccess === false && (
            <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gray-800/90 border border-gray-700/70 grid place-items-center text-gray-400">
                <CameraOff className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-200">Camera Not Available</p>
                <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
                  {errorMessage || 'Check camera permissions in system settings'}
                </p>
              </div>
            </div>
          )}

          {/* Live Telemetry HUD Overlay */}
          {hasCameraAccess && settings.showTelemetryOverlay && (
            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
              {/* Top HUD: Eye Contact & Posture Alert */}
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-950/75 backdrop-blur-sm border border-gray-800/90 text-[11px] text-gray-200 shadow-md tabular-nums">
                  <Eye
                    className={`w-3.5 h-3.5 shrink-0 ${
                      eyeScore >= 70 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  />
                  <span>
                    Eye Contact: <strong className="font-semibold text-white">{eyeScore}%</strong>
                  </span>
                </div>

                {isSlouching && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 backdrop-blur-sm border border-amber-500/50 text-[11px] text-amber-300 font-medium animate-pulse shadow-md">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Straighten Posture</span>
                  </div>
                )}
              </div>

              {/* Bottom HUD: Confidence & Smile tracker */}
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-950/75 backdrop-blur-sm border border-gray-800/90 text-[11px] text-gray-200 shadow-md tabular-nums">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>
                    Confidence: <strong className="font-semibold text-white">{confidence}%</strong>
                  </span>
                </div>

                {latestVisionMetrics?.smileDetected && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/40 text-[11px] font-medium text-emerald-300 shadow-md">
                    <Smile className="w-3.5 h-3.5 shrink-0" />
                    <span>Engaged</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2.5 p-4 text-center">
          <div className="w-11 h-11 rounded-2xl bg-gray-900 border border-gray-800 grid place-items-center text-gray-500">
            <CameraOff className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-gray-300">Camera Feed Disabled</p>
            <p className="text-[11px] text-gray-500">Video telemetry is off for this session</p>
          </div>
        </div>
      )}
    </div>
  );
};