import React, { useState } from 'react';
import {
  Cpu,
  ShieldCheck,
  Command,
  Sliders,
  Sparkles,
  HelpCircle,
  X,
  Keyboard,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';

export const Footer: React.FC = () => {
  const { settings, currentSession, activeTab, setActiveTab } = useInterviewStore();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const isSessionLive = currentSession?.status === 'in_progress';

  return (
    <>
      <footer className="h-7 shrink-0 px-4 flex items-center justify-between border-t border-gray-800/80 bg-gray-950/90 text-[11px] text-gray-400 select-none backdrop-blur z-20">
        {/* Left: Engine & Environment Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 font-medium text-gray-300">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="truncate">Prepmate AI v1.0</span>
          </div>

          <div className="h-3 w-px bg-gray-800 hidden sm:block" />

          {/* Active AI Provider */}
          <div
            className="hidden sm:flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition cursor-pointer"
            onClick={() => setActiveTab('settings')}
            title="Click to manage AI provider"
          >
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span className="capitalize">{settings.activeProvider}</span>
            <span className="text-[10px] text-gray-600 font-mono">
              ({settings.activeProvider === 'gemini' ? settings.geminiModel : settings.activeProvider === 'groq' ? settings.groqModel : settings.ollamaModel})
            </span>
          </div>

          <div className="h-3 w-px bg-gray-800 hidden md:block" />

          {/* Privacy & Storage */}
          <div className="hidden md:flex items-center gap-1 text-gray-500" title="Sessions and transcripts are stored in your local browser/device storage">
            <ShieldCheck className="w-3 h-3 text-emerald-500/80" />
            <span>Local Storage</span>
          </div>
        </div>

        {/* Center: Contextual Activity Hint */}
        <div className="hidden lg:flex items-center gap-2 text-gray-500">
          {activeTab === 'interview' && (
            <span className="flex items-center gap-1 text-blue-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span>Session active</span>
            </span>
          )}
          {activeTab === 'interview' && (
            <>
              <span className="text-gray-700">•</span>
              <span><kbd className="px-1 py-0.2 rounded bg-gray-900 border border-gray-800 text-[10px] text-gray-400 font-mono">Ctrl+Enter</kbd> runs test cases</span>
            </>
          )}
          {activeTab === 'dashboard' && (
            <span>Ready for your next mock interview round</span>
          )}
        </div>

        {/* Right: Quick Tools & About */}
        <div className="flex items-center gap-3">
          {/* Shortcuts trigger */}
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-200 transition cursor-pointer"
            title="Keyboard Shortcuts"
          >
            <Command className="w-3 h-3 text-gray-400" />
            <span className="hidden sm:inline">Shortcuts</span>
          </button>

          <div className="h-3 w-px bg-gray-800" />

          {/* Settings button */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-200 transition cursor-pointer"
            title="Settings & Keys"
          >
            <Sliders className="w-3 h-3 text-gray-400" />
            <span className="hidden sm:inline">Config</span>
          </button>

          <div className="h-3 w-px bg-gray-800" />

          {/* About trigger */}
          <button
            type="button"
            onClick={() => setShowAboutModal(true)}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-200 transition cursor-pointer"
            title="About Prepmate AI"
          >
            <HelpCircle className="w-3 h-3 text-gray-400" />
            <span className="hidden sm:inline">About</span>
          </button>
        </div>
      </footer>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-800/60">
                <span className="text-gray-300">Run code tests</span>
                <kbd className="px-2 py-0.5 rounded bg-gray-950 border border-gray-800 font-mono text-blue-300">Ctrl + Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-800/60">
                <span className="text-gray-300">Send chat answer</span>
                <kbd className="px-2 py-0.5 rounded bg-gray-950 border border-gray-800 font-mono text-gray-300">Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-800/60">
                <span className="text-gray-300">Multiline chat input</span>
                <kbd className="px-2 py-0.5 rounded bg-gray-950 border border-gray-800 font-mono text-gray-300">Shift + Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-gray-300">Toggle AI speech</span>
                <kbd className="px-2 py-0.5 rounded bg-gray-950 border border-gray-800 font-mono text-gray-300">M</kbd>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* About & Privacy Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 grid place-items-center text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Prepmate AI Studio</h3>
                  <p className="text-[10px] text-gray-500">Desktop Technical &amp; Behavioral Preparation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <p>
                <strong>Prepmate AI</strong> is an open desktop preparation workspace powered by Tauri, React, and Monaco Editor.
              </p>

              <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 space-y-1.5 text-[11px]">
                <p className="font-semibold text-gray-200">System Architecture &amp; Data Privacy:</p>
                <ul className="space-y-1 list-disc pl-4 text-gray-400">
                  <li>API calls connect directly to your configured provider (Google Gemini, Groq, or local Ollama).</li>
                  <li>Video telemetry (eye contact, posture heuristics) executes client-side on your device.</li>
                  <li>Interview sessions and code history are saved locally in your browser storage.</li>
                </ul>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                <span>Version 1.0.0</span>
                <span>Powered by Tauri 2.0 &amp; Vite</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAboutModal(false)}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-blue-600/20"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
