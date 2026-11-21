/**
 * mcqStore.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Zustand store for MCQ / OA Prep practice state.
 * Persists answers, bookmarks, and subject scores to Firestore under
 * users/{uid}/mcq_progress/stats
 *
 * Local React state (currentIndex, filters, mode) lives in the component.
 * This store only manages data that must PERSIST across sessions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand';
import { activityDbService, MCQProgressData } from '../services/activityDbService';
import { CORE_CS_QUESTIONS } from '../data/coreCsQuestions';
import { CSSubject } from '../types/mcq';

interface MCQState {
  /** questionId → selected option index (persisted to Firestore) */
  answers: Record<string, number>;
  /** Set of bookmarked question IDs (persisted to Firestore) */
  bookmarks: Set<string>;
  /** Per-subject attempted/correct counts */
  subjectScores: Record<CSSubject, { attempted: number; correct: number }>;

  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  currentUserId: string | null;

  /** Called by authStore when user signs in — loads progress from Firestore */
  initForUser: (uid: string) => Promise<void>;

  /** Records the user's answer for a question */
  recordAnswer: (questionId: string, selectedIndex: number, correctIndex: number, subject: CSSubject) => void;

  /** Toggles a bookmark */
  toggleBookmark: (questionId: string) => void;

  /** Resets all progress (confirms with caller, does not window.confirm here) */
  resetProgress: () => void;

  // Computed helpers
  getTotalAttempted: () => number;
  getTotalCorrect: () => number;
  getAccuracyPercent: () => number;
}

/** Debounce timer for Firestore writes — avoids a write on every keystroke */
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const debouncedSave = (uid: string, data: Partial<MCQProgressData>) => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    activityDbService.saveMCQProgress(uid, data).catch((err) => {
      console.warn('[MCQStore] Failed to save progress to Firestore:', err);
    });
  }, 1500); // 1.5 s debounce
};

export const useMCQStore = create<MCQState>((set, get) => ({
  answers: {},
  bookmarks: new Set(),
  subjectScores: {} as Record<CSSubject, { attempted: number; correct: number }>,
  isLoading: false,
  isSaving: false,
  error: null,
  currentUserId: null,

  // ── Init ─────────────────────────────────────────────────────────────────

  initForUser: async (uid: string) => {
    if (!uid) return;
    // Reset to empty state first (clears previous user's data from memory)
    set({
      answers: {},
      bookmarks: new Set(),
      subjectScores: {} as Record<CSSubject, { attempted: number; correct: number }>,
      isLoading: true,
      error: null,
      currentUserId: uid,
    });

    try {
      const result = await activityDbService.getMCQProgress(uid);
      if (result.success && result.data) {
        set({
          answers: result.data.answers ?? {},
          bookmarks: new Set(result.data.bookmarks ?? []),
          subjectScores: result.data.subjectScores ?? {},
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err: unknown) {
      set({
        isLoading: false,
        error: (err as Error)?.message ?? 'Failed to load MCQ progress.',
      });
    }
  },

  // ── Record Answer ─────────────────────────────────────────────────────────

  recordAnswer: (questionId, selectedIndex, correctIndex, subject) => {
    const { answers, subjectScores, currentUserId } = get();

    // Only record if not already answered (practice mode: lock once answered)
    if (answers[questionId] !== undefined) return;

    const isCorrect = selectedIndex === correctIndex;
    const prevSubject = subjectScores[subject] ?? { attempted: 0, correct: 0 };
    const updatedSubjectScores = {
      ...subjectScores,
      [subject]: {
        attempted: prevSubject.attempted + 1,
        correct: prevSubject.correct + (isCorrect ? 1 : 0),
      },
    };

    const updatedAnswers = { ...answers, [questionId]: selectedIndex };

    // Count totals
    const totalAttempted = Object.keys(updatedAnswers).length;
    const totalCorrect = CORE_CS_QUESTIONS.filter(
      (q) => updatedAnswers[q.id] === q.correctIndex
    ).length;

    set({
      answers: updatedAnswers,
      subjectScores: updatedSubjectScores,
    });

    if (currentUserId) {
      debouncedSave(currentUserId, {
        answers: updatedAnswers,
        subjectScores: updatedSubjectScores,
        totalAttempted,
        totalCorrect,
        bookmarks: Array.from(get().bookmarks),
      });
    }
  },

  // ── Bookmark ──────────────────────────────────────────────────────────────

  toggleBookmark: (questionId) => {
    const { bookmarks, currentUserId, answers, subjectScores } = get();
    const next = new Set(bookmarks);
    if (next.has(questionId)) next.delete(questionId);
    else next.add(questionId);

    set({ bookmarks: next });

    if (currentUserId) {
      const totalAttempted = Object.keys(answers).length;
      const totalCorrect = CORE_CS_QUESTIONS.filter(
        (q) => answers[q.id] === q.correctIndex
      ).length;
      debouncedSave(currentUserId, {
        bookmarks: Array.from(next),
        answers,
        subjectScores,
        totalAttempted,
        totalCorrect,
      });
    }
  },

  // ── Reset ─────────────────────────────────────────────────────────────────

  resetProgress: () => {
    const { currentUserId } = get();
    set({
      answers: {},
      bookmarks: new Set(),
      subjectScores: {} as Record<CSSubject, { attempted: number; correct: number }>,
    });

    if (currentUserId) {
      activityDbService.resetMCQProgress(currentUserId).catch((err) => {
        console.warn('[MCQStore] Failed to reset MCQ progress in Firestore:', err);
      });
    }
  },

  // ── Computed Helpers ──────────────────────────────────────────────────────

  getTotalAttempted: () => Object.keys(get().answers).length,

  getTotalCorrect: () =>
    CORE_CS_QUESTIONS.filter((q) => get().answers[q.id] === q.correctIndex).length,

  getAccuracyPercent: () => {
    const attempted = get().getTotalAttempted();
    const correct = get().getTotalCorrect();
    return attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  },
}));
