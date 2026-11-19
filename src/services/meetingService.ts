import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface MeetingParticipant {
  uid: string;
  name: string;
  joinedAt?: unknown;
}

interface MeetingCallbacks {
  onParticipants: (participants: MeetingParticipant[]) => void;
  onRemoteStream: (uid: string, stream: MediaStream) => void;
  onPeerRemoved: (uid: string) => void;
  onError: (error: Error) => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export class MeetingService {
  private roomId = '';
  private localUserId = '';
  private localStream: MediaStream | null = null;
  private peers = new Map<string, RTCPeerConnection>();
  private remoteStreams = new Map<string, MediaStream>();
  private unsubscribers: Unsubscribe[] = [];
  private callbacks: MeetingCallbacks | null = null;

  async join(
    roomId: string,
    user: { uid: string; displayName?: string | null; email?: string | null },
    stream: MediaStream,
    callbacks: MeetingCallbacks
  ) {
    this.leave();
    this.roomId = roomId;
    this.localUserId = user.uid;
    this.localStream = stream;
    this.callbacks = callbacks;

    const participant: MeetingParticipant = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Participant',
      joinedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'meetingRooms', roomId, 'participants', user.uid), participant);
    await setDoc(doc(db, 'meetingRooms', roomId), {
      roomId,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    this.subscribeToParticipants();
    this.subscribeToSignals();
  }

  private subscribeToParticipants() {
    const participantsRef = collection(db, 'meetingRooms', this.roomId, 'participants');
    const unsubscribe = onSnapshot(
      participantsRef,
      (snapshot) => {
        const participants = snapshot.docs
          .map((item) => item.data() as MeetingParticipant)
          .filter((participant) => participant.uid !== this.localUserId);

        this.callbacks?.onParticipants([
          ...participants,
          {
            uid: this.localUserId,
            name: 'You',
          },
        ]);

        participants.forEach((participant) => {
          if (this.localUserId > participant.uid && !this.peers.has(participant.uid)) {
            void this.createOffer(participant.uid);
          }
        });

        const participantIds = new Set(participants.map((participant) => participant.uid));
        for (const peerId of this.peers.keys()) {
          if (!participantIds.has(peerId)) this.removePeer(peerId);
        }
      },
      (error) => this.callbacks?.onError(error)
    );
    this.unsubscribers.push(unsubscribe);
  }

  private subscribeToSignals() {
    const signalsRef = collection(db, 'meetingRooms', this.roomId, 'signals');
    const unsubscribe = onSnapshot(
      signalsRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') return;
          const signal = change.doc.data() as {
            to: string;
            from: string;
            type: 'offer' | 'answer' | 'candidate';
            payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
          };
          if (signal.to !== this.localUserId) return;
          void this.handleSignal(change.doc.id, signal);
        });
      },
      (error) => this.callbacks?.onError(error)
    );
    this.unsubscribers.push(unsubscribe);
  }

  private getOrCreatePeer(remoteUserId: string) {
    const existing = this.peers.get(remoteUserId);
    if (existing) return existing;

    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.localStream?.getTracks().forEach((track) => peer.addTrack(track, this.localStream!));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        void this.sendSignal(remoteUserId, 'candidate', event.candidate.toJSON());
      }
    };
    peer.ontrack = (event) => {
      if (!event.streams[0]) return;
      this.remoteStreams.set(remoteUserId, event.streams[0]);
      this.callbacks?.onRemoteStream(remoteUserId, event.streams[0]);
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
        this.removePeer(remoteUserId);
      }
    };

    this.peers.set(remoteUserId, peer);
    return peer;
  }

  private async createOffer(remoteUserId: string) {
    try {
      const peer = this.getOrCreatePeer(remoteUserId);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await this.sendSignal(remoteUserId, 'offer', offer);
    } catch (error) {
      this.callbacks?.onError(error as Error);
    }
  }

  private async handleSignal(
    signalId: string,
    signal: {
      to: string;
      from: string;
      type: 'offer' | 'answer' | 'candidate';
      payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
    }
  ) {
    try {
      const peer = this.getOrCreatePeer(signal.from);
      if (signal.type === 'candidate') {
        await peer.addIceCandidate(signal.payload as RTCIceCandidateInit);
      } else if (signal.type === 'offer') {
        await peer.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await this.sendSignal(signal.from, 'answer', answer);
      } else {
        await peer.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
      }
      await deleteDoc(doc(db, 'meetingRooms', this.roomId, 'signals', signalId));
    } catch (error) {
      this.callbacks?.onError(error as Error);
    }
  }

  private async sendSignal(
    to: string,
    type: 'offer' | 'answer' | 'candidate',
    payload: RTCSessionDescriptionInit | RTCIceCandidateInit
  ) {
    await addDoc(collection(db, 'meetingRooms', this.roomId, 'signals'), {
      to,
      from: this.localUserId,
      type,
      payload,
      createdAt: serverTimestamp(),
    });
  }

  replaceVideoTrack(track: MediaStreamTrack) {
    this.peers.forEach((peer) => {
      const sender = peer.getSenders().find((item) => item.track?.kind === 'video');
      void sender?.replaceTrack(track);
    });
  }

  private removePeer(remoteUserId: string) {
    this.peers.get(remoteUserId)?.close();
    this.peers.delete(remoteUserId);
    this.remoteStreams.delete(remoteUserId);
    this.callbacks?.onPeerRemoved(remoteUserId);
  }

  leave() {
    this.peers.forEach((peer) => peer.close());
    this.peers.clear();
    this.remoteStreams.clear();
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];

    if (this.roomId && this.localUserId) {
      void deleteDoc(doc(db, 'meetingRooms', this.roomId, 'participants', this.localUserId));
    }
    this.roomId = '';
    this.localUserId = '';
    this.callbacks = null;
  }
}

export const meetingService = new MeetingService();
