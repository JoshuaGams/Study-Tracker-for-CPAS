import React, { useState } from 'react';
import {
  Layers,
  Award,
  Clock,
  Check,
  Search,
  Sliders,
  HelpCircle,
  Plus,
  Zap,
} from 'lucide-react';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { sanitizeString, sanitizeNumber } from '../lib/sanitize';
import { ApplicationState, SessionType } from '../types';
import {
  generateCombinedExamScores,
  generateCombinedTimeLogs,
} from '../lib/multiTopicHelpers';

interface CombinedTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: ApplicationState;
  setState: React.Dispatch<React.SetStateAction<ApplicationState>>;
  defaultTab?: 'exam' | 'time';
}

export const CombinedTopicModal: React.FC<CombinedTopicModalProps> = ({
  isOpen,
  onClose,
  state,
  setState,
  defaultTab = 'exam',
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'exam' | 'time'>(defaultTab);

  // Common State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<string[]>([]);

  // Exam Form State
  const [examName, setExamName] = useState('Comprehensive Pre-Board Exam 1');
  const [totalScore, setTotalScore] = useState<number>(80);
  const [totalMaxScore, setTotalMaxScore] = useState<number>(100);
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [examNotes, setExamNotes] = useState('');
  const [examStrategy, setExamStrategy] = useState<'equal' | 'custom_items'>('equal');
  const [customExamItems, setCustomExamItems] = useState<{
    [stId: string]: { itemCount: number; correctCount: number };
  }>({});

  // Time Form State
  const [timeNotes, setTimeNotes] = useState('Multi-topic comprehensive study block');
  const [totalHours, setTotalHours] = useState<number>(2);
  const [totalMinutesInput, setTotalMinutesInput] = useState<number>(0); // additional mins
  const [sessionType, setSessionType] = useState<SessionType>('Practice Drills');
  const [timeDate, setTimeDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [timeStrategy, setTimeStrategy] = useState<'equal' | 'custom_time'>('equal');
  const [customMinutes, setCustomMinutes] = useState<{ [stId: string]: number }>({});

  const handleToggleSubtopic = (id: string) => {
    setSelectedSubtopicIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectSubjectAll = (mainTopicId: string) => {
    const subjectSubtopics = state.subtopics
      .filter((s) => s.mainTopicId === mainTopicId)
      .map((s) => s.id);
    const allSelected = subjectSubtopics.every((id) => selectedSubtopicIds.includes(id));

    if (allSelected) {
      setSelectedSubtopicIds((prev) => prev.filter((id) => !subjectSubtopics.includes(id)));
    } else {
      setSelectedSubtopicIds((prev) => Array.from(new Set([...prev, ...subjectSubtopics])));
    }
  };

  const handleSaveCombinedExam = () => {
    if (selectedSubtopicIds.length < 2) {
      showToast('Selection Required', 'Please select at least 2 subtopics to combine in an exam entry.', 'error');
      return;
    }
    if (totalMaxScore <= 0 || totalScore < 0) {
      showToast('Validation Error', 'Please enter valid test score numbers.', 'error');
      return;
    }
    if (totalScore > totalMaxScore) {
      showToast('Validation Error', 'Total score cannot exceed total maximum score.', 'error');
      return;
    }

    const cleanExamName = sanitizeString(examName, 120) || 'Comprehensive Pre-Board Exam';
    const cleanNotes = sanitizeString(examNotes, 300);

    const newScores = generateCombinedExamScores(
      {
        examName: cleanExamName,
        selectedSubtopicIds,
        totalScore,
        totalMaxScore,
        date: examDate || new Date().toISOString().slice(0, 10),
        notes: cleanNotes,
        splitStrategy: examStrategy,
        customItems: customExamItems,
      },
      state.subtopics,
      state.mainTopics
    );

    setState((prev) => ({
      ...prev,
      examScores: [...newScores, ...prev.examScores],
    }));

    showToast(
      'Multi-Topic Exam Logged',
      `Apportioned exam "${cleanExamName}" recorded across ${newScores.length} subtopics.`,
      'success'
    );
    onClose();
  };

  const handleSaveCombinedTime = () => {
    if (selectedSubtopicIds.length < 2) {
      showToast('Selection Required', 'Please select at least 2 subtopics to combine in a study session.', 'error');
      return;
    }

    const totalDurationMinutes = totalHours * 60 + totalMinutesInput;
    if (totalDurationMinutes <= 0) {
      showToast('Validation Error', 'Please enter a valid total study duration.', 'error');
      return;
    }

    const cleanTimeNotes = sanitizeString(timeNotes, 300);

    const newLogs = generateCombinedTimeLogs(
      {
        notes: cleanTimeNotes,
        selectedSubtopicIds,
        totalDurationMinutes,
        sessionType,
        date: timeDate || new Date().toISOString().slice(0, 10),
        splitStrategy: timeStrategy,
        customMinutes,
      },
      state.subtopics,
      state.mainTopics
    );

    setState((prev) => ({
      ...prev,
      timeLogs: [...newLogs, ...prev.timeLogs],
    }));

    showToast(
      'Combined Session Logged',
      `Logged ${totalDurationMinutes} mins of study across ${newLogs.length} subtopics.`,
      'success'
    );
    onClose();
  };

  // Filter subtopics by search
  const filteredSubtopics = state.subtopics.filter((st) => {
    const parentMain = state.mainTopics.find((m) => m.id === st.mainTopicId);
    const text = `${st.title} ${st.code || ''} ${parentMain?.title || ''} ${parentMain?.code || ''}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  const overallAccuracyPct = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
  const calculatedTotalMinutes = totalHours * 60 + totalMinutesInput;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Combine Topics & Multi-Topic Log Engine"
      maxWidth="2xl"
    >
      <div className="space-y-5 text-slate-200">
        {/* Entry Mode Selector */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('exam')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'exam'
                ? 'bg-amber-900/30 border border-amber-800/60 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Multi-Topic Exam / Pre-Board Score</span>
          </button>
          <button
            onClick={() => setActiveTab('time')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'time'
                ? 'bg-amber-900/30 border border-amber-800/60 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Multi-Topic Study Session Time</span>
          </button>
        </div>

        {/* TOPIC SELECTION SECTION */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-mono uppercase tracking-widest font-semibold text-slate-200">
                1. Select Topics Covered ({selectedSubtopicIds.length} Selected)
              </h4>
            </div>
            {selectedSubtopicIds.length > 0 && (
              <button
                onClick={() => setSelectedSubtopicIds([])}
                className="text-[10px] text-slate-400 hover:text-rose-400 underline font-mono"
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search subjects or subtopics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Subtopics Checklist Grouped by Main Subject */}
          <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
            {state.mainTopics.map((mt) => {
              const mtSubtopics = filteredSubtopics.filter((st) => st.mainTopicId === mt.id);
              if (mtSubtopics.length === 0) return null;

              const allMtSelected = mtSubtopics.every((st) => selectedSubtopicIds.includes(st.id));

              return (
                <div key={mt.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80">
                    <span className="text-slate-300">
                      [{mt.code}] {mt.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectSubjectAll(mt.id)}
                      className="text-[10px] text-amber-400 hover:underline uppercase"
                    >
                      {allMtSelected ? 'Deselect Subject' : 'Select All Subject'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                    {mtSubtopics.map((st) => {
                      const isSelected = selectedSubtopicIds.includes(st.id);
                      return (
                        <div
                          key={st.id}
                          onClick={() => handleToggleSubtopic(st.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-800/70 text-amber-200'
                              : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] transition-colors ${
                              isSelected
                                ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                                : 'border-slate-700 bg-slate-950'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{st.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedSubtopicIds.length < 2 && (
            <p className="text-[11px] text-amber-400/90 italic flex items-center gap-1 font-mono">
              <HelpCircle className="w-3 h-3" />
              Select at least 2 topics above to compute multi-topic splitting.
            </p>
          )}
        </div>

        {/* COMBINED EXAM FORM */}
        {activeTab === 'exam' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Exam Title / Label
                </label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g. Pre-board Mock Exam 1"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Date Administered
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Score inputs */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 grid grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Total Items Correct
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalScore}
                  onChange={(e) => setTotalScore(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm font-bold text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Total Exam Items (Max)
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalMaxScore}
                  onChange={(e) => setTotalMaxScore(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm font-bold text-slate-100 focus:outline-none"
                />
              </div>

              <div className="text-right">
                <span className="block text-[10px] font-mono text-slate-500 uppercase">
                  Calculated Accuracy
                </span>
                <span
                  className={`text-xl font-serif font-bold ${
                    overallAccuracyPct >= 80
                      ? 'text-emerald-400'
                      : overallAccuracyPct >= 60
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {overallAccuracyPct}%
                </span>
              </div>
            </div>

            {/* Strategy radio */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Score & Diagnostic Apportionment Rule
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  className={`p-3 rounded-lg border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                    examStrategy === 'equal'
                      ? 'bg-amber-950/30 border-amber-800/60 text-slate-100'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="examStrategy"
                    checked={examStrategy === 'equal'}
                    onChange={() => setExamStrategy('equal')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-200">
                      ⚖️ Equal Distribution (Proportional)
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                      Splits the overall {overallAccuracyPct}% score accuracy proportionally across all {selectedSubtopicIds.length || 'N'} selected subtopics.
                    </span>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-lg border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                    examStrategy === 'custom_items'
                      ? 'bg-amber-950/30 border-amber-800/60 text-slate-100'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="examStrategy"
                    checked={examStrategy === 'custom_items'}
                    onChange={() => setExamStrategy('custom_items')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-200">
                      📊 Custom Question Item Breakdown
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                      Enter exact question count & score earned per subtopic module.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Custom items input breakdown if custom_items selected */}
            {examStrategy === 'custom_items' && selectedSubtopicIds.length > 0 && (
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2 max-h-40 overflow-y-auto">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Per-Subtopic Items & Score Breakdown
                </span>
                {selectedSubtopicIds.map((stId) => {
                  const st = state.subtopics.find((s) => s.id === stId);
                  const current = customExamItems[stId] || { itemCount: 20, correctCount: 16 };
                  return (
                    <div
                      key={stId}
                      className="flex items-center justify-between gap-3 text-xs bg-slate-900 p-2 rounded border border-slate-800"
                    >
                      <span className="font-medium text-slate-300 truncate max-w-[160px]">
                        {st?.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Correct"
                          value={current.correctCount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomExamItems((prev) => ({
                              ...prev,
                              [stId]: { ...current, correctCount: val },
                            }));
                          }}
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs font-mono"
                        />
                        <span className="text-slate-500">/</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="Total items"
                          value={current.itemCount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomExamItems((prev) => ({
                              ...prev,
                              [stId]: { ...current, itemCount: val },
                            }));
                          }}
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Optional Notes / Exam Details
              </label>
              <input
                type="text"
                value={examNotes}
                onChange={(e) => setExamNotes(e.target.value)}
                placeholder="e.g. School pre-board examination round 1"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveCombinedExam}
              disabled={selectedSubtopicIds.length < 2}
              className="w-full py-2.5 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-800/60 text-amber-400 font-bold text-xs uppercase tracking-widest rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              <Zap className="w-4 h-4" />
              <span>Log Multi-Topic Exam Scores ({selectedSubtopicIds.length} Subtopics)</span>
            </button>
          </div>
        )}

        {/* COMBINED TIME FORM */}
        {activeTab === 'time' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Session Notes / Title
                </label>
                <input
                  type="text"
                  value={timeNotes}
                  onChange={(e) => setTimeNotes(e.target.value)}
                  placeholder="e.g. Multi-subject weekend review"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Session Type
                </label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as SessionType)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none"
                >
                  <option value="Practice Drills">Practice Drills</option>
                  <option value="Mock Exam">Mock Exam</option>
                  <option value="Reading">Reading</option>
                  <option value="Revision">Revision</option>
                  <option value="Flashcards">Flashcards</option>
                  <option value="Video Lecture">Video Lecture</option>
                </select>
              </div>
            </div>

            {/* Time inputs */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 grid grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Hours
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalHours}
                  onChange={(e) => setTotalHours(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm font-bold text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={totalMinutesInput}
                  onChange={(e) => setTotalMinutesInput(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm font-bold text-slate-100 focus:outline-none"
                />
              </div>

              <div className="text-right">
                <span className="block text-[10px] font-mono text-slate-500 uppercase">
                  Total Duration
                </span>
                <span className="text-xl font-serif font-bold text-amber-400">
                  {calculatedTotalMinutes} mins
                </span>
              </div>
            </div>

            {/* Strategy radio */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Time Distribution Rule
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  className={`p-3 rounded-lg border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                    timeStrategy === 'equal'
                      ? 'bg-amber-950/30 border-amber-800/60 text-slate-100'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="timeStrategy"
                    checked={timeStrategy === 'equal'}
                    onChange={() => setTimeStrategy('equal')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-200">
                      ⚖️ Equal Time Allocation
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                      Divides total duration ({calculatedTotalMinutes} mins) equally across all {selectedSubtopicIds.length || 'N'} selected subtopics.
                    </span>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-lg border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                    timeStrategy === 'custom_time'
                      ? 'bg-amber-950/30 border-amber-800/60 text-slate-100'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="timeStrategy"
                    checked={timeStrategy === 'custom_time'}
                    onChange={() => setTimeStrategy('custom_time')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-semibold block text-slate-200">
                      ⏱️ Custom Time Breakdown
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                      Enter specific study minutes per subtopic.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Custom minutes input if custom_time selected */}
            {timeStrategy === 'custom_time' && selectedSubtopicIds.length > 0 && (
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2 max-h-40 overflow-y-auto">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Minutes Allocated Per Subtopic
                </span>
                {selectedSubtopicIds.map((stId) => {
                  const st = state.subtopics.find((s) => s.id === stId);
                  const val = customMinutes[stId] ?? Math.round(calculatedTotalMinutes / selectedSubtopicIds.length);
                  return (
                    <div
                      key={stId}
                      className="flex items-center justify-between gap-3 text-xs bg-slate-900 p-2 rounded border border-slate-800"
                    >
                      <span className="font-medium text-slate-300 truncate max-w-[180px]">
                        {st?.title}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          value={val}
                          onChange={(e) => {
                            const newMins = Number(e.target.value);
                            setCustomMinutes((prev) => ({ ...prev, [stId]: newMins }));
                          }}
                          className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs font-mono"
                        />
                        <span className="text-[10px] font-mono text-slate-500">mins</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Date Performed
              </label>
              <input
                type="date"
                value={timeDate}
                onChange={(e) => setTimeDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveCombinedTime}
              disabled={selectedSubtopicIds.length < 2}
              className="w-full py-2.5 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-800/60 text-amber-400 font-bold text-xs uppercase tracking-widest rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              <Zap className="w-4 h-4" />
              <span>Log Multi-Topic Study Time ({calculatedTotalMinutes} mins)</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
