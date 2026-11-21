import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types/profile';

/**
 * Collection identifier for candidate profiles in Cloud Firestore.
 * Each document ID corresponds directly to the candidate's Firebase Auth UID.
 */
export const CANDIDATE_PROFILES_COLLECTION = 'candidate_profiles';

export interface ProfileDbResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  isFirestoreUnavailable?: boolean;
}

/**
 * Service handling Cloud Firestore CRUD operations for Candidate Profiles.
 * Associates each profile document with the authenticated user's Firebase UID.
 */
export class ProfileDbService {
  /**
   * Retrieves a candidate profile from Cloud Firestore by user UID.
   */
  public async getProfile(userId: string): Promise<ProfileDbResult<UserProfile | null>> {
    if (!userId?.trim()) {
      return { success: false, error: 'User ID is required to fetch profile.' };
    }

    try {
      const docRef = doc(db, CANDIDATE_PROFILES_COLLECTION, userId.trim());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const rawData = docSnap.data();
        const profile: UserProfile = {
          fullName: rawData.fullName || '',
          headline: rawData.headline || '',
          bio: rawData.bio || '',
          location: rawData.location || '',
          targetRole: rawData.targetRole || '',
          targetCompany: rawData.targetCompany || '',
          targetLevel: rawData.targetLevel || 'senior',
          githubUrl: rawData.githubUrl || '',
          linkedinUrl: rawData.linkedinUrl || '',
          portfolioUrl: rawData.portfolioUrl || '',
          education: Array.isArray(rawData.education) ? rawData.education : [],
          experience: Array.isArray(rawData.experience) ? rawData.experience : [],
          skills: {
            languages: Array.isArray(rawData.skills?.languages) ? rawData.skills.languages : [],
            frameworks: Array.isArray(rawData.skills?.frameworks) ? rawData.skills.frameworks : [],
            coreCS: Array.isArray(rawData.skills?.coreCS) ? rawData.skills.coreCS : [],
            databasesAndTools: Array.isArray(rawData.skills?.databasesAndTools) ? rawData.skills.databasesAndTools : [],
          },
          updatedAt: typeof rawData.updatedAt === 'number' ? rawData.updatedAt : Date.now(),
        };

        return { success: true, data: profile };
      }

      // Document does not exist yet in Firestore
      return { success: true, data: null };
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to retrieve profile from Firestore.';
      const isUnavailable =
        errorMsg.includes('not-found') ||
        errorMsg.includes('permission-denied') ||
        errorMsg.includes('failed-precondition') ||
        errorMsg.includes('unavailable');

      console.warn('[ProfileDbService] Could not read from Cloud Firestore:', errorMsg);
      return {
        success: false,
        error: errorMsg,
        isFirestoreUnavailable: isUnavailable,
      };
    }
  }

  /**
   * Saves or updates a candidate profile in Cloud Firestore under the user's UID.
   */
  public async saveProfile(userId: string, profile: UserProfile): Promise<ProfileDbResult<void>> {
    if (!userId?.trim()) {
      return { success: false, error: 'User ID is required to save profile.' };
    }

    try {
      const docRef = doc(db, CANDIDATE_PROFILES_COLLECTION, userId.trim());

      const payload = {
        userId: userId.trim(),
        fullName: profile.fullName || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        location: profile.location || '',
        targetRole: profile.targetRole || '',
        targetCompany: profile.targetCompany || '',
        targetLevel: profile.targetLevel || 'senior',
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
        education: profile.education || [],
        experience: profile.experience || [],
        skills: {
          languages: profile.skills?.languages || [],
          frameworks: profile.skills?.frameworks || [],
          coreCS: profile.skills?.coreCS || [],
          databasesAndTools: profile.skills?.databasesAndTools || [],
        },
        updatedAt: Date.now(),
        lastSyncedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload, { merge: true });
      return { success: true };
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to save profile to Firestore.';
      const isUnavailable =
        errorMsg.includes('permission-denied') ||
        errorMsg.includes('failed-precondition') ||
        errorMsg.includes('unavailable');

      console.warn('[ProfileDbService] Could not save to Cloud Firestore:', errorMsg);
      return {
        success: false,
        error: errorMsg,
        isFirestoreUnavailable: isUnavailable,
      };
    }
  }

  /**
   * Deletes a candidate profile document from Cloud Firestore.
   */
  public async deleteProfile(userId: string): Promise<ProfileDbResult<void>> {
    if (!userId?.trim()) {
      return { success: false, error: 'User ID is required to delete profile.' };
    }

    try {
      const docRef = doc(db, CANDIDATE_PROFILES_COLLECTION, userId.trim());
      await deleteDoc(docRef);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to delete profile from Firestore.',
      };
    }
  }
}

export const profileDbService = new ProfileDbService();
