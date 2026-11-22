import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Check,
  Copy,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  User,
  Users,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  meetingService,
  MeetingParticipant,
} from "../../services/meetingService";

interface LiveMeetingStageProps {
  roomCode: string;
  compact?: boolean;
  onLeave?: () => void;
}

const RemoteVideo: React.FC<{ stream: MediaStream; className?: string }> = ({
  stream,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline className={className} />;
};

interface LocalVideoTileProps {
  stream: MediaStream | null;
  cameraEnabled: boolean;
  micEnabled: boolean;
  screenSharing: boolean;
  compact?: boolean;
}

const LocalVideoTile: React.FC<LocalVideoTileProps> = ({
  stream,
  cameraEnabled,
  micEnabled,
  screenSharing,
  compact = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, cameraEnabled, screenSharing]);

  const showVideo = Boolean(stream) && (screenSharing || cameraEnabled);

  return (
    <div
      className={`relative aspect-video overflow-hidden bg-black border border-gray-800 ${compact ? "rounded-xl" : "rounded-2xl"
        }`}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full ${showVideo ? "block" : "hidden"} ${screenSharing ? "object-contain" : "object-cover -scale-x-100"
          }`}
      />

      {!showVideo && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-400">
          <div
            className={`rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center ${compact ? "w-8 h-8" : "w-12 h-12"
              }`}
          >
            <User className={compact ? "w-4 h-4" : "w-6 h-6"} />
          </div>
          {!compact && (
            <span className="text-[11px] text-gray-500 mt-2">Camera off</span>
          )}
        </div>
      )}

      <div
        className={`absolute flex items-center gap-1 bg-black/70 text-white ${compact
            ? "bottom-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded"
            : "bottom-2 left-2 text-[10px] px-2 py-1 rounded-lg"
          }`}
      >
        <span>You{screenSharing ? " (Screen)" : ""}</span>
        {!micEnabled && (
          <MicOff
            className={`text-red-400 ${compact ? "w-2.5 h-2.5" : "w-3 h-3"}`}
            aria-label="Microphone muted"
          />
        )}
      </div>
    </div>
  );
};

export const LiveMeetingStage: React.FC<LiveMeetingStageProps> = ({
  roomCode,
  compact = false,
  onLeave,
}) => {
  const { user } = useAuthStore();
  const userRef = useRef(user);
  userRef.current = user;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [hasVideoDevice, setHasVideoDevice] = useState(true);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const hasLeftRef = useRef(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupMediaAndRoom = useCallback(() => {
    if (!hasLeftRef.current) {
      hasLeftRef.current = true;
      meetingService.leave();
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    cameraTrackRef.current = null;

    screenStreamRef.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    screenStreamRef.current = null;
  }, []);

  useEffect(() => {
    let active = true;
    hasLeftRef.current = false;

    const acquireInitialStream = async (): Promise<{
      stream: MediaStream;
      videoAvailable: boolean;
    }> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        return { stream, videoAvailable: stream.getVideoTracks().length > 0 };
      } catch (initialError) {
        // Retry audio-only when no camera is attached or video capture is blocked
        if (
          initialError instanceof DOMException &&
          (initialError.name === "NotFoundError" ||
            initialError.name === "DevicesNotFoundError" ||
            initialError.name === "OverconstrainedError")
        ) {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          return { stream: audioOnlyStream, videoAvailable: false };
        }
        throw initialError;
      }
    };

    const start = async () => {
      try {
        const { stream, videoAvailable } = await acquireInitialStream();
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        cameraTrackRef.current = stream.getVideoTracks()[0] || null;
        setLocalStream(stream);
        setHasVideoDevice(videoAvailable);
        setCameraEnabled(videoAvailable);

        const currentUser = userRef.current;
        if (currentUser) {
          await meetingService.join(roomCode, currentUser, stream, {
            onParticipants: setParticipants,
            onRemoteStream: (uid, remoteStream) =>
              setRemoteStreams((current) => ({
                ...current,
                [uid]: remoteStream,
              })),
            onPeerRemoved: (uid) =>
              setRemoteStreams((current) => {
                const next = { ...current };
                delete next[uid];
                return next;
              }),
            onError: (meetingError) => setError(meetingError.message),
          });
        }
      } catch (meetingError) {
        if (active) {
          setError(
            meetingError instanceof Error
              ? meetingError.message
              : "Could not access microphone or camera",
          );
        }
      }
    };

    void start();

    return () => {
      active = false;
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      cleanupMediaAndRoom();
    };
  }, [roomCode, user?.uid, cleanupMediaAndRoom]);

  const toggleMic = () => {
    const enabled = !micEnabled;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setMicEnabled(enabled);
  };

  const toggleCamera = () => {
    if (!hasVideoDevice || screenSharing) return;
    const enabled = !cameraEnabled;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setCameraEnabled(enabled);
  };

  const stopScreenShareInternal = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    screenStreamRef.current = null;

    if (cameraTrackRef.current) {
      meetingService.replaceVideoTrack(cameraTrackRef.current);
    }
    setScreenSharing(false);
  }, []);

  const toggleScreenShare = async () => {
    if (screenSharing) {
      stopScreenShareInternal();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) {
        screenStream.getTracks().forEach((t) => t.stop());
        return;
      }

      screenStreamRef.current = screenStream;
      meetingService.replaceVideoTrack(screenTrack);
      setScreenSharing(true);

      screenTrack.onended = () => {
        stopScreenShareInternal();
      };
    } catch (shareError) {
      // Ignore user-initiated cancellation of the browser screen picker
      if (
        shareError instanceof DOMException &&
        (shareError.name === "NotAllowedError" ||
          shareError.name === "AbortError")
      ) {
        return;
      }
      setError(
        shareError instanceof Error
          ? shareError.message
          : "Failed to start screen sharing",
      );
    }
  };

  const leaveMeeting = () => {
    cleanupMediaAndRoom();
    onLeave?.();
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy room code");
    }
  };

  const remoteEntries = Object.entries(remoteStreams);
  const activeDisplayStream =
    screenSharing && screenStreamRef.current
      ? screenStreamRef.current
      : localStream;

  if (compact) {
    const firstRemote = remoteEntries[0];
    const firstPeer = firstRemote
      ? participants.find((p) => p.uid === firstRemote[0])
      : undefined;
    const extraPeersCount = Math.max(0, remoteEntries.length - 1);

    return (
      <div className="w-full grid grid-cols-2 gap-2">
        <LocalVideoTile
          stream={activeDisplayStream}
          cameraEnabled={cameraEnabled}
          micEnabled={micEnabled}
          screenSharing={screenSharing}
          compact
        />
        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
          {firstRemote ? (
            <>
              <RemoteVideo
                stream={firstRemote[1]}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-2.5rem)] truncate text-[9px] px-1.5 py-0.5 rounded bg-black/70 text-white">
                {firstPeer?.name?.trim() || "Participant"}
              </span>
              {extraPeersCount > 0 && (
                <span className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded bg-black/75 text-gray-200 font-medium">
                  +{extraPeersCount}
                </span>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-[10px] text-gray-500 px-2 text-center">
              Waiting for participant
            </div>
          )}
        </div>
      </div>
    );
  }

  const totalTiles = 1 + Math.max(1, remoteEntries.length);
  const gridColsClass =
    totalTiles >= 5
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className="h-full flex flex-col gap-3">
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="text-amber-300/80 hover:text-amber-200 transition cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div
        className={`flex-1 grid ${gridColsClass} auto-rows-fr gap-2.5 min-h-0 overflow-y-auto`}
      >
        <LocalVideoTile
          stream={activeDisplayStream}
          cameraEnabled={cameraEnabled}
          micEnabled={micEnabled}
          screenSharing={screenSharing}
        />

        {remoteEntries.length > 0 ? (
          remoteEntries.map(([uid, stream]) => {
            const peer = participants.find((p) => p.uid === uid);
            return (
              <div
                key={uid}
                className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 border border-gray-800"
              >
                <RemoteVideo
                  stream={stream}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate text-[10px] px-2 py-1 rounded-lg bg-black/70 text-white">
                  {peer?.name?.trim() || "Participant"}
                </span>
              </div>
            );
          })
        ) : (
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900/70 border border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-4">
            <Users className="w-5 h-5 text-gray-500 mb-1.5" />
            <p className="text-xs font-medium text-gray-300">
              Waiting for participant
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Share room code: {roomCode}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-800 bg-gray-900/90 px-3 py-2">
        <button
          type="button"
          onClick={copyRoomCode}
          aria-label={copied ? "Room code copied" : "Copy room code"}
          className="flex items-center gap-1.5 text-[11px] font-mono text-gray-300 hover:text-white transition cursor-pointer"
          title="Copy room code"
        >
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span>{roomCode}</span>
          {copied ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Copy className="w-3 h-3 text-gray-400" />
          )}
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleMic}
            aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
            aria-pressed={!micEnabled}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 transition cursor-pointer"
            title={micEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {micEnabled ? (
              <Mic className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4 text-red-400" />
            )}
          </button>
          <button
            type="button"
            onClick={toggleCamera}
            disabled={!hasVideoDevice || screenSharing}
            aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
            aria-pressed={!cameraEnabled}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:pointer-events-none border border-gray-700 text-gray-200 transition cursor-pointer"
            title={
              !hasVideoDevice
                ? "No camera detected"
                : screenSharing
                  ? "Stop screen share to toggle camera"
                  : cameraEnabled
                    ? "Turn camera off"
                    : "Turn camera on"
            }
          >
            {cameraEnabled ? (
              <Camera className="w-4 h-4" />
            ) : (
              <CameraOff className="w-4 h-4 text-red-400" />
            )}
          </button>
          <button
            type="button"
            onClick={toggleScreenShare}
            aria-label={
              screenSharing ? "Stop screen sharing" : "Share screen"
            }
            aria-pressed={screenSharing}
            className={`p-2 rounded-lg border transition cursor-pointer ${screenSharing
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200"
              }`}
            title={screenSharing ? "Stop screen sharing" : "Share screen"}
          >
            <MonitorUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={leaveMeeting}
            aria-label="Leave meeting"
            className="p-2 rounded-lg bg-red-600/90 hover:bg-red-500 border border-red-500 text-white transition cursor-pointer"
            title="Leave meeting"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>

        <span className="text-[10px] text-gray-400 tabular-nums">
          {participants.length} participant
          {participants.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
};