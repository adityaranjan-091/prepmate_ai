import { create } from 'zustand';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { useProfileStore } from './profileStore';

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
    } catch (err: any) {
      const msg = mapAuthError(err.code || err.message);
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
    } catch (err: any) {
      const msg = mapAuthError(err.code || err.message);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, provider);
      set({ user: res.user, loading: false, error: null });
    } catch (err: any) {
      // Don't treat user closing popup as a fatal system error, but report cleanly
      if (err.code === 'auth/popup-closed-by-user') {
        set({ loading: false, error: null });
        return;
      }
      const msg = mapAuthError(err.code || err.message);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await firebaseSignOut(auth);
      set({ user: null, loading: false, error: null });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  sendPasswordReset: async (email: string) => {
    set({ loading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email.trim());
      set({ loading: false, error: null });
    } catch (err: any) {
      const msg = mapAuthError(err.code || err.message);
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  clearError: () => set({ error: null }),
}));

// Initialize Firebase auth listener once
onAuthStateChanged(auth, (user) => {
  useAuthStore.setState({
    user,
    loading: false,
    initialized: true,
  });

  if (user?.uid) {
    useProfileStore.getState().initProfileForUser(user.uid);
  }
});

function mapAuthError(codeOrMsg: string): string {
  if (codeOrMsg.includes('auth/invalid-email')) return 'Invalid email address format.';
  if (codeOrMsg.includes('auth/user-not-found') || codeOrMsg.includes('auth/wrong-password') || codeOrMsg.includes('auth/invalid-credential')) {
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

