import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchQuiz,
  submitQuiz,
  fetchQuizResults,
  checkQuizAttempt,
  checkQuizAccess,
  QuizResults,
} from '@/lib/api/quizzes';

// Query keys
export const quizKeys = {
  all: ['quizzes'] as const,
  lists: () => [...quizKeys.all, 'list'] as const,
  list: (filters: string) => [...quizKeys.lists(), { filters }] as const,
  details: () => [...quizKeys.all, 'detail'] as const,
  detail: (id: string) => [...quizKeys.details(), id] as const,
  results: () => [...quizKeys.all, 'results'] as const,
  result: (id: string) => [...quizKeys.results(), id] as const,
  attempts: () => [...quizKeys.all, 'attempts'] as const,
  attempt: (id: string) => [...quizKeys.attempts(), id] as const,
  access: () => [...quizKeys.all, 'access'] as const,
  accessCheck: (id: string) => [...quizKeys.access(), id] as const,
};

// Hooks
export const useQuiz = (sessionId: string, quizId?: string) => {
  return useQuery({
    queryKey: quizId
      ? [...quizKeys.detail(sessionId), quizId]
      : quizKeys.detail(sessionId),
    queryFn: () => fetchQuiz(sessionId, quizId),
    enabled: !!sessionId,
  });
};

export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      quizId,
      answers,
      timeTaken,
      sessionId,
    }: {
      quizId: string;
      answers: Record<string, string>; // Changed to use question IDs as keys
      timeTaken?: Record<string, number>; // Changed to use question IDs as keys
      sessionId?: string;
    }) => submitQuiz(quizId, answers, sessionId, timeTaken),
    onSuccess: (data: QuizResults, { quizId, sessionId }) => {
      // Store the results in the cache
      queryClient.setQueryData(quizKeys.result(quizId), data);

      // Invalidate the attempt status to reflect that the quiz is now completed
      queryClient.invalidateQueries({ queryKey: quizKeys.attempt(quizId) });

      // Invalidate the access check to reflect that the quiz is now completed
      queryClient.invalidateQueries({ queryKey: quizKeys.accessCheck(quizId) });

      // Invalidate the quiz details to update completion status
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: quizKeys.detail(sessionId) });
        // Also invalidate the session details to force a refetch with updated quiz status
        queryClient.invalidateQueries({
          queryKey: ['sessions', 'detail', sessionId],
        });
      }
      // Invalidate the leaderboard for this quiz to ensure instant update
      queryClient.invalidateQueries({ queryKey: ['quizLeaderboard', quizId] });
    },
  });
};

export const useQuizResults = (quizId: string) => {
  return useQuery({
    queryKey: quizKeys.result(quizId),
    queryFn: () => fetchQuizResults(quizId),
    enabled: !!quizId,
  });
};

export const useQuizAttemptStatus = (quizId: string) => {
  return useQuery({
    queryKey: quizKeys.attempt(quizId),
    queryFn: () => checkQuizAttempt(quizId),
    enabled: !!quizId,
    retry: false, // Don't retry on 404 (user hasn't attempted quiz)
  });
};

export const useQuizAccess = (quizId: string) => {
  return useQuery({
    queryKey: quizKeys.accessCheck(quizId),
    queryFn: () => checkQuizAccess(quizId),
    enabled: !!quizId,
    retry: false, // Don't retry on 403 (user cannot access quiz)
  });
};
