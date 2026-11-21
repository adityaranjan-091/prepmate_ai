import React, { useState, useEffect } from 'react';
import {
  Cpu,
  ShieldCheck,
  Command,
  Sliders,
  Sparkles,
  HelpCircle,
  X,
  Keyboard,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';

interface ShortcutItem {
  label: string;
  keys: string[];
  highlight?: boolean;
}

const SHORTCUT_GROUPS: { title: string; items: ShortcutItem[] }[] = [
  {
    title: 'Code & Execution',
    items: [
      { label: 'Run code tests', keys: ['Ctrl', 'Enter'], highlight: true },
    ],
  },
  {
    title: 'Interview & Communication',
    items: [
      { label: 'Send chat answer', keys: ['Enter'] },
      { label: 'Multiline chat input', keys: ['Shift', 'Enter'] },
      { label: 'Toggle AI voice / speech', keys: ['M'] },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { label: 'Keyboard shortcuts', keys: ['Ctrl', '/'] },
      { label: 'Close active dialog', keys: ['Esc'] },
    ],
  },
];

export const Footer: React.FC = () => {
  const { settings, currentSession, activeTab, setActiveTab } = useInterviewStore();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const isSessionLive = currentSession?.status === 'in_progress';

  const activeModel =
    settings.activeProvider === 'gemini'
      ? settings.geminiModel
      : settings.activeProvider === 'groq'
        ? settings.groqModel
        : settings.ollamaModel;

  // Global keyboard support: Escape to close modals, Ctrl+/ to toggle shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showShortcutsModal) setShowShortcutsModal(false);
        if (showAboutModal) setShowAboutModal(false);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowAboutModal(false);
        setShowShortcutsModal((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcutsModal, showAboutModal]);

  return (
    <>
      <footer
        role="contentinfo"
        className="h-7 shrink-0 px-3 flex items-center justify-between border-t border-gray-800/80 bg-gray-950/90 text-[11px] text-gray-400 select-none backdrop-blur-md z-20"
      >
        {/* Left: Engine & Environment Status */}
        <div className="flex items-center gap-2 min-w-0">
          {/* App Status */}
          <div
            className="flex items-center gap-1.5 px-1.5 py-0.5 font-medium text-gray-300"
            title="Prepmate AI Engine Ready"
          >
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="truncate tracking-tight">Prepmate AI</span>
            <span className="text-[10px] text-gray-600 font-mono">v1.0</span>
          </div>

          <div className="h-3 w-px bg-gray-800 hidden sm:block" />

          {/* Active AI Provider */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="hidden sm:flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-gray-900 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            title="Manage AI provider & model"
          >
            <Cpu className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="capitalize font-medium text-gray-300">
              {settings.activeProvider}
            </span>
            {activeModel && (
              <span className="text-[10px] text-gray-500 font-mono truncate max-w-[140px]">
                {activeModel}
              </span>
            )}
          </button>

          <div className="h-3 w-px bg-gray-800 hidden md:block" />

          {/* Privacy & Storage */}
          <div
            className="hidden md:flex items-center gap-1 px-1.5 py-0.5 text-gray-500"
            title="Sessions and transcripts are stored locally on your device"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-500/80 shrink-0" />
            <span>Local-First</span>
          </div>
        </div>

        {/* Center: Contextual Activity Hint */}
        <div className="hidden lg:flex items-center gap-2 text-gray-500">
          {activeTab === 'interview' && (
            <>
              {isSessionLive ? (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-medium">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>Live Interview</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  <span>Interview Standby</span>
                </span>
              )}

              <span className="text-gray-800">•</span>

              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.2 rounded bg-gray-900 border border-gray-800 text-[10px] text-gray-300 font-mono shadow-inner">
                  Ctrl+Enter
                </kbd>
                <span>to run tests</span>
              </span>
            </>
          )}

          {activeTab === 'dashboard' && (
            <span className="flex items-center gap-1.5 text-gray-500">
              <CheckCircle2 className="w-3 h-3 text-emerald-500/70" />
              <span>Ready for your next mock interview round</span>
            </span>
          )}

          {activeTab === 'settings' && (
            <span className="text-gray-500">
              Changes to provider keys apply immediately to new sessions
            </span>
          )}
        </div>

        {/* Right: Quick Tools & About */}
        <div className="flex items-center gap-1">
          {/* Shortcuts trigger */}
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-gray-900 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            title="Keyboard Shortcuts (Ctrl + /)"
          >
            <Command className="w-3 h-3 text-gray-400" />
            <span className="hidden sm:inline">Shortcuts</span>
          </button>

          <div className="h-3 w-px bg-gray-800 mx-0.5" />

          {/* Settings button */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-gray-800/90 text-blue-400 font-medium'
                : 'hover:bg-gray-900 text-gray-400 hover:text-gray-200'
            }`}
            title="Settings & API Keys"
          >
            <Sliders
              className={`w-3 h-3 ${
                activeTab === 'settings' ? 'text-blue-400' : 'text-gray-400'
              }`}
            />
            <span className="hidden sm:inline">Config</span>
          </button>

          <div className="h-3 w-px bg-gray-800 mx-0.5" />

          {/* About trigger */}
          <button
            type="button"
            onClick={() => setShowAboutModal(true)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-gray-900 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            title="About Prepmate AI"
          >
            <HelpCircle className="w-3 h-3 text-gray-400" />
            <span className="hidden sm:inline">About</span>
          </button>
        </div>
      </footer>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-modal-title"
          onClick={() => setShowShortcutsModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 grid place-items-center">
                  <Keyboard className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <h3
                  id="shortcuts-modal-title"
                  className="text-sm font-semibold text-white"
                >
                  Keyboard Shortcuts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                aria-label="Close shortcuts dialog"
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.title} className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    {group.title}
                  </p>
                  <div className="rounded-xl bg-gray-950/70 border border-gray-800/80 divide-y divide-gray-800/60">
                    {group.items.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between px-3 py-2"
                      >
                        <span className="text-gray-300">{item.label}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((key, idx) => (
                            <React.Fragment key={key}>
                              {idx > 0 && (
                                <span className="text-gray-600 text-[10px]">+</span>
                              )}
                              <kbd
                                className={`px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 font-mono text-[11px] ${
                                  item.highlight ? 'text-blue-300' : 'text-gray-300'
                                }`}
                              >
                                {key}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* About & Privacy Modal */}
      {showAboutModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-modal-title"
          onClick={() => setShowAboutModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 grid place-items-center text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    id="about-modal-title"
                    className="text-sm font-bold text-white"
                  >
                    Prepmate AI Studio
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Desktop Technical &amp; Behavioral Preparation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                aria-label="Close about dialog"
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <p>
                <strong className="text-white">Prepmate AI</strong> is an open desktop
                preparation workspace powered by Tauri, React, and Monaco Editor.
              </p>

              <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 space-y-2 text-[11px]">
                <div className="flex items-center gap-1.5 font-semibold text-gray-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>System Architecture &amp; Data Privacy</span>
                </div>
                <ul className="space-y-1.5 list-disc pl-4 text-gray-400">
                  <li>
                    API calls connect directly to your configured provider (Google
                    Gemini, Groq, or local Ollama).
                  </li>
                  <li>
                    Video telemetry (eye contact, posture heuristics) executes
                    client-side on your device.
                  </li>
                  <li>
                    Interview sessions and code history are saved locally in your
                    browser storage.
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                <span className="font-mono">v1.0.0</span>
                <span>Powered by Tauri 2.0 &amp; Vite</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAboutModal(false)}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-blue-600/20"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};