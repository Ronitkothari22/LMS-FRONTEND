import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSurveysBySession,
  fetchSurveyById,
  submitSurveyResponse,
  fetchUserSurveyResponses,
  Survey,
  SurveyResponsePayload,
  SurveyResponse,
} from '@/lib/api/surveys';
import { toast } from 'sonner';
import { useUser } from './auth';

// Query keys
export const surveyKeys = {
  all: ['surveys'] as const,
  bySession: (sessionId: string) => [...surveyKeys.all, 'session', sessionId] as const,
  detail: (id: string) => [...surveyKeys.all, 'detail', id] as const,
  userResponses: (userId: string) => [...surveyKeys.all, 'responses', userId] as const,
};

// Fetch surveys for a session
export const useSessionSurveys = (sessionId: string) => {
  return useQuery<Survey[]>({
    queryKey: surveyKeys.bySession(sessionId),
    queryFn: () => fetchSurveysBySession(sessionId),
    enabled: !!sessionId,
  });
};

// Fetch survey details
export const useSurvey = (id?: string) => {
  return useQuery<Survey | null>({
    queryKey: surveyKeys.detail(id ?? 'unknown'),
    queryFn: () => (id ? fetchSurveyById(id) : Promise.resolve(null)),
    enabled: !!id,
  });
};

// Fetch responses for current user (optionally session filter)
export const useMySurveyResponses = (sessionId?: string) => {
  const { data: user } = useUser();
  const userId = user?.id ?? 'anon';
  return useQuery<SurveyResponse[]>({
    queryKey: [...surveyKeys.userResponses(userId), sessionId ?? 'all'],
    queryFn: () => {
      if (!user?.id) return Promise.resolve([]);
      return fetchUserSurveyResponses(user.id, sessionId);
    },
    enabled: !!user?.id,
  });
};

// Submit survey response
export const useSubmitSurvey = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  return useMutation({
    mutationFn: (payload: SurveyResponsePayload) => submitSurveyResponse(payload),
    onSuccess: (data, variables) => {
      // Invalidate user responses so UI refreshes
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: surveyKeys.userResponses(user.id) });
      }
      // Invalidate survey list maybe to update counts
      if (variables.surveyId) {
        queryClient.invalidateQueries({ queryKey: surveyKeys.detail(variables.surveyId) });
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to submit survey';
      toast.error(errorMessage);
    },
  });
}; 