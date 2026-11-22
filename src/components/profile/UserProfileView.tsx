import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Briefcase,
  Wrench,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  Building,
  ArrowRight,
  RotateCcw,
  Download,
  Share2,
  FileText,
  Code2,
  Layers,
  Award,
  X,
  Check,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { useProfileStore } from '../../store/profileStore';
import { useInterviewStore } from '../../store/interviewStore';
import { useAuthStore } from '../../store/authStore';
import { CandidateLevel } from '../../types/interview';
import { EducationItem, ExperienceItem, SkillCategory } from '../../types/profile';

type ProfileTab = 'overview' | 'experience' | 'education' | 'skills' | 'resume_preview';

export const UserProfileView: React.FC = () => {
  const {
    profile,
    updatePersonalDetails,
    addEducation,
    updateEducation,
    deleteEducation,
    addExperience,
    updateExperience,
    deleteExperience,
    addSkill,
    removeSkill,
    resetToDefaultProfile,
    getSynthesizedResumeText,
    syncStatus,
    isSaving,
    isLoading,
    syncWithFirestore,
    lastSyncedAt,
    syncError,
    initProfileForUser,
  } = useProfileStore();

  const { setActiveTab } = useInterviewStore();
  const { user } = useAuthStore();

  // Ensure user profile is synced from Firestore on mount if authenticated
  React.useEffect(() => {
    if (user?.uid) {
      initProfileForUser(user.uid);
    }
  }, [user?.uid]);

  const [activeTab, setActiveSectionTab] = useState<ProfileTab>('overview');

  // Personal Info Edit Modal/State
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    fullName: profile.fullName,
    headline: profile.headline,
    bio: profile.bio,
    location: profile.location,
    targetRole: profile.targetRole,
    targetCompany: profile.targetCompany,
    targetLevel: profile.targetLevel,
    githubUrl: profile.githubUrl,
    linkedinUrl: profile.linkedinUrl,
    portfolioUrl: profile.portfolioUrl,
  });

  // Education Modal/State
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [eduForm, setEduForm] = useState<Omit<EducationItem, 'id'>>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startYear: '',
    endYear: '',
    grade: '',
    description: '',
  });

  // Experience Modal/State
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState<Omit<ExperienceItem, 'id'>>({
    company: '',
    role: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    technologies: [],
  });
  const [expTechInput, setExpTechInput] = useState('');

  // Skill Input states
  const [skillInputs, setSkillInputs] = useState<Record<keyof SkillCategory, string>>({
    languages: '',
    frameworks: '',
    coreCS: '',
    databasesAndTools: '',
  });

  // Calculate profile completion score
  const completionPercentage = React.useMemo(() => {
    let score = 0;
    if (profile.fullName.trim()) score += 10;
    if (profile.headline.trim()) score += 10;
    if (profile.bio.trim()) score += 15;
    if (profile.targetRole.trim()) score += 10;
    if (profile.education.length > 0) score += 20;
    if (profile.experience.length > 0) score += 20;
    const totalSkills =
      profile.skills.languages.length +
      profile.skills.frameworks.length +
      profile.skills.coreCS.length +
      profile.skills.databasesAndTools.length;
    if (totalSkills >= 5) score += 15;
    return Math.min(100, score);
  }, [profile]);

  // Handlers for Personal Details
  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    updatePersonalDetails(personalForm);
    setIsEditingPersonal(false);
  };

  // Handlers for Education
  const handleOpenAddEdu = () => {
    setEditingEduId(null);
    setEduForm({
      institution: '',
      degree: 'Bachelor of Technology (B.Tech)',
      fieldOfStudy: 'Computer Science',
      startYear: '2020',
      endYear: '2024',
      grade: '',
      description: '',
    });
    setIsEduModalOpen(true);
  };

  const handleOpenEditEdu = (item: EducationItem) => {
    setEditingEduId(item.id);
    setEduForm({
      institution: item.institution,
      degree: item.degree,
      fieldOfStudy: item.fieldOfStudy,
      startYear: item.startYear,
      endYear: item.endYear,
      grade: item.grade || '',
      description: item.description || '',
    });
    setIsEduModalOpen(true);
  };

  const handleSaveEdu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduForm.institution.trim() || !eduForm.degree.trim()) return;

    if (editingEduId) {
      updateEducation(editingEduId, eduForm);
    } else {
      addEducation(eduForm);
    }
    setIsEduModalOpen(false);
  };

  // Handlers for Experience
  const handleOpenAddExp = () => {
    setEditingExpId(null);
    setExpForm({
      company: '',
      role: '',
      location: '',
      startDate: '2023',
      endDate: 'Present',
      isCurrent: true,
      description: '',
      technologies: [],
    });
    setExpTechInput('');
    setIsExpModalOpen(true);
  };

  const handleOpenEditExp = (item: ExperienceItem) => {
    setEditingExpId(item.id);
    setExpForm({
      company: item.company,
      role: item.role,
      location: item.location || '',
      startDate: item.startDate,
      endDate: item.endDate,
      isCurrent: item.isCurrent,
      description: item.description,
      technologies: item.technologies || [],
    });
    setExpTechInput((item.technologies || []).join(', '));
    setIsExpModalOpen(true);
  };

  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.company.trim() || !expForm.role.trim()) return;

    const parsedTechs = expTechInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const dataToSave = {
      ...expForm,
      technologies: parsedTechs,
    };

    if (editingExpId) {
      updateExperience(editingExpId, dataToSave);
    } else {
      addExperience(dataToSave);
    }
    setIsExpModalOpen(false);
  };

  // Handlers for Skills
  const handleAddSkillFromInput = (cat: keyof SkillCategory) => {
    const val = skillInputs[cat];
    if (val && val.trim()) {
      addSkill(cat, val.trim());
      setSkillInputs((prev) => ({ ...prev, [cat]: '' }));
    }
  };

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${profile.fullName.replace(/\s+/g, '_')}_profile.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatLevel = (lvl: CandidateLevel) => {
    return (
      {
        entry: 'Junior / Entry Level',
        mid: 'Mid-Level SWE',
        senior: 'Senior SWE',
        staff_principal: 'Staff / Principal',
      }[lvl] || lvl
    );
  };

  const userDisplayName = user?.displayName || profile.fullName || 'Candidate';

  return (
    <div className="profile-page flex-1 overflow-y-auto scroll-smooth px-6 py-7 lg:px-10 lg:py-8 select-none">
      <div className="max-w-7xl mx-auto space-y-7 pb-8">
        {/* ───────────── Top Header Card ───────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-gray-900/95 to-blue-950/40 border border-gray-800 p-6 lg:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* User Avatar */}
              <div className="relative shrink-0">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={userDisplayName}
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-blue-500/40 shadow-xl"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 grid place-items-center text-white text-2xl font-bold shadow-xl ring-2 ring-white/10 uppercase">
                    {userDisplayName.slice(0, 2)}
                  </div>
                )}
                <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-gray-900 flex items-center justify-center shadow-md">
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                </span>
              </div>

              {/* Candidate Metadata */}
              <div className="space-y-2.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                    {profile.fullName || userDisplayName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {formatLevel(profile.targetLevel)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Target: {profile.targetRole}
                  </span>
                </div>

                <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
                  {profile.headline || 'Software Engineer targeting high-scale tech companies.'}
                </p>

                {/* Metadata & Social Links */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-0.5 text-xs text-gray-400">
                  {profile.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      {profile.location}
                    </span>
                  )}
                  {profile.targetCompany && (
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      Targeting: <span className="text-gray-200 font-medium">{profile.targetCompany}</span>
                    </span>
                  )}
                  {profile.githubUrl && (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 hover:text-white transition"
                    >
                      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span>GitHub</span>
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 hover:text-blue-400 transition"
                    >
                      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Header Buttons */}
            <div className="flex flex-wrap lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('setup')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Practice with Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPersonalForm({
                    fullName: profile.fullName,
                    headline: profile.headline,
                    bio: profile.bio,
                    location: profile.location,
                    targetRole: profile.targetRole,
                    targetCompany: profile.targetCompany,
                    targetLevel: profile.targetLevel,
                    githubUrl: profile.githubUrl,
                    linkedinUrl: profile.linkedinUrl,
                    portfolioUrl: profile.portfolioUrl,
                  });
                  setIsEditingPersonal(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-xs font-medium text-gray-200 hover:text-white transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                <span>Edit Details</span>
              </button>
            </div>
          </div>

          {/* Profile Strength Meter & Cloud Sync Status */}
          <div className="relative z-10 mt-6 pt-5 border-t border-gray-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-400">Profile Readiness:</span>
                <div className="w-36 bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono tabular-nums">
                  {completionPercentage}%
                </span>
              </div>

              {/* Cloud Firestore Sync Status Badge */}
              {syncStatus === 'synced' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-emerald-400 border border-emerald-500/25 bg-emerald-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Cloud Synced (Firestore)</span>
                </span>
              ) : syncStatus === 'syncing' || isSaving ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-blue-400 border border-blue-500/25 bg-blue-500/10">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing to Cloud...</span>
                </span>
              ) : syncStatus === 'error' ? (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-red-400 border border-red-500/25 bg-red-500/10"
                  title={syncError || 'Sync failed'}
                >
                  <CloudOff className="w-3.5 h-3.5" />
                  <span>Cloud Sync Error (Check Rules)</span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-gray-400 border border-gray-700/70 bg-gray-800/60"
                  title="Firestore not configured yet or offline"
                >
                  <CloudOff className="w-3.5 h-3.5 text-gray-500" />
                  <span>Local Storage Active</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-400">
              <button
                type="button"
                onClick={async () => {
                  const ok = await syncWithFirestore();
                  if (ok) alert('Profile synced successfully to Cloud Firestore!');
                  else if (syncError) alert(`Cloud sync status: ${syncError}`);
                }}
                className="hover:text-blue-400 transition inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/70 hover:bg-gray-800 border border-gray-700/70 cursor-pointer font-medium"
                title="Force sync to Cloud Firestore"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin text-blue-400' : 'text-gray-400'}`}
                />
                <span>Sync Cloud</span>
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="hover:text-white transition inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/40 hover:bg-gray-800 border border-gray-800 cursor-pointer"
                title="Download Profile JSON"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                <span>Export JSON</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset profile to recommended engineering template?')) {
                    resetToDefaultProfile();
                  }
                }}
                className="hover:text-amber-400 transition inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/40 hover:bg-gray-800 border border-gray-800 cursor-pointer"
                title="Reset profile"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                <span>Sample Template</span>
              </button>
            </div>
          </div>

          {/* Subtle background ambient glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* ───────────── Navigation Tabs ───────────── */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-gray-900/60 border border-gray-800 overflow-x-auto">
          {[
            { id: 'overview' as ProfileTab, label: 'Profile Overview', icon: User },
            {
              id: 'experience' as ProfileTab,
              label: `Work Experience (${profile.experience.length})`,
              icon: Briefcase,
            },
            {
              id: 'education' as ProfileTab,
              label: `Education (${profile.education.length})`,
              icon: GraduationCap,
            },
            { id: 'skills' as ProfileTab, label: 'Skills & Tech Stack', icon: Wrench },
            { id: 'resume_preview' as ProfileTab, label: 'AI Resume Context', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSectionTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-blue-600/15 border border-blue-500/30 text-blue-300 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ───────────── TAB 1: OVERVIEW ───────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Bio, Experience & Education (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Bio Card */}
              <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800/80">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 grid place-items-center text-blue-400">
                      <User className="w-3.5 h-3.5" />
                    </span>
                    <span>About &amp; Career Summary</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingPersonal(true)}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition cursor-pointer"
                  >
                    Edit Bio
                  </button>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                  {profile.bio ||
                    'Add a personal summary highlighting your engineering passion, projects, and specialties.'}
                </p>
              </div>

              {/* Experience Highlights */}
              <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800/80">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 grid place-items-center text-emerald-400">
                      <Briefcase className="w-3.5 h-3.5" />
                    </span>
                    <span>Recent Work Experience</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveSectionTab('experience')}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition cursor-pointer"
                  >
                    View All ({profile.experience.length}) &rarr;
                  </button>
                </div>

                {profile.experience.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <p>No experience added yet.</p>
                    <button
                      type="button"
                      onClick={handleOpenAddExp}
                      className="mt-2 text-blue-400 text-xs font-semibold hover:underline cursor-pointer"
                    >
                      + Add your first role
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {profile.experience.slice(0, 2).map((exp) => (
                      <div
                        key={exp.id}
                        className="p-4 rounded-xl bg-gray-800/40 border border-gray-800/90 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-white">{exp.role}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {exp.company} {exp.location && `• ${exp.location}`}
                            </p>
                          </div>
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-gray-900 text-gray-300 border border-gray-700/80 shrink-0 tabular-nums">
                            {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                          {exp.description}
                        </p>
                        {exp.technologies && exp.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {exp.technologies.slice(0, 5).map((tech) => (
                              <span
                                key={tech}
                                className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Education Highlights */}
              <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800/80">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 grid place-items-center text-purple-400">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </span>
                    <span>Academic Background</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveSectionTab('education')}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition cursor-pointer"
                  >
                    View All ({profile.education.length}) &rarr;
                  </button>
                </div>

                {profile.education.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    <p>No education details listed.</p>
                    <button
                      type="button"
                      onClick={handleOpenAddEdu}
                      className="mt-2 text-blue-400 text-xs font-semibold hover:underline cursor-pointer"
                    >
                      + Add Education
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profile.education.map((edu) => (
                      <div
                        key={edu.id}
                        className="p-4 rounded-xl bg-gray-800/40 border border-gray-800/90 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-white">
                            {edu.degree} in {edu.fieldOfStudy}
                          </h4>
                          <p className="text-xs text-gray-400">{edu.institution}</p>
                          {edu.grade && (
                            <span className="inline-block text-[11px] text-purple-300 font-medium">
                              {edu.grade}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-gray-900 text-gray-300 border border-gray-700/80 shrink-0 tabular-nums">
                          {edu.startYear} - {edu.endYear}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sticky Column: Key Skills & AI Interview Match (4 Cols) */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
              {/* Top Skills Snapshot */}
              <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800/80">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 grid place-items-center text-amber-400">
                      <Wrench className="w-3.5 h-3.5" />
                    </span>
                    <span>Skills Snapshot</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveSectionTab('skills')}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition cursor-pointer"
                  >
                    Manage
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Languages
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.languages.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-800/90 text-gray-200 border border-gray-700/80"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Core CS &amp; Design
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.coreCS.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/25"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Calibration Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border border-blue-500/30 space-y-3.5">
                <div className="flex items-center gap-2 text-blue-300 text-sm font-semibold">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>AI Calibration Active</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  When you start an interview, Prepmate AI uses your target role (
                  <strong className="text-white">{profile.targetRole}</strong>), level (
                  <strong className="text-white">{profile.targetLevel}</strong>), and verified skill
                  set to calibrate questions specifically for you.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('setup')}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  <span>Launch Calibrated Mock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* ───────────── TAB 2: EXPERIENCE ───────────── */}
        {activeTab === 'experience' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Work Experience</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  List internships, full-time roles, and technical project contributions.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddExp}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-blue-600/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Role</span>
              </button>
            </div>

            {profile.experience.length === 0 ? (
              <div className="p-14 text-center rounded-2xl bg-gray-900/50 border border-dashed border-gray-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center text-gray-500 mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-white">No experience records</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    Add your previous or current software engineering roles to help the AI
                    interviewer conduct in-depth STAR behavioral and architectural deep dives.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddExp}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer"
                >
                  + Add Experience
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.experience.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 hover:border-gray-700 transition space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-white">{exp.role}</h3>
                        <p className="text-sm text-blue-400 font-medium mt-0.5">
                          {exp.company}{' '}
                          {exp.location && <span className="text-gray-500">• {exp.location}</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-medium px-3 py-1 rounded-lg bg-gray-800/90 text-gray-300 border border-gray-700/80 tabular-nums">
                          {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditExp(exp)}
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                          title="Edit Role"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete experience at ${exp.company}?`)) {
                              deleteExperience(exp.id);
                            }
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                          title="Delete Role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                      {exp.description}
                    </p>

                    {exp.technologies && exp.technologies.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {exp.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ───────────── TAB 3: EDUCATION ───────────── */}
        {activeTab === 'education' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Academic Qualifications
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Degrees, colleges, bootcamps, and relevant technical coursework.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddEdu}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-blue-600/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Education</span>
              </button>
            </div>

            {profile.education.length === 0 ? (
              <div className="p-14 text-center rounded-2xl bg-gray-900/50 border border-dashed border-gray-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center text-gray-500 mx-auto">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-white">No academic records yet</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    Add your degree, university, or academic certifications to showcase your
                    foundational knowledge.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddEdu}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer"
                >
                  + Add Education
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.education.map((edu) => (
                  <div
                    key={edu.id}
                    className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 hover:border-gray-700 transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 grid place-items-center text-purple-400">
                          <GraduationCap className="w-5 h-5" />
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditEdu(edu)}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete education at ${edu.institution}?`)) {
                                deleteEducation(edu.id);
                              }
                            }}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white">
                          {edu.degree} in {edu.fieldOfStudy}
                        </h3>
                        <p className="text-sm text-purple-300 font-medium mt-0.5">
                          {edu.institution}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 tabular-nums">
                        <span>
                          {edu.startYear} - {edu.endYear}
                        </span>
                        {edu.grade && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">{edu.grade}</span>
                          </>
                        )}
                      </div>

                      {edu.description && (
                        <p className="text-xs text-gray-300 leading-relaxed pt-1">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ───────────── TAB 4: SKILLS ───────────── */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Technical Skills &amp; Competencies
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Manage your engineering skill categories. Type a skill name and press Enter to add.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Category: Languages */}
              <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-blue-400" />
                    <span>Programming Languages ({profile.skills.languages.length})</span>
                  </h3>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. TypeScript, Rust, Go..."
                    value={skillInputs.languages}
                    onChange={(e) => setSkillInputs({ ...skillInputs, languages: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkillFromInput('languages')}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkillFromInput('languages')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.skills.languages.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/25"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill('languages', skill)}
                        className="hover:text-red-400 transition cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Category: Frameworks */}
              <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Frameworks &amp; Libraries ({profile.skills.frameworks.length})</span>
                  </h3>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. React, Next.js, FastAPI..."
                    value={skillInputs.frameworks}
                    onChange={(e) => setSkillInputs({ ...skillInputs, frameworks: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkillFromInput('frameworks')}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkillFromInput('frameworks')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.skills.frameworks.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill('frameworks', skill)}
                        className="hover:text-red-400 transition cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Category: Core CS */}
              <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span>Core CS &amp; Architecture ({profile.skills.coreCS.length})</span>
                  </h3>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Distributed Systems, Concurrency..."
                    value={skillInputs.coreCS}
                    onChange={(e) => setSkillInputs({ ...skillInputs, coreCS: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkillFromInput('coreCS')}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkillFromInput('coreCS')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.skills.coreCS.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/25"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill('coreCS', skill)}
                        className="hover:text-red-400 transition cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Category: Databases & Cloud */}
              <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>Databases &amp; Cloud Tools ({profile.skills.databasesAndTools.length})</span>
                  </h3>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. PostgreSQL, Redis, Docker, AWS..."
                    value={skillInputs.databasesAndTools}
                    onChange={(e) =>
                      setSkillInputs({ ...skillInputs, databasesAndTools: e.target.value })
                    }
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleAddSkillFromInput('databasesAndTools')
                    }
                    className="flex-1 px-3.5 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkillFromInput('databasesAndTools')}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.skills.databasesAndTools.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill('databasesAndTools', skill)}
                        className="hover:text-red-400 transition cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────── TAB 5: AI RESUME CONTEXT PREVIEW ───────────── */}
        {activeTab === 'resume_preview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Synthesized AI Resume Context
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  This structured context is dynamically provided to the AI Interviewer during mock
                  sessions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getSynthesizedResumeText());
                  alert('Copied AI resume context to clipboard!');
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-semibold text-white transition cursor-pointer shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy Context</span>
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap overflow-x-auto shadow-inner">
              {getSynthesizedResumeText()}
            </div>
          </div>
        )}

        {/* ───────────── EDIT PERSONAL DETAILS MODAL ───────────── */}
        {isEditingPersonal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gray-900 border border-gray-800 p-6 sm:p-7 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Edit Candidate Details
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingPersonal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePersonal} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={personalForm.fullName}
                    onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Professional Headline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Backend Engineer | Distributed Systems"
                    value={personalForm.headline}
                    onChange={(e) => setPersonalForm({ ...personalForm, headline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Target Role
                    </label>
                    <input
                      type="text"
                      value={personalForm.targetRole}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, targetRole: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Target Candidate Level
                    </label>
                    <select
                      value={personalForm.targetLevel}
                      onChange={(e) =>
                        setPersonalForm({
                          ...personalForm,
                          targetLevel: e.target.value as CandidateLevel,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer transition"
                    >
                      <option value="entry">Junior / Entry Level</option>
                      <option value="mid">Mid-Level SWE</option>
                      <option value="senior">Senior SWE</option>
                      <option value="staff_principal">Staff / Principal</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Target Companies
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Google, Meta, Stripe"
                      value={personalForm.targetCompany}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, targetCompany: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. San Francisco, CA / Bangalore"
                      value={personalForm.location}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, location: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    About &amp; Summary
                  </label>
                  <textarea
                    rows={4}
                    value={personalForm.bio}
                    onChange={(e) => setPersonalForm({ ...personalForm, bio: e.target.value })}
                    placeholder="Tell your engineering story, specializations, and what you build..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={personalForm.githubUrl}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, githubUrl: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={personalForm.linkedinUrl}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, linkedinUrl: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingPersonal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium text-gray-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition cursor-pointer shadow-lg shadow-blue-600/25"
                  >
                    Save Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ───────────── ADD / EDIT EDUCATION MODAL ───────────── */}
        {isEduModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg rounded-3xl bg-gray-900 border border-gray-800 p-6 sm:p-7 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {editingEduId ? 'Edit Education' : 'Add Education'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEduModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdu} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Institution / University
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stanford University or IIT Delhi"
                    value={eduForm.institution}
                    onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Degree
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.Tech / B.S. / M.S."
                      value={eduForm.degree}
                      onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Field of Study
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science"
                      value={eduForm.fieldOfStudy}
                      onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Start Year
                    </label>
                    <input
                      type="text"
                      placeholder="2020"
                      value={eduForm.startYear}
                      onChange={(e) => setEduForm({ ...eduForm, startYear: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      End Year
                    </label>
                    <input
                      type="text"
                      placeholder="2024"
                      value={eduForm.endYear}
                      onChange={(e) => setEduForm({ ...eduForm, endYear: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      GPA / Grade
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3.9 GPA"
                      value={eduForm.grade}
                      onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Description / Coursework (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Honors in Algorithms and Distributed Systems..."
                    value={eduForm.description}
                    onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-purple-500 transition leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsEduModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium text-gray-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition cursor-pointer"
                  >
                    {editingEduId ? 'Update Education' : 'Save Education'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ───────────── ADD / EDIT EXPERIENCE MODAL ───────────── */}
        {isExpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gray-900 border border-gray-800 p-6 sm:p-7 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {editingExpId ? 'Edit Work Experience' : 'Add Work Experience'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsExpModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Uber or Stripe"
                      value={expForm.company}
                      onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Job Title / Role
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software Engineer II"
                      value={expForm.role}
                      onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Remote / Bangalore / San Francisco"
                    value={expForm.location}
                    onChange={(e) => setExpForm({ ...expForm, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jun 2022"
                      value={expForm.startDate}
                      onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      End Date
                    </label>
                    <input
                      type="text"
                      disabled={expForm.isCurrent}
                      placeholder="e.g. Present or Dec 2023"
                      value={expForm.isCurrent ? 'Present' : expForm.endDate}
                      onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="isCurrent"
                    checked={expForm.isCurrent}
                    onChange={(e) => setExpForm({ ...expForm, isCurrent: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-gray-800 border-gray-700 cursor-pointer"
                  />
                  <label htmlFor="isCurrent" className="text-xs text-gray-300 cursor-pointer">
                    I currently work here
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Key Achievements &amp; Responsibilities
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your technical contributions, system metrics (e.g. reduced latency by 30%), and technologies leveraged..."
                    value={expForm.description}
                    onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Technologies Used (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Go, Kafka, PostgreSQL, Docker"
                    value={expTechInput}
                    onChange={(e) => setExpTechInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsExpModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium text-gray-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition cursor-pointer"
                  >
                    {editingExpId ? 'Update Role' : 'Save Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};