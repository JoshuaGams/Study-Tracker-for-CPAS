import React, { useState, useEffect } from 'react';
import {
  FileText,
  Link2,
  Paperclip,
  Plus,
  Trash2,
  Award,
  Clock,
  ExternalLink,
  Save,
  CheckCircle2,
  ChevronLeft,
  Sparkles,
  Calendar,
  Layers,
  BookOpen,
  Play,
} from 'lucide-react';
import { ApplicationState, Subtopic, NoteResource, ExamScore, TopicStatus } from '../types';
import { calculateSubtopicExamAvg, calculateSubtopicTimeLogged } from '../lib/analytics';
import { sanitizeString, sanitizeNumber, sanitizeUrl } from '../lib/sanitize';
import { Modal } from './Modal';
import { useToast } from './Toast';

interface SubtopicDashboardProps {
  state: ApplicationState;
  setState: React.Dispatch<React.SetStateAction<ApplicationState>>;
  subtopicId: string | null;
  onBackToOverview: () => void;
  onStartTimer: (mainTopicId: string, subtopicId: string) => void;
  onOpenCombinedModal?: (tab?: 'exam' | 'time') => void;
}

export const SubtopicDashboard: React.FC<SubtopicDashboardProps> = ({
  state,
  setState,
  subtopicId,
  onBackToOverview,
  onStartTimer,
  onOpenCombinedModal,
}) => {
  const { showToast } = useToast();

  // Find current subtopic or fallback to first available
  const subtopic = state.subtopics.find((s) => s.id === subtopicId) || state.subtopics[0];
  const mainTopic = state.mainTopics.find((m) => m.id === subtopic?.mainTopicId);

  // Form States for Links & Files
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<NoteResource['type']>('link');
  const [resUrl, setResUrl] = useState('');
  const [resDesc, setResDesc] = useState('');

  // Form States for Exam Scores
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examName, setExamName] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('50');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [examNotes, setExamNotes] = useState('');

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'resource' | 'score';
    id: string;
    title: string;
  } | null>(null);

  // Scratchpad Notes State
  const [scratchpadText, setScratchpadText] = useState(subtopic?.notesScratchpad || '');
  const [isSavedScratchpad, setIsSavedScratchpad] = useState(false);

  // Sync scratchpad when switching to a different subtopic ID
  useEffect(() => {
    setScratchpadText(subtopic?.notesScratchpad || '');
  }, [subtopic?.id]);

  if (!subtopic) {
    return (
      <div className="text-center py-20 px-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-200">No Subtopic Selected</h3>
        <p className="text-sm text-slate-400 mt-1">
          Select or create a subtopic from the Topic Overview to view its detailed dashboard.
        </p>
        <button
          onClick={onBackToOverview}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          Go to Topic Overview
        </button>
      </div>
    );
  }

  // Filtered subtopic resources, scores, and time logs
  const subResources = state.resources.filter((r) => r.subtopicId === subtopic.id);
  const subScores = state.examScores.filter((e) => e.subtopicId === subtopic.id);
  const subTimeLogs = state.timeLogs.filter((l) => l.subtopicId === subtopic.id);

  const avgPercentage = calculateSubtopicExamAvg(subtopic.id, state.examScores);
  const totalTimeMinutes = calculateSubtopicTimeLogged(subtopic.id, state.timeLogs);
  const totalHoursLogged = Math.round((totalTimeMinutes / 60) * 10) / 10;

  // Add Resource Link/File
  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeString(resTitle, 120);
    const cleanUrl = sanitizeUrl(resUrl);
    const cleanDesc = sanitizeString(resDesc, 300);

    if (!cleanTitle || !cleanUrl) {
      showToast('Validation Error', 'Please enter a title and a valid resource URL/path.', 'error');
      return;
    }

    const newRes: NoteResource = {
      id: `res-${Date.now()}`,
      subtopicId: subtopic.id,
      title: cleanTitle,
      type: resType,
      urlOrPath: cleanUrl,
      description: cleanDesc,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      resources: [...prev.resources, newRes],
    }));

    setResTitle('');
    setResUrl('');
    setResDesc('');
    setIsLinkModalOpen(false);
    showToast('Resource Added', `Attached "${cleanTitle}" to ${subtopic.title}.`, 'success');
  };

  const executeDeleteResource = () => {
    if (!deleteConfirm || deleteConfirm.type !== 'resource') return;
    const targetId = deleteConfirm.id;
    setState((prev) => ({
      ...prev,
      resources: prev.resources.filter((r) => r.id !== targetId),
    }));
    setDeleteConfirm(null);
    showToast('Resource Removed', 'Reference was deleted.', 'info');
  };

  // Add Exam Score Entry
  const handleAddExamScore = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeString(examName, 100);
    const numScore = sanitizeNumber(score, NaN, 0, 10000);
    const numMax = sanitizeNumber(maxScore, NaN, 1, 10000);
    const cleanNotes = sanitizeString(examNotes, 250);

    if (!cleanName) {
      showToast('Validation Error', 'Please enter an assessment or drill title.', 'error');
      return;
    }
    if (isNaN(numScore) || isNaN(numMax) || numMax <= 0) {
      showToast('Validation Error', 'Please provide valid numerical scores.', 'error');
      return;
    }
    if (numScore > numMax) {
      showToast('Score Exceeds Maximum', 'Score cannot exceed the total maximum points.', 'error');
      return;
    }

    const newScore: ExamScore = {
      id: `es-${Date.now()}`,
      subtopicId: subtopic.id,
      examName: cleanName,
      score: numScore,
      maxScore: numMax,
      date: examDate || new Date().toISOString().slice(0, 10),
      notes: cleanNotes,
    };

    setState((prev) => ({
      ...prev,
      examScores: [...prev.examScores, newScore],
    }));

    setExamName('');
    setScore('');
    setExamNotes('');
    setIsExamModalOpen(false);
    showToast('Assessment Recorded', `Saved score of ${numScore}/${numMax} (${Math.round((numScore / numMax) * 100)}%).`, 'success');
  };

  const executeDeleteExamScore = () => {
    if (!deleteConfirm || deleteConfirm.type !== 'score') return;
    const targetId = deleteConfirm.id;
    setState((prev) => ({
      ...prev,
      examScores: prev.examScores.filter((e) => e.id !== targetId),
    }));
    setDeleteConfirm(null);
    showToast('Score Deleted', 'Exam score entry removed from diagnostics.', 'info');
  };

  // Update Status
  const handleStatusChange = (newStatus: TopicStatus) => {
    setState((prev) => ({
      ...prev,
      subtopics: prev.subtopics.map((s) =>
        s.id === subtopic.id ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s
      ),
    }));
    showToast('Status Updated', `Marked ${subtopic.title} as ${newStatus}`, 'success');
  };

  // Save Scratchpad
  const handleSaveScratchpad = () => {
    const cleanNotes = sanitizeString(scratchpadText, 10000);
    setState((prev) => ({
      ...prev,
      subtopics: prev.subtopics.map((s) =>
        s.id === subtopic.id ? { ...s, notesScratchpad: cleanNotes, updatedAt: new Date().toISOString() } : s
      ),
    }));
    setIsSavedScratchpad(true);
    showToast('Scratchpad Saved', 'Study notes safely updated in ledger.', 'success');
    setTimeout(() => setIsSavedScratchpad(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBackToOverview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Topic Overview</span>
        </button>

        {/* Quick Subtopic Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Switch Subtopic:</span>
          <select
            value={subtopic.id}
            onChange={(e) => {
              const targetId = e.target.value;
              setState((prev) => ({ ...prev, activeSubtopicId: targetId }));
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 max-w-xs"
          >
            {state.subtopics.map((s) => {
              const parent = state.mainTopics.find((m) => m.id === s.mainTopicId);
              return (
                <option key={s.id} value={s.id}>
                  [{parent?.code || 'GEN'}] {s.title}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Hero Subtopic Detail Card */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-6 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold uppercase text-slate-400 rounded">
                {mainTopic?.code || 'FAR'}
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                {mainTopic?.title || 'Main Subject'}
              </span>
            </div>

            <h2 className="text-3xl font-serif text-slate-50 tracking-tight">
              {subtopic.title}
            </h2>

            {subtopic.description && (
              <p className="text-sm text-slate-400 leading-relaxed">
                {subtopic.description}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                Revision Status:
              </span>
              <select
                value={subtopic.status}
                onChange={(e) => handleStatusChange(e.target.value as TopicStatus)}
                className="px-3 py-1 bg-amber-900/20 border border-amber-800/50 text-amber-400 font-bold text-[10px] uppercase tracking-wider rounded-full focus:outline-none"
              >
                <option value="Not Started" className="bg-slate-900 text-slate-300">Not Started</option>
                <option value="In Progress" className="bg-slate-900 text-amber-400">In Progress</option>
                <option value="Reviewing" className="bg-slate-900 text-indigo-400">Reviewing</option>
                <option value="Mastered" className="bg-slate-900 text-emerald-400">Mastered</option>
              </select>
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Avg Accuracy
              </span>
              <div className="text-2xl font-serif flex items-center gap-1.5">
                <Award className="w-5 h-5 text-amber-500" />
                <span
                  className={
                    avgPercentage !== null
                      ? avgPercentage >= 80
                        ? 'text-emerald-400 font-bold'
                        : avgPercentage >= 60
                        ? 'text-amber-400 font-bold'
                        : 'text-rose-400 font-bold'
                      : 'text-slate-400'
                  }
                >
                  {avgPercentage !== null ? `${avgPercentage}%` : 'N/A'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 block font-medium">
                {subScores.length} tests recorded
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Hours Logged
              </span>
              <div className="text-2xl font-serif text-slate-100 flex items-center gap-1.5 font-bold">
                <Clock className="w-5 h-5 text-blue-400" />
                <span>{totalHoursLogged}h</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 block font-medium">
                Target: {subtopic.targetHours}h
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1 flex flex-col justify-center">
              <button
                onClick={() => onStartTimer(subtopic.mainTopicId, subtopic.id)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-xl shadow-xs cursor-pointer"
              >
                Start Timer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Exam Score Section & Link/File Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Exam Performance & Score Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Exam & Drill Performance</h3>
                <p className="text-xs text-slate-400">Input quiz scores to calculate percentage accuracy</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenCombinedModal && (
                <button
                  onClick={() => onOpenCombinedModal('exam')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-400 border border-amber-800/60 rounded-xl text-xs font-semibold transition-colors shadow-xs"
                  title="Record a pre-board or multi-topic exam score"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Combine Topics Exam</span>
                </button>
              )}

              <button
                onClick={() => setIsExamModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Score</span>
              </button>
            </div>
          </div>

          {/* Exam Auto-Calculation Summary Banner */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block">Subtopic Average Score:</span>
              <span
                className={`text-lg font-black ${
                  avgPercentage !== null
                    ? avgPercentage >= 80
                      ? 'text-emerald-400'
                      : avgPercentage >= 60
                      ? 'text-amber-400'
                      : 'text-rose-400'
                    : 'text-slate-500'
                }`}
              >
                {avgPercentage !== null ? `${avgPercentage}%` : 'No Exams Recorded'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block">Status Diagnosis:</span>
              <span className="font-semibold text-slate-200">
                {avgPercentage === null
                  ? 'Untested'
                  : avgPercentage >= 80
                  ? 'Mastered / Strong'
                  : avgPercentage >= 60
                  ? 'Moderate / Pass'
                  : 'Weak Area (High Priority)'}
              </span>
            </div>
          </div>

          {/* Exam Score List */}
          {subScores.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              No exam or drill scores recorded yet for this subtopic.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {subScores.map((sc) => {
                const pct = sc.maxScore > 0 ? Math.round((sc.score / sc.maxScore) * 100) : 0;
                return (
                  <div
                    key={sc.id}
                    className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{sc.examName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({sc.date})</span>
                      </div>
                      {sc.notes && <p className="text-[11px] text-slate-400 mt-0.5">{sc.notes}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono text-slate-300 font-medium">
                          {sc.score} / {sc.maxScore}
                        </span>
                        <span
                          className={`block font-bold text-[11px] ${
                            pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            isOpen: true,
                            type: 'score',
                            id: sc.id,
                            title: sc.examName,
                          })
                        }
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Delete entry"
                        aria-label={`Delete score entry for ${sc.examName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Links to Notes & File Attachments */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
                <Link2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Notes & Resource References</h3>
                <p className="text-xs text-slate-400">Attach Notion pages, Drive docs, Quizlet sets, or local files</p>
              </div>
            </div>

            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              aria-label="Add resource reference"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Resource</span>
            </button>
          </div>

          {/* Resources List */}
          {subResources.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              No notes links or file references attached yet.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {subResources.map((res) => (
                <div
                  key={res.id}
                  className="flex items-start justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-blue-400 mt-0.5">
                      {res.type === 'file_reference' ? (
                        <Paperclip className="w-4 h-4" />
                      ) : (
                        <Link2 className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-200">{res.title}</h4>
                      {res.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{res.description}</p>
                      )}
                      <a
                        href={res.urlOrPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline mt-1 break-all"
                      >
                        <span>{res.urlOrPath}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        type: 'resource',
                        id: res.id,
                        title: res.title,
                      })
                    }
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    title="Remove reference"
                    aria-label={`Remove reference ${res.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Subtopic Scratchpad & Notes Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Subtopic Notes & Key Formulas Scratchpad</h3>
              <p className="text-xs text-slate-400">
                Keep crucial mnemonic rules, legal exceptions, or PAS/PFRS formulas readily available
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveScratchpad}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            {isSavedScratchpad ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Notes</span>
              </>
            )}
          </button>
        </div>

        <textarea
          rows={6}
          placeholder="Type or paste essential formulas, key board exam jurisprudence, tax tables, or study reminders here..."
          value={scratchpadText}
          onChange={(e) => setScratchpadText(e.target.value)}
          className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
        />
      </div>

      {/* Modal: Add Resource Link/File */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Add Notes Link or File Reference"
      >
        <form onSubmit={handleAddResource} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Resource Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., PAS 16 Valix Handout or Notion Law Notes"
              value={resTitle}
              onChange={(e) => setResTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Resource Type
            </label>
            <select
              value={resType}
              onChange={(e) => setResType(e.target.value as NoteResource['type'])}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="link">Web Link / Notion / Google Doc</option>
              <option value="quizlet">Quizlet / Flashcards Link</option>
              <option value="file_reference">Local File Path / PDF Reference</option>
              <option value="doc">Study PDF / Summary Doc</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              URL or Local File Path *
            </label>
            <input
              type="text"
              required
              placeholder="https://drive.google.com/file/... or file:///C:/study/far_notes.pdf"
              value={resUrl}
              onChange={(e) => setResUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Short Description / Tags
            </label>
            <input
              type="text"
              placeholder="e.g., Contains 50 practice problems with detailed solution keys"
              value={resDesc}
              onChange={(e) => setResDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-md shadow-blue-500/20"
            >
              Attach Resource
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Exam Score Entry */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title="Record Exam / Drill Score"
      >
        <form onSubmit={handleAddExamScore} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Exam Name / Assessment Type *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Pre-board Exam 1, Chapter Quiz, or Drills Set A"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Your Score *
              </label>
              <input
                type="number"
                step="0.5"
                required
                min="0"
                placeholder="35"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Max Possible Score *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="50"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Assessment Date
            </label>
            <input
              type="date"
              required
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Reflection / Error Analysis
            </label>
            <input
              type="text"
              placeholder="e.g., Missed 3 items on joint & solidary liability provisions"
              value={examNotes}
              onChange={(e) => setExamNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Save Exam Score
            </button>
          </div>
        </form>
      </Modal>

      {/* In-app Delete Confirmation Dialog */}
      <Modal
        isOpen={Boolean(deleteConfirm?.isOpen)}
        onClose={() => setDeleteConfirm(null)}
        title={deleteConfirm?.type === 'score' ? 'Delete Assessment Score' : 'Delete Resource Link'}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-slate-100">"{deleteConfirm?.title}"</span>? This entry will be removed from your diagnostic study records.
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
              onClick={deleteConfirm?.type === 'score' ? executeDeleteExamScore : executeDeleteResource}
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
