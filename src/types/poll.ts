// Poll Types for User Participation

// Poll and Question Types
export type PollType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RANKING' | 'SCALE' | 'OPEN_TEXT' | 'Q_AND_A';

export interface PollOption {
  id: string;
  text: string;
  imageUrl?: string | null;
  order: number;
}

export interface PollQuestion {
  id: string;
  text: string;
  type: PollType;
  options: PollOption[];
  timeLimit?: number;
  isActive?: boolean;
  startedAt?: string;
  endedAt?: string;
}

export interface Poll {
  id: string;
  title: string;
  questions: PollQuestion[];
  status: 'DRAFT' | 'ACTIVE' | 'ENDED';
  createdAt: string;
  updatedAt: string;
}

// Question type is now an alias of PollQuestion for consistency
export type Question = PollQuestion;

// WebSocket Event Types
export interface WebSocketMessage {
  event?: string;
  type?: string;
  data: Record<string, unknown>;
}

export interface PollResponse {
  id: string;
  userId: string;
  answer: string | string[] | number;
  type: PollType;
  timestamp: string;
  anonymous: boolean;
}

export interface ActiveQuestionData {
  action: 'new-question';
  data: {
    pollId: string;
    question: PollQuestion;
  };
}

export interface PollUpdateData {
  action: string;
  data: {
    pollId?: string;
    question?: PollQuestion;
    count?: number;
    results?: PollResults;
    questionId?: string;
  };
}

export interface QuestionEndedData {
  pollId: string;
  timestamp: string;
  questionId: string;
}

export interface WordCloudUpdateData {
  pollId: string;
  word: string;
  userId: string;
  timestamp: string;
}

export interface ParticipantCountData {
  pollId: string;
  count: number;
}

// Poll State Management
export interface PollState {
  poll: Poll | null;
  activeQuestion: PollQuestion | null;
  participants: number;
  connected: boolean;
  loading: boolean;
  error: string | null;
}

// API Response Types
export interface JoinPollResponse {
  success: boolean;
  message: string;
  poll: Poll;
}

// Form Types for User Input
export interface PollResponseForm {
  questionId: string;
  answer: string | string[] | number;
  type: PollType;
}

// Results Types
export interface PollResults {
  questionId: string;
  totalResponses: number;
  options?: Array<{
    id: string;
    text: string;
    count: number;
    percentage: number;
  }>;
  words?: Array<{
    text: string;
    weight: number;
  }>;
}
