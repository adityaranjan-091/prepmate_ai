import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Check,
  Copy,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Users,
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

export const LiveMeetingStage: React.FC<LiveMeetingStageProps> = ({
  roomCode,
  compact = false,
  onLeave,
}) => {
  const { user } = useAuthStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    let active = true;
    let acquiredStream: MediaStream | null = null;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        acquiredStream = stream;
        setLocalStream(stream);
        cameraTrackRef.current = stream.getVideoTracks()[0] || null;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        if (user) {
          await meetingService.join(roomCode, user, stream, {
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
              : "Could not access camera or microphone",
          );
        }
      }
    };

    void start();

    return () => {
      active = false;
      meetingService.leave();
      acquiredStream?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    };
  }, [roomCode, user?.uid]);

  // Keep local <video> attached when toggling between compact and expanded views or screen share
  useEffect(() => {
    if (!localVideoRef.current) return;
    const activeVideoStream =
      screenSharing && screenStreamRef.current
        ? screenStreamRef.current
        : localStream;
    if (
      activeVideoStream &&
      localVideoRef.current.srcObject !== activeVideoStream
    ) {
      localVideoRef.current.srcObject = activeVideoStream;
    }
  }, [localStream, screenSharing, compact]);

  const toggleMic = () => {
    const enabled = !micEnabled;
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setMicEnabled(enabled);
  };

  const toggleCamera = () => {
    const enabled = !cameraEnabled;
    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setCameraEnabled(enabled);
  };

  const stopScreenShareInternal = () => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    if (cameraTrackRef.current) {
      meetingService.replaceVideoTrack(cameraTrackRef.current);
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
    setScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      stopScreenShareInternal();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) {
        screenStream.getTracks().forEach((t) => t.stop());
        return;
      }
      screenStreamRef.current = screenStream;
      meetingService.replaceVideoTrack(screenTrack);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      setScreenSharing(true);

      screenTrack.onended = () => {
        stopScreenShareInternal();
      };
    } catch (shareError) {
      setError(
        shareError instanceof Error
          ? shareError.message
          : "Screen sharing was cancelled",
      );
    }
  };

  const leaveMeeting = () => {
    meetingService.leave();
    localStream?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    onLeave?.();
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy room code");
    }
  };

  const remoteEntries = Object.entries(remoteStreams);

  if (compact) {
    return (
      <div className="w-full grid grid-cols-2 gap-2">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${screenSharing ? "" : "transform -scale-x-100"}`}
          />
          <span className="absolute bottom-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded bg-black/70 text-white">
            You
          </span>
        </div>
        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
          {remoteEntries.length > 0 ? (
            <RemoteVideo
              stream={remoteEntries[0][1]}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[10px] text-gray-500">
              Waiting for participant
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {error && (
        <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-h-0">
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${screenSharing ? "" : "transform -scale-x-100"}`}
          />
          <span className="absolute bottom-2 left-2 text-[10px] px-2 py-1 rounded-lg bg-black/70 text-white">
            You {screenSharing ? "(Screen)" : ""}
          </span>
        </div>

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
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 transition cursor-pointer"
            title={cameraEnabled ? "Turn camera off" : "Turn camera on"}
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
            className={`p-2 rounded-lg border transition cursor-pointer ${
              screenSharing
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200"
            }`}
            title="Share screen"
          >
            <MonitorUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={leaveMeeting}
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
