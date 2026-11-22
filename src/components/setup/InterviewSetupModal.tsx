import React, { useState } from 'react';
import {
  Code,
  Users,
  Layers,
  Award,
  Upload,
  Sparkles,
  FileText,
  Building,
  Briefcase,
  Play,
  Mic,
  Camera,
  Check,
  AlertCircle,
  Clock,
  Sliders,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';
import { InterviewConfig, InterviewMode, CandidateLevel, MeetingType } from '../../types/interview';
import { resumeParserService, ParsedResume } from '../../services/resumeParser';
import { DSA_PROBLEMS } from '../../data/dsaProblems';
import { useProfileStore } from '../../store/profileStore';

export const InterviewSetupModal: React.FC = () => {
  const { startSession, settings, setActiveTab, aiService } = useInterviewStore();
  const { profile, getSynthesizedResumeText } = useProfileStore();

  const [mode, setMode] = useState<InterviewMode>('coding');
  const [meetingType, setMeetingType] = useState<MeetingType>('ai');
  const [roomCode, setRoomCode] = useState('');
  const [targetRole, setTargetRole] = useState('Senior Software Engineer');
  const [targetCompany, setTargetCompany] = useState('Google');
  const [candidateLevel, setCandidateLevel] = useState<CandidateLevel>('senior');
  const [resumeText, setResumeText] = useState('');
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [dsaProblemId, setDsaProblemId] = useState('two-sum');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isExtractingFile, setIsExtractingFile] = useState(false);

  const handleResumeChange = (text: string) => {
    setResumeText(text);
    if (text.trim().length > 40) {
      const parsed = resumeParserService.parseText(text);
      setParsedResume(parsed);
    } else {
      setParsedResume(null);
    }
  };

  const handleAutofillFromProfile = () => {
    if (profile.targetRole) setTargetRole(profile.targetRole);
    if (profile.targetCompany) setTargetCompany(profile.targetCompany.split(',')[0].trim());
    if (profile.targetLevel) setCandidateLevel(profile.targetLevel);
    const synthResume = getSynthesizedResumeText();
    if (synthResume) handleResumeChange(synthResume);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsExtractingFile(true);
      try {
        const content = await resumeParserService.extractTextFromFile(file);
        handleResumeChange(content);
      } catch (err) {
        console.error('File extraction error:', err);
      } finally {
        setIsExtractingFile(false);
      }
    }
  };

  const handleLaunch = () => {
    const resolvedRoomCode =
      meetingType === 'ai'
        ? undefined
        : (roomCode.trim().toUpperCase() || Math.random().toString(36).slice(2, 8).toUpperCase());
    const config: InterviewConfig = {
      mode,
      meetingType,
      roomCode: resolvedRoomCode,
      targetRole,
      targetCompany,
      candidateLevel,
      resumeText: resumeText.trim() || undefined,
      jobDescription: jobDescription.trim() || undefined,
      dsaProblemId: mode === 'coding' ? dsaProblemId : undefined,
      provider: settings.activeProvider,
      model:
        settings.activeProvider === 'gemini'
          ? settings.geminiModel
          : settings.activeProvider === 'groq'
            ? settings.groqModel
            : settings.ollamaModel,
      voiceEnabled,
      videoEnabled,
      durationMinutes,
    };

    startSession(config);
  };

  const popularCompanies = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Netflix', 'Apple', 'Stripe', 'Uber', 'OpenAI'];

  const tracks = [
    { id: 'coding', label: 'Coding & DSA', icon: Code, desc: 'Monaco editor + test suite' },
    { id: 'behavioral', label: 'Behavioral', icon: Users, desc: 'STAR method & leadership' },
    { id: 'system_design', label: 'System Design', icon: Layers, desc: 'Architecture whiteboard' },
    { id: 'full_mock', label: 'Full Loop', icon: Award, desc: 'Mixed technical & behavioral' },
  ] as const;

  const selectedTrackLabel = tracks.find((t) => t.id === mode)?.label ?? 'Coding & DSA';
  const selectedProblem = DSA_PROBLEMS.find((p) => p.id === dsaProblemId);
  const isMissingApiKey =
    (settings.activeProvider === 'gemini' && !aiService.getGeminiApiKey()) ||
    (settings.activeProvider === 'groq' && !aiService.getGroqApiKey());

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-10 lg:py-8 select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Desktop Header + Profile Autofill Strip */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 pb-6 border-b border-gray-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                <Sliders className="w-3 h-3" />
                Session Studio
              </span>
            </div>
            <h1 className="text-2xl lg:text-[26px] font-bold text-white tracking-tight">
              Configure Your Mock Interview
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl">
              Calibrate company expectations, choose your assessment track, and ground the session with your resume.
            </p>
          </div>

          {/* Compact Profile Autofill Card */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-500/30 shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5 truncate">
                  <span className="text-gray-400 font-normal">Profile:</span>
                  <span className="text-blue-300 truncate">{profile.fullName}</span>
                </h4>
                <p className="text-[11px] text-gray-400 truncate">
                  {profile.targetRole} • {profile.experience.length} Exp • {profile.education.length} Edu
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAutofillFromProfile}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition shadow-sm cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autofill</span>
            </button>
          </div>
        </div>

        {/* Main Two-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT WORKSPACE: Primary Configuration (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 01: Format & Track */}
            <section className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 space-y-6">
              {/* Session Format */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700/70">
                    01
                  </span>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                    Interview Format
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: 'ai' as const, label: 'AI Interview', desc: 'Practice solo with the AI interviewer' },
                    { id: 'one_to_one' as const, label: 'One-to-One', desc: 'Invite a peer or live interviewer' },
                    { id: 'room' as const, label: 'Interview Room', desc: 'Create or join a shared room' },
                  ].map((type) => {
                    const active = meetingType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setMeetingType(type.id)}
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${active
                            ? 'bg-blue-600/15 border-blue-500 shadow-sm shadow-blue-500/10'
                            : 'bg-gray-900/70 border-gray-800 hover:border-gray-700'
                          }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{type.label}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{type.desc}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${active ? 'border-blue-400 bg-blue-500/20' : 'border-gray-700'
                            }`}
                        >
                          {active && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {meetingType !== 'ai' && (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-950/70 border border-gray-800">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) =>
                        setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))
                      }
                      placeholder={
                        meetingType === 'room'
                          ? 'Enter room code or leave blank to auto-create'
                          : 'Invite room code (optional)'
                      }
                      className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono tracking-wider text-white uppercase focus:outline-none focus:border-blue-500"
                    />
                    {meetingType === 'room' && (
                      <button
                        type="button"
                        onClick={() => setRoomCode(Math.random().toString(36).slice(2, 8).toUpperCase())}
                        className="px-3.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-medium text-gray-200 hover:text-white transition cursor-pointer shrink-0"
                      >
                        Generate Code
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-800/80" />

              {/* Track Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700/70">
                    02
                  </span>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                    Assessment Track
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {tracks.map((track) => {
                    const Icon = track.icon;
                    const isSelected = mode === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => setMode(track.id as InterviewMode)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${isSelected
                            ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10'
                            : 'bg-gray-900/70 border-gray-800 hover:border-gray-700'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isSelected
                                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                                : 'bg-gray-800/80 border-gray-700/60 text-gray-400'
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{track.label}</h3>
                          <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{track.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Conditional DSA Problem Picker */}
                {mode === 'coding' && (
                  <div className="pt-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-blue-400" />
                        <span>Coding Problem ({DSA_PROBLEMS.length} Curated)</span>
                      </label>
                      {selectedProblem && (
                        <span className="text-[11px] text-gray-400">
                          Selected: <strong className="text-gray-200">{selectedProblem.title}</strong>
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {DSA_PROBLEMS.map((prob) => (
                        <div
                          key={prob.id}
                          onClick={() => setDsaProblemId(prob.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-2 ${dsaProblemId === prob.id
                              ? 'bg-blue-600/15 border-blue-500 text-white'
                              : 'bg-gray-900/80 border-gray-800 text-gray-300 hover:border-gray-700'
                            }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{prob.title}</p>
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">{prob.category}</p>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${prob.difficulty === 'Easy'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : prob.difficulty === 'Medium'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                          >
                            {prob.difficulty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Section 03: Target Calibration */}
            <section className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 space-y-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700/70">
                  03
                </span>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Company & Role Calibration
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Target Company */}
                <div className="space-y-2.5">
                  <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    <span>Target Company</span>
                  </label>
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Google, Amazon, OpenAI"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {popularCompanies.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTargetCompany(c)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${targetCompany === c
                            ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 font-medium'
                            : 'bg-gray-900/80 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-white'
                          }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Role & Level */}
                <div className="space-y-2.5">
                  <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    <span>Target Role & Seniority</span>
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition"
                  />
                  <div className="grid grid-cols-4 gap-2 pt-0.5">
                    {[
                      { id: 'entry', label: 'Entry' },
                      { id: 'mid', label: 'Mid' },
                      { id: 'senior', label: 'Senior' },
                      { id: 'staff_principal', label: 'Staff' },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setCandidateLevel(lvl.id as any)}
                        className={`text-xs py-1.5 rounded-lg border font-medium transition cursor-pointer ${candidateLevel === lvl.id
                            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                            : 'bg-gray-900/80 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-white'
                          }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 04: Resume & Context */}
            <section className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700/70">
                    04
                  </span>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span>Resume & Projects (Optional)</span>
                  </label>
                </div>

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-800 border border-gray-700/80 text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isExtractingFile ? 'Extracting...' : 'Upload PDF / TXT / MD'}</span>
                  <input
                    type="file"
                    accept=".txt,.md,.pdf,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                value={resumeText}
                onChange={(e) => handleResumeChange(e.target.value)}
                rows={4}
                placeholder="Paste your resume summary, tech stack, and key projects here so the AI interviewer can ask questions directly about your past experience..."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 font-mono leading-relaxed resize-none transition"
              />

              {parsedResume && parsedResume.detectedSkills.length > 0 && (
                <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-blue-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Resume Insights ({parsedResume.seniorityEstimate} Level)</span>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {parsedResume.detectedSkills.length} skills identified
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedResume.detectedSkills.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {parsedResume.keyProjects.length > 0 && (
                    <div className="pt-2 text-xs text-gray-400 border-t border-blue-900/30">
                      <span className="font-semibold text-gray-300">Detected Highlight: </span>
                      {parsedResume.keyProjects[0]}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT SIDEBAR: Hardware Controls, Summary & Launch (4 Cols) */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-8">
            {/* Environment & Devices Card */}
            <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Environment & Devices
              </h2>

              <div className="space-y-2.5">
                {/* Voice Toggle */}
                <div
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${voiceEnabled
                      ? 'bg-blue-600/10 border-blue-500/40 text-blue-400'
                      : 'bg-gray-900/80 border-gray-800 text-gray-500 hover:border-gray-700'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${voiceEnabled ? 'bg-blue-500/15 text-blue-400' : 'bg-gray-800 text-gray-500'
                        }`}
                    >
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Voice & Speech</p>
                      <p className="text-[11px] text-gray-400">
                        {voiceEnabled ? 'Hands-Free AI Voice' : 'Text Only'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${voiceEnabled
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-gray-800 text-gray-400'
                      }`}
                  >
                    {voiceEnabled ? 'On' : 'Off'}
                  </span>
                </div>

                {/* Camera Toggle */}
                <div
                  onClick={() => setVideoEnabled(!videoEnabled)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${videoEnabled
                      ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400'
                      : 'bg-gray-900/80 border-gray-800 text-gray-500 hover:border-gray-700'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${videoEnabled ? 'bg-indigo-500/15 text-indigo-400' : 'bg-gray-800 text-gray-500'
                        }`}
                    >
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Camera Telemetry</p>
                      <p className="text-[11px] text-gray-400">
                        {videoEnabled ? 'Eye Contact & Posture' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${videoEnabled
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-gray-800 text-gray-400'
                      }`}
                  >
                    {videoEnabled ? 'On' : 'Off'}
                  </span>
                </div>

                {/* Duration Selector */}
                <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Session Duration</p>
                      <p className="text-[11px] text-gray-400">{durationMinutes} Minutes</p>
                    </div>
                  </div>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="bg-gray-800 border border-gray-700 text-xs font-medium text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Session Summary & Launch Card */}
            <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Session Blueprint
              </h2>

              <dl className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-gray-800/80">
                  <dt className="text-gray-400">Track</dt>
                  <dd className="font-semibold text-white">{selectedTrackLabel}</dd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-800/80">
                  <dt className="text-gray-400">Company</dt>
                  <dd className="font-semibold text-white truncate max-w-[180px]">
                    {targetCompany || 'General'}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-800/80">
                  <dt className="text-gray-400">Role</dt>
                  <dd className="font-semibold text-white truncate max-w-[180px]">
                    {targetRole || 'Software Engineer'}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-800/80">
                  <dt className="text-gray-400">Resume Context</dt>
                  <dd className="font-medium text-gray-300">
                    {resumeText.trim() ? 'Attached' : 'None'}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <dt className="text-gray-400">AI Engine</dt>
                  <dd className="font-mono text-[11px] text-blue-300 uppercase">
                    {settings.activeProvider}
                  </dd>
                </div>
              </dl>

              {/* Key Missing Alert */}
              {isMissingApiKey && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs text-amber-300">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>
                      {settings.activeProvider === 'gemini' ? 'Google Gemini' : 'Groq'} API key is not configured.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="underline font-semibold hover:text-white cursor-pointer block pl-6"
                  >
                    Configure in Settings &rarr;
                  </button>
                </div>
              )}

              {/* Primary Launch CTA */}
              <button
                onClick={handleLaunch}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Launch Interview Room</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};