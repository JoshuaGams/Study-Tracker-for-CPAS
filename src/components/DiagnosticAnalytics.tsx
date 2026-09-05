import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Zap,
  TrendingUp,
  Clock,
  Award,
  ExternalLink,
  Printer,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { ApplicationState, DiagnosticItem } from '../types';
import { diagnoseSubtopics, calculateOverallBoardReadiness } from '../lib/analytics';
import { generateGoogleSheetsTSV } from '../lib/appsScriptAdapter';
import { isAppAdmin } from '../lib/auth';
import { useToast } from './Toast';

interface DiagnosticAnalyticsProps {
  state: ApplicationState;
  setState: React.Dispatch<React.SetStateAction<ApplicationState>>;
  onOpenSubtopic: (subtopicId: string) => void;
  onStartTimer: (mainTopicId: string, subtopicId: string) => void;
  onOpenCombinedModal?: (tab?: 'exam' | 'time') => void;
}

export const DiagnosticAnalytics: React.FC<DiagnosticAnalyticsProps> = ({
  state,
  setState,
  onOpenSubtopic,
  onStartTimer,
  onOpenCombinedModal,
}) => {
  const { showToast } = useToast();
  const [selectedClassificationFilter, setSelectedClassificationFilter] = useState<string>('All');

  const diagnostics = diagnoseSubtopics(
    state.mainTopics,
    state.subtopics,
    state.examScores,
    state.timeLogs
  );

  const readiness = calculateOverallBoardReadiness(
    state.mainTopics,
    state.subtopics,
    state.examScores,
    state.timeLogs
  );

  // Scatter Plot Data: X = Time Spent (Hours), Y = Exam Score %
  const scatterData = diagnostics.map((d) => ({
    id: d.subtopic.id,
    name: d.subtopic.title,
    mainCode: d.mainTopic.code || 'GEN',
    xHours: Math.round((d.totalTimeMinutes / 60) * 10) / 10,
    yScore: d.averageScorePercentage,
    classification: d.classification,
  }));

  // Sort by priority (weak & untested first)
  const sortedDiagnostics = [...diagnostics].sort((a, b) => b.priorityScore - a.priorityScore);

  const filteredDiagnostics = sortedDiagnostics.filter((d) => {
    if (selectedClassificationFilter === 'All') return true;
    return d.classification === selectedClassificationFilter;
  });

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 print:p-0 print:bg-white print:text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 backdrop-blur-sm p-6 rounded-lg border border-slate-800 shadow-xl print:border-none print:p-0">
        <div>
          <h2 className="text-2xl font-serif text-slate-50 italic flex items-center gap-2 print:text-black">
            <span>Face 4: Diagnostic Performance Analytics</span>
          </h2>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mt-1 print:text-slate-600">
            Algorithmic Classification & Time Efficiency Diagnosis
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap print:hidden">
          {onOpenCombinedModal && (
            <button
              onClick={() => onOpenCombinedModal('exam')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-400 text-[10px] font-bold font-mono uppercase tracking-widest rounded transition-colors shadow-xs cursor-pointer"
              title="Log multi-topic exam scores or study sessions"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Combine Topics Log</span>
            </button>
          )}

          {isAppAdmin(state.currentUser) && (
            <button
              onClick={() => {
                const tsv = generateGoogleSheetsTSV(state, 'summary');
                navigator.clipboard.writeText(tsv);
                showToast('Copied Summary TSV', 'Diagnostic summary copied. Paste directly into Google Sheets with Ctrl+V.', 'success');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-mono uppercase tracking-wider rounded border border-emerald-800/60 transition-colors cursor-pointer"
              title="Copy formatted spreadsheet diagnostic summary (Admin Only)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copy Sheets TSV</span>
            </button>
          )}

          <button
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono uppercase tracking-wider rounded border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Readiness Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Overall Readiness</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-serif text-slate-100">
            {readiness.overallAveragePct > 0 ? `${readiness.overallAveragePct}%` : 'N/A'}
          </div>
          <p className="text-xs text-amber-500 font-semibold truncate">{readiness.readinessLabel}</p>
        </div>

        {/* Strong Topics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Strong Topics</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{readiness.strongTopicCount}</div>
          <p className="text-xs text-slate-400 font-medium">Exam accuracy ≥ 80%</p>
        </div>

        {/* Weak Topics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Weak Topics</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400">{readiness.weakTopicCount}</div>
          <p className="text-xs text-rose-400 font-semibold">Exam accuracy &lt; 60% (Action Needed)</p>
        </div>

        {/* Total Time & Exams */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Study Hours / Exams</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-slate-100">{readiness.totalStudyHours}h</div>
          <p className="text-xs text-slate-400 font-medium">{readiness.totalExamsTaken} total exam entries</p>
        </div>
      </div>

      {/* Visual Diagnostic Scatter Matrix: Time Spent vs Exam Score % */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Performance Matrix: Exam Score % vs Time Spent (Hours)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Identifies efficiency vs struggle subtopics (High Time + Low Score = Passive study indicator)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Strong (≥80%)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-300">Moderate (60-79%)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-slate-300">Weak (&lt;60%)</span>
            </span>
          </div>
        </div>

        {scatterData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-500">
            No topics or exam scores available to plot.
          </div>
        ) : (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  type="number"
                  dataKey="xHours"
                  name="Time Spent"
                  unit=" hrs"
                  stroke="#94a3b8"
                  fontSize={11}
                  label={{ value: 'Time Logged (Hours)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="yScore"
                  name="Exam Score"
                  unit="%"
                  domain={[0, 100]}
                  stroke="#94a3b8"
                  fontSize={11}
                  label={{ value: 'Exam Score %', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px', color: '#f8fafc' }}
                  formatter={(value: any, name: any) => [
                    name === 'Exam Score' ? `${value}%` : `${value} hrs`,
                    name,
                  ]}
                />
                <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Passing Threshold (60%)', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Mastery Line (80%)', fill: '#10b981', fontSize: 10 }} />
                <Scatter name="Subtopics" data={scatterData}>
                  {scatterData.map((entry, index) => {
                    let color = '#94a3b8';
                    if (entry.classification === 'Strong') color = '#10b981';
                    else if (entry.classification === 'Moderate') color = '#f59e0b';
                    else if (entry.classification === 'Weak') color = '#ef4444';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Prioritized Diagnostic Study Recommendations List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              Diagnostic Classifications & Actionable Planner
            </h3>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400">Filter Classification:</span>
            {['All', 'Weak', 'Moderate', 'Strong', 'Untested'].map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClassificationFilter(cls)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  selectedClassificationFilter === cls
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic Items Breakdown Cards */}
        {filteredDiagnostics.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            No subtopics matching the selected classification filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDiagnostics.map((item) => {
              const borderConfig = {
                Strong: 'border-emerald-500/30 bg-emerald-950/10',
                Moderate: 'border-amber-500/30 bg-amber-950/10',
                Weak: 'border-rose-500/30 bg-rose-950/10',
                Untested: 'border-slate-800 bg-slate-950/30',
              }[item.classification];

              const badgeConfig = {
                Strong: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold',
                Moderate: 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold',
                Weak: 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold',
                Untested: 'bg-slate-800 text-slate-300 border-slate-700 font-bold',
              }[item.classification];

              const hoursSpent = Math.round((item.totalTimeMinutes / 60) * 10) / 10;

              return (
                <div
                  key={item.subtopic.id}
                  className={`p-4 sm:p-5 rounded-xl border ${borderConfig} space-y-3 transition-colors hover:border-slate-700`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs border rounded-lg ${badgeConfig}`}>
                        {item.classification}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-blue-400">
                            [{item.mainTopic.code}]
                          </span>
                          <h4 className="text-sm font-bold text-slate-100">{item.subtopic.title}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">{item.mainTopic.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Exam Score</span>
                        <strong
                          className={
                            item.totalExamCount > 0
                              ? item.averageScorePercentage >= 80
                                ? 'text-emerald-400 font-bold'
                                : item.averageScorePercentage >= 60
                                ? 'text-amber-400 font-bold'
                                : 'text-rose-400 font-bold'
                              : 'text-slate-400 font-normal'
                          }
                        >
                          {item.totalExamCount > 0 ? `${item.averageScorePercentage}%` : 'Untested'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Time Spent</span>
                        <strong className="text-slate-200 font-bold">{hoursSpent} / {item.targetHours}h</strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenSubtopic(item.subtopic.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Dashboard
                        </button>
                        <button
                          onClick={() => onStartTimer(item.mainTopic.id, item.subtopic.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Study Now
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis & Recommendation Paragraph */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5 shadow-xs">
                    <p className="text-slate-200 leading-relaxed">
                      <strong className="text-amber-400 font-bold">Diagnosis:</strong> {item.diagnosisReason}
                    </p>
                    <p className="text-blue-300 flex items-start gap-1.5 leading-relaxed">
                      <ArrowRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-400" />
                      <span>
                        <strong className="text-blue-200 font-bold">Action Plan:</strong> {item.recommendation}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
