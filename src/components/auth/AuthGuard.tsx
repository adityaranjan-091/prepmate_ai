import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { LoginPage } from './LoginPage';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading, initialized } = useAuthStore();

  if (loading && !initialized) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 select-none">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-blue-500/30 blur-xl animate-pulse" />
          <div className="relative grid place-items-center w-16 h-16 rounded-2xl bg-gray-900/80 shadow-2xl shadow-blue-500/30 ring-1 ring-white/20 overflow-hidden">
            <img
              src="/logo.png"
              alt="Prepmate project logo"
              className="w-full h-full object-contain p-1.5"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-bold tracking-tight text-white">Prepmate</h2>
          <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
            AI
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
};
