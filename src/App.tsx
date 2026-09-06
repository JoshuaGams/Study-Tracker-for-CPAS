import React, { useState, useEffect, useCallback } from 'react';
import { ApplicationState, TimeLog, UserAccount, DashboardTheme } from './types';
import { loadSavedState, saveStateToStorage, initialBlankState } from './lib/storage';
import {
  getActiveSessionUser,
  loadUserState,
  saveUserState,
  logoutUser,
  setActiveSessionUser,
  updateUserAccount,
  isAppAdmin,
  syncUsersFromRemote,
  syncUserStateFromRemote,
} from './lib/auth';
import { applyThemeToDocument, DEFAULT_THEME } from './lib/theme';
import { Navbar } from './components/Navbar';
import { TopicOverview } from './components/TopicOverview';
import { SubtopicDashboard } from './components/SubtopicDashboard';
import { TimeTracker } from './components/TimeTracker';
import { DiagnosticAnalytics } from './components/DiagnosticAnalytics';
import { SchemaDocumentation } from './components/SchemaDocumentation';
import { CombinedTopicModal } from './components/CombinedTopicModal';
import { AuthScreen } from './components/AuthScreen';
import { AccountModal } from './components/AccountModal';
import { ThemeModal } from './components/ThemeModal';
import { AppsScriptModal } from './components/AppsScriptModal';
import { Modal } from './components/Modal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToast } from './components/Toast';
import { isRunningInAppsScript, loadStateFromGAS, saveStateToGAS } from './lib/appsScriptAdapter';
import { WifiOff } from 'lucide-react';

function AppContent() {
  const { showToast } = useToast();
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Network connection resilience listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network Connected', 'Your device is back online. Local sync active.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode Active', 'Changes are saved locally to your device storage ledger.', 'info', 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Initialize state from active user session if available
  const [state, setState] = useState<ApplicationState>(() => {
    const activeUser = getActiveSessionUser();
    if (activeUser) {
      const userState = loadUserState(activeUser.id);
      return {
        ...userState,
        currentUser: activeUser,
        theme: activeUser.theme || userState.theme || DEFAULT_THEME,
        targetExamDate: activeUser.targetExamDate || userState.targetExamDate,
      };
    }
    const saved = loadSavedState();
    return {
      ...saved,
      theme: saved.theme || DEFAULT_THEME,
      currentUser: null,
    };
  });

  const [isCombinedModalOpen, setIsCombinedModalOpen] = useState(false);
  const [combinedModalTab, setCombinedModalTab] = useState<'exam' | 'time'>('exam');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);

  // Initial load & cross-profile sync from remote cloud (Server or GAS)
  useEffect(() => {
    // 1. Synchronize all registered user accounts from remote so any account created in another Chrome profile is recognized
    syncUsersFromRemote().catch((err) => {
      console.warn('Initial users remote sync notice:', err);
    });

    // 2. If a session is already active, synchronize that user's latest saved edits & progress from remote
    const activeUser = getActiveSessionUser();
    if (activeUser) {
      syncUserStateFromRemote(activeUser.id)
        .then((remoteState) => {
          if (remoteState) {
            setState((prev) => ({
              ...prev,
              ...remoteState,
              currentUser: prev.currentUser || activeUser,
              theme: activeUser.theme || remoteState.theme || prev.theme,
            }));
          }
        })
        .catch((err) => {
          console.warn('User state remote sync notice:', err);
        });
    }

    // 3. If running in Google Apps Script context, also listen to GAS properties
    if (isRunningInAppsScript()) {
      loadStateFromGAS()
        .then((gasData) => {
          if (gasData) {
            setState((prev) => {
              const { currentUser: _ignored, ...safeGasData } = gasData as any;
              return {
                ...prev,
                ...safeGasData,
                currentUser: prev.currentUser,
                mainTopics: Array.isArray(gasData.mainTopics) ? gasData.mainTopics : prev.mainTopics,
                subtopics: Array.isArray(gasData.subtopics) ? gasData.subtopics : prev.subtopics,
                resources: Array.isArray(gasData.resources) ? gasData.resources : prev.resources,
                examScores: Array.isArray(gasData.examScores) ? gasData.examScores : prev.examScores,
                timeLogs: Array.isArray(gasData.timeLogs) ? gasData.timeLogs : prev.timeLogs,
              };
            });
            showToast('Apps Script Cloud Connected', 'Loaded candidate study ledger from Google Workspace.', 'success');
          }
        })
        .catch((err) => {
          console.warn('Apps Script init load notice:', err);
        });
    }
  }, [showToast]);

  // Timer discard confirmation modal state (replaces window.confirm)
  const [isTimerDiscardModalOpen, setIsTimerDiscardModalOpen] = useState(false);

  // Apply theme to document whenever theme changes
  useEffect(() => {
    applyThemeToDocument(state.theme || DEFAULT_THEME);
  }, [state.theme]);

  // Restrict schema_docs and Apps Script access exclusively to the admin account
  useEffect(() => {
    if (state.activeTab === 'schema_docs' && !isAppAdmin(state.currentUser)) {
      setState((prev) => ({ ...prev, activeTab: 'overview' }));
    }
  }, [state.activeTab, state.currentUser]);

  const handleOpenCombinedModal = (tab: 'exam' | 'time' = 'exam') => {
    setCombinedModalTab(tab);
    setIsCombinedModalOpen(true);
  };

  // Sync to user storage whenever state changes (debounced internally)
  useEffect(() => {
    if (state.currentUser) {
      saveUserState(state.currentUser.id, state);
    }
    saveStateToStorage(state);
    if (isRunningInAppsScript()) {
      saveStateToGAS(state).catch(() => {});
    }
  }, [state]);

  // Handle successful login or sign up
  const handleAuthSuccess = (user: UserAccount) => {
    const userState = loadUserState(user.id);
    const chosenTheme = user.theme || userState.theme || DEFAULT_THEME;
    applyThemeToDocument(chosenTheme);
    setState({
      ...userState,
      theme: chosenTheme,
      currentUser: user,
      targetExamDate: user.targetExamDate || userState.targetExamDate,
      timerState: {
        ...userState.timerState,
        isRunning: false,
        isPaused: false,
      },
    });
    showToast('Welcome back, ' + user.name + '!', 'Your candidate review syllabus and progress have been restored.', 'success');

    // Asynchronously double-check for latest remote edits
    syncUserStateFromRemote(user.id).then((freshState) => {
      if (freshState) {
        setState((prev) => ({
          ...prev,
          ...freshState,
          currentUser: user,
        }));
      }
    }).catch(() => {});
  };

  // Handle saving new theme
  const handleSaveTheme = (newTheme: DashboardTheme) => {
    applyThemeToDocument(newTheme);
    setState((prev) => {
      const updatedUser = prev.currentUser
        ? {
            ...prev.currentUser,
            theme: newTheme,
          }
        : null;
      if (updatedUser) {
        updateUserAccount(updatedUser.id, { theme: newTheme });
      }
      return {
        ...prev,
        theme: newTheme,
        currentUser: updatedUser,
      };
    });
    showToast('Theme Updated', `Switched theme to ${newTheme.name}.`, 'success');
  };

  // Handle sign out
  const handleSignOut = () => {
    if (state.currentUser) {
      saveUserState(state.currentUser.id, state, true);
    }
    logoutUser();
    setState({
      ...initialBlankState,
      currentUser: null,
    });
    showToast('Signed Out', 'Your session data has been securely saved locally.', 'info');
  };

  // Handle switching between accounts
  const handleSwitchUser = (targetUser: UserAccount) => {
    if (state.currentUser) {
      saveUserState(state.currentUser.id, state, true);
    }
    setActiveSessionUser(targetUser);
    const targetState = loadUserState(targetUser.id);
    setState({
      ...targetState,
      currentUser: targetUser,
      targetExamDate: targetUser.targetExamDate || targetState.targetExamDate,
      timerState: {
        ...targetState.timerState,
        isRunning: false,
        isPaused: false,
      },
    });
    showToast('Switched Account', `Now studying as ${targetUser.name}`, 'info');
  };

  // Live Timer Interval Loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (state.timerState.isRunning && !state.timerState.isPaused) {
      interval = setInterval(() => {
        setState((prev) => {
          if (!prev.timerState.isRunning || prev.timerState.isPaused) return prev;
          return {
            ...prev,
            timerState: {
              ...prev.timerState,
              elapsedSeconds: prev.timerState.elapsedSeconds + 1,
            },
          };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.timerState.isRunning, state.timerState.isPaused]);

  // Stop Timer and Log Session
  const handleStopTimer = () => {
    const { elapsedSeconds, mainTopicId, subtopicId, sessionType, notes } = state.timerState;
    if (elapsedSeconds < 10) {
      setIsTimerDiscardModalOpen(true);
      return;
    }

    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const targetMain = mainTopicId || state.mainTopics[0]?.id || 'mt-gen';
    const targetSub = subtopicId || state.subtopics.find((s) => s.mainTopicId === targetMain)?.id || 'st-gen';

    const newLog: TimeLog = {
      id: `tl-${Date.now()}`,
      mainTopicId: targetMain,
      subtopicId: targetSub,
      durationMinutes,
      sessionType,
      date: new Date().toISOString().slice(0, 10),
      notes: notes || `Live study session (${durationMinutes} mins)`,
    };

    setState((prev) => ({
      ...prev,
      timeLogs: [newLog, ...prev.timeLogs],
      timerState: {
        ...prev.timerState,
        isRunning: false,
        isPaused: false,
        elapsedSeconds: 0,
      },
    }));

    showToast('Study Session Logged', `Recorded ${durationMinutes} minutes to your study ledger.`, 'success');
  };

  const confirmDiscardTimer = () => {
    setState((prev) => ({
      ...prev,
      timerState: {
        ...prev.timerState,
        isRunning: false,
        isPaused: false,
        elapsedSeconds: 0,
      },
    }));
    setIsTimerDiscardModalOpen(false);
    showToast('Timer Reset', 'Short session was discarded.', 'info');
  };

  const handleTogglePauseTimer = () => {
    setState((prev) => ({
      ...prev,
      timerState: {
        ...prev.timerState,
        isPaused: !prev.timerState.isPaused,
      },
    }));
  };

  const handleStartTimerForSubtopic = (mainTopicId: string, subtopicId: string) => {
    setState((prev) => ({
      ...prev,
      activeSubtopicId: subtopicId,
      timerState: {
        ...prev.timerState,
        isRunning: true,
        isPaused: false,
        mainTopicId,
        subtopicId,
        elapsedSeconds: 0,
      },
    }));
    showToast('Timer Started', 'Live stopwatch is now tracking your study session.', 'info');
  };

  const handleOpenSubtopic = (subtopicId: string) => {
    setState((prev) => ({
      ...prev,
      activeSubtopicId: subtopicId,
      activeTab: 'subtopic',
    }));
  };

  // If no user is logged in, show the Authentication Screen
  if (!state.currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/20 selection:text-amber-200 flex flex-col justify-between">
      <div>
        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-amber-600/90 text-slate-950 px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-xs">
            <WifiOff className="w-3.5 h-3.5" />
            <span>You are working in Offline Mode. All changes are securely cached in local device storage.</span>
          </div>
        )}

        <Navbar
          state={state}
          setState={setState}
          onStopTimer={handleStopTimer}
          onTogglePauseTimer={handleTogglePauseTimer}
          onOpenCombinedModal={handleOpenCombinedModal}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onOpenAppsScriptModal={isAppAdmin(state.currentUser) ? () => setIsAppsScriptModalOpen(true) : undefined}
          onSignOut={handleSignOut}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          {state.activeTab === 'overview' && (
            <TopicOverview
              state={state}
              setState={setState}
              onOpenSubtopic={handleOpenSubtopic}
              onStartTimer={handleStartTimerForSubtopic}
              onOpenCombinedModal={handleOpenCombinedModal}
            />
          )}

          {state.activeTab === 'subtopic' && (
            <SubtopicDashboard
              state={state}
              setState={setState}
              subtopicId={state.activeSubtopicId}
              onBackToOverview={() => setState((prev) => ({ ...prev, activeTab: 'overview' }))}
              onStartTimer={handleStartTimerForSubtopic}
              onOpenCombinedModal={handleOpenCombinedModal}
            />
          )}

          {state.activeTab === 'timetracker' && (
            <TimeTracker
              state={state}
              setState={setState}
              onStopTimer={handleStopTimer}
              onTogglePauseTimer={handleTogglePauseTimer}
              onOpenCombinedModal={handleOpenCombinedModal}
            />
          )}

          {state.activeTab === 'analytics' && (
            <DiagnosticAnalytics
              state={state}
              setState={setState}
              onOpenSubtopic={handleOpenSubtopic}
              onStartTimer={handleStartTimerForSubtopic}
              onOpenCombinedModal={handleOpenCombinedModal}
            />
          )}

          {state.activeTab === 'schema_docs' && isAppAdmin(state.currentUser) && <SchemaDocumentation />}
        </main>

        <CombinedTopicModal
          isOpen={isCombinedModalOpen}
          onClose={() => setIsCombinedModalOpen(false)}
          state={state}
          setState={setState}
          defaultTab={combinedModalTab}
        />

        {state.currentUser && (
          <AccountModal
            isOpen={isAccountModalOpen}
            onClose={() => setIsAccountModalOpen(false)}
            currentUser={state.currentUser}
            state={state}
            setState={setState}
            onSignOut={handleSignOut}
            onSwitchUser={handleSwitchUser}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
          />
        )}

        <ThemeModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          currentTheme={state.theme || DEFAULT_THEME}
          onSaveTheme={handleSaveTheme}
        />

        {isAppAdmin(state.currentUser) && (
          <AppsScriptModal
            isOpen={isAppsScriptModalOpen}
            onClose={() => setIsAppsScriptModalOpen(false)}
            state={state}
            setState={setState}
          />
        )}

        {/* In-app Discard Timer Confirmation Modal */}
        <Modal
          isOpen={isTimerDiscardModalOpen}
          onClose={() => setIsTimerDiscardModalOpen(false)}
          title="Discard Short Study Session?"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              The live study timer ran for less than 10 seconds. Would you like to discard this brief session or cancel and continue timing?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsTimerDiscardModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Continue Timer
              </button>
              <button
                type="button"
                onClick={confirmDiscardTimer}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Discard Session
              </button>
            </div>
          </div>
        </Modal>
      </div>

      <footer className="h-12 border-t border-slate-800 flex items-center px-4 sm:px-8 bg-slate-900/80 backdrop-blur-md justify-between mt-auto">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] uppercase tracking-widest font-mono text-slate-500">
              Authenticated Candidate: {state.currentUser.name}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-[10px] uppercase tracking-widest font-mono text-slate-500">
              Target Exam: {state.currentUser.targetExam || 'CPALE'}
            </span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-600 tracking-wider">
          SECURE USER LEDGER: @{state.currentUser.username || state.currentUser.email} // PERSISTED
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}
