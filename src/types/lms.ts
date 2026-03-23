export type LmsQuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CORRECT' | 'TEXT';
export type LmsContentType = 'VIDEO' | 'READING' | 'ATTACHMENT' | 'LINK';
export type LmsVideoSourceType = 'UPLOAD' | 'EXTERNAL_LINK';
export type LmsWatchEventType = 'START' | 'PROGRESS' | 'PAUSE' | 'SEEK' | 'COMPLETE';
export type LmsAttemptStatus = 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'ABANDONED';
export type LmsProgressStatus = 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'COMPLETED';
export type LmsVisibility = 'ALL' | 'SESSION';

export interface LmsApiErrorContext {
  [key: string]: unknown;
}

export interface LmsApiResponse<TData> {
  success: boolean;
  message: string;
  data: TData;
  code?: string;
  context?: LmsApiErrorContext;
}

export interface LmsUserRef {
  id: string;
  name: string;
  email?: string;
}

export interface LmsQuestionOption {
  id: string;
  questionId?: string;
  optionText: string;
  position: number;
  isCorrect?: boolean;
}

export interface LmsQuestion {
  id: string;
  levelId?: string;
  questionText: string;
  type: LmsQuestionType;
  position: number;
  isRequired?: boolean;
  points?: number;
  explanation?: string | null;
  options?: LmsQuestionOption[];
}

export interface LmsLevelContent {
  id: string;
  levelId?: string;
  type: LmsContentType;
  title: string;
  description?: string | null;
  position: number;
  isRequired?: boolean;
  videoSourceType?: LmsVideoSourceType;
  videoUrl?: string | null;
  videoDurationSeconds?: number | null;
  externalUrl?: string | null;
  attachmentUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  isCompleted?: boolean;
  completionPercent?: number;
}

export interface LmsLevel {
  id: string;
  topicId: string;
  visibility?: LmsVisibility;
  sessionId?: string | null;
  topic?: {
    id: string;
    title: string;
    isPublished?: boolean;
    isActive?: boolean;
  };
  title: string;
  description?: string | null;
  position: number;
  isPublished: boolean;
  requireVideoCompletion?: boolean;
  minVideoWatchPercent?: number;
  requireQuizPass?: boolean;
  quizPassingPercent?: number;
  requireReadingAcknowledgement?: boolean;
  xpOnCompletion?: number;
  contents?: LmsLevelContent[];
  questions?: LmsQuestion[];
  progress?: LmsUserLevelProgress | null;
  latestAttempt?: {
    id: string;
    attemptNumber?: number;
    status: LmsAttemptStatus;
    scorePercent?: number | null;
    submittedAt?: string | null;
    answers?: Array<{
      questionId: string;
      selectedOptionIds: string[];
      textAnswer?: string | null;
      isCorrect?: boolean | null;
      pointsAwarded?: number;
    }>;
  } | null;
  completionRules?: {
    videoPassed: boolean;
    readingPassed: boolean;
    contentPassed: boolean;
    quizPassed: boolean;
    canComplete: boolean;
    reasons?: {
      currentWatchPercent?: number;
      currentContentGatePercent?: number;
      requiredVideos?: number;
      completedRequiredVideos?: number;
      requiredReadings?: number;
      completedRequiredReadings?: number;
    };
  };
  _count?: {
    contents?: number;
    questions?: number;
  };
}

export interface LmsTopic {
  id: string;
  title: string;
  description?: string | null;
  slug?: string | null;
  visibility?: LmsVisibility;
  sessionId?: string | null;
  isPublished: boolean;
  isActive?: boolean;
  position?: number | null;
  estimatedDurationMinutes?: number | null;
  createdById?: string;
  createdBy?: LmsUserRef;
  levels?: LmsLevel[];
  progress?: LmsUserTopicProgress | null;
  _count?: {
    levels?: number;
  };
}

export interface LmsUserLevelProgress {
  id?: string;
  userId?: string;
  levelId?: string;
  status: LmsProgressStatus;
  watchPercent?: number;
  latestScorePercent?: number;
  attemptsCount?: number;
  completedAt?: string | null;
  unlockedAt?: string | null;
}

export interface LmsUserTopicProgress {
  id?: string;
  userId?: string;
  topicId?: string;
  status: LmsProgressStatus;
  completionPercent: number;
  completedLevels: number;
  totalLevels: number;
  timeSpentSeconds?: number;
  completedAt?: string | null;
}

export interface LmsVideoProgressPayload {
  contentId: string;
  eventType: LmsWatchEventType;
  watchSeconds?: number;
  videoPositionSeconds?: number;
  watchPercent?: number;
}

export interface LmsAttemptAnswerPayload {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
}

export interface LmsCreateAttemptPayload {
  answers: LmsAttemptAnswerPayload[];
  timeSpentSeconds?: number;
}

export interface LmsLevelAttemptSummary {
  passed: boolean;
  scorePercent: number;
  totalPoints?: number;
  earnedPoints?: number;
  passThreshold?: number;
  maxScore?: number;
  earnedScore?: number;
}

export interface LmsLevelAttemptResult {
  attempt: {
    id: string;
    status: LmsAttemptStatus;
    scorePercent?: number;
    createdAt?: string;
  };
  summary: LmsLevelAttemptSummary;
}

export interface LmsLevelCompletionResult {
  completion: {
    status: LmsProgressStatus;
    completedAt?: string;
  };
  nextLevelId?: string | null;
  topicProgress?: LmsUserTopicProgress;
  levelProgress?: LmsUserLevelProgress;
  reasons?: Record<string, unknown>;
}

export interface LmsLeaderboardEntry {
  rank: number;
  lmsXp?: number;
  user: LmsUserRef;
}

export interface LmsGlobalLeaderboardData {
  leaderboard: LmsLeaderboardEntry[];
}

export interface LmsTopicLeaderboardData {
  topic: {
    id: string;
    title: string;
  };
  rankings: LmsLeaderboardEntry[];
}

export interface LmsProgressOverview {
  topics: LmsUserTopicProgress[];
  levels: LmsUserLevelProgress[];
}

export interface LmsApiError {
  response?: {
    status?: number;
    data?: {
      success?: boolean;
      message?: string;
      code?: string;
      context?: LmsApiErrorContext;
    };
  };
  message?: string;
}
