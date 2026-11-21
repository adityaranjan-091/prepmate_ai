import { CandidateLevel } from './interview';

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  grade?: string;
  description?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  technologies?: string[];
}

export interface SkillCategory {
  languages: string[];
  frameworks: string[];
  coreCS: string[];
  databasesAndTools: string[];
}

export interface UserProfile {
  fullName: string;
  headline: string;
  bio: string;
  location: string;
  targetRole: string;
  targetCompany: string;
  targetLevel: CandidateLevel;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: SkillCategory;
  updatedAt: number;
}
