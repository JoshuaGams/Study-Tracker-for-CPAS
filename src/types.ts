export type TopicStatus = 'Not Started' | 'In Progress' | 'Reviewing' | 'Mastered';

export type SessionType = 'Reading' | 'Practice Drills' | 'Flashcards' | 'Video Lecture' | 'Mock Exam' | 'Revision';

export interface NoteResource {
  id: string;
  subtopicId: string;
  title: string;
  type: 'link' | 'file_reference' | 'doc' | 'quizlet';
  urlOrPath: string;
  description?: string;
  createdAt: string;
}

export interface ExamScore {
  id: string;
  subtopicId: string;
  examName: string; // e.g., "Pre-board 1", "Chapter Quiz", "Drills Set A"
  score: number;
  maxScore: number;
  date: string;
  notes?: string;
  weight?: number; // Default 1
  combinedExamId?: string; // Grouping ID for multi-topic exam
  isCombined?: boolean;
  multiSubtopicAllocations?: {
    subtopicId: string;
    subtopicTitle?: string;
    itemCount?: number;
    assignedScore?: number;
  }[];
}

export interface TimeLog {
  id: string;
  mainTopicId: string;
  subtopicId: string;
  durationMinutes: number;
  sessionType: SessionType;
  date: string; // ISO date string
  notes?: string;
  combinedSessionId?: string; // Grouping ID for multi-topic study session
  isCombined?: boolean;
  multiSubtopicAllocations?: {
    subtopicId: string;
    subtopicTitle?: string;
    allocatedMinutes?: number;
  }[];
}

export interface Subtopic {
  id: string;
  mainTopicId: string;
  title: string;
  code?: string; // e.g., "RFBT-01"
  description?: string;
  status: TopicStatus;
  targetHours: number;
  notesScratchpad?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MainTopic {
  id: string;
  title: string; // e.g., "RFBT", "FAR", "AUD", "MAS", "TAX"
  code: string;  // e.g., "RFBT"
  description?: string;
  color?: string; // Tailwind hex or class color for tag styling
  targetHours: number;
  weightPercentage?: number; // Weight in board exam e.g. 15%
  createdAt: string;
}

export interface UserAccount {
  id: string;
  username: string;
  email?: string;
  name: string;
  passwordHash: string;
  role?: 'owner' | 'student';
  targetExam: string;
  targetExamDate?: string;
  avatarColor?: string;
  theme?: DashboardTheme;
  createdAt: string;
  lastLoginAt?: string;
}

export type BackgroundMode =
  | 'dark-slate'
  | 'dark-obsidian'
  | 'dark-midnight'
  | 'dark-espresso'
  | 'light-ivory'
  | 'light-slate'
  | 'light-sage'
  | 'light-sand'
  | 'light-rose';

export type CardStyle = 'solid' | 'subtle-glass' | 'bordered';
export type FontStyle = 'serif-heading' | 'modern-sans' | 'academic-mono';

export interface DashboardTheme {
  id: string;
  name: string;
  description?: string;
  accentColor: string; // e.g. '#F59E0B'
  secondaryAccentColor?: string; // e.g. '#3B82F6'
  textColor?: string; // Custom primary font/text color
  textMutedColor?: string; // Custom muted font/text color
  customBgColor?: string; // Custom background hex
  customCardColor?: string; // Custom card surface hex
  backgroundMode: BackgroundMode;
  cardStyle: CardStyle;
  fontStyle: FontStyle;
  isCustom?: boolean;
}

export interface ApplicationState {
  currentUser?: UserAccount | null;
  theme?: DashboardTheme;
  mainTopics: MainTopic[];
  subtopics: Subtopic[];
  resources: NoteResource[];
  examScores: ExamScore[];
  timeLogs: TimeLog[];
  activeSubtopicId: string | null;
  activeTab: 'overview' | 'subtopic' | 'timetracker' | 'analytics' | 'schema_docs';
  targetExamDate?: string; // ISO Date YYYY-MM-DD
  timerState: {
    isRunning: boolean;
    isPaused: boolean;
    mainTopicId: string | null;
    subtopicId: string | null;
    sessionType: SessionType;
    elapsedSeconds: number;
    mode: 'stopwatch' | 'pomodoro';
    pomodoroTargetMinutes: number;
    notes: string;
  };
}

export interface DiagnosticItem {
  subtopic: Subtopic;
  mainTopic: MainTopic;
  averageScorePercentage: number; // 0-100
  totalExamCount: number;
  totalTimeMinutes: number;
  targetHours: number;
  timeProgressPercentage: number;
  classification: 'Strong' | 'Moderate' | 'Weak' | 'Untested';
  diagnosisReason: string;
  recommendation: string;
  priorityScore: number; // Higher means urgent need for attention
}
