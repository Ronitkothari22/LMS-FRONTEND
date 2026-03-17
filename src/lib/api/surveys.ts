import { axiosInstance } from '@/lib/axios';
import { toast } from 'sonner';

// Survey Types
export type SurveyQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'SINGLE_CHOICE'
  | 'RATING_SCALE'
  | 'TEXT'
  | 'YES_NO';

export interface SurveyQuestion {
  id: string;
  questionText: string;
  questionType: SurveyQuestionType;
  options?: {
    scale?: string;
    labels?: Record<string, string>;
  } | string[]; // For choice questions or rating scale
  orderIndex: number;
  isRequired: boolean;
  validationRules?: {
    required?: boolean;
    minValue?: number;
    maxValue?: number;
  };
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
  isAnonymous?: boolean;
  allowMultipleResponses?: boolean;
  isOptional?: boolean;
  questions: SurveyQuestion[];
  responses?: SurveyResponse[]; // User responses if included
}

export interface SurveyResponsePayload {
  surveyId: string;
  responses: {
    questionId: string;
    responseValue: string | number;
  }[];
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  submittedAt: string;
}

// Fetch surveys assigned to a session
export const fetchSurveysBySession = async (
  sessionId: string
): Promise<Survey[]> => {
  try {
    const response = await axiosInstance.get(`survey/sessions/${sessionId}/surveys`);
    return response.data?.data ?? [];
  } catch (err: unknown) {
    if (err instanceof Error && 'response' in err && 
        typeof err.response === 'object' && err.response !== null &&
        'status' in err.response && err.response.status === 404) {
      // Fallback to query-param style: /surveys?sessionId=
      const alt = await axiosInstance.get(`survey/surveys?sessionId=${sessionId}`);
      return alt.data?.data ?? alt.data ?? [];
    }
    console.error('Error fetching surveys:', err);
    const errorMessage = err instanceof Error && 'response' in err && 
      typeof err.response === 'object' && err.response !== null &&
      'data' in err.response && typeof err.response.data === 'object' &&
      err.response.data !== null && 'message' in err.response.data
      ? String(err.response.data.message)
      : 'Failed to fetch surveys for session';
    toast.error(errorMessage);
    return [];
  }
};

// Fetch a single survey by ID
export const fetchSurveyById = async (id: string): Promise<Survey | null> => {
  try {
    const response = await axiosInstance.get(`survey/surveys/${id}`);
    return response.data?.data ?? null;
  } catch (error: unknown) {
    console.error('Error fetching survey:', error);
    const errorMessage = error instanceof Error && 'response' in error && 
      typeof error.response === 'object' && error.response !== null &&
      'data' in error.response && typeof error.response.data === 'object' &&
      error.response.data !== null && 'message' in error.response.data
      ? String(error.response.data.message)
      : 'Failed to fetch survey';
    toast.error(errorMessage);
    return null;
  }
};

// Submit survey response (one per user enforced by backend)
export const submitSurveyResponse = async (
  payload: SurveyResponsePayload
): Promise<SurveyResponse> => {
  try {
    const res = await axiosInstance.post('survey/survey-responses', payload);
    toast.success('Survey submitted successfully');
    return res.data?.data ?? res.data;
  } catch (error: unknown) {
    console.error('Error submitting survey response:', error);
    const errorMessage = error instanceof Error && 'response' in error && 
      typeof error.response === 'object' && error.response !== null &&
      'data' in error.response && typeof error.response.data === 'object' &&
      error.response.data !== null && 'message' in error.response.data
      ? String(error.response.data.message)
      : 'Failed to submit survey response';
    toast.error(errorMessage);
    throw error;
  }
};

// Fetch current user's survey responses (optionally filtered by session)
export const fetchUserSurveyResponses = async (
  userId: string,
  sessionId?: string
): Promise<SurveyResponse[]> => {
  try {
    const query = sessionId ? `?sessionId=${sessionId}` : '';
    const res = await axiosInstance.get(
      `survey/users/${userId}/survey-responses${query}`
    );
    return res.data?.data ?? [];
  } catch (error: unknown) {
    console.error('Error fetching user survey responses:', error);
    toast.error('Failed to fetch your survey responses');
    return [];
  }
}; 