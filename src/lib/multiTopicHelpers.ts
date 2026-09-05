import { ExamScore, TimeLog, Subtopic, MainTopic, SessionType } from '../types';

export interface MultiTopicExamInput {
  examName: string;
  selectedSubtopicIds: string[];
  totalScore: number;
  totalMaxScore: number;
  date: string;
  notes?: string;
  splitStrategy: 'equal' | 'custom_items';
  customItems?: { [subtopicId: string]: { itemCount: number; correctCount: number } };
}

export interface MultiTopicTimeInput {
  notes: string;
  selectedSubtopicIds: string[];
  totalDurationMinutes: number;
  sessionType: SessionType;
  date: string;
  splitStrategy: 'equal' | 'custom_time';
  customMinutes?: { [subtopicId: string]: number };
}

/**
 * Creates individual ExamScore objects distributed across selected subtopics
 * linked by a shared combinedExamId.
 */
export function generateCombinedExamScores(
  input: MultiTopicExamInput,
  subtopics: Subtopic[],
  mainTopics: MainTopic[]
): ExamScore[] {
  const { examName, selectedSubtopicIds, totalScore, totalMaxScore, date, notes, splitStrategy, customItems } = input;
  if (selectedSubtopicIds.length === 0) return [];

  const combinedExamId = `cb-exam-${Date.now()}`;
  const totalAccuracy = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
  const topicCount = selectedSubtopicIds.length;

  // Build summary allocations tag
  const selectedSubtopicMap = new Map(subtopics.map((s) => [s.id, s]));

  const allocationsSummary = selectedSubtopicIds.map((stId) => {
    const st = selectedSubtopicMap.get(stId);
    return {
      subtopicId: stId,
      subtopicTitle: st?.title || 'Subtopic',
    };
  });

  if (splitStrategy === 'custom_items' && customItems) {
    return selectedSubtopicIds.map((stId) => {
      const st = selectedSubtopicMap.get(stId);
      const custom = customItems[stId] || { itemCount: 10, correctCount: 8 };
      const subMax = Math.max(1, custom.itemCount);
      const subScore = Math.min(subMax, Math.max(0, custom.correctCount));

      return {
        id: `es-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        subtopicId: stId,
        examName: `${examName} [Combined Exam Part: ${st?.title || stId}]`,
        score: subScore,
        maxScore: subMax,
        date,
        notes: notes
          ? `${notes} (Part of Combined Exam "${examName}")`
          : `Combined Exam entry (${selectedSubtopicIds.length} topics covered)`,
        combinedExamId,
        isCombined: true,
        multiSubtopicAllocations: allocationsSummary,
      };
    });
  }

  // Equal distribution split
  // Base items per topic
  const baseMax = Math.max(1, Math.round(totalMaxScore / topicCount));
  
  return selectedSubtopicIds.map((stId, index) => {
    const st = selectedSubtopicMap.get(stId);
    // Adjust last topic maxScore for rounding sum
    const subMax = index === topicCount - 1 ? totalMaxScore - baseMax * (topicCount - 1) : baseMax;
    const subScore = Math.round((subMax * totalAccuracy) / 100);

    return {
      id: `es-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      subtopicId: stId,
      examName: `${examName} [Multi-Topic: ${st?.title || stId}]`,
      score: subScore,
      maxScore: Math.max(1, subMax),
      date,
      notes: notes
        ? `${notes} (Apportioned from Combined Exam "${examName}" - ${Math.round(totalAccuracy)}% overall)`
        : `Apportioned score from Multi-Topic Exam (${topicCount} topics covered)`,
      combinedExamId,
      isCombined: true,
      multiSubtopicAllocations: allocationsSummary,
    };
  });
}

/**
 * Creates individual TimeLog objects distributed across selected subtopics
 * linked by a shared combinedSessionId.
 */
export function generateCombinedTimeLogs(
  input: MultiTopicTimeInput,
  subtopics: Subtopic[],
  mainTopics: MainTopic[]
): TimeLog[] {
  const { notes, selectedSubtopicIds, totalDurationMinutes, sessionType, date, splitStrategy, customMinutes } = input;
  if (selectedSubtopicIds.length === 0) return [];

  const combinedSessionId = `cb-time-${Date.now()}`;
  const topicCount = selectedSubtopicIds.length;
  const selectedSubtopicMap = new Map(subtopics.map((s) => [s.id, s]));

  const allocationsSummary = selectedSubtopicIds.map((stId) => {
    const st = selectedSubtopicMap.get(stId);
    return {
      subtopicId: stId,
      subtopicTitle: st?.title || 'Subtopic',
    };
  });

  if (splitStrategy === 'custom_time' && customMinutes) {
    return selectedSubtopicIds.map((stId) => {
      const st = selectedSubtopicMap.get(stId);
      const allocatedMins = Math.max(1, customMinutes[stId] || Math.round(totalDurationMinutes / topicCount));
      const mainTopicId = st?.mainTopicId || mainTopics[0]?.id || 'mt-gen';

      return {
        id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        mainTopicId,
        subtopicId: stId,
        durationMinutes: allocatedMins,
        sessionType,
        date,
        notes: notes
          ? `${notes} [Combined Session: ${st?.title || stId}]`
          : `Combined Study Session (${allocatedMins} mins assigned to ${st?.title})`,
        combinedSessionId,
        isCombined: true,
        multiSubtopicAllocations: allocationsSummary,
      };
    });
  }

  // Equal distribution split
  const baseMinutes = Math.max(1, Math.floor(totalDurationMinutes / topicCount));

  return selectedSubtopicIds.map((stId, index) => {
    const st = selectedSubtopicMap.get(stId);
    // Adjust remainder on last item
    const mins = index === topicCount - 1 ? totalDurationMinutes - baseMinutes * (topicCount - 1) : baseMinutes;
    const mainTopicId = st?.mainTopicId || mainTopics[0]?.id || 'mt-gen';

    return {
      id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      mainTopicId,
      subtopicId: stId,
      durationMinutes: Math.max(1, mins),
      sessionType,
      date,
      notes: notes
        ? `${notes} [Combined Session Part - ${st?.title}]`
        : `Combined Study Session (${mins} mins allocated across ${topicCount} topics)`,
      combinedSessionId,
      isCombined: true,
      multiSubtopicAllocations: allocationsSummary,
    };
  });
}
