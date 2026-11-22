import { create } from 'zustand';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { useProfileStore } from './profileStore';
import { useInterviewStore } from './interviewStore';
import { useMCQStore } from './mcqStore';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  clearError: () => void;
}

const isTauriDesktop = () =>
  typeof window !== 'undefined' &&
  Boolean(
    (window as typeof window & {
      __TAURI_INTERNALS__?: unknown;
      __TAURI__?: unknown;
    }).__TAURI_INTERNALS__ ||
    (window as typeof window & {
      __TAURI_INTERNALS__?: unknown;
      __TAURI__?: unknown;
    }).__TAURI__
  );

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  initialized: false,

  signInWithEmail: async (email, pass) => {
    set({ loading: true, error: null });
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      set({ user: res.user, loading: false, error: null });
    } catch (err: unknown) {
      const msg = mapAuthError((err as { code?: string; message?: string }).code || (err as Error).message);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  signUpWithEmail: async (email, pass, displayName) => {
    set({ loading: true, error: null });
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (displayName?.trim() && res.user) {
        await updateProfile(res.user, { displayName: displayName.trim() });
      }
      set({ user: auth.currentUser || res.user, loading: false, error: null });
    } catch (err: unknown) {
      const msg = mapAuthError((err as { code?: string; message?: string }).code || (err as Error).message);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      if (isTauriDesktop()) {
        await signInWithRedirect(auth, provider);
        return;
      }
      const res = await signInWithPopup(auth, provider);
      set({ user: res.user, loading: false, error: null });
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'auth/popup-closed-by-user') {
        set({ loading: false, error: null });
        return;
      }
      const msg = mapAuthError((err as { code?: string; message?: string }).code || (err as Error).message);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await firebaseSignOut(auth);
      // Clear all in-memory user data so the next user gets a clean slate
      useInterviewStore.getState().setCurrentUserId(null);
      useInterviewStore.setState({ sessionHistory: [], historyLoading: false, historyError: null });
      useMCQStore.getState().resetProgress();
      useProfileStore.getState().clearProfileForSignOut();
      set({ user: null, loading: false, error: null });
    } catch (err: unknown) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  sendPasswordReset: async (email: string) => {
    set({ loading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email.trim());
      set({ loading: false, error: null });
    } catch (err: unknown) {
      const msg = mapAuthError((err as { code?: string; message?: string }).code || (err as Error).message);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  clearError: () => set({ error: null }),
}));

// Initialize Firebase auth listener once — runs on module import
onAuthStateChanged(auth, (user) => {
  useAuthStore.setState({ user, loading: false, initialized: true });

  if (user?.uid) {
    // Load profile data from Firestore for the signed-in user
    useProfileStore.getState().initProfileForUser(user.uid);
    // Load interview sessions & settings from Firestore
    useInterviewStore.getState().initSessionsForUser(user.uid);
    // Load MCQ / OA prep progress from Firestore
    useMCQStore.getState().initForUser(user.uid);
  } else {
    // User signed out: wipe in-memory data
    useInterviewStore.getState().setCurrentUserId(null);
    useInterviewStore.setState({ sessionHistory: [], historyLoading: false, historyError: null });
    useMCQStore.setState({ answers: {}, bookmarks: new Set(), subjectScores: {} as any, currentUserId: null });
    useProfileStore.getState().clearProfileForSignOut();
  }
});

// Complete Google redirect sign-in for the desktop Tauri WebView.
if (isTauriDesktop()) {
  getRedirectResult(auth)
    .then((result) => {
      if (result?.user) {
        useAuthStore.setState({
          user: result.user,
          loading: false,
          initialized: true,
          error: null,
        });
      }
    })
    .catch((err: unknown) => {
      const codeOrMsg =
        (err as { code?: string }).code ||
        (err as Error).message ||
        'Google sign-in failed.';
      const msg = mapAuthError(codeOrMsg);
      useAuthStore.setState({ loading: false, error: msg });
    });
}

function mapAuthError(codeOrMsg: string): string {
  if (!codeOrMsg) return 'Authentication failed. Please try again.';
  if (codeOrMsg.includes('auth/invalid-email')) return 'Invalid email address format.';
  if (
    codeOrMsg.includes('auth/user-not-found') ||
    codeOrMsg.includes('auth/wrong-password') ||
    codeOrMsg.includes('auth/invalid-credential')
  ) {
    return 'Invalid email or password.';
  }
  if (codeOrMsg.includes('auth/email-already-in-use')) return 'This email address is already registered.';
  if (codeOrMsg.includes('auth/weak-password')) return 'Password should be at least 6 characters.';
  if (codeOrMsg.includes('auth/too-many-requests')) return 'Too many attempts. Please try again later.';
  if (codeOrMsg.includes('auth/network-request-failed')) return 'Network error. Please check your internet connection.';
  if (codeOrMsg.includes('auth/popup-blocked')) return 'Sign-in popup was blocked by browser/webview.';
  if (codeOrMsg.includes('auth/operation-not-allowed')) return 'This sign-in provider is not enabled in Firebase Console.';
  return codeOrMsg || 'Authentication failed. Please try again.';
}
