import { create } from 'zustand';
import { UserProfile, EducationItem, ExperienceItem, SkillCategory } from '../types/profile';
import { profileDbService } from '../services/profileDbService';

const PROFILE_STORAGE_KEY = 'prepmate_user_profile_v1';

export type SyncStatus = 'synced' | 'local_only' | 'syncing' | 'error';

export const DEFAULT_USER_PROFILE: UserProfile = {
  fullName: '',
  headline: '',
  bio: '',
  location: '',
  targetRole: '',
  targetCompany: '',
  targetLevel: 'entry',
  githubUrl: '',
  linkedinUrl: '',
  portfolioUrl: '',
  education: [],
  experience: [],
  skills: {
    languages: [],
    frameworks: [],
    coreCS: [],
    databasesAndTools: [],
  },
  updatedAt: Date.now(),
};

interface ProfileState {
  profile: UserProfile;
  currentUserId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  syncError: string | null;

  // Cloud Firestore Sync Actions
  initProfileForUser: (userId: string) => Promise<void>;
  syncWithFirestore: () => Promise<boolean>;

  // Profile Field Actions
  updatePersonalDetails: (details: Partial<Omit<UserProfile, 'education' | 'experience' | 'skills' | 'updatedAt'>>) => void;
  addEducation: (edu: Omit<EducationItem, 'id'>) => void;
  updateEducation: (id: string, edu: Partial<EducationItem>) => void;
  deleteEducation: (id: string) => void;
  addExperience: (exp: Omit<ExperienceItem, 'id'>) => void;
  updateExperience: (id: string, exp: Partial<ExperienceItem>) => void;
  deleteExperience: (id: string) => void;
  addSkill: (category: keyof SkillCategory, skill: string) => void;
  removeSkill: (category: keyof SkillCategory, skill: string) => void;
  resetToDefaultProfile: () => void;
  clearProfileForSignOut: () => void;
  getSynthesizedResumeText: () => string;
}

const loadProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_USER_PROFILE,
      ...parsed,
      skills: {
        ...DEFAULT_USER_PROFILE.skills,
        ...(parsed.skills || {}),
      },
    };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
};

// Blank profile template used for new user accounts (not seeded with any personal data)
export const BLANK_USER_PROFILE: UserProfile = {
  fullName: '',
  headline: '',
  bio: '',
  location: '',
  targetRole: '',
  targetCompany: '',
  targetLevel: 'entry',
  githubUrl: '',
  linkedinUrl: '',
  portfolioUrl: '',
  education: [],
  experience: [],
  skills: { languages: [], frameworks: [], coreCS: [], databasesAndTools: [] },
  updatedAt: Date.now(),
};

const saveProfileToLocalStorage = (profile: UserProfile) => {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile to localStorage:', err);
  }
};

export const useProfileStore = create<ProfileState>((set, get) => {
  // Helper to trigger remote Firestore update in the background
  const triggerRemoteSync = (updatedProfile: UserProfile) => {
    const { currentUserId } = get();
    if (!currentUserId) return;

    set({ isSaving: true, syncStatus: 'syncing' });
    profileDbService.saveProfile(currentUserId, updatedProfile).then((res) => {
      if (res.success) {
        set({
          isSaving: false,
          syncStatus: 'synced',
          lastSyncedAt: Date.now(),
          syncError: null,
        });
      } else {
        set({
          isSaving: false,
          syncStatus: res.isFirestoreUnavailable ? 'local_only' : 'error',
          syncError: res.error || null,
        });
      }
    });
  };

  return {
    profile: loadProfile(),
    currentUserId: null,
    isLoading: false,
    isSaving: false,
    syncStatus: 'local_only',
    lastSyncedAt: null,
    syncError: null,

    initProfileForUser: async (userId: string) => {
      if (!userId?.trim()) return;
      set({ currentUserId: userId, isLoading: true, syncStatus: 'syncing', syncError: null });

      try {
        const res = await profileDbService.getProfile(userId);

        if (res.success && res.data) {
          // Firestore has existing profile — use it
          saveProfileToLocalStorage(res.data);
          set({
            profile: res.data,
            isLoading: false,
            syncStatus: 'synced',
            lastSyncedAt: Date.now(),
            syncError: null,
          });
        } else if (res.success && !res.data) {
          // New user — push a blank profile to Firestore (never seed personal demo data)
          const blankProfile: UserProfile = {
            ...BLANK_USER_PROFILE,
            updatedAt: Date.now(),
          };
          saveProfileToLocalStorage(blankProfile);
          set({ profile: blankProfile });
          const saveRes = await profileDbService.saveProfile(userId, blankProfile);
          set({
            isLoading: false,
            syncStatus: saveRes.success ? 'synced' : (saveRes.isFirestoreUnavailable ? 'local_only' : 'error'),
            lastSyncedAt: saveRes.success ? Date.now() : null,
            syncError: saveRes.error || null,
          });
        } else {
          set({
            isLoading: false,
            syncStatus: res.isFirestoreUnavailable ? 'local_only' : 'error',
            syncError: res.error || null,
          });
        }
      } catch (err: unknown) {
        set({
          isLoading: false,
          syncStatus: 'error',
          syncError: (err as Error)?.message || 'Failed to initialize profile.',
        });
      }
    },

    syncWithFirestore: async (): Promise<boolean> => {
      const { currentUserId, profile } = get();
      if (!currentUserId) {
        set({ syncStatus: 'local_only', syncError: 'Authentication required for cloud sync.' });
        return false;
      }

      set({ isSaving: true, syncStatus: 'syncing', syncError: null });
      const res = await profileDbService.saveProfile(currentUserId, profile);

      if (res.success) {
        set({
          isSaving: false,
          syncStatus: 'synced',
          lastSyncedAt: Date.now(),
          syncError: null,
        });
        return true;
      } else {
        set({
          isSaving: false,
          syncStatus: res.isFirestoreUnavailable ? 'local_only' : 'error',
          syncError: res.error || null,
        });
        return false;
      }
    },

    updatePersonalDetails: (details) => {
      set((state) => {
        const updated: UserProfile = {
          ...state.profile,
          ...details,
          updatedAt: Date.now(),
        };
        saveProfileToLocalStorage(updated);
        triggerRemoteSync(updated);
        return { profile: updated };
      });
    },

    addEducation: (edu) => {
      set((state) => {
        const newEdu: EducationItem = {
          ...edu,
          id: 'edu-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        };
        const updated: UserProfile = {
          ...state.profile,
          education: [newEdu, ...state.profile.education],
          updatedAt: Date.now(),
        };
        saveProfileToLocalStorage(updated);
        triggerRemoteSync(updated);
        return { profile: updated };
      });
    },

    updateEducation: (id, edu) => {
      set((state) => {
        const updated: UserProfile = {
          ...state.profile,
          education: state.profile.education.map((item) =>
            item.id === id ? { ...item, ...edu } : item
          ),
          updatedAt: Date.now(),
        };
        saveProfileToLocalStorage(updated);
        triggerRemoteSync(updated);
        return { profile: updated };
      });
    },

    deleteEducation: (id) => {
      set((state) => {
        const updated: UserProfile = {
          ...state.profile,
          education: state.profile.education.filter((item) => item.id !== id),
          updatedAt: Date.now(),
        };
        saveProfileToLocalStorage(updated);
        triggerRemoteSync(updated);
        return { profile: updated };
      });
    },

    addExperience: (exp) => {
      set((state) => {
        const newExp: ExperienceItem = {
          ...exp,
          id: 'exp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        };
        const updated: UserProfile = {
          ...state.profile,
          experience: [newExp, ...state.profile.experience],
          updatedAt: Date.now(),
        };
        saveProfileToLocalStorage(updated);
        triggerRemoteSync(updated);
        return { profile: updated };
      });
    },

    updateExperience: (id, exp) => {
      set((state) => {
        const updated: UserProfile = {
          ...state.profile,
          experience: state.profile.experience.map((item) =>
            item.id === id ? { ...item, ...exp } : item
          ),
          updatedAt: Date.now(),
        };
        saveProfileToLocalStorage(updated);
        triggerRemoteSync(updated);
        return { profile: updated };
      });
    },

    deleteExperience: (id) => {
      set((state) => {
        const updated: UserProfile = {
          ...state.profile,
          experience: state.profile.experience.filter((item) => item.id !== id),
          updatedAt: Date.now(),
        };
        saveProfileToLocalStorage(updated);
        triggerRemoteSync(updated);
        return { profile: updated };
      });
    },

    addSkill: (category, skill) => {
      const trimmed = skill.trim();
      if (!trimmed) return;

      set((state) => {
        const currentList = state.profile.skills[category] || [];
        if (currentList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
          return state;
        }
        const updated: UserProfile = {
          ...state.profile,
          skills: {
            ...state.profile.skills,
            [category]: [...currentList, trimmed],
          },
          updatedAt: Date.now(),
        };
        saveProfileToLocalStorage(updated);
        triggerRemoteSync(updated);
        return { profile: updated };
      });
    },

    removeSkill: (category, skill) => {
      set((state) => {
        const updated: UserProfile = {
          ...state.profile,
          skills: {
            ...state.profile.skills,
            [category]: state.profile.skills[category].filter((s) => s !== skill),
          },
          updatedAt: Date.now(),
        };
        saveProfileToLocalStorage(updated);
        triggerRemoteSync(updated);
        return { profile: updated };
      });
    },

    resetToDefaultProfile: () => {
      saveProfileToLocalStorage(DEFAULT_USER_PROFILE);
      triggerRemoteSync(DEFAULT_USER_PROFILE);
      set({ profile: DEFAULT_USER_PROFILE });
    },

    clearProfileForSignOut: () => {
      saveProfileToLocalStorage(BLANK_USER_PROFILE);
      set({
        profile: BLANK_USER_PROFILE,
        currentUserId: null,
        isLoading: false,
        isSaving: false,
        syncStatus: 'local_only',
        lastSyncedAt: null,
        syncError: null,
      });
    },

    getSynthesizedResumeText: () => {
      const { profile } = get();
      const sections: string[] = [];

      sections.push(`CANDIDATE: ${profile.fullName}`);
      if (profile.headline) sections.push(`HEADLINE: ${profile.headline}`);
      if (profile.location) sections.push(`LOCATION: ${profile.location}`);
      if (profile.bio) sections.push(`SUMMARY:\n${profile.bio}`);

      if (profile.experience.length > 0) {
        const expStr = profile.experience
          .map((exp) => {
            const dates = `${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate}`;
            const tech = exp.technologies?.length ? `\nTech: ${exp.technologies.join(', ')}` : '';
            return `• ${exp.role} at ${exp.company} (${dates})\n  ${exp.description}${tech}`;
          })
          .join('\n\n');
        sections.push(`EXPERIENCE:\n${expStr}`);
      }

      if (profile.education.length > 0) {
        const eduStr = profile.education
          .map((edu) => {
            const grade = edu.grade ? ` | ${edu.grade}` : '';
            const desc = edu.description ? `\n  ${edu.description}` : '';
            return `• ${edu.degree} in ${edu.fieldOfStudy} - ${edu.institution} (${edu.startYear} - ${edu.endYear})${grade}${desc}`;
          })
          .join('\n\n');
        sections.push(`EDUCATION:\n${eduStr}`);
      }

      const skillsList: string[] = [];
      if (profile.skills.languages.length) skillsList.push(`Languages: ${profile.skills.languages.join(', ')}`);
      if (profile.skills.frameworks.length) skillsList.push(`Frameworks & Libraries: ${profile.skills.frameworks.join(', ')}`);
      if (profile.skills.coreCS.length) skillsList.push(`Core CS & Fundamentals: ${profile.skills.coreCS.join(', ')}`);
      if (profile.skills.databasesAndTools.length) skillsList.push(`Databases & Cloud Tools: ${profile.skills.databasesAndTools.join(', ')}`);

      if (skillsList.length > 0) {
        sections.push(`TECHNICAL SKILLS:\n${skillsList.join('\n')}`);
      }

      return sections.join('\n\n');
    },
  };
});
