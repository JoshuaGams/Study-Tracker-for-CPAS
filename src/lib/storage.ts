import { ApplicationState, MainTopic, Subtopic, NoteResource, ExamScore, TimeLog } from '../types';
import { DEFAULT_THEME } from './theme';

const STORAGE_KEY = 'board_exam_study_tracker_v1';

export const initialBlankState: ApplicationState = {
  theme: DEFAULT_THEME,
  mainTopics: [],
  subtopics: [],
  resources: [],
  examScores: [],
  timeLogs: [],
  activeSubtopicId: null,
  activeTab: 'overview',
  targetExamDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  timerState: {
    isRunning: false,
    isPaused: false,
    mainTopicId: null,
    subtopicId: null,
    sessionType: 'Reading',
    elapsedSeconds: 0,
    mode: 'stopwatch',
    pomodoroTargetMinutes: 25,
    notes: '',
  },
};

export const sampleCPALEData: { mainTopics: MainTopic[]; subtopics: Subtopic[]; resources: NoteResource[]; examScores: ExamScore[]; timeLogs: TimeLog[] } = {
  mainTopics: [
    {
      id: 'mt-rfbt',
      title: 'Regulatory Framework for Business Transactions',
      code: 'RFBT',
      description: 'Obligations, Contracts, Sales, Partnerships, Corporations, Bouncing Checks, Competition Law',
      color: '#3B82F6', // Blue
      targetHours: 60,
      weightPercentage: 15,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mt-far',
      title: 'Financial Accounting and Reporting',
      code: 'FAR',
      description: 'Conceptual Framework, PAS/PFRS, Assets, Liabilities, Equity, Financial Statements',
      color: '#10B981', // Emerald
      targetHours: 80,
      weightPercentage: 20,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mt-afar',
      title: 'Advanced Financial Accounting and Reporting',
      code: 'AFAR',
      description: 'Partnership Accounting, Business Combinations, Consolidated FS, Foreign Currency, Govt Acc',
      color: '#8B5CF6', // Purple
      targetHours: 70,
      weightPercentage: 15,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mt-aud',
      title: 'Auditing',
      code: 'AUD',
      description: 'Auditing Theory, Professional Standards, Internal Control, Substantive Testing, Audit Reports',
      color: '#F59E0B', // Amber
      targetHours: 65,
      weightPercentage: 15,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mt-mas',
      title: 'Management Advisory Services',
      code: 'MAS',
      description: 'Cost Concepts, CVP Analysis, Budgeting, Standard Costing, Financial Statement Analysis',
      color: '#EC4899', // Pink
      targetHours: 60,
      weightPercentage: 15,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mt-tax',
      title: 'Taxation',
      code: 'TAX',
      description: 'NIRC, Income Tax, Value Added Tax, Estate & Donor Tax, Corporate Tax, Tax Remedies',
      color: '#EF4444', // Red
      targetHours: 65,
      weightPercentage: 20,
      createdAt: new Date().toISOString(),
    },
  ],
  subtopics: [
    {
      id: 'st-rfbt-1',
      mainTopicId: 'mt-rfbt',
      title: 'Law on Obligations & Contracts',
      code: 'RFBT-01',
      description: 'Sources of obligations, kinds of obligations, performance, breach, and remedies',
      status: 'In Progress',
      targetHours: 15,
      notesScratchpad: 'Remember: Fortuitous events excuse obligation EXCEPT when specified by law or contract.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'st-rfbt-2',
      mainTopicId: 'mt-rfbt',
      title: 'Revised Corporation Code',
      code: 'RFBT-02',
      description: 'Incorporation, Board of Directors, Stockholders, Corporate Dissolution & Merger',
      status: 'In Progress',
      targetHours: 18,
      notesScratchpad: 'Minimum capital requirement repealed under RCC. One Person Corporations (OPC) permitted.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'st-far-1',
      mainTopicId: 'mt-far',
      title: 'Property, Plant & Equipment (PAS 16)',
      code: 'FAR-01',
      description: 'Initial measurement, capitalization vs expense, depreciation methods, impairment, revaluation model',
      status: 'Mastered',
      targetHours: 12,
      notesScratchpad: 'Cost model vs Revaluation model. Impairment under PAS 36 recoverable amount = higher of FVCG and VIU.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'st-far-2',
      mainTopicId: 'mt-far',
      title: 'Revenue from Contracts with Customers (PFRS 15)',
      code: 'FAR-02',
      description: '5-step model for revenue recognition, variable consideration, performance obligations',
      status: 'In Progress',
      targetHours: 14,
      notesScratchpad: '1. Identify contract, 2. Identify performance obligation, 3. Determine price, 4. Allocate price, 5. Recognize revenue.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'st-aud-1',
      mainTopicId: 'mt-aud',
      title: 'Audit Planning & Risk Assessment (PSA 315)',
      code: 'AUD-01',
      description: 'Materiality, audit risk model (AR = IR x CR x DR), understanding entity & internal control',
      status: 'Reviewing',
      targetHours: 10,
      notesScratchpad: 'Detection risk is inversely related to combined inherent and control risk.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'st-tax-1',
      mainTopicId: 'mt-tax',
      title: 'Individual Income Taxation',
      code: 'TAX-01',
      description: 'Resident citizens, non-residents, taxable income brackets, 8% flat tax option for MSMEs',
      status: 'In Progress',
      targetHours: 12,
      notesScratchpad: 'TRAIN Law updates: 8% option in lieu of progressive rates & percentage tax for self-employed with gross < 3M.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  resources: [
    {
      id: 'res-1',
      subtopicId: 'st-rfbt-1',
      title: 'De Leon Law on Obligations & Contracts Summary PDF',
      type: 'doc',
      urlOrPath: 'https://drive.google.com/file/d/sample-obli-con',
      description: 'Comprehensive study guide with jurisprudence cases',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'res-2',
      subtopicId: 'st-far-1',
      title: 'Valix Financial Accounting Vol 1 Notes',
      type: 'link',
      urlOrPath: 'https://notion.so/pas-16-ppe-summary',
      description: 'Class lecture notes and comprehensive illustrations',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'res-3',
      subtopicId: 'st-far-2',
      title: 'PFRS 15 5-Step Model Flashcard Set',
      type: 'quizlet',
      urlOrPath: 'https://quizlet.com/pfrs-15-revenue-recognition',
      description: '50 quick-recall questions for drill preparation',
      createdAt: new Date().toISOString(),
    },
  ],
  examScores: [
    {
      id: 'es-1',
      subtopicId: 'st-rfbt-1',
      examName: 'Pre-board Diagnostic Exam',
      score: 28,
      maxScore: 50,
      date: '2026-07-15',
      notes: 'Struggled with joint and solidary obligations provisions.',
    },
    {
      id: 'es-2',
      subtopicId: 'st-rfbt-1',
      examName: 'Chapter Quiz 1',
      score: 35,
      maxScore: 50,
      date: '2026-07-28',
      notes: 'Slight improvement after reviewing remedies for breach.',
    },
    {
      id: 'es-3',
      subtopicId: 'st-far-1',
      examName: 'PAS 16 Mastery Assessment',
      score: 46,
      maxScore: 50,
      date: '2026-07-20',
      notes: 'Excellent score. Revaluation model questions answered correctly.',
    },
    {
      id: 'es-4',
      subtopicId: 'st-far-2',
      examName: 'PFRS 15 Drills Set A',
      score: 31,
      maxScore: 40,
      date: '2026-08-01',
      notes: 'Good understanding of variable consideration.',
    },
    {
      id: 'es-5',
      subtopicId: 'st-aud-1',
      examName: 'Audit Risk Model Quiz',
      score: 21,
      maxScore: 30,
      date: '2026-08-03',
      notes: 'Review distinction between detection risk and control risk.',
    },
    {
      id: 'es-6',
      subtopicId: 'st-tax-1',
      examName: 'Taxation Pre-board Module 1',
      score: 38,
      maxScore: 50,
      date: '2026-08-04',
      notes: 'Solid grasp on passive income final withholding tax rates.',
    },
  ],
  timeLogs: [
    {
      id: 'tl-1',
      mainTopicId: 'mt-rfbt',
      subtopicId: 'st-rfbt-1',
      durationMinutes: 120,
      sessionType: 'Reading',
      date: '2026-07-14',
      notes: 'Read De Leon chapters 1-3 on obligations',
    },
    {
      id: 'tl-2',
      mainTopicId: 'mt-rfbt',
      subtopicId: 'st-rfbt-1',
      durationMinutes: 90,
      sessionType: 'Practice Drills',
      date: '2026-07-27',
      notes: 'Completed 50 multiple choice questions on breach of contract',
    },
    {
      id: 'tl-3',
      mainTopicId: 'mt-far',
      subtopicId: 'st-far-1',
      durationMinutes: 180,
      sessionType: 'Reading',
      date: '2026-07-19',
      notes: 'PAS 16 comprehensive problem solving',
    },
    {
      id: 'tl-4',
      mainTopicId: 'mt-far',
      subtopicId: 'st-far-2',
      durationMinutes: 150,
      sessionType: 'Video Lecture',
      date: '2026-07-31',
      notes: 'Watched CPAR review video on 5-step revenue recognition model',
    },
    {
      id: 'tl-5',
      mainTopicId: 'mt-aud',
      subtopicId: 'st-aud-1',
      durationMinutes: 110,
      sessionType: 'Flashcards',
      date: '2026-08-02',
      notes: 'Memorized PSA standards definitions and audit report opinions',
    },
    {
      id: 'tl-6',
      mainTopicId: 'mt-tax',
      subtopicId: 'st-tax-1',
      durationMinutes: 140,
      sessionType: 'Practice Drills',
      date: '2026-08-04',
      notes: 'Solved tax table problems and 8% flat tax vs progressive tax comparison',
    },
  ],
};

// Clean starter syllabus for new candidates without pre-filled scores/logs
export function getCleanCPALESyllabus(): {
  mainTopics: MainTopic[];
  subtopics: Subtopic[];
  resources: NoteResource[];
  examScores: ExamScore[];
  timeLogs: TimeLog[];
} {
  return {
    mainTopics: sampleCPALEData.mainTopics.map((m) => ({ ...m })),
    subtopics: sampleCPALEData.subtopics.map((s) => ({
      ...s,
      status: 'Not Started',
      notesScratchpad: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    resources: [],
    examScores: [],
    timeLogs: [],
  };
}

let saveDebounceTimer: any = null;

export function loadSavedState(): ApplicationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialBlankState;
    }
    const parsed = JSON.parse(raw);
    return {
      ...initialBlankState,
      ...parsed,
      mainTopics: Array.isArray(parsed.mainTopics) ? parsed.mainTopics : [],
      subtopics: Array.isArray(parsed.subtopics) ? parsed.subtopics : [],
      resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      examScores: Array.isArray(parsed.examScores) ? parsed.examScores : [],
      timeLogs: Array.isArray(parsed.timeLogs) ? parsed.timeLogs : [],
      timerState: {
        ...initialBlankState.timerState,
        ...(parsed.timerState || {}),
        isRunning: false, // Ensure timer is stopped on load
        isPaused: false,
      },
    };
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return initialBlankState;
  }
}

export function saveStateToStorage(state: ApplicationState, immediate = false): void {
  const doSave = () => {
    try {
      const dataToSave = {
        theme: state.theme,
        mainTopics: state.mainTopics,
        subtopics: state.subtopics,
        resources: state.resources,
        examScores: state.examScores,
        timeLogs: state.timeLogs,
        activeSubtopicId: state.activeSubtopicId,
        activeTab: state.activeTab,
        targetExamDate: state.targetExamDate,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  };

  if (immediate) {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    doSave();
  } else {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(doSave, 300);
  }
}

export function exportBackupJSON(state: ApplicationState): void {
  const backupData = {
    appName: 'Board Exam Study Tracker',
    version: '1.0',
    exportTimestamp: new Date().toISOString(),
    data: {
      theme: state.theme,
      mainTopics: state.mainTopics,
      subtopics: state.subtopics,
      resources: state.resources,
      examScores: state.examScores,
      timeLogs: state.timeLogs,
    },
  };
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `board_exam_study_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
