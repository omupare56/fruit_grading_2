import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { AuthModal } from './components/auth/AuthModal';
import { LandingView } from './components/landing/LandingView';
import { DashboardView } from './components/dashboard/DashboardView';
import { AnalysisView } from './components/analysis/AnalysisView';
import { FinalReportView } from './components/results/FinalReportView';
import { HistoryView } from './components/history/HistoryView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { VivaArchitectureView } from './components/viva/VivaArchitectureView';
import { SettingsView } from './components/settings/SettingsView';
import { BenchmarkCase } from './types';
import { api, AuthUser } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [currentUser, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Active analysis result & benchmark case
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkCase | null>(null);
  const [activeAnalysisResult, setActiveAnalysisResult] = useState<any | null>(null);

  // Verify active authentication session on mount
  useEffect(() => {
    // Check locally stored user
    const localUser = api.getStoredUser();
    if (localUser) {
      setUser(localUser);
    }

    // Verify token validity with backend
    if (api.getToken()) {
      api.getMe()
        .then((res) => {
          if (res.data?.user) {
            setUser(res.data.user);
          }
        })
        .catch(() => {
          // Token expired or invalid
          api.clearToken();
          setUser(null);
        });
    }
  }, []);

  const handleAuthSuccess = (user: AuthUser) => {
    setUser(user);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    api.logout().catch(() => {});
    setUser(null);
  };

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Launch analysis with a preset benchmark case
  const handleLaunchBenchmark = (benchCase: BenchmarkCase) => {
    setSelectedBenchmark(benchCase);
    setCurrentView('upload');
  };

  // Callback when analysis completes
  const handleAnalysisComplete = (result: any) => {
    setActiveAnalysisResult(result);
    setCurrentView('detection');
  };

  // Inspect existing report from history or dashboard
  const handleSelectResult = (result: any) => {
    setActiveAnalysisResult(result);
    setCurrentView('detection');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <TopBar
        currentView={currentView}
        currentUser={currentUser}
        onOpenLogin={() => handleOpenAuth('login')}
        onOpenSignup={() => handleOpenAuth('signup')}
        onLogout={handleLogout}
        onToggleMobile={() => setIsMobileNavOpen(!isMobileNavOpen)}
        onNavigate={(view) => {
          if (view === 'upload') setSelectedBenchmark(null);
          setCurrentView(view);
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            if (view === 'upload') setSelectedBenchmark(null);
            setCurrentView(view);
          }}
          currentUser={currentUser}
          onOpenAuth={() => handleOpenAuth('login')}
          onLogout={handleLogout}
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="max-w-7xl mx-auto">
            {/* 1. Landing Page Presentation */}
            {currentView === 'landing' && (
              <LandingView
                onStartAnalysis={() => {
                  setSelectedBenchmark(null);
                  setCurrentView('upload');
                }}
                onOpenLogin={() => handleOpenAuth('login')}
                onOpenSignup={() => handleOpenAuth('signup')}
                onExploreViva={() => setCurrentView('viva')}
              />
            )}

            {/* 2. Dashboard View */}
            {currentView === 'dashboard' && (
              <DashboardView
                onStartAnalysis={() => {
                  setSelectedBenchmark(null);
                  setCurrentView('upload');
                }}
                onViewHistory={() => setCurrentView('history')}
                onSelectBenchmark={handleLaunchBenchmark}
                onViewResult={handleSelectResult}
              />
            )}

            {/* 3. Upload / Analysis Engine View */}
            {currentView === 'upload' && (
              <AnalysisView
                onAnalysisComplete={handleAnalysisComplete}
                initialBenchmark={selectedBenchmark}
              />
            )}

            {/* 4. Detection Results & Quality Report View */}
            {currentView === 'detection' && activeAnalysisResult && (
              <FinalReportView
                result={activeAnalysisResult}
                onStartNewAnalysis={() => {
                  setSelectedBenchmark(null);
                  setCurrentView('upload');
                }}
                onBackToHistory={() => setCurrentView('history')}
              />
            )}

            {/* Fallback if detection view opened without active result */}
            {currentView === 'detection' && !activeAnalysisResult && (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-white">No Active Analysis Loaded</h3>
                <p className="text-xs text-slate-400">
                  Select a previous evaluation from your history or run an image evaluation to inspect detection results.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentView('upload')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Start New Analysis
                  </button>
                  <button
                    onClick={() => setCurrentView('history')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    View History
                  </button>
                </div>
              </div>
            )}

            {/* 5. History View */}
            {currentView === 'history' && (
              <HistoryView
                onSelectResult={handleSelectResult}
                onStartNewAnalysis={() => {
                  setSelectedBenchmark(null);
                  setCurrentView('upload');
                }}
              />
            )}

            {/* 6. Analytics Dashboard */}
            {currentView === 'analytics' && (
              <AnalyticsView
                onStartNewAnalysis={() => {
                  setSelectedBenchmark(null);
                  setCurrentView('upload');
                }}
              />
            )}

            {/* 7. Architecture & Viva Voce Defense View */}
            {currentView === 'viva' && <VivaArchitectureView />}

            {/* 8. Settings & Diagnostics View */}
            {currentView === 'settings' && (
              <SettingsView onRefreshData={() => {}} />
            )}
          </div>
        </main>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />
    </div>
  );
}
