// Feedback Module Types

export interface Feedback {
  id: string;
  title: string;
  description?: string;
  sessionId: string;
  isActive: boolean;
  isAnonymous: boolean;
  questions: FeedbackQuestion[];
  createdAt: string;
  updatedAt: string;
  session?: {
    title: string;
    state: string;
    participants?: unknown[];
  };
  hasSubmitted?: boolean;
}

export interface FeedbackQuestion {
  id: string;
  feedbackId: string;
  question: string;
  type: FeedbackType;
  isRequired: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackResponse {
  id: string;
  feedbackId: string;
  questionId: string;
  userId: string;
  rating?: SmileyRating;
  textAnswer?: string;
  isAnonymous: boolean;
  createdAt: string;
}

export enum FeedbackType {
  SMILEY_SCALE = 'SMILEY_SCALE',
  TEXT = 'TEXT'
}

export enum SmileyRating {
  VERY_POOR = 'VERY_POOR',
  POOR = 'POOR',
  AVERAGE = 'AVERAGE',
  GOOD = 'GOOD',
  EXCELLENT = 'EXCELLENT'
}

// API Request/Response Types
export interface SubmitFeedbackRequest {
  feedbackId: string;
  responses: FeedbackQuestionResponse[];
}

export interface FeedbackQuestionResponse {
  questionId: string;
  rating?: SmileyRating;
  textAnswer?: string;
}

export interface SubmitFeedbackResponse {
  success: boolean;
  message: string;
  data: {
    responseCount: number;
    submittedAt: string;
  };
}

export interface GetFeedbackFormsResponse {
  success: boolean;
  data: Feedback[];
}

// Form state types for UI
export interface FeedbackFormState {
  [questionId: string]: {
    rating?: SmileyRating;
    textAnswer?: string;
  };
}

export interface FeedbackFormErrors {
  [questionId: string]: string;
}

// Smiley rating display configuration
export const SMILEY_RATINGS = {
  [SmileyRating.VERY_POOR]: { emoji: '😞', label: 'Very Poor', value: 1 },
  [SmileyRating.POOR]: { emoji: '😟', label: 'Poor', value: 2 },
  [SmileyRating.AVERAGE]: { emoji: '😐', label: 'Average', value: 3 },
  [SmileyRating.GOOD]: { emoji: '😊', label: 'Good', value: 4 },
  [SmileyRating.EXCELLENT]: { emoji: '😁', label: 'Excellent', value: 5 }
} as const;

export const SMILEY_RATING_OPTIONS = Object.entries(SMILEY_RATINGS).map(([key, value]) => ({
  rating: key as SmileyRating,
  ...value
})); 