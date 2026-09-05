import React, { useRef, useState } from 'react';
import {
  LayoutGrid,
  FileText,
  Clock,
  BarChart3,
  Database,
  Download,
  Upload,
  RotateCcw,
  Pause,
  Play,
  Square,
  Sparkles,
  Layers,
  Calendar,
  Edit3,
  User,
  LogOut,
  Palette,
  FileSpreadsheet,
} from 'lucide-react';
import { isRunningInAppsScript } from '../lib/appsScriptAdapter';
import { ApplicationState } from '../types';
import { exportBackupJSON, sampleCPALEData, initialBlankState } from '../lib/storage';
import { calculateOverallBoardReadiness } from '../lib/analytics';
import { validateImportedBackup } from '../lib/sanitize';
import { isAppAdmin } from '../lib/auth';
import { Modal } from './Modal';
import { useToast } from './Toast';

interface NavbarProps {
  state: ApplicationState;
  setState: React.Dispatch<React.SetStateAction<ApplicationState>>;
  onStopTimer: () => void;
  onTogglePauseTimer: () => void;
  onOpenCombinedModal?: (tab?: 'exam' | 'time') => void;
  onOpenAccountModal?: () => void;
  onOpenThemeModal?: () => void;
  onOpenAppsScriptModal?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  setState,
  onStopTimer,
  onTogglePauseTimer,
  onOpenCombinedModal,
  onOpenAccountModal,
  onOpenThemeModal,
  onOpenAppsScriptModal,
  onSignOut,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExamDateModalOpen, setIsExamDateModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'reset' | 'sample';
    title: string;
    description: string;
  } | null>(null);

  // Compute days to exam
  const defaultTargetDate = new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const targetExamDate = state.targetExamDate || defaultTargetDate;
  const [tempExamDate, setTempExamDate] = useState(targetExamDate);

  const calculateDaysRemaining = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    const diff = target - today;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = calculateDaysRemaining(targetExamDate);

  const handleSaveExamDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempExamDate) return;
    setState((prev) => ({
      ...prev,
      targetExamDate: tempExamDate,
    }));
    setIsExamDateModalOpen(false);
    showToast('Exam Date Updated', `Target countdown updated to ${tempExamDate}`, 'success');
  };

  const handleOpenExamModal = () => {
    setTempExamDate(targetExamDate);
    setIsExamDateModalOpen(true);
  };

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      showToast('Invalid File Type', 'Please select a valid .json backup file.', 'error');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const validation = validateImportedBackup(json);
        if (!validation.isValid) {
          showToast('Import Failed', validation.error || 'Backup format invalid.', 'error');
          return;
        }

        const data = json.data || json;
        setState((prev) => ({
          ...prev,
          mainTopics: Array.isArray(data.mainTopics) ? data.mainTopics : [],
          subtopics: Array.isArray(data.subtopics) ? data.subtopics : [],
          resources: Array.isArray(data.resources) ? data.resources : [],
          examScores: Array.isArray(data.examScores) ? data.examScores : [],
          timeLogs: Array.isArray(data.timeLogs) ? data.timeLogs : [],
        }));
        showToast('Backup Restored', 'Successfully imported review syllabus and study records.', 'success');
      } catch (err) {
        showToast('Corrupted File', 'Failed to parse JSON file. Please check the backup content.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportClick = () => {
    exportBackupJSON(state);
    showToast('Backup Downloaded', 'Exported full encrypted syllabus and history as JSON.', 'success');
  };

  const handleLoadSample = () => {
    if (state.mainTopics.length > 0) {
      setConfirmModal({
        isOpen: true,
        type: 'sample',
        title: 'Load CPALE Board Exam Sample Data',
        description: 'Loading the sample CPALE syllabus will replace your current topics list with 6 standard Philippine CPA board exam subjects and subtopics. Continue?',
      });
      return;
    }
    executeLoadSample();
  };

  const executeLoadSample = () => {
    setState((prev) => ({
      ...prev,
      mainTopics: sampleCPALEData.mainTopics,
      subtopics: sampleCPALEData.subtopics,
      resources: sampleCPALEData.resources,
      examScores: sampleCPALEData.examScores,
      timeLogs: sampleCPALEData.timeLogs,
      activeSubtopicId: sampleCPALEData.subtopics[0].id,
    }));
    setConfirmModal(null);
    showToast('Sample Data Loaded', '6 CPALE standard review subjects loaded.', 'success');
  };

  const handleResetBlank = () => {
    setConfirmModal({
      isOpen: true,
      type: 'reset',
      title: 'Reset to Blank Slate',
      description: 'Are you sure you want to reset all data to a blank slate? All subjects, subtopics, exam scores, and study logs will be cleared.',
    });
  };

  const executeResetBlank = () => {
    setState(initialBlankState);
    setConfirmModal(null);
    showToast('Reset Complete', 'Application reset to clean blank state.', 'info');
  };

  const currentSubtopic = state.subtopics.find((s) => s.id === state.timerState.subtopicId);
  const isAdmin = isAppAdmin(state.currentUser);

  // Compute live readiness metric
  const readiness = calculateOverallBoardReadiness(
    state.mainTopics,
    state.subtopics,
    state.examScores,
    state.timeLogs
  );

  const totalMinutesLogged = state.timeLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const totalHoursLogged = Math.round((totalMinutesLogged / 60) * 10) / 10;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Header Title in Sophisticated Dark Serif Style */}
          <div className="flex flex-col justify-center">
            <h1 className="text-xl sm:text-2xl font-serif tracking-tight text-slate-50 italic flex items-center flex-wrap gap-2">
              <span>CPA Board Ledger</span>
              <span className="text-[10px] font-sans not-italic font-semibold text-slate-500 uppercase tracking-widest bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                Internal Study Archive v4.2
              </span>
            </h1>
            <p className="text-[10px] text-amber-500/80 font-mono tracking-wider uppercase mt-0.5">
              Session Active: {totalHoursLogged}h total study duration
            </p>
          </div>

          {/* Active Timer Pill Header */}
          {state.timerState.isRunning && (
            <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 bg-amber-950/40 border border-amber-800/60 rounded-full text-xs text-amber-200 shadow-inner">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="font-semibold text-amber-300 truncate max-w-[130px]">
                  {currentSubtopic ? currentSubtopic.title : 'Active Timer'}
                </span>
                <span className="font-mono font-bold text-slate-100 text-xs">
                  {formatSeconds(state.timerState.elapsedSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={onTogglePauseTimer}
                  className="p-1 hover:bg-amber-900/60 rounded text-amber-300 transition-colors"
                  title={state.timerState.isPaused ? 'Resume' : 'Pause'}
                >
                  {state.timerState.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={onStopTimer}
                  className="p-1 hover:bg-rose-900/80 rounded text-rose-400 transition-colors"
                  title="Save & Stop"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          )}

          {/* Global Readiness & Metrics Strip */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:block text-right">
              <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                Global Readiness
              </span>
              <span className="text-xl sm:text-2xl font-serif text-slate-100 font-medium">
                {readiness.overallAveragePct}
                <span className="text-xs text-slate-500 ml-0.5">%</span>
              </span>
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-800"></div>

            <button
              onClick={handleOpenExamModal}
              className="hidden sm:block text-right group px-2 py-1 -mr-2 rounded-lg hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700/80 cursor-pointer text-left"
              title="Click to set or change your target CPA Board Exam date"
            >
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono group-hover:text-amber-400 transition-colors">
                  Days to Exam
                </span>
                <Edit3 className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <span className="text-xl sm:text-2xl font-serif text-amber-500 font-medium block">
                {daysRemaining}
                <span className="text-xs text-amber-500/70 font-sans ml-1">days</span>
              </span>
            </button>

            <div className="w-px h-8 bg-slate-800"></div>

            {/* Data Controls */}
            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              {state.mainTopics.length === 0 ? (
                <button
                  onClick={handleLoadSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 text-amber-400 rounded-lg transition-colors shadow-xs"
                  title="Load sample CPALE subjects and topics"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample</span>
                </button>
              ) : (
                <button
                  onClick={handleResetBlank}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors border border-transparent hover:border-slate-700"
                  title="Reset to Blank Slate"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleExportClick}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
                title="Export JSON Backup"
                aria-label="Export JSON Backup"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={handleImportClick}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
                title="Import JSON Backup"
                aria-label="Import JSON Backup"
              >
                <Upload className="w-4 h-4" />
              </button>

              {isAdmin && onOpenAppsScriptModal && (
                <button
                  onClick={onOpenAppsScriptModal}
                  className={`relative p-2 rounded-lg transition-all border cursor-pointer group flex items-center gap-1.5 ${
                    isRunningInAppsScript()
                      ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60 hover:bg-emerald-900/60'
                      : 'text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 border-slate-800 hover:border-emerald-500/40'
                  }`}
                  title="Google Apps Script & Google Sheets Integration Hub (Admin Only)"
                  aria-label="Open Google Apps Script Integration Hub"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="hidden xl:inline text-xs font-semibold text-emerald-300">Apps Script</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRunningInAppsScript() ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500/80'
                    }`}
                  />
                </button>
              )}

              {onOpenThemeModal && (
                <button
                  onClick={onOpenThemeModal}
                  className="relative p-2 text-slate-300 hover:text-amber-300 hover:bg-slate-800/80 rounded-lg transition-all border border-slate-800 hover:border-amber-500/40 cursor-pointer group flex items-center gap-1.5"
                  title="Dashboard Theme & Appearance Studio"
                  aria-label="Open Theme Settings"
                >
                  <Palette className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span
                    className="w-2 h-2 rounded-full border border-slate-900 shadow-xs"
                    style={{ backgroundColor: state.theme?.accentColor || '#F59E0B' }}
                  />
                </button>
              )}
            </div>

            {/* Authenticated User Profile Pill */}
            {state.currentUser && (
              <>
                <div className="w-px h-8 bg-slate-800 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenAccountModal}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl transition-all hover:border-amber-500/50 cursor-pointer text-left group"
                    title="Account Settings & Profile"
                    aria-label="Account Settings and Profile"
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs text-slate-950 shrink-0"
                      style={{ backgroundColor: state.currentUser.avatarColor || '#F59E0B' }}
                    >
                      {state.currentUser.name ? state.currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden lg:block">
                      <div className="text-xs font-semibold text-slate-200 leading-tight group-hover:text-amber-400 transition-colors">
                        {state.currentUser.name}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono leading-tight truncate max-w-[110px]">
                        @{state.currentUser.username || state.currentUser.email}
                      </div>
                    </div>
                  </button>

                  {onSignOut && (
                    <button
                      onClick={onSignOut}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors border border-transparent hover:border-rose-900/50 cursor-pointer"
                      title="Log Out"
                      aria-label="Log Out of account"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="flex items-center space-x-1 border-t border-slate-800/80 overflow-x-auto py-2 scrollbar-none">
          <button
            onClick={() => setState((prev) => ({ ...prev, activeTab: 'overview' }))}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all border ${
              state.activeTab === 'overview'
                ? 'bg-slate-800 text-slate-100 border-slate-700 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-500/80" />
            <span className="uppercase tracking-wider text-[11px]">1. Topic Overview</span>
            <span className="ml-1 px-1.5 py-0.2 bg-slate-950/80 rounded text-[10px] font-mono text-slate-400 border border-slate-800">
              {state.mainTopics.length}
            </span>
          </button>

          <button
            onClick={() => setState((prev) => ({ ...prev, activeTab: 'subtopic' }))}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all border ${
              state.activeTab === 'subtopic'
                ? 'bg-slate-800 text-slate-100 border-slate-700 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-500/80" />
            <span className="uppercase tracking-wider text-[11px]">2. Subtopic Dashboard</span>
            {state.activeSubtopicId && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setState((prev) => ({ ...prev, activeTab: 'timetracker' }))}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all border ${
              state.activeTab === 'timetracker'
                ? 'bg-slate-800 text-slate-100 border-slate-700 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500/80" />
            <span className="uppercase tracking-wider text-[11px]">3. Time Tracker</span>
          </button>

          <button
            onClick={() => setState((prev) => ({ ...prev, activeTab: 'analytics' }))}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all border ${
              state.activeTab === 'analytics'
                ? 'bg-slate-800 text-slate-100 border-slate-700 shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-500/80" />
            <span className="uppercase tracking-wider text-[11px]">4. Diagnostic Analytics</span>
          </button>

          <div className="flex-1"></div>

          {onOpenCombinedModal && (
            <button
              onClick={() => onOpenCombinedModal('exam')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg whitespace-nowrap bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-400 transition-colors shadow-xs"
              title="Combine multiple topics for Pre-Board Exams or Multi-Subject Study Sessions"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Combine Topics</span>
            </button>
          )}

          {isAdmin && onOpenAppsScriptModal && (
            <button
              onClick={onOpenAppsScriptModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg whitespace-nowrap bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 transition-colors shadow-xs"
              title="Google Apps Script Web App & Google Sheets Integration Center (Admin Only)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Apps Script & Sheets</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setState((prev) => ({ ...prev, activeTab: 'schema_docs' }))}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-lg whitespace-nowrap border transition-all ${
                state.activeTab === 'schema_docs'
                  ? 'bg-slate-800 text-amber-400 border-amber-800/50'
                  : 'text-slate-500 border-slate-800/80 hover:text-slate-300 hover:bg-slate-800/40'
              }`}
              title="View Database Schema & Local Run Setup (Admin Only)"
            >
              <Database className="w-3.5 h-3.5 text-amber-500/70" />
              <span className="hidden sm:inline">Schema Docs</span>
            </button>
          )}
        </nav>
      </div>

      {/* Target Exam Date Settings Modal */}
      <Modal
        isOpen={isExamDateModalOpen}
        onClose={() => setIsExamDateModalOpen(false)}
        title="Target Board Exam Date Setting"
        maxWidth="md"
      >
        <form onSubmit={handleSaveExamDate} className="space-y-5">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase text-slate-400">Calculated Countdown</div>
              <div className="text-2xl font-serif font-bold text-amber-400">
                {calculateDaysRemaining(tempExamDate)}{' '}
                <span className="text-sm font-sans font-normal text-slate-300">Days Remaining</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Target Board Exam Date
            </label>
            <input
              type="date"
              value={tempExamDate}
              onChange={(e) => setTempExamDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-hidden focus:border-amber-500 font-mono text-sm"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Quick Target Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 30);
                  setTempExamDate(d.toISOString().slice(0, 10));
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs text-left transition-colors"
              >
                + 30 Days (1 Month)
              </button>

              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 60);
                  setTempExamDate(d.toISOString().slice(0, 10));
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs text-left transition-colors"
              >
                + 60 Days (2 Months)
              </button>

              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 90);
                  setTempExamDate(d.toISOString().slice(0, 10));
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs text-left transition-colors"
              >
                + 90 Days (3 Months)
              </button>

              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 180);
                  setTempExamDate(d.toISOString().slice(0, 10));
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs text-left transition-colors"
              >
                + 180 Days (6 Months)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsExamDateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Save Exam Date
            </button>
          </div>
        </form>
      </Modal>

      {/* In-App Confirmation Modal for Reset or Sample Data */}
      <Modal
        isOpen={Boolean(confirmModal?.isOpen)}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.title || 'Confirmation'}
      >
        <div className="space-y-4">
          <div className={`p-3.5 rounded-xl border ${
            confirmModal?.type === 'reset'
              ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
              : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
          }`}>
            <p className="text-xs leading-relaxed">
              {confirmModal?.description}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setConfirmModal(null)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmModal?.type === 'reset' ? executeResetBlank : executeLoadSample}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-colors shadow-md cursor-pointer ${
                confirmModal?.type === 'reset'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 text-slate-950'
              }`}
            >
              {confirmModal?.type === 'reset' ? 'Confirm Reset' : 'Confirm Load'}
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
};

