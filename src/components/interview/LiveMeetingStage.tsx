import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Copy, Mic, MicOff, MonitorUp, PhoneOff, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { meetingService, MeetingParticipant } from '../../services/meetingService';

interface LiveMeetingStageProps {
  roomCode: string;
  compact?: boolean;
  onLeave?: () => void;
}

export const LiveMeetingStage: React.FC<LiveMeetingStageProps> = ({ roomCode, compact = false, onLeave }) => {
  const { user } = useAuthStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    let active = true;
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
        setLocalStream(stream);
        cameraTrackRef.current = stream.getVideoTracks()[0] || null;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        if (user) {
          await meetingService.join(
            roomCode,
            user,
            stream,
            {
              onParticipants: setParticipants,
              onRemoteStream: (uid, remoteStream) =>
                setRemoteStreams((current) => ({ ...current, [uid]: remoteStream })),
              onPeerRemoved: (uid) =>
                setRemoteStreams((current) => {
                  const next = { ...current };
                  delete next[uid];
                  return next;
                }),
              onError: (meetingError) => setError(meetingError.message),
            }
          );
        }
      } catch (meetingError) {
        setError(meetingError instanceof Error ? meetingError.message : 'Could not access camera or microphone');
      }
    };
    void start();

    return () => {
      active = false;
      meetingService.leave();
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, [roomCode, user]);

  useEffect(() => {
    if (!remoteVideoRef.current) return;
    remoteVideoRef.current.querySelectorAll('video[data-remote]').forEach((video) => {
      const element = video as HTMLVideoElement;
      const stream = remoteStreams[element.dataset.uid || ''];
      if (stream && element.srcObject !== stream) element.srcObject = stream;
    });
  }, [remoteStreams]);

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

  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      if (cameraTrackRef.current) meetingService.replaceVideoTrack(cameraTrackRef.current);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      setScreenSharing(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;
      screenTrackRef.current = screenTrack;
      meetingService.replaceVideoTrack(screenTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      setScreenSharing(true);
      screenTrack.onended = () => {
        screenTrackRef.current = null;
        if (cameraTrackRef.current) meetingService.replaceVideoTrack(cameraTrackRef.current);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        setScreenSharing(false);
      };
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : 'Screen sharing was cancelled');
    }
  };

  const leaveMeeting = () => {
    meetingService.leave();
    localStream?.getTracks().forEach((track) => track.stop());
    onLeave?.();
  };

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode);
  };

  const remoteEntries = Object.entries(remoteStreams);

  if (compact) {
    return (
      <div className="w-full grid grid-cols-2 gap-2">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-gray-800">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <span className="absolute bottom-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded bg-black/70 text-white">You</span>
        </div>
        <div ref={remoteVideoRef} className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
          {remoteEntries.length > 0 ? (
            <video data-remote data-uid={remoteEntries[0][0]} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="h-full flex items-center justify-center text-[10px] text-gray-500">Waiting for participant</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {error && <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">{error}</div>}
      <div ref={remoteVideoRef} className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-h-0">
        <div className="relative rounded-2xl overflow-hidden bg-black border border-gray-800">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <span className="absolute bottom-2 left-2 text-[10px] px-2 py-1 rounded-lg bg-black/70 text-white">You</span>
        </div>
        {remoteEntries.map(([uid]) => (
          <div key={uid} className="relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
            <video data-remote data-uid={uid} autoPlay playsInline className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-800 bg-gray-900/90 px-3 py-2">
        <button type="button" onClick={copyRoomCode} className="flex items-center gap-1.5 text-[10px] text-gray-300">
          <Users className="w-3.5 h-3.5" />
          <span>{roomCode}</span>
          <Copy className="w-3 h-3" />
        </button>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={toggleMic} className="p-2 rounded-lg bg-gray-800 border border-gray-700" title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}>
            {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-400" />}
          </button>
          <button type="button" onClick={toggleCamera} className="p-2 rounded-lg bg-gray-800 border border-gray-700" title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}>
            {cameraEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4 text-red-400" />}
          </button>
          <button type="button" onClick={toggleScreenShare} className={`p-2 rounded-lg border ${screenSharing ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'}`} title="Share screen">
            <MonitorUp className="w-4 h-4" />
          </button>
          <button type="button" onClick={leaveMeeting} className="p-2 rounded-lg bg-red-600/90 border border-red-500" title="Leave meeting">
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
        <span className="text-[10px] text-gray-500">{participants.length} participant{participants.length === 1 ? '' : 's'}</span>
      </div>
    </div>
  );
};
