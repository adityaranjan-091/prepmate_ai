import React, { useState, useEffect } from 'react';
import {
  Save,
  Cpu,
  Volume2,
  Camera,
  Check,
  AlertCircle,
  HelpCircle,
  Key,
  Server,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';
import { AIProvider } from '../../types/interview';
import { speechService } from '../../services/speechService';

export const SettingsModal: React.FC = () => {
  const { settings, updateSettings, aiService } = useInterviewStore();

  const [form, setForm] = useState(settings);
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'checking' | 'connected' | 'failed'>('idle');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [savedAlert, setSavedAlert] = useState(false);
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});
  const [testState, setTestState] = useState<{
    [key: string]: { status: 'idle' | 'testing' | 'success' | 'error'; message?: string };
  }>({});

  useEffect(() => {
    setVoices(speechService.getVoices());
  }, []);

  const handleTestCloudProvider = async (provider: AIProvider) => {
    setTestState((prev) => ({ ...prev, [provider]: { status: 'testing' } }));
    aiService.updateSettings(form);
    const res = await aiService.testConnection(provider);
    if (res.ok) {
      setTestState((prev) => ({
        ...prev,
        [provider]: { status: 'success', message: res.message },
      }));
    } else {
      setTestState((prev) => ({
        ...prev,
        [provider]: { status: 'error', message: res.message },
      }));
    }
  };

  const handleTestOllama = async () => {
    setOllamaStatus('checking');
    try {
      const res = await fetch(`${form.ollamaBaseUrl}/api/tags`);
      if (res.ok) {
        setOllamaStatus('connected');
      } else {
        setOllamaStatus('failed');
      }
    } catch {
      setOllamaStatus('failed');
    }
  };

  const handleSave = () => {
    updateSettings(form);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Application Settings</h1>
          <p className="text-xs text-gray-400">
            Configure AI models, API keys, local Ollama fallback, and voice/video preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedAlert && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-pulse">
              <Check className="w-4 h-4" />
              <span>Saved!</span>
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-md shadow-blue-600/30 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* AI Provider Section */}
        <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400">
              <Cpu className="w-5 h-5" />
              <h2 className="text-sm font-semibold text-white">AI Engine & Cloud/Local Hybrid</h2>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Select your primary engine</span>
          </div>

          {/* Provider selector radio cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'gemini', name: 'Google Gemini', desc: 'Fast, multimodal, free tier' },
              { id: 'openai', name: 'OpenAI GPT-4o', desc: 'Industry standard reasoning' },
              { id: 'groq', name: 'Groq (Llama 3.3)', desc: 'Ultra low-latency speech' },
              { id: 'ollama', name: 'Ollama (Local)', desc: '100% offline & private' },
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setForm({ ...form, activeProvider: p.id as AIProvider })}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  form.activeProvider === p.id
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">{p.name}</span>
                  {form.activeProvider === p.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <p className="text-[11px] text-gray-500">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Conditional Inputs */}
          {form.activeProvider === 'gemini' && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-300 flex items-center justify-between">
                  <span>Google Gemini API Key</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Get free key &rarr;
                  </a>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showKey.gemini ? 'text' : 'password'}
                    value={form.geminiApiKey}
                    onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((prev) => ({ ...prev, gemini: !prev.gemini }))}
                    className="absolute right-3 text-gray-400 hover:text-gray-200 cursor-pointer"
                    title={showKey.gemini ? 'Hide API Key' : 'Show API Key'}
                  >
                    {showKey.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-300">Model</label>
                <select
                  value={form.geminiModel}
                  onChange={(e) => setForm({ ...form, geminiModel: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended - Ultra Fast)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleTestCloudProvider('gemini')}
                  disabled={testState.gemini?.status === 'testing'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 cursor-pointer disabled:opacity-50 transition"
                >
                  {testState.gemini?.status === 'testing' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                      <span>Testing Gemini Key...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>Test Gemini Connection</span>
                    </>
                  )}
                </button>

                {testState.gemini?.status === 'success' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>{testState.gemini.message}</span>
                  </span>
                )}
                {testState.gemini?.status === 'error' && (
                  <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{testState.gemini.message}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {form.activeProvider === 'openai' && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-300">OpenAI API Key</label>
                <div className="relative flex items-center">
                  <input
                    type={showKey.openai ? 'text' : 'password'}
                    value={form.openaiApiKey}
                    onChange={(e) => setForm({ ...form, openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((prev) => ({ ...prev, openai: !prev.openai }))}
                    className="absolute right-3 text-gray-400 hover:text-gray-200 cursor-pointer"
                  >
                    {showKey.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-300">Model</label>
                <select
                  value={form.openaiModel}
                  onChange={(e) => setForm({ ...form, openaiModel: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost Effective)</option>
                  <option value="gpt-4o">GPT-4o (Flagship Multimodal)</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleTestCloudProvider('openai')}
                  disabled={testState.openai?.status === 'testing'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 cursor-pointer disabled:opacity-50 transition"
                >
                  {testState.openai?.status === 'testing' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                      <span>Testing OpenAI Key...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>Test OpenAI Connection</span>
                    </>
                  )}
                </button>

                {testState.openai?.status === 'success' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>{testState.openai.message}</span>
                  </span>
                )}
                {testState.openai?.status === 'error' && (
                  <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{testState.openai.message}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {form.activeProvider === 'groq' && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-300">Groq API Key</label>
                <div className="relative flex items-center">
                  <input
                    type={showKey.groq ? 'text' : 'password'}
                    value={form.groqApiKey}
                    onChange={(e) => setForm({ ...form, groqApiKey: e.target.value })}
                    placeholder="gsk_..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((prev) => ({ ...prev, groq: !prev.groq }))}
                    className="absolute right-3 text-gray-400 hover:text-gray-200 cursor-pointer"
                  >
                    {showKey.groq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleTestCloudProvider('groq')}
                  disabled={testState.groq?.status === 'testing'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 cursor-pointer disabled:opacity-50 transition"
                >
                  {testState.groq?.status === 'testing' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                      <span>Testing Groq Key...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>Test Groq Connection</span>
                    </>
                  )}
                </button>

                {testState.groq?.status === 'success' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>{testState.groq.message}</span>
                  </span>
                )}
                {testState.groq?.status === 'error' && (
                  <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{testState.groq.message}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Ollama Configuration (always accessible for fallback) */}
          <div className="p-4 rounded-xl bg-gray-950 border border-gray-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-white">Local Ollama Configuration</span>
              </div>
              <button
                type="button"
                onClick={handleTestOllama}
                disabled={ollamaStatus === 'checking'}
                className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
              >
                {ollamaStatus === 'checking'
                  ? 'Pinging...'
                  : ollamaStatus === 'connected'
                  ? 'Connected'
                  : 'Test Ollama Connection'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Ollama Host URL</label>
                <input
                  type="text"
                  value={form.ollamaBaseUrl}
                  onChange={(e) => setForm({ ...form, ollamaBaseUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Model Name</label>
                <input
                  type="text"
                  value={form.ollamaModel}
                  onChange={(e) => setForm({ ...form, ollamaModel: e.target.value })}
                  placeholder="llama3.2, deepseek-r1, qwen2.5-coder"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="enableLocalFallback"
                checked={form.enableLocalFallback}
                onChange={(e) => setForm({ ...form, enableLocalFallback: e.target.checked })}
                className="rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-0"
              />
              <label htmlFor="enableLocalFallback" className="text-xs text-gray-300">
                Transparent fallback: automatically switch to Ollama if Cloud API is offline
              </label>
            </div>
          </div>
        </div>

        {/* Voice & Speech Preferences */}
        <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <Volume2 className="w-5 h-5" />
            <h2 className="text-sm font-semibold text-white">Voice & Audio Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-300">Interviewer Voice</label>
              <select
                value={form.ttsVoiceName}
                onChange={(e) => setForm({ ...form, ttsVoiceName: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">Default System Natural Voice</option>
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-300">Speech Rate ({form.ttsRate}x)</label>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={form.ttsRate}
                onChange={(e) => setForm({ ...form, ttsRate: parseFloat(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoSpeakResponse}
                onChange={(e) => setForm({ ...form, autoSpeakResponse: e.target.checked })}
                className="rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-0"
              />
              <span>Speak interviewer responses aloud (Audio output)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.handsFreeContinuousMode}
                onChange={(e) => setForm({ ...form, handsFreeContinuousMode: e.target.checked })}
                className="rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-0"
              />
              <span>Hands-free continuous conversation mode (auto-listens after interviewer finishes)</span>
            </label>
          </div>
        </div>

        {/* Interviewer Persona */}
        <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-3">
          <div className="flex items-center gap-2 text-purple-400">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-sm font-semibold text-white">Interviewer Persona & Rigor</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'friendly', title: 'Friendly & Supportive', desc: 'Encouraging, helps calm nerves' },
              { id: 'balanced', title: 'Balanced Tech', desc: 'Standard professional bar' },
              { id: 'rigorous_faang', title: 'FAANG Bar Raiser', desc: 'Probes trade-offs & edge cases' },
              { id: 'stress_test', title: 'Stress Test', desc: 'Fast-paced, challenges assumptions' },
            ].map((persona) => (
              <div
                key={persona.id}
                onClick={() => setForm({ ...form, interviewerPersonality: persona.id as any })}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  form.interviewerPersonality === persona.id
                    ? 'bg-purple-600/15 border-purple-500 text-white'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <p className="text-xs font-semibold text-white mb-0.5">{persona.title}</p>
                <p className="text-[10px] text-gray-500">{persona.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

