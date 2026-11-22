/**
 * activityDbService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised Firebase Firestore service for all user-specific activity data.
 *
 * Database structure (Firestore):
 * ─────────────────────────────────────────────────────────────────────────────
 * users/{uid}/
 *   interview_sessions/{sessionId}   – completed interview sessions + scorecards
 *   mcq_progress/stats               – MCQ answers, bookmarks, subject scores
 *   settings/app                     – per-user app settings (AI provider, keys, etc.)
 *
 * candidate_profiles/{uid}           – top-level (already managed by profileDbService)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  deleteField,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { InterviewSession } from '../types/interview';
import { AppSettings } from '../types/settings';
import { CSSubject } from '../types/mcq';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DbResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  isUnavailable?: boolean;
}

export interface MCQProgressData {
  /** questionId → selected option index */
  answers: Record<string, number>;
  /** Array of bookmarked question IDs */
  bookmarks: string[];
  /** Per-subject attempted/correct counts */
  subjectScores: Record<CSSubject, { attempted: number; correct: number }>;
  /** Total stats */
  totalAttempted: number;
  totalCorrect: number;
  updatedAt?: unknown; // Firestore server timestamp
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function userRef(uid: string) {
  return doc(db, 'users', uid);
}

function sessionCol(uid: string) {
  return collection(db, 'users', uid, 'interview_sessions');
}

function sessionDoc(uid: string, sessionId: string) {
  return doc(db, 'users', uid, 'interview_sessions', sessionId);
}

function mcqProgressDoc(uid: string) {
  return doc(db, 'users', uid, 'mcq_progress', 'stats');
}

function settingsDoc(uid: string) {
  return doc(db, 'users', uid, 'settings', 'app');
}

function handleError(err: unknown, context: string): DbResult {
  const msg = (err as Error)?.message ?? String(err);
  const isUnavailable =
    msg.includes('permission-denied') ||
    msg.includes('unavailable') ||
    msg.includes('failed-precondition') ||
    msg.includes('not-found');
  console.warn(`[ActivityDbService] ${context}:`, msg);
  return { success: false, error: msg, isUnavailable };
}

function stripSensitiveSettings(settings: Partial<AppSettings>): Partial<AppSettings> {
  const {
    geminiApiKey: _geminiApiKey,
    groqApiKey: _groqApiKey,
    ...safeSettings
  } = settings;
  return safeSettings;
}

// ─── Service Class ────────────────────────────────────────────────────────────

class ActivityDbService {
  // ── User document ──────────────────────────────────────────────────────────

  /** Ensures the top-level /users/{uid} document exists (idempotent). */
  async ensureUserDoc(uid: string): Promise<DbResult> {
    try {
      const ref = userRef(uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      return { success: true };
    } catch (err) {
      return handleError(err, 'ensureUserDoc');
    }
  }

  // ── Interview Sessions ─────────────────────────────────────────────────────

  /**
   * Saves a completed interview session to Firestore.
   * Uses the session's existing id as the document ID.
   */
  async saveSession(uid: string, session: InterviewSession): Promise<DbResult> {
    if (!uid || !session?.id) return { success: false, error: 'uid and session.id are required.' };
    try {
      const ref = sessionDoc(uid, session.id);
      // Firestore cannot store undefined values – strip them
      const payload = JSON.parse(JSON.stringify(session));
      payload.savedAt = serverTimestamp();
      payload.uid = uid;
      await setDoc(ref, payload, { merge: true });
      return { success: true };
    } catch (err) {
      return handleError(err, 'saveSession');
    }
  }

  /**
   * Fetches all interview sessions for the user, ordered by startTime desc.
   * Limits to 100 most recent sessions to avoid excessive reads.
   */
  async getSessions(uid: string): Promise<DbResult<InterviewSession[]>> {
    if (!uid) return { success: false, error: 'uid is required.' };
    try {
      const q = query(sessionCol(uid), orderBy('startTime', 'desc'), limit(100));
      const snap = await getDocs(q);
      const sessions: InterviewSession[] = snap.docs.map((d) => {
        const data = d.data();
        // Remove Firestore-only fields before returning
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { savedAt, uid: _uid, ...rest } = data;
        return rest as InterviewSession;
      });
      return { success: true, data: sessions };
    } catch (err) {
      return handleError(err, 'getSessions') as DbResult<InterviewSession[]>;
    }
  }

  /**
   * Deletes a single interview session document.
   */
  async deleteSession(uid: string, sessionId: string): Promise<DbResult> {
    if (!uid || !sessionId) return { success: false, error: 'uid and sessionId are required.' };
    try {
      await deleteDoc(sessionDoc(uid, sessionId));
      return { success: true };
    } catch (err) {
      return handleError(err, 'deleteSession');
    }
  }

  /**
   * Deletes ALL interview sessions for the user (batch delete, up to 100).
   */
  async clearAllSessions(uid: string): Promise<DbResult> {
    if (!uid) return { success: false, error: 'uid is required.' };
    try {
      const snap = await getDocs(sessionCol(uid));
      if (snap.empty) return { success: true };
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      return { success: true };
    } catch (err) {
      return handleError(err, 'clearAllSessions');
    }
  }

  // ── MCQ / OA Prep Progress ────────────────────────────────────────────────

  /**
   * Saves the user's full MCQ progress (answers, bookmarks, subject scores).
   * Performs a merge so that partial updates don't erase existing fields.
   */
  async saveMCQProgress(uid: string, data: Partial<MCQProgressData>): Promise<DbResult> {
    if (!uid) return { success: false, error: 'uid is required.' };
    try {
      const ref = mcqProgressDoc(uid);
      await setDoc(
        ref,
        {
          ...data,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return { success: true };
    } catch (err) {
      return handleError(err, 'saveMCQProgress');
    }
  }

  /**
   * Fetches the user's MCQ progress document.
   */
  async getMCQProgress(uid: string): Promise<DbResult<MCQProgressData | null>> {
    if (!uid) return { success: false, error: 'uid is required.' };
    try {
      const snap = await getDoc(mcqProgressDoc(uid));
      if (!snap.exists()) return { success: true, data: null };
      const raw = snap.data();
      const data: MCQProgressData = {
        answers: raw.answers ?? {},
        bookmarks: Array.isArray(raw.bookmarks) ? raw.bookmarks : [],
        subjectScores: raw.subjectScores ?? {},
        totalAttempted: raw.totalAttempted ?? 0,
        totalCorrect: raw.totalCorrect ?? 0,
      };
      return { success: true, data };
    } catch (err) {
      return handleError(err, 'getMCQProgress') as DbResult<MCQProgressData | null>;
    }
  }

  /**
   * Resets the user's MCQ progress document.
   */
  async resetMCQProgress(uid: string): Promise<DbResult> {
    if (!uid) return { success: false, error: 'uid is required.' };
    try {
      await setDoc(mcqProgressDoc(uid), {
        answers: {},
        bookmarks: [],
        subjectScores: {},
        totalAttempted: 0,
        totalCorrect: 0,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (err) {
      return handleError(err, 'resetMCQProgress');
    }
  }

  // ── App Settings ─────────────────────────────────────────────────────────

  /**
   * Saves the user's app settings to Firestore.
   * API keys are intentionally not persisted to Firestore. They remain local/device-specific.
   */
  async saveSettings(uid: string, settings: Partial<AppSettings>): Promise<DbResult> {
    if (!uid) return { success: false, error: 'uid is required.' };
    try {
      await setDoc(
        settingsDoc(uid),
        {
          ...stripSensitiveSettings(settings),
          geminiApiKey: deleteField(),
          groqApiKey: deleteField(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return { success: true };
    } catch (err) {
      return handleError(err, 'saveSettings');
    }
  }

  /**
   * Fetches the user's saved app settings.
   */
  async getSettings(uid: string): Promise<DbResult<Partial<AppSettings> | null>> {
    if (!uid) return { success: false, error: 'uid is required.' };
    try {
      const snap = await getDoc(settingsDoc(uid));
      if (!snap.exists()) return { success: true, data: null };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { updatedAt, geminiApiKey, groqApiKey, ...rest } = snap.data();
      return { success: true, data: stripSensitiveSettings(rest as Partial<AppSettings>) };
    } catch (err) {
      return handleError(err, 'getSettings') as DbResult<Partial<AppSettings> | null>;
    }
  }
}

export const activityDbService = new ActivityDbService();
