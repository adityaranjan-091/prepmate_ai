import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Code2,
  Mic,
  Award,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const LoginPage: React.FC = () => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    error,
    clearError,
  } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);
    setResetSent(false);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
      } else if (mode === 'forgot') {
        await sendPasswordReset(email);
        setResetSent(true);
      }
    } catch {
      // Error is stored in authStore
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error is handled in authStore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-950 relative overflow-hidden select-none flex items-center justify-center">
      {/* Ambient Background Gradients */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-indigo-600/10 rounded-full blur-3xl" />

      {/* Main Split Desktop Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-center">
        {/* LEFT PANE: Desktop Brand & Product Showcase */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between space-y-8 pr-4">
          {/* Top Brand Lockup */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-blue-500/30 blur-md" />
                <div className="relative grid place-items-center w-11 h-11 rounded-xl bg-gray-900/80 shadow-lg shadow-blue-500/20 ring-1 ring-white/15 overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Prepmate project logo"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">Prepmate</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  AI Studio
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl xl:text-4xl font-bold tracking-tight text-white leading-[1.15]">
                Practice High-Stakes Tech Interviews with Real-Time AI Calibration.
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xl">
                Step into a realistic coding, system design, and behavioral studio tailored to your
                resume and target engineering bar.
              </p>
            </div>
          </div>

          {/* Feature Highlights Stack */}
          <div className="space-y-3 max-w-xl">
            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800/80 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Live Coding & Socratic Guidance</h3>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  Solve curated DSA problems in an integrated editor with instant test execution and
                  complexity critiques.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800/80 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Voice-to-Voice & STAR Breakdown</h3>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  Natural conversational pacing with structured behavioral feedback, filler-word
                  detection, and delivery metrics.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800/80 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Role & Company Scorecards</h3>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  Track readiness across sessions with actionable hiring-committee style evaluations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Auth Card */}
        <div className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-gray-900/90 border border-gray-800/90 rounded-2xl shadow-2xl backdrop-blur-xl p-7 sm:p-8">
            {/* Mobile / Compact Brand Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-3 lg:hidden">
                <div className="absolute inset-0 rounded-2xl bg-blue-500/30 blur-lg" />
                <div className="relative grid place-items-center w-13 h-13 rounded-2xl bg-gray-900/60 shadow-xl shadow-blue-500/30 ring-1 ring-white/20 overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Prepmate project logo"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 lg:hidden mb-1">
                <h1 className="text-xl font-bold tracking-tight text-white">Prepmate</h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  AI
                </span>
              </div>

              <h1 className="hidden lg:block text-xl font-bold tracking-tight text-white">
                {mode === 'signin' && 'Welcome back'}
                {mode === 'signup' && 'Create your studio account'}
                {mode === 'forgot' && 'Reset your password'}
              </h1>

              <p className="text-xs text-gray-400 mt-1">
                {mode === 'signin' && 'Sign in to access your interview prep studio'}
                {mode === 'signup' && 'Start practicing AI mock interviews in minutes'}
                {mode === 'forgot' && 'Enter your email to receive a password reset link'}
              </p>
            </div>

            {/* Segmented Mode Switcher (Sign In / Sign Up) */}
            {mode !== 'forgot' && (
              <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-gray-950/80 border border-gray-800/90">
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setMode('signin');
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${mode === 'signin'
                      ? 'bg-gray-800 text-white shadow-sm border border-gray-700/70'
                      : 'text-gray-400 hover:text-gray-200 border border-transparent'
                    }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setMode('signup');
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${mode === 'signup'
                      ? 'bg-gray-800 text-white shadow-sm border border-gray-700/70'
                      : 'text-gray-400 hover:text-gray-200 border border-transparent'
                    }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Global Error Banner */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{error}</span>
              </div>
            )}

            {/* Password Reset Success */}
            {resetSent && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  A reset link has been dispatched to <strong>{email}</strong>. Check your inbox.
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700/70 text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700/70 text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-300">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          clearError();
                          setMode('forgot');
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700/70 text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'signin' && 'Sign In with Email'}
                      {mode === 'signup' && 'Create Account'}
                      {mode === 'forgot' && 'Send Password Reset Link'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider for Google Sign-In */}
            {mode !== 'forgot' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase">
                    <span className="bg-gray-900 px-3 text-gray-500 font-semibold tracking-wider">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700/80 border border-gray-700 text-gray-200 text-sm font-medium transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </>
            )}

            {/* Footer Mode Switcher */}
            <div className="mt-6 pt-4 border-t border-gray-800/80 text-center text-xs text-gray-400">
              {mode === 'signin' && (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setMode('signup');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold ml-1 cursor-pointer transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              )}

              {mode === 'signup' && (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setMode('signin');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold ml-1 cursor-pointer transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <p>
                  Remembered your password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setMode('signin');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold ml-1 cursor-pointer transition-colors"
                  >
                    Back to Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};