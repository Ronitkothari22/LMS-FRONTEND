import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPollsBySession,
  fetchPollById,
  joinPoll,
  submitPollResponse,
  Poll,
  JoinPollResponse,
} from '@/lib/api/polls';

// Query keys
export const pollKeys = {
  all: ['polls'] as const,
  lists: () => [...pollKeys.all, 'list'] as const,
  list: (filters: string) => [...pollKeys.lists(), { filters }] as const,
  bySession: (sessionId: string) =>
    [...pollKeys.lists(), { sessionId }] as const,
  details: () => [...pollKeys.all, 'detail'] as const,
  detail: (id: string) => [...pollKeys.details(), id] as const,
};

// Hooks
export const useSessionPolls = (sessionId: string) => {
  return useQuery({
    queryKey: pollKeys.bySession(sessionId),
    queryFn: () => fetchPollsBySession(sessionId),
    enabled: !!sessionId,
  });
};

export const usePoll = (pollId: string) => {
  return useQuery({
    queryKey: pollKeys.detail(pollId),
    queryFn: () => fetchPollById(pollId),
    enabled: !!pollId,
  });
};

export const useJoinPoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (joiningCode: string) => joinPoll(joiningCode),
    onSuccess: (data: JoinPollResponse) => {
      // Log the data for debugging
      console.log('Join poll mutation success data:', data);

      if (data.poll && data.poll.id) {
        // Add the poll to the cache
        queryClient.setQueryData(pollKeys.detail(data.poll.id), data.poll);

        // If the poll has a sessionId, update the session polls list
        if (data.poll.sessionId) {
          // Get the current polls for this session
          const currentPolls =
            queryClient.getQueryData<Poll[]>(
              pollKeys.bySession(data.poll.sessionId)
            ) || [];

          // Check if the poll is already in the list
          const pollExists = currentPolls.some((p) => p.id === data.poll.id);

          if (!pollExists) {
            // Add the poll to the list
            queryClient.setQueryData(pollKeys.bySession(data.poll.sessionId), [
              ...currentPolls,
              data.poll,
            ]);
          }
        }
      }
    },
    onError: (error) => {
      console.error('Join poll mutation error:', error);
    },
  });
};

export const useSubmitPollResponse = (pollId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      questionId?: string;
      optionId?: string;
      questionOptionId?: string;
      textResponse?: string;
      ranking?: number;
      scale?: number;
      anonymous: boolean;
    }) => submitPollResponse(pollId, data),
    onSuccess: () => {
      // Invalidate the poll to refetch with updated response data
      queryClient.invalidateQueries({ queryKey: pollKeys.detail(pollId) });
    },
    onError: (error) => {
      console.error('Submit poll response mutation error:', error);
    },
  });
};
