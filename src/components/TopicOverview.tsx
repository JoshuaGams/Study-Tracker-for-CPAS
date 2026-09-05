import React, { useState } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FilePlus,
  Search,
  CheckCircle2,
  Clock,
  Award,
  Edit2,
  Trash2,
  ExternalLink,
  Play,
  Sparkles,
  BookOpen,
  Layers,
} from 'lucide-react';
import { ApplicationState, MainTopic, Subtopic, TopicStatus } from '../types';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { sanitizeString, sanitizeNumber } from '../lib/sanitize';
import { calculateSubtopicExamAvg, calculateSubtopicTimeLogged, calculateMainTopicMetrics } from '../lib/analytics';
import { sampleCPALEData } from '../lib/storage';

interface TopicOverviewProps {
  state: ApplicationState;
  setState: React.Dispatch<React.SetStateAction<ApplicationState>>;
  onOpenSubtopic: (subtopicId: string) => void;
  onStartTimer: (mainTopicId: string, subtopicId: string) => void;
  onOpenCombinedModal?: (tab?: 'exam' | 'time') => void;
}

export const TopicOverview: React.FC<TopicOverviewProps> = ({
  state,
  setState,
  onOpenSubtopic,
  onStartTimer,
  onOpenCombinedModal,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Modals
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [editingMainTopic, setEditingMainTopic] = useState<MainTopic | null>(null);

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedMainForSub, setSelectedMainForSub] = useState<string>('');
  const [editingSubtopic, setEditingSubtopic] = useState<Subtopic | null>(null);

  // Main Topic Form State
  const [mtTitle, setMtTitle] = useState('');
  const [mtCode, setMtCode] = useState('');
  const [mtDesc, setMtDesc] = useState('');
  const [mtHours, setMtHours] = useState('50');
  const [mtWeight, setMtWeight] = useState('15');

  // Subtopic Form State
  const [stTitle, setStTitle] = useState('');
  const [stCode, setStCode] = useState('');
  const [stDesc, setStDesc] = useState('');
  const [stHours, setStHours] = useState('10');
  const [stStatus, setStStatus] = useState<TopicStatus>('Not Started');

  // In-App Deletion Confirmation State (replaces blocked window.confirm)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'main' | 'sub';
    id: string;
    title: string;
  } | null>(null);

  const mainMetrics = calculateMainTopicMetrics(
    state.mainTopics,
    state.subtopics,
    state.examScores,
    state.timeLogs
  );

  // Accurate real-time count of subtopics per status
  const statusCounts = {
    All: state.subtopics.length,
    'In Progress': state.subtopics.filter((s) => s.status === 'In Progress').length,
    Reviewing: state.subtopics.filter((s) => s.status === 'Reviewing').length,
    Mastered: state.subtopics.filter((s) => s.status === 'Mastered').length,
    'Not Started': state.subtopics.filter((s) => s.status === 'Not Started').length,
  };

  const toggleExpand = (mainTopicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [mainTopicId]: prev[mainTopicId] === undefined ? false : !prev[mainTopicId],
    }));
  };

  const expandAll = () => {
    const newMap: Record<string, boolean> = {};
    state.mainTopics.forEach((m) => (newMap[m.id] = true));
    setExpandedTopics(newMap);
  };

  const collapseAll = () => {
    setExpandedTopics({});
  };

  // Main Topic Modal handlers
  const openAddMainTopic = () => {
    setEditingMainTopic(null);
    setMtTitle('');
    setMtCode('');
    setMtDesc('');
    setMtHours('50');
    setMtWeight('15');
    setIsMainModalOpen(true);
  };

  const openEditMainTopic = (mt: MainTopic) => {
    setEditingMainTopic(mt);
    setMtTitle(mt.title);
    setMtCode(mt.code);
    setMtDesc(mt.description || '');
    setMtHours(mt.targetHours.toString());
    setMtWeight((mt.weightPercentage || 15).toString());
    setIsMainModalOpen(true);
  };

  const handleSaveMainTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeString(mtTitle, 120);
    const cleanCode = sanitizeString(mtCode, 20) || cleanTitle.slice(0, 4).toUpperCase();
    const cleanDesc = sanitizeString(mtDesc, 400);
    const numHours = sanitizeNumber(mtHours, 50, 1, 1000);
    const numWeight = sanitizeNumber(mtWeight, 15, 0, 100);

    if (!cleanTitle) {
      showToast('Validation Error', 'Main topic title is required.', 'error');
      return;
    }

    if (editingMainTopic) {
      setState((prev) => ({
        ...prev,
        mainTopics: prev.mainTopics.map((m) =>
          m.id === editingMainTopic.id
            ? {
                ...m,
                title: cleanTitle,
                code: cleanCode,
                description: cleanDesc,
                targetHours: numHours,
                weightPercentage: numWeight,
              }
            : m
        ),
      }));
      showToast('Topic Updated', `Saved changes to "${cleanTitle}".`, 'success');
    } else {
      const newMain: MainTopic = {
        id: `mt-${Date.now()}`,
        title: cleanTitle,
        code: cleanCode,
        description: cleanDesc,
        targetHours: numHours,
        weightPercentage: numWeight,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        mainTopics: [...prev.mainTopics, newMain],
      }));
      showToast('Topic Created', `Created main subject "${cleanTitle}".`, 'success');
    }
    setIsMainModalOpen(false);
  };

  // Request deletion via in-app modal
  const requestDeleteMainTopic = (id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'main',
      id,
      title: name,
    });
  };

  const requestDeleteSubtopic = (subId: string, subTitle: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'sub',
      id: subId,
      title: subTitle,
    });
  };

  // Execute confirmed deletion
  const executeDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'main') {
      const id = deleteConfirm.id;
      const subIdsToRemove = state.subtopics.filter((s) => s.mainTopicId === id).map((s) => s.id);
      const subSet = new Set(subIdsToRemove);

      setState((prev) => ({
        ...prev,
        mainTopics: prev.mainTopics.filter((m) => m.id !== id),
        subtopics: prev.subtopics.filter((s) => s.mainTopicId !== id),
        resources: prev.resources.filter((r) => !subSet.has(r.subtopicId)),
        examScores: prev.examScores.filter((e) => !subSet.has(e.subtopicId)),
        timeLogs: prev.timeLogs.filter((l) => l.mainTopicId !== id && !subSet.has(l.subtopicId)),
        activeSubtopicId: prev.activeSubtopicId && subSet.has(prev.activeSubtopicId)
          ? prev.subtopics.find((s) => !subSet.has(s.id))?.id || ''
          : prev.activeSubtopicId,
      }));
      showToast('Subject Removed', `Deleted "${deleteConfirm.title}" and its linked subtopics.`, 'info');
    } else if (deleteConfirm.type === 'sub') {
      const subId = deleteConfirm.id;
      setState((prev) => ({
        ...prev,
        subtopics: prev.subtopics.filter((s) => s.id !== subId),
        resources: prev.resources.filter((r) => r.subtopicId !== subId),
        examScores: prev.examScores.filter((e) => e.subtopicId !== subId),
        timeLogs: prev.timeLogs.filter((l) => l.subtopicId !== subId),
        activeSubtopicId: prev.activeSubtopicId === subId
          ? prev.subtopics.find((s) => s.id !== subId)?.id || ''
          : prev.activeSubtopicId,
      }));
      showToast('Subtopic Removed', `Deleted "${deleteConfirm.title}".`, 'info');
    }

    setDeleteConfirm(null);
  };

  // Quick inline status change for subtopic
  const handleQuickStatusChange = (subtopicId: string, newStatus: TopicStatus) => {
    setState((prev) => ({
      ...prev,
      subtopics: prev.subtopics.map((s) =>
        s.id === subtopicId ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s
      ),
    }));
    const found = state.subtopics.find((s) => s.id === subtopicId);
    showToast('Status Updated', `Marked ${found ? `"${found.title}"` : 'subtopic'} as ${newStatus}.`, 'success');
  };

  // Subtopic Modal Handlers
  const openAddSubtopic = (mainTopicId: string) => {
    setSelectedMainForSub(mainTopicId);
    setEditingSubtopic(null);
    setStTitle('');
    setStCode('');
    setStDesc('');
    setStHours('10');
    setStStatus('Not Started');
    setIsSubModalOpen(true);
  };

  const openEditSubtopic = (sub: Subtopic) => {
    setSelectedMainForSub(sub.mainTopicId);
    setEditingSubtopic(sub);
    setStTitle(sub.title);
    setStCode(sub.code || '');
    setStDesc(sub.description || '');
    setStHours(sub.targetHours.toString());
    setStStatus(sub.status);
    setIsSubModalOpen(true);
  };

  const handleSaveSubtopic = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeString(stTitle, 140);
    const cleanCode = sanitizeString(stCode, 30);
    const cleanDesc = sanitizeString(stDesc, 400);
    const numHours = sanitizeNumber(stHours, 10, 0.5, 500);

    if (!cleanTitle || !selectedMainForSub) {
      showToast('Validation Error', 'Subtopic title is required.', 'error');
      return;
    }

    if (editingSubtopic) {
      setState((prev) => ({
        ...prev,
        subtopics: prev.subtopics.map((s) =>
          s.id === editingSubtopic.id
            ? {
                ...s,
                title: cleanTitle,
                code: cleanCode,
                description: cleanDesc,
                targetHours: numHours,
                status: stStatus,
                updatedAt: new Date().toISOString(),
              }
            : s
        ),
      }));
      showToast('Subtopic Saved', `Updated "${cleanTitle}".`, 'success');
    } else {
      const newSub: Subtopic = {
        id: `st-${Date.now()}`,
        mainTopicId: selectedMainForSub,
        title: cleanTitle,
        code: cleanCode,
        description: cleanDesc,
        targetHours: numHours,
        status: stStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        subtopics: [...prev.subtopics, newSub],
      }));
      showToast('Subtopic Added', `Added "${cleanTitle}" to study plan.`, 'success');
    }
    setIsSubModalOpen(false);
  };

  const handleLoadSample = () => {
    setState((prev) => ({
      ...prev,
      mainTopics: sampleCPALEData.mainTopics,
      subtopics: sampleCPALEData.subtopics,
      resources: sampleCPALEData.resources,
      examScores: sampleCPALEData.examScores,
      timeLogs: sampleCPALEData.timeLogs,
      activeSubtopicId: sampleCPALEData.subtopics[0].id,
    }));
  };

  // Status Badge Helper
  const renderStatusBadge = (status: TopicStatus) => {
    const config = {
      'Not Started': 'bg-slate-800 text-slate-300 border-slate-700 font-semibold',
      'In Progress': 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold',
      Reviewing: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-bold',
      Mastered: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold',
    }[status];

    return (
      <span className={`px-2.5 py-0.5 text-[11px] border rounded-full ${config}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header / Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 backdrop-blur-sm p-6 rounded-lg border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-serif text-slate-50 italic flex items-center gap-2">
            <span>Face 1: Topics Repository & Hierarchy</span>
          </h2>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mt-1">
            Archival Topic Tree & Master Module Ledger
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCombinedModal && (
            <button
              onClick={() => onOpenCombinedModal('exam')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-400 rounded transition-colors shadow-xs"
              title="Combine multiple subtopics into a single exam or study session"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Combine Topics</span>
            </button>
          )}

          <button
            onClick={openAddMainTopic}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Add Subject</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded border border-slate-800">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors uppercase"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors uppercase"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search topics or subtopics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 whitespace-nowrap font-mono">Filter Status:</span>
          {(['All', 'In Progress', 'Reviewing', 'Mastered', 'Not Started'] as const).map((st) => {
            const count = statusCounts[st];
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>{st}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {state.mainTopics.length === 0 ? (
        <div className="text-center py-16 px-6 bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">Start with a Blank Slate or Sample Data</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
            You currently have zero main topics. Create your custom board exam subjects manually, or load pre-built CPA Board Exam (CPALE) topics to test the application immediately.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={openAddMainTopic}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Main Topic</span>
            </button>
            <button
              onClick={handleLoadSample}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium text-xs rounded-xl border border-indigo-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Load CPALE Accounting Topics</span>
            </button>
          </div>
        </div>
      ) : (
        /* Hierarchical Topic Tree List */
        (() => {
          // Filter main topics: only show subjects that match search and have matching subtopics when a status filter is active
          const visibleMainTopics = state.mainTopics.filter((mt) => {
            const matchingSubtopics = state.subtopics.filter((st) => {
              if (st.mainTopicId !== mt.id) return false;
              if (statusFilter !== 'All' && st.status !== statusFilter) return false;
              if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchTitle = st.title.toLowerCase().includes(query);
                const matchCode = (st.code || '').toLowerCase().includes(query);
                const matchDesc = (st.description || '').toLowerCase().includes(query);
                return matchTitle || matchCode || matchDesc;
              }
              return true;
            });

            if (statusFilter !== 'All') {
              return matchingSubtopics.length > 0;
            }

            if (searchQuery.trim()) {
              const matchMainTitle = mt.title.toLowerCase().includes(searchQuery.toLowerCase());
              const matchMainCode = mt.code.toLowerCase().includes(searchQuery.toLowerCase());
              return matchingSubtopics.length > 0 || matchMainTitle || matchMainCode;
            }

            return true;
          });

          if (visibleMainTopics.length === 0) {
            return (
              <div className="text-center py-12 px-6 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
                <p className="text-sm font-semibold text-slate-300">
                  {statusFilter !== 'All'
                    ? `No subtopics currently marked as "${statusFilter}"`
                    : `No topics match "${searchQuery}"`}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust your search keyword or clear the status filter to view all topics.
                </p>
                <button
                  onClick={() => {
                    setStatusFilter('All');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Reset Filter & Search
                </button>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {visibleMainTopics.map((mt) => {
                const metrics = mainMetrics.find((m) => m.mainTopic.id === mt.id);
                // If a status filter is active or searching, default to expanded so user sees matching subtopics immediately
                const isExpanded = statusFilter !== 'All' || searchQuery.trim() !== ''
                  ? (expandedTopics[mt.id] ?? true)
                  : (expandedTopics[mt.id] ?? true);

                // Filter subtopics based on search and status
                const nestedSubtopics = state.subtopics.filter((st) => {
                  if (st.mainTopicId !== mt.id) return false;
                  if (statusFilter !== 'All' && st.status !== statusFilter) return false;
                  if (searchQuery.trim()) {
                    const query = searchQuery.toLowerCase();
                    const matchTitle = st.title.toLowerCase().includes(query);
                    const matchCode = (st.code || '').toLowerCase().includes(query);
                    const matchDesc = (st.description || '').toLowerCase().includes(query);
                    return matchTitle || matchCode || matchDesc;
                  }
                  return true;
                });

                const totalHoursLogged = metrics ? Math.round((metrics.totalTimeMinutes / 60) * 10) / 10 : 0;

                return (
                  <div
                    key={mt.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all shadow-md"
                  >
                    {/* Main Topic Header Strip */}
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 hover:bg-slate-900">
                      <div className="flex items-start sm:items-center gap-3">
                        <button
                          onClick={() => toggleExpand(mt.id)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors mt-0.5 sm:mt-0 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-amber-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 text-xs font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                              {mt.code}
                            </span>
                            <h3 className="text-base font-bold text-slate-100">{mt.title}</h3>
                            {mt.weightPercentage && (
                              <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                                Exam Weight: {mt.weightPercentage}%
                              </span>
                            )}
                          </div>
                          {mt.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{mt.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Main Topic Summary Stats */}
                      <div className="flex items-center gap-4 sm:gap-6 text-xs text-slate-300 ml-8 md:ml-0 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span>
                            Avg Exam:{' '}
                            <strong
                              className={
                                metrics?.averageExamScorePct !== null && metrics?.averageExamScorePct !== undefined
                                  ? metrics.averageExamScorePct >= 80
                                    ? 'text-emerald-400'
                                    : metrics.averageExamScorePct >= 60
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                                  : 'text-slate-500'
                              }
                            >
                              {metrics?.averageExamScorePct !== null && metrics?.averageExamScorePct !== undefined
                                ? `${metrics.averageExamScorePct}%`
                                : 'N/A'}
                            </strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span>
                            Time:{' '}
                            <strong className="text-slate-100 font-mono">
                              {totalHoursLogged} / {mt.targetHours} hrs
                            </strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openAddSubtopic(mt.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Add nested subtopic under this topic"
                          >
                            <FilePlus className="w-3.5 h-3.5" />
                            <span>Add Subtopic</span>
                          </button>

                          <button
                            onClick={() => openEditMainTopic(mt)}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Main Topic"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => requestDeleteMainTopic(mt.id, mt.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete Main Topic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Main Topic Progress Bar */}
                    <div className="w-full bg-slate-950 h-1.5 flex">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{
                          width: `${
                            metrics?.subtopicCount
                              ? Math.round((metrics.masteredCount / metrics.subtopicCount) * 100)
                              : 0
                          }%`,
                        }}
                        title="Mastered Subtopics Ratio"
                      />
                      <div
                        className="bg-blue-500 h-full transition-all"
                        style={{
                          width: `${
                            metrics?.subtopicCount
                              ? Math.round((metrics.inProgressCount / metrics.subtopicCount) * 100)
                              : 0
                          }%`,
                        }}
                        title="In Progress Subtopics Ratio"
                      />
                    </div>

                    {/* Subtopic Tree Table / Nested View */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 bg-slate-950/40 divide-y divide-slate-800/60">
                        {nestedSubtopics.length === 0 ? (
                          <div className="py-6 px-6 text-center text-xs text-slate-500">
                            No subtopics found matching the active filter.{' '}
                            <button
                              onClick={() => openAddSubtopic(mt.id)}
                              className="text-blue-400 hover:underline font-medium cursor-pointer"
                            >
                              Click here to add one.
                            </button>
                          </div>
                        ) : (
                          nestedSubtopics.map((st) => {
                            const avgExam = calculateSubtopicExamAvg(st.id, state.examScores);
                            const minutesLogged = calculateSubtopicTimeLogged(st.id, state.timeLogs);
                            const hoursLogged = Math.round((minutesLogged / 60) * 10) / 10;
                            const scoreCount = state.examScores.filter((e) => e.subtopicId === st.id).length;

                            return (
                              <div
                                key={st.id}
                                className="p-3.5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 transition-colors"
                              >
                                {/* Left: Code, Title, Description */}
                                <div className="flex items-start gap-3 pl-2 sm:pl-4 border-l-2 border-slate-800">
                                  <div className="pt-0.5">
                                    {renderStatusBadge(st.status)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      {st.code && (
                                        <span className="text-[11px] font-mono text-slate-400">
                                          [{st.code}]
                                        </span>
                                      )}
                                      <h4
                                        className="text-sm font-semibold text-slate-200 hover:text-amber-400 cursor-pointer transition-colors"
                                        onClick={() => onOpenSubtopic(st.id)}
                                      >
                                        {st.title}
                                      </h4>
                                    </div>
                                    {st.description && (
                                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                        {st.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Right: Score %, Time Logged, Actions */}
                                <div className="flex items-center gap-4 sm:gap-6 text-xs text-slate-300 ml-6 sm:ml-0 flex-wrap justify-between sm:justify-end">
                                  {/* Exam Score */}
                                  <div className="flex items-center gap-1.5" title="Average percentage across recorded exams">
                                    <Award className="w-3.5 h-3.5 text-amber-400" />
                                    <span>
                                      Exam Score:{' '}
                                      <strong
                                        className={
                                          avgExam !== null
                                            ? avgExam >= 80
                                              ? 'text-emerald-400 font-bold'
                                              : avgExam >= 60
                                              ? 'text-amber-400 font-bold'
                                              : 'text-rose-400 font-bold'
                                            : 'text-slate-400 font-normal'
                                        }
                                      >
                                        {avgExam !== null ? `${avgExam}%` : 'Untested'}
                                      </strong>
                                      {scoreCount > 0 && (
                                        <span className="text-[10px] text-slate-400 ml-1 font-semibold">
                                          ({scoreCount} test{scoreCount > 1 ? 's' : ''})
                                        </span>
                                      )}
                                    </span>
                                  </div>

                                  {/* Time Logged */}
                                  <div className="flex items-center gap-1.5" title="Logged study hours vs target">
                                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                                    <span>
                                      Study Time:{' '}
                                      <strong className="text-slate-200 font-mono">
                                        {hoursLogged} / {st.targetHours}h
                                      </strong>
                                    </span>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => onStartTimer(mt.id, st.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs transition-colors cursor-pointer"
                                      title="Start live study timer for this subtopic"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      <span className="hidden sm:inline">Timer</span>
                                    </button>

                                    <button
                                      onClick={() => onOpenSubtopic(st.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
                                      title="Open Subtopic Dashboard"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span>Dashboard</span>
                                    </button>

                                    <button
                                      onClick={() => openEditSubtopic(st)}
                                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Subtopic"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => requestDeleteSubtopic(st.id, st.title)}
                                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                      title="Delete Subtopic"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()
      )}

      {/* Main Topic Modal */}
      <Modal
        isOpen={isMainModalOpen}
        onClose={() => setIsMainModalOpen(false)}
        title={editingMainTopic ? 'Edit Main Topic' : 'Create Main Topic'}
      >
        <form onSubmit={handleSaveMainTopic} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Main Topic Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Regulatory Framework for Business Transactions (RFBT)"
              value={mtTitle}
              onChange={(e) => setMtTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Subject Code
              </label>
              <input
                type="text"
                placeholder="e.g., RFBT or FAR"
                value={mtCode}
                onChange={(e) => setMtCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Target Study Hours
              </label>
              <input
                type="number"
                min="1"
                placeholder="50"
                value={mtHours}
                onChange={(e) => setMtHours(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Board Exam Weight Percentage (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="15"
              value={mtWeight}
              onChange={(e) => setMtWeight(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Description / Scope Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Covers Law on Obligations, Contracts, Corporations, Bouncing Checks Act..."
              value={mtDesc}
              onChange={(e) => setMtDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsMainModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-md shadow-blue-500/20"
            >
              {editingMainTopic ? 'Save Changes' : 'Create Main Topic'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Subtopic Modal */}
      <Modal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        title={editingSubtopic ? 'Edit Subtopic' : 'Create Subtopic'}
      >
        <form onSubmit={handleSaveSubtopic} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Main Topic Container
            </label>
            <select
              value={selectedMainForSub}
              onChange={(e) => setSelectedMainForSub(e.target.value)}
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
              Subtopic Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Law on Obligations & Contracts"
              value={stTitle}
              onChange={(e) => setStTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Code / Tag
              </label>
              <input
                type="text"
                placeholder="e.g., Topic 1"
                value={stCode}
                onChange={(e) => setStCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Target Hours
              </label>
              <input
                type="number"
                min="1"
                placeholder="10"
                value={stHours}
                onChange={(e) => setStHours(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={stStatus}
                onChange={(e) => setStStatus(e.target.value as TopicStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Reviewing">Reviewing</option>
                <option value="Mastered">Mastered</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Description / Learning Objectives
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Sources of obligations, kinds of obligations, breach, remedies, and extinguishment."
              value={stDesc}
              onChange={(e) => setStDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsSubModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
            >
              {editingSubtopic ? 'Save Changes' : 'Create Subtopic'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (In-App, non-blocking) */}
      <Modal
        isOpen={Boolean(deleteConfirm?.isOpen)}
        onClose={() => setDeleteConfirm(null)}
        title={deleteConfirm?.type === 'main' ? 'Delete Subject / Main Topic' : 'Delete Subtopic'}
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-950/30 border border-rose-800/50 rounded-xl">
            <p className="text-xs text-rose-200 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-rose-100 font-bold">"{deleteConfirm?.title}"</strong>?
            </p>
            {deleteConfirm?.type === 'main' && (
              <p className="text-[11px] text-rose-300/80 mt-1.5 leading-normal">
                This will also remove all nested subtopics, flashcards, resources, exam scores, and time logs associated with this subject.
              </p>
            )}
            {deleteConfirm?.type === 'sub' && (
              <p className="text-[11px] text-rose-300/80 mt-1.5 leading-normal">
                This will also remove all study resources, exam scores, and time logs associated with this subtopic.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeDelete}
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors shadow-md shadow-rose-600/30 cursor-pointer"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
