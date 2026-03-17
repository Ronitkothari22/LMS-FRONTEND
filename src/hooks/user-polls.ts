import { useMutation, useQuery } from '@tanstack/react-query';
import {
  joinPollWithCode,
  submitPollResponse,
  getPollById,
} from '@/lib/api/user-polls';
import type { JoinPollResponse } from '@/lib/api/user-polls';

// Hook for joining a poll
export const useJoinPollWithCode = () => {
  return useMutation({
    mutationFn: (joiningCode: string) => joinPollWithCode(joiningCode),
    onSuccess: (data: JoinPollResponse) => {
      console.log('Join poll mutation success:', data);
    },
    onError: (error) => {
      console.error('Join poll mutation error:', error);
    },
  });
};

// Hook for submitting poll responses
export const useSubmitPollResponse = (pollId: string) => {
  return useMutation({
    mutationFn: (responseData: {
      questionId?: string;
      optionId?: string;
      questionOptionId?: string;
      textResponse?: string;
      ranking?: number;
      scale?: number;
      anonymous?: boolean;
      timeTaken?: number;
    }) => submitPollResponse(pollId, responseData),
    onSuccess: (data) => {
      console.log('Submit response success:', data);
    },
    onError: (error) => {
      console.error('Submit response error:', error);
    },
  });
};

// Hook for getting poll details
export const useGetPoll = (pollId: string) => {
  return useQuery({
    queryKey: ['poll', pollId],
    queryFn: () => getPollById(pollId),
    enabled: !!pollId,
  });
};
