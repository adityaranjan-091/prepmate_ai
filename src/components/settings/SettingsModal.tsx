import React, { useState, useEffect } from 'react';
import {
  Save,
  Cpu,
  Volume2,
  Check,
  AlertCircle,
  Server,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  Sliders,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';
import { AIProvider } from '../../types/interview';
import { DEFAULT_OLLAMA_MODEL } from '../../types/settings';
import { speechService } from '../../services/speechService';

export const SettingsModal: React.FC = () => {
  const { settings, updateSettings, aiService } = useInterviewStore();

  const [form, setForm] = useState(settings);
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'checking' | 'connected' | 'failed'>('idle');
  const [ollamaMessage, setOllamaMessage] = useState('');
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
    setOllamaMessage('');
    try {
      const res = await fetch(`${form.ollamaBaseUrl}/api/tags`);
      if (res.ok) {
        const data = (await res.json()) as { models?: Array<{ name?: string }> };
        const modelName = form.ollamaModel.trim() || DEFAULT_OLLAMA_MODEL;
        const modelInstalled = data.models?.some((model) => model.name === modelName);
        setOllamaStatus(modelInstalled ? 'connected' : 'failed');
        setOllamaMessage(
          modelInstalled
            ? `${modelName} is installed and ready.`
            : `${modelName} was not found. Run "ollama pull ${modelName}" first.`
        );
      } else {
        setOllamaStatus('failed');
        setOllamaMessage(`Ollama returned HTTP ${res.status}.`);
      }
    } catch {
      setOllamaStatus('failed');
      setOllamaMessage('Cannot reach Ollama. Make sure it is running locally.');
    }
  };

  const handleSave = () => {
    updateSettings(form);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const providerLabels: Record<string, string> = {
    gemini: 'Google Gemini',
    groq: 'Groq (Llama 3.3)',
    ollama: 'Ollama (Local)',
  };

  const personaLabels: Record<string, string> = {
    friendly: 'Friendly & Supportive',
    balanced: 'Balanced Tech',
    rigorous_faang: 'FAANG Bar Raiser',
    stress_test: 'Stress Test',
  };

  const activeModelDisplay =
    form.activeProvider === 'gemini'
      ? form.geminiModel
      : form.activeProvider === 'groq'
        ? form.groqModel || 'llama-3.3-70b'
        : form.ollamaModel || DEFAULT_OLLAMA_MODEL;

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth px-6 py-7 lg:px-10 lg:py-8 select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Desktop Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-800/80">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold uppercase tracking-wider text-blue-400">
              <Sliders className="w-3 h-3" />
              <span>System Preferences</span>
            </div>
            <h1 className="text-2xl lg:text-[26px] font-bold text-white tracking-tight">
              Application Settings
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Configure AI models, API keys, local Ollama fallback, and voice/video preferences.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {savedAlert && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-semibold transition shadow-lg shadow-blue-600/25 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>

        {/* Main Two-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT WORKSPACE: Settings Sections (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 01: AI Provider & Hybrid Routing */}
            <section className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700/70">
                    01
                  </span>
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-white">
                    AI Engine &amp; Cloud/Local Hybrid
                  </h2>
                </div>
                <span className="text-[11px] text-gray-400 font-mono">
                  Select your primary engine
                </span>
              </div>

              {/* Provider Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'gemini', name: 'Google Gemini', desc: 'Fast, multimodal, free tier' },
                  { id: 'groq', name: 'Groq (Llama 3.3)', desc: 'Ultra low-latency speech' },
                  { id: 'ollama', name: 'Ollama (Local)', desc: '100% offline & private' },
                ].map((p) => {
                  const isActive = form.activeProvider === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setForm({ ...form, activeProvider: p.id as AIProvider })}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between ${isActive
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm shadow-blue-500/10'
                          : 'bg-gray-950/90 border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-white">{p.name}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${isActive ? 'border-blue-400 bg-blue-500/20' : 'border-gray-700'
                            }`}
                        >
                          {isActive && <Check className="w-2.5 h-2.5 text-blue-400" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-snug">{p.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Conditional Cloud Provider Config: Gemini */}
              {form.activeProvider === 'gemini' && (
                <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800/90 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
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
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey((prev) => ({ ...prev, gemini: !prev.gemini }))}
                          className="absolute right-3 text-gray-400 hover:text-gray-200 cursor-pointer"
                          title={showKey.gemini ? 'Hide API Key' : 'Show API Key'}
                        >
                          {showKey.gemini ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-300 block">Model</label>
                      <select
                        value={form.geminiModel}
                        onChange={(e) => setForm({ ...form, geminiModel: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="gemini-1.5-flash">
                          Gemini 1.5 Flash (Recommended - Ultra Fast)
                        </option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleTestCloudProvider('gemini')}
                      disabled={testState.gemini?.status === 'testing'}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 cursor-pointer disabled:opacity-50 transition"
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
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>{testState.gemini.message}</span>
                      </span>
                    )}
                    {testState.gemini?.status === 'error' && (
                      <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{testState.gemini.message}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Conditional Cloud Provider Config: Groq */}
              {form.activeProvider === 'groq' && (
                <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800/90 space-y-4">
                  <div className="space-y-1.5 max-w-lg">
                    <label className="text-xs font-medium text-gray-300 block">Groq API Key</label>
                    <div className="relative flex items-center">
                      <input
                        type={showKey.groq ? 'text' : 'password'}
                        value={form.groqApiKey}
                        onChange={(e) => setForm({ ...form, groqApiKey: e.target.value })}
                        placeholder="gsk_..."
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono transition"
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
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 cursor-pointer disabled:opacity-50 transition"
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
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>{testState.groq.message}</span>
                      </span>
                    )}
                    {testState.groq?.status === 'error' && (
                      <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{testState.groq.message}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Local Ollama Configuration (always accessible for fallback) */}
              <div className="p-4 rounded-xl bg-gray-950/90 border border-gray-800/90 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-white">
                      Local Ollama Configuration
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestOllama}
                    disabled={ollamaStatus === 'checking'}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition cursor-pointer disabled:opacity-50"
                  >
                    {ollamaStatus === 'checking'
                      ? 'Pinging...'
                      : ollamaStatus === 'connected'
                        ? 'Connected'
                        : 'Test Ollama Connection'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-medium text-gray-400 block mb-1">
                      Ollama Host URL
                    </label>
                    <input
                      type="text"
                      value={form.ollamaBaseUrl}
                      onChange={(e) => setForm({ ...form, ollamaBaseUrl: e.target.value })}
                      placeholder="http://localhost:11434"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-400 block mb-1">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={form.ollamaModel}
                      onChange={(e) => setForm({ ...form, ollamaModel: e.target.value })}
                      placeholder={DEFAULT_OLLAMA_MODEL}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {ollamaMessage && (
                  <p
                    className={`text-xs flex items-center gap-1.5 ${ollamaStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                  >
                    {ollamaStatus === 'connected' ? (
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{ollamaMessage}</span>
                  </p>
                )}

                <label
                  htmlFor="enableLocalFallback"
                  className="flex items-center gap-2.5 pt-1 text-xs text-gray-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    id="enableLocalFallback"
                    checked={form.enableLocalFallback}
                    onChange={(e) => setForm({ ...form, enableLocalFallback: e.target.checked })}
                    className="rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>
                    Transparent fallback: automatically switch to Ollama if Cloud API is offline
                  </span>
                </label>
              </div>
            </section>

            {/* Section 02: Interviewer Persona & Rigor */}
            <section className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800/80">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700/70">
                  02
                </span>
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-semibold text-white">Interviewer Persona &amp; Rigor</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                  {
                    id: 'friendly',
                    title: 'Friendly & Supportive',
                    desc: 'Encouraging, helps calm nerves',
                  },
                  { id: 'balanced', title: 'Balanced Tech', desc: 'Standard professional bar' },
                  {
                    id: 'rigorous_faang',
                    title: 'FAANG Bar Raiser',
                    desc: 'Probes trade-offs & edge cases',
                  },
                  {
                    id: 'stress_test',
                    title: 'Stress Test',
                    desc: 'Fast-paced, challenges assumptions',
                  },
                ].map((persona) => {
                  const isSelected = form.interviewerPersonality === persona.id;
                  return (
                    <div
                      key={persona.id}
                      onClick={() =>
                        setForm({ ...form, interviewerPersonality: persona.id as any })
                      }
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between ${isSelected
                          ? 'bg-purple-600/15 border-purple-500 text-white shadow-sm shadow-purple-500/10'
                          : 'bg-gray-950/90 border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-white">{persona.title}</p>
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-snug">{persona.desc}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 03: Voice & Audio Preferences */}
            <section className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800/80">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700/70">
                  03
                </span>
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">Voice &amp; Audio Settings</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300 block">
                    Interviewer Voice
                  </label>
                  <select
                    value={form.ttsVoiceName}
                    onChange={(e) => setForm({ ...form, ttsVoiceName: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Default System Natural Voice</option>
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-300">Speech Rate</label>
                    <span className="text-xs font-mono font-semibold text-blue-400 tabular-nums">
                      {form.ttsRate}x
                    </span>
                  </div>
                  <div className="pt-1.5">
                    <input
                      type="range"
                      min="0.8"
                      max="1.4"
                      step="0.05"
                      value={form.ttsRate}
                      onChange={(e) => setForm({ ...form, ttsRate: parseFloat(e.target.value) })}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
                      <span>0.8x</span>
                      <span>1.0x</span>
                      <span>1.4x</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={form.autoSpeakResponse}
                    onChange={(e) => setForm({ ...form, autoSpeakResponse: e.target.checked })}
                    className="mt-0.5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <p className="font-semibold text-white">Speak interviewer responses</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Enable synthesized voice audio output
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={form.handsFreeContinuousMode}
                    onChange={(e) =>
                      setForm({ ...form, handsFreeContinuousMode: e.target.checked })
                    }
                    className="mt-0.5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <p className="font-semibold text-white">Hands-free continuous mode</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Auto-listens after interviewer finishes speaking
                    </p>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR: Active Configuration Summary & Save CTA (4 Cols) */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-8">
            <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Active Engine Blueprint
              </h2>

              <dl className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-800/80">
                  <dt className="text-gray-400">Primary Provider</dt>
                  <dd className="font-semibold text-white">
                    {providerLabels[form.activeProvider] || form.activeProvider}
                  </dd>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-gray-800/80">
                  <dt className="text-gray-400">Active Model</dt>
                  <dd className="font-mono text-[11px] text-blue-300 truncate max-w-[170px]">
                    {activeModelDisplay}
                  </dd>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-gray-800/80">
                  <dt className="text-gray-400">Local Fallback</dt>
                  <dd className="font-medium text-gray-200">
                    {form.enableLocalFallback ? 'Enabled (Ollama)' : 'Disabled'}
                  </dd>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-gray-800/80">
                  <dt className="text-gray-400">Interviewer Bar</dt>
                  <dd className="font-semibold text-purple-300">
                    {personaLabels[form.interviewerPersonality] || form.interviewerPersonality}
                  </dd>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <dt className="text-gray-400">Voice &amp; Pace</dt>
                  <dd className="font-mono text-[11px] text-gray-300 tabular-nums">
                    {form.autoSpeakResponse ? `On (${form.ttsRate}x)` : 'Muted'}
                  </dd>
                </div>
              </dl>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-semibold transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </button>

                {savedAlert && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>All preferences saved!</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};