import React from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { InterviewSetupModal } from './components/setup/InterviewSetupModal';
import { InterviewRoom } from './components/interview/InterviewRoom';
import { ScorecardView } from './components/report/ScorecardView';
import { HistoryView } from './components/history/HistoryView';
import { SettingsModal } from './components/settings/SettingsModal';
import { useInterviewStore } from './store/interviewStore';

export function App() {
  const { activeTab, currentSession } = useInterviewStore();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f19] text-gray-100 overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-950/40 relative">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'setup' && <InterviewSetupModal />}
          {activeTab === 'interview' && <InterviewRoom />}
          {activeTab === 'report' && <ScorecardView />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'settings' && <SettingsModal />}
        </main>
      </div>
    </div>
  );
}

export default App;
