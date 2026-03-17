import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFeedbackForms,
  getFeedbackById,
  submitFeedback,
  hasUserSubmittedFeedback,
} from '@/lib/api/feedback';
import {
  Feedback,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
} from '@/types/feedback';

// Query keys
export const feedbackKeys = {
  all: ['feedback'] as const,
  lists: () => [...feedbackKeys.all, 'list'] as const,
  list: (filters: string) => [...feedbackKeys.lists(), { filters }] as const,
  bySession: (sessionId: string) =>
    [...feedbackKeys.lists(), { sessionId }] as const,
  details: () => [...feedbackKeys.all, 'detail'] as const,
  detail: (id: string) => [...feedbackKeys.details(), id] as const,
  submissionStatus: (sessionId: string, feedbackId: string) =>
    [...feedbackKeys.all, 'submission', { sessionId, feedbackId }] as const,
};

// Hooks

/**
 * Get all feedback forms for a session
 * @param sessionId - Session ID
 */
export const useSessionFeedback = (sessionId: string) => {
  return useQuery({
    queryKey: feedbackKeys.bySession(sessionId),
    queryFn: () => getFeedbackForms(sessionId),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Get a specific feedback form by ID
 * @param feedbackId - Feedback form ID
 * @param sessionId - Session ID
 */
export const useFeedback = (feedbackId: string, sessionId: string) => {
  return useQuery({
    queryKey: feedbackKeys.detail(feedbackId),
    queryFn: () => getFeedbackById(feedbackId, sessionId),
    enabled: !!feedbackId && !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Check if user has submitted feedback for a specific form
 * @param sessionId - Session ID
 * @param feedbackId - Feedback form ID
 */
export const useFeedbackSubmissionStatus = (sessionId: string, feedbackId: string) => {
  return useQuery({
    queryKey: feedbackKeys.submissionStatus(sessionId, feedbackId),
    queryFn: () => hasUserSubmittedFeedback(sessionId, feedbackId),
    enabled: !!sessionId && !!feedbackId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Submit feedback response mutation
 * @param sessionId - Session ID
 */
export const useSubmitFeedback = (sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedbackData: SubmitFeedbackRequest) =>
      submitFeedback(sessionId, feedbackData),
    onSuccess: (data: SubmitFeedbackResponse | null, variables) => {
      if (data && data.success) {
        // Invalidate session feedback list to refetch with updated hasSubmitted status
        queryClient.invalidateQueries({
          queryKey: feedbackKeys.bySession(sessionId),
        });

        // Update the submission status for this specific feedback form
        queryClient.setQueryData(
          feedbackKeys.submissionStatus(sessionId, variables.feedbackId),
          true
        );

        // Update the specific feedback form cache if it exists
        queryClient.setQueryData(
          feedbackKeys.detail(variables.feedbackId),
          (oldData: Feedback | undefined) => {
            if (oldData) {
              return {
                ...oldData,
                hasSubmitted: true,
              };
            }
            return oldData;
          }
        );
      }
    },
    onError: (error) => {
      console.error('Submit feedback mutation error:', error);
    },
  });
};

/**
 * Get available feedback forms for a session (excludes already submitted ones)
 * @param sessionId - Session ID
 */
export const useAvailableFeedback = (sessionId: string) => {
  const { data: feedbackForms, ...rest } = useSessionFeedback(sessionId);

  const availableFeedback = feedbackForms?.filter(
    (feedback) => feedback.isActive && !feedback.hasSubmitted
  ) || [];

  return {
    data: availableFeedback,
    ...rest,
  };
};

/**
 * Get completed feedback forms for a session
 * @param sessionId - Session ID
 */
export const useCompletedFeedback = (sessionId: string) => {
  const { data: feedbackForms, ...rest } = useSessionFeedback(sessionId);

  const completedFeedback = feedbackForms?.filter(
    (feedback) => feedback.hasSubmitted
  ) || [];

  return {
    data: completedFeedback,
    ...rest,
  };
};

/**
 * Get feedback statistics for a session
 * @param sessionId - Session ID
 */
export const useFeedbackStats = (sessionId: string) => {
  const { data: feedbackForms, ...rest } = useSessionFeedback(sessionId);

  const stats = {
    total: feedbackForms?.length || 0,
    completed: feedbackForms?.filter((f) => f.hasSubmitted).length || 0,
    available: feedbackForms?.filter((f) => f.isActive && !f.hasSubmitted).length || 0,
    inactive: feedbackForms?.filter((f) => !f.isActive).length || 0,
  };

  return {
    data: stats,
    ...rest,
  };
}; 