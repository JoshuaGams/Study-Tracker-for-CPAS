import { MainTopic, Subtopic, ExamScore, TimeLog, DiagnosticItem } from '../types';

export interface MainTopicMetrics {
  mainTopic: MainTopic;
  subtopicCount: number;
  totalTimeMinutes: number;
  totalTargetHours: number;
  timeProgressPct: number;
  averageExamScorePct: number | null;
  examCount: number;
  masteredCount: number;
  inProgressCount: number;
  weakCount: number;
  strongCount: number;
}

export function calculateSubtopicExamAvg(subtopicId: string, scores: ExamScore[]): number | null {
  const subtopicScores = scores.filter((s) => s.subtopicId === subtopicId);
  if (subtopicScores.length === 0) return null;

  const sumPercentage = subtopicScores.reduce((acc, curr) => {
    const pct = curr.maxScore > 0 ? (curr.score / curr.maxScore) * 100 : 0;
    return acc + pct;
  }, 0);

  return Math.round((sumPercentage / subtopicScores.length) * 10) / 10;
}

export function calculateSubtopicTimeLogged(subtopicId: string, timeLogs: TimeLog[]): number {
  return timeLogs
    .filter((log) => log.subtopicId === subtopicId)
    .reduce((acc, log) => acc + log.durationMinutes, 0);
}

export function diagnoseSubtopics(
  mainTopics: MainTopic[],
  subtopics: Subtopic[],
  examScores: ExamScore[],
  timeLogs: TimeLog[]
): DiagnosticItem[] {
  return subtopics.map((st) => {
    const parentMainTopic = mainTopics.find((mt) => mt.id === st.mainTopicId) || {
      id: st.mainTopicId,
      title: 'General',
      code: 'GEN',
      targetHours: 10,
      createdAt: new Date().toISOString(),
    };

    const avgScore = calculateSubtopicExamAvg(st.id, examScores);
    const totalMinutes = calculateSubtopicTimeLogged(st.id, timeLogs);
    const subtopicScores = examScores.filter((s) => s.subtopicId === st.id);
    const totalHoursSpent = totalMinutes / 60;
    const timeProgressPercentage =
      st.targetHours > 0 ? Math.min(Math.round((totalHoursSpent / st.targetHours) * 100), 100) : 0;

    let classification: DiagnosticItem['classification'] = 'Untested';
    let diagnosisReason = '';
    let recommendation = '';
    let priorityScore = 50;

    if (avgScore === null) {
      classification = 'Untested';
      diagnosisReason = `No exam or drill scores recorded yet for this subtopic. ${totalMinutes > 0 ? `You have logged ${Math.round((totalMinutes / 60) * 10) / 10} hours of study time.` : 'No study time logged yet.'}`;
      recommendation = 'Take a diagnostic quiz or practice drill set to test your comprehension baseline.';
      priorityScore = 70 + (st.targetHours > 10 ? 10 : 0);
    } else if (avgScore >= 80) {
      classification = 'Strong';
      diagnosisReason = `Consistently high accuracy (${avgScore}% across ${subtopicScores.length} assessment${subtopicScores.length > 1 ? 's' : ''}).`;
      recommendation = 'Maintain mastery with brief weekly flashcard active recall. Allocate remaining study time to weaker subtopics.';
      priorityScore = Math.max(10, 100 - avgScore);
    } else if (avgScore >= 60) {
      classification = 'Moderate';
      diagnosisReason = `Satisfactory score (${avgScore}%), but requires consolidation before the board exam.`;
      recommendation = 'Review missed exam items, practice timed problem-solving sets, and summarize key exceptions.';
      priorityScore = 50 + (80 - avgScore);
    } else {
      classification = 'Weak';
      priorityScore = 90 + (60 - avgScore) + (totalHoursSpent > 5 ? 10 : 0);
      if (totalHoursSpent > 4) {
        diagnosisReason = `High study time (${Math.round(totalHoursSpent * 10) / 10} hrs) coupled with low exam performance (${avgScore}%). Indicates passive reading or conceptual confusion.`;
        recommendation = 'Shift strategy from passive re-reading to active problem-solving, flashcards, or seeking instructor explanation.';
      } else {
        diagnosisReason = `Low exam accuracy (${avgScore}%). Limited study time logged (${Math.round(totalHoursSpent * 10) / 10} hrs).`;
        recommendation = 'Schedule focused review sessions, study core principles, and solve basic drill sets first.';
      }
    }

    return {
      subtopic: st,
      mainTopic: parentMainTopic,
      averageScorePercentage: avgScore !== null ? avgScore : 0,
      totalExamCount: subtopicScores.length,
      totalTimeMinutes: totalMinutes,
      targetHours: st.targetHours,
      timeProgressPercentage,
      classification,
      diagnosisReason,
      recommendation,
      priorityScore,
    };
  });
}

export function calculateMainTopicMetrics(
  mainTopics: MainTopic[],
  subtopics: Subtopic[],
  examScores: ExamScore[],
  timeLogs: TimeLog[]
): MainTopicMetrics[] {
  const diagnostics = diagnoseSubtopics(mainTopics, subtopics, examScores, timeLogs);

  return mainTopics.map((mt) => {
    const parentSubtopics = subtopics.filter((s) => s.mainTopicId === mt.id);
    const parentSubtopicIds = new Set(parentSubtopics.map((s) => s.id));

    const mtLogs = timeLogs.filter((l) => l.mainTopicId === mt.id || parentSubtopicIds.has(l.subtopicId));
    const totalTimeMinutes = mtLogs.reduce((acc, log) => acc + log.durationMinutes, 0);

    const mtScores = examScores.filter((s) => parentSubtopicIds.has(s.subtopicId));
    const avgScore =
      mtScores.length > 0
        ? Math.round(
            (mtScores.reduce((sum, s) => sum + (s.maxScore > 0 ? (s.score / s.maxScore) * 100 : 0), 0) /
              mtScores.length) *
              10
          ) / 10
        : null;

    const totalTargetHours = parentSubtopics.reduce((acc, s) => acc + s.targetHours, 0) || mt.targetHours;
    const timeProgressPct =
      totalTargetHours > 0 ? Math.min(Math.round(((totalTimeMinutes / 60) / totalTargetHours) * 100), 100) : 0;

    const mtDiagnostics = diagnostics.filter((d) => d.mainTopic.id === mt.id);
    const weakCount = mtDiagnostics.filter((d) => d.classification === 'Weak').length;
    const strongCount = mtDiagnostics.filter((d) => d.classification === 'Strong').length;
    const masteredCount = parentSubtopics.filter((s) => s.status === 'Mastered').length;
    const inProgressCount = parentSubtopics.filter((s) => s.status === 'In Progress').length;

    return {
      mainTopic: mt,
      subtopicCount: parentSubtopics.length,
      totalTimeMinutes,
      totalTargetHours,
      timeProgressPct,
      averageExamScorePct: avgScore,
      examCount: mtScores.length,
      masteredCount,
      inProgressCount,
      weakCount,
      strongCount,
    };
  });
}

export function calculateOverallBoardReadiness(
  mainTopics: MainTopic[],
  subtopics: Subtopic[],
  examScores: ExamScore[],
  timeLogs: TimeLog[]
): {
  overallAveragePct: number;
  totalStudyHours: number;
  strongTopicCount: number;
  weakTopicCount: number;
  untestedTopicCount: number;
  totalExamsTaken: number;
  readinessLabel: string;
} {
  const diagnostics = diagnoseSubtopics(mainTopics, subtopics, examScores, timeLogs);
  const totalMinutes = timeLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const totalStudyHours = Math.round((totalMinutes / 60) * 10) / 10;

  const testedDiagnostics = diagnostics.filter((d) => d.totalExamCount > 0);
  const sumScores = testedDiagnostics.reduce((acc, d) => acc + d.averageScorePercentage, 0);
  const overallAveragePct =
    testedDiagnostics.length > 0 ? Math.round((sumScores / testedDiagnostics.length) * 10) / 10 : 0;

  const strongTopicCount = diagnostics.filter((d) => d.classification === 'Strong').length;
  const weakTopicCount = diagnostics.filter((d) => d.classification === 'Weak').length;
  const untestedTopicCount = diagnostics.filter((d) => d.classification === 'Untested').length;

  let readinessLabel = 'Needs Assessment';
  if (overallAveragePct >= 85) readinessLabel = 'Board Exam Ready (High Distinction)';
  else if (overallAveragePct >= 75) readinessLabel = 'Passing Range (Solid Preparation)';
  else if (overallAveragePct >= 60) readinessLabel = 'Moderate Readiness (Target Weak Areas)';
  else if (testedDiagnostics.length > 0) readinessLabel = 'High Priority Revision Needed';

  return {
    overallAveragePct,
    totalStudyHours,
    strongTopicCount,
    weakTopicCount,
    untestedTopicCount,
    totalExamsTaken: examScores.length,
    readinessLabel,
  };
}
