import React, { useState } from 'react';
import {
  Clock,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Calendar,
  BarChart2,
  PieChart as PieChartIcon,
  BookOpen,
  CheckCircle2,
  ListFilter,
  Flame,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { ApplicationState, TimeLog, SessionType } from '../types';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { sanitizeString, sanitizeNumber } from '../lib/sanitize';

interface TimeTrackerProps {
  state: ApplicationState;
  setState: React.Dispatch<React.SetStateAction<ApplicationState>>;
  onStopTimer: () => void;
  onTogglePauseTimer: () => void;
  onOpenCombinedModal?: (tab?: 'exam' | 'time') => void;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({
  state,
  setState,
  onStopTimer,
  onTogglePauseTimer,
  onOpenCombinedModal,
}) => {
  const { showToast } = useToast();

  // Manual Log Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualMainTopicId, setManualMainTopicId] = useState(
    state.mainTopics[0]?.id || ''
  );
  const [manualSubtopicId, setManualSubtopicId] = useState('');
  const [manualDuration, setManualDuration] = useState('60');
  const [manualSessionType, setManualSessionType] = useState<SessionType>('Reading');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualNotes, setManualNotes] = useState('');

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    description: string;
  } | null>(null);

  // Filtering Table
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');

  // Colors for charts
  const CHART_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#EF4444', '#06B6D4'];

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer Handlers
  const handleStartTimer = (mainId: string, subId: string, sessionType: SessionType) => {
    setState((prev) => ({
      ...prev,
      timerState: {
        ...prev.timerState,
        isRunning: true,
        isPaused: false,
        mainTopicId: mainId,
        subtopicId: subId,
        sessionType,
        elapsedSeconds: prev.timerState.elapsedSeconds,
      },
    }));
  };

  const handleResetTimer = () => {
    setState((prev) => ({
      ...prev,
      timerState: {
        ...prev.timerState,
        isRunning: false,
        isPaused: false,
        elapsedSeconds: 0,
      },
    }));
  };

  // Manual Log Submit
  const handleSaveManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = sanitizeNumber(manualDuration, NaN, 1, 1440);
    const cleanNotes = sanitizeString(manualNotes, 300);

    if (isNaN(mins) || mins <= 0 || !manualMainTopicId) {
      showToast('Validation Error', 'Please enter a valid study duration in minutes.', 'error');
      return;
    }

    const targetSubId = manualSubtopicId || state.subtopics.find((s) => s.mainTopicId === manualMainTopicId)?.id || '';

    const newLog: TimeLog = {
      id: `tl-${Date.now()}`,
      mainTopicId: manualMainTopicId,
      subtopicId: targetSubId,
      durationMinutes: mins,
      sessionType: manualSessionType,
      date: manualDate || new Date().toISOString().slice(0, 10),
      notes: cleanNotes,
    };

    setState((prev) => ({
      ...prev,
      timeLogs: [newLog, ...prev.timeLogs],
    }));

    setManualNotes('');
    setIsManualModalOpen(false);
    showToast('Session Logged', `Recorded ${mins} mins of ${manualSessionType}.`, 'success');
  };

  const executeDeleteLog = () => {
    if (!deleteConfirm) return;
    const targetId = deleteConfirm.id;
    setState((prev) => ({
      ...prev,
      timeLogs: prev.timeLogs.filter((l) => l.id !== targetId),
    }));
    setDeleteConfirm(null);
    showToast('Log Removed', 'Study time log entry deleted.', 'info');
  };

  // Data aggregations for charts
  const totalMinutesAll = state.timeLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const totalHoursAll = Math.round((totalMinutesAll / 60) * 10) / 10;

  // Distribution by Main Topic
  const mainTopicChartData = state.mainTopics.map((mt) => {
    const mtSubIds = new Set(state.subtopics.filter((s) => s.mainTopicId === mt.id).map((s) => s.id));
    const mins = state.timeLogs
      .filter((l) => l.mainTopicId === mt.id || mtSubIds.has(l.subtopicId))
      .reduce((acc, l) => acc + l.durationMinutes, 0);
    return {
      name: mt.code || mt.title.slice(0, 8),
      fullName: mt.title,
      hours: Math.round((mins / 60) * 10) / 10,
    };
  });

  // Distribution by Session Type
  const sessionTypesList: SessionType[] = [
    'Reading',
    'Practice Drills',
    'Flashcards',
    'Video Lecture',
    'Mock Exam',
    'Revision',
  ];

  const sessionTypeChartData = sessionTypesList
    .map((st) => {
      const mins = state.timeLogs
        .filter((l) => l.sessionType === st)
        .reduce((acc, l) => acc + l.durationMinutes, 0);
      return {
        name: st,
        value: Math.round((mins / 60) * 10) / 10,
      };
    })
    .filter((d) => d.value > 0);

  // Filtered Time Logs for Table
  const filteredLogs = state.timeLogs.filter((log) => {
    if (selectedTopicFilter !== 'All' && log.mainTopicId !== selectedTopicFilter) return false;
    if (selectedTypeFilter !== 'All' && log.sessionType !== selectedTypeFilter) return false;
    return true;
  });

  // Current timer topic labels
  const timerMainTopic = state.mainTopics.find((m) => m.id === state.timerState.mainTopicId);
  const timerSubtopic = state.subtopics.find((s) => s.id === state.timerState.subtopicId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 backdrop-blur-sm p-6 rounded-lg border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-serif text-slate-50 italic flex items-center gap-2">
            <span>Face 3: Time Allocation Diagnostic & Session Logger</span>
          </h2>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mt-1">
            Archival Stopwatch & Session Ledger
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCombinedModal && (
            <button
              onClick={() => onOpenCombinedModal('time')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded transition-colors shadow-xs"
              title="Log multi-topic study sessions across 2 or more subtopics"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Combine Topics Session</span>
            </button>
          )}

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-800/50 text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Manual Time Entry</span>
          </button>
        </div>
      </div>

      {/* Live Stopwatch & Pomodoro Widget */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Interactive Study Timer
              </span>
            </div>

            {/* Topic & Subtopic Selector for Timer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Target Main Topic
                </label>
                <select
                  value={state.timerState.mainTopicId || ''}
                  onChange={(e) => {
                    const mtId = e.target.value;
                    const defaultSub = state.subtopics.find((s) => s.mainTopicId === mtId)?.id || null;
                    setState((prev) => ({
                      ...prev,
                      timerState: {
                        ...prev.timerState,
                        mainTopicId: mtId,
                        subtopicId: defaultSub,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Main Topic...</option>
                  {state.mainTopics.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Target Subtopic
                </label>
                <select
                  value={state.timerState.subtopicId || ''}
                  onChange={(e) => {
                    const subId = e.target.value;
                    const parentMt = state.subtopics.find((s) => s.id === subId)?.mainTopicId || state.timerState.mainTopicId;
                    setState((prev) => ({
                      ...prev,
                      timerState: {
                        ...prev.timerState,
                        subtopicId: subId,
                        mainTopicId: parentMt,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Subtopic...</option>
                  {state.subtopics
                    .filter((s) => !state.timerState.mainTopicId || s.mainTopicId === state.timerState.mainTopicId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Session Type Buttons */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1.5">
                Session Focus Activity
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {sessionTypesList.map((st) => (
                  <button
                    key={st}
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        timerState: { ...prev.timerState, sessionType: st },
                      }))
                    }
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                      state.timerState.sessionType === st
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Large Timer Display Box */}
          <div className="flex flex-col items-center justify-center bg-slate-950/80 p-6 rounded-2xl border border-slate-800/90 text-center min-w-[260px]">
            <span className="text-xs text-slate-400 font-medium mb-1">
              {timerSubtopic ? timerSubtopic.title : 'No topic selected'}
            </span>

            <div className="text-4xl sm:text-5xl font-black font-mono text-slate-100 tracking-wider my-2">
              {formatSeconds(state.timerState.elapsedSeconds)}
            </div>

            <span className="text-[11px] text-blue-400 font-medium mb-4">
              Focus: {state.timerState.sessionType}
            </span>

            {/* Timer Buttons */}
            <div className="flex items-center gap-2">
              {!state.timerState.isRunning ? (
                <button
                  onClick={() => {
                    if (!state.timerState.mainTopicId || !state.timerState.subtopicId) {
                      showToast('Topic Selection Required', 'Please select a Main Topic and Subtopic before starting the timer.', 'error');
                      return;
                    }
                    handleStartTimer(
                      state.timerState.mainTopicId,
                      state.timerState.subtopicId,
                      state.timerState.sessionType
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={onTogglePauseTimer}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl transition-colors"
                  >
                    {state.timerState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    <span>{state.timerState.isPaused ? 'Resume' : 'Pause'}</span>
                  </button>

                  <button
                    onClick={onStopTimer}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-md"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Save & Log</span>
                  </button>
                </>
              )}

              {state.timerState.elapsedSeconds > 0 && !state.timerState.isRunning && (
                <button
                  onClick={handleResetTimer}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Topic Hours Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-base font-bold text-slate-100">Study Hours by Main Topic</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Total: {totalHoursAll} hrs</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mainTopicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px', color: '#f8fafc' }}
                  formatter={(value: any) => [`${value} hours`, 'Study Time']}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {mainTopicChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session Type Breakdown Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-100">Study Focus Distribution</h3>
            </div>
          </div>

          {sessionTypeChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No study session logs recorded yet.
            </div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sessionTypeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sessionTypeChartData.map((_, index) => (
                      <Cell key={`pie-cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px', color: '#f8fafc' }}
                    formatter={(value: any) => [`${value} hours`, 'Time Spent']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Filterable Time Log History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">Study Session History Log</h3>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedTopicFilter}
              onChange={(e) => setSelectedTopicFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
            >
              <option value="All">All Main Topics</option>
              {state.mainTopics.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.code}] {m.title}
                </option>
              ))}
            </select>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
            >
              <option value="All">All Activity Types</option>
              {sessionTypesList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Table */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            No study sessions found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Topic / Subtopic</th>
                  <th className="py-3 px-4">Focus Activity</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => {
                  const mt = state.mainTopics.find((m) => m.id === log.mainTopicId);
                  const st = state.subtopics.find((s) => s.id === log.subtopicId);
                  const hrs = Math.round((log.durationMinutes / 60) * 10) / 10;

                  return (
                    <tr key={log.id} className="hover:bg-slate-950/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{log.date}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-200 block">
                          [{mt?.code || 'GEN'}] {st?.title || 'General'}
                        </span>
                        <span className="text-[10px] text-slate-500">{mt?.title}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[11px]">
                          {log.sessionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-100 whitespace-nowrap">
                        {log.durationMinutes} mins ({hrs}h)
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {log.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              id: log.id,
                              description: `${log.durationMinutes} mins (${log.sessionType}) on ${log.date}`,
                            })
                          }
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Delete entry"
                          aria-label={`Delete study session log of ${log.durationMinutes} minutes`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Log Manual Study Time"
      >
        <form onSubmit={handleSaveManualLog} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Main Topic *
            </label>
            <select
              value={manualMainTopicId}
              onChange={(e) => {
                setManualMainTopicId(e.target.value);
                const firstSub = state.subtopics.find((s) => s.mainTopicId === e.target.value);
                setManualSubtopicId(firstSub?.id || '');
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {state.mainTopics.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.code}] {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Subtopic Container
            </label>
            <select
              value={manualSubtopicId}
              onChange={(e) => setManualSubtopicId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {state.subtopics
                .filter((s) => s.mainTopicId === manualMainTopicId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Duration (Minutes) *
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="60"
                value={manualDuration}
                onChange={(e) => setManualDuration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Session Focus Activity
              </label>
              <select
                value={manualSessionType}
                onChange={(e) => setManualSessionType(e.target.value as SessionType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {sessionTypesList.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Session Accomplishment Notes
            </label>
            <input
              type="text"
              placeholder="e.g., Read 30 pages of PAS 16 and solved 15 impairment problems"
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Log Time
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirm?.isOpen)}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Time Log Entry"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to delete this study session log (<span className="font-bold text-slate-100">{deleteConfirm?.description}</span>)? This will update total recorded time in your charts.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeDeleteLog}
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors shadow-md shadow-rose-600/30 cursor-pointer"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
