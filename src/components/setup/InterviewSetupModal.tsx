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
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';
import { InterviewConfig, InterviewMode, CandidateLevel } from '../../types/interview';
import { resumeParserService, ParsedResume } from '../../services/resumeParser';
import { DSA_PROBLEMS } from '../../data/dsaProblems';

export const InterviewSetupModal: React.FC = () => {
  const { startSession, settings } = useInterviewStore();

  const [mode, setMode] = useState<InterviewMode>('coding');
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

  const handleResumeChange = (text: string) => {
    setResumeText(text);
    if (text.length > 50) {
      const parsed = resumeParserService.parseText(text);
      setParsedResume(parsed);
    } else {
      setParsedResume(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        handleResumeChange(content);
      };
      reader.readAsText(file);
    }
  };

  const handleLaunch = () => {
    const config: InterviewConfig = {
      mode,
      targetRole,
      targetCompany,
      candidateLevel,
      resumeText: resumeText.trim() || undefined,
      jobDescription: jobDescription.trim() || undefined,
      dsaProblemId: mode === 'coding' ? dsaProblemId : undefined,
      provider: settings.activeProvider,
      model: settings.activeProvider === 'gemini' ? settings.geminiModel : settings.activeProvider === 'openai' ? settings.openaiModel : settings.ollamaModel,
      voiceEnabled,
      videoEnabled,
      durationMinutes,
    };

    startSession(config);
  };

  const popularCompanies = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Netflix', 'Apple', 'Stripe', 'Uber', 'OpenAI'];

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Configure Your Mock Interview</h1>
        <p className="text-sm text-gray-400">
          Customize company expectations, interview track, and upload your resume for hyper-tailored questions.
        </p>
      </div>

      <div className="space-y-6">
        {/* Track Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            1. Select Track
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'coding', label: 'Coding & DSA', icon: Code, desc: 'Monaco editor + test suite' },
              { id: 'behavioral', label: 'Behavioral', icon: Users, desc: 'STAR method & leadership' },
              { id: 'system_design', label: 'System Design', icon: Layers, desc: 'Scalability & architecture' },
              { id: 'full_mock', label: 'Full Loop', icon: Award, desc: 'Comprehensive simulation' },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = mode === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setMode(t.id as any)}
                  className={`p-4 rounded-xl border cursor-pointer transition text-left space-y-1.5 ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm shadow-blue-500/10'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-gray-500'}`} />
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p className="text-[11px] text-gray-500">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Company & Role */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>Target Company</span>
            </label>
            <input
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              placeholder="e.g. Google, Stripe, Meta"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {popularCompanies.slice(0, 6).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTargetCompany(c)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                    targetCompany === c
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : 'bg-gray-800/80 text-gray-400 border-gray-700/60 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Target Role & Level</span>
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <div className="grid grid-cols-4 gap-1.5 pt-1">
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
                  className={`text-[11px] py-1 rounded-lg border font-medium transition ${
                    candidateLevel === lvl.id
                      ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40'
                      : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-white'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DSA Problem Picker if Coding mode */}
        {mode === 'coding' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5" />
              <span>Select Coding Problem</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {DSA_PROBLEMS.map((prob) => (
                <div
                  key={prob.id}
                  onClick={() => setDsaProblemId(prob.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    dsaProblemId === prob.id
                      ? 'bg-blue-600/15 border-blue-500 text-white'
                      : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{prob.title}</p>
                    <p className="text-xs text-gray-500">{prob.category}</p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      prob.difficulty === 'Easy'
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

        {/* Resume & JD Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Resume & Projects (Optional)</span>
            </label>
            <label className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .txt / .md</span>
              <input type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <textarea
            value={resumeText}
            onChange={(e) => handleResumeChange(e.target.value)}
            rows={4}
            placeholder="Paste your resume summary, tech stack, and key projects here so the AI interviewer can ask questions directly about your past experience..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono leading-relaxed resize-none"
          />

          {parsedResume && parsedResume.detectedSkills.length > 0 && (
            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Detected Resume Profile ({parsedResume.seniorityEstimate}):</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {parsedResume.detectedSkills.map((s) => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Devices & Toggles */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          <div
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
              voiceEnabled ? 'bg-blue-600/10 border-blue-500/40 text-blue-400' : 'bg-gray-900/60 border-gray-800 text-gray-500'
            }`}
          >
            <Mic className="w-4 h-4" />
            <div>
              <p className="text-xs font-semibold text-white">Voice & Speech</p>
              <p className="text-[10px] text-gray-400">{voiceEnabled ? 'Hands-Free AI Voice' : 'Text Only'}</p>
            </div>
          </div>

          <div
            onClick={() => setVideoEnabled(!videoEnabled)}
            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
              videoEnabled ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400' : 'bg-gray-900/60 border-gray-800 text-gray-500'
            }`}
          >
            <Camera className="w-4 h-4" />
            <div>
              <p className="text-xs font-semibold text-white">Camera Telemetry</p>
              <p className="text-[10px] text-gray-400">{videoEnabled ? 'Eye Contact & Posture' : 'Disabled'}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Duration</p>
              <p className="text-[10px] text-gray-400">{durationMinutes} Minutes</p>
            </div>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
            </select>
          </div>
        </div>

        {/* Launch Button */}
        <div className="pt-4">
          <button
            onClick={handleLaunch}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Interview Room</span>
          </button>
        </div>
      </div>
    </div>
  );
};

