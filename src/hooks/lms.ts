import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeMyLmsLevel,
  fetchLmsGlobalLeaderboard,
  fetchLmsTopicLeaderboard,
  fetchMyLmsLevelById,
  fetchMyLmsProgress,
  fetchMyLmsTopicById,
  fetchMyLmsTopics,
  submitMyLmsLevelAttempt,
  updateMyLmsVideoProgress,
} from '@/lib/api/lms';
import type {
  LmsCreateAttemptPayload,
  LmsVideoProgressPayload,
} from '@/types/lms';

export const lmsKeys = {
  all: ['lms'] as const,
  topics: () => [...lmsKeys.all, 'topics'] as const,
  topic: (topicId: string) => [...lmsKeys.topics(), topicId] as const,
  levels: () => [...lmsKeys.all, 'levels'] as const,
  level: (levelId: string) => [...lmsKeys.levels(), levelId] as const,
  progress: () => [...lmsKeys.all, 'progress'] as const,
  leaderboard: () => [...lmsKeys.all, 'leaderboard'] as const,
  globalLeaderboard: (limit: number) => [...lmsKeys.leaderboard(), 'global', limit] as const,
  topicLeaderboard: (topicId: string, limit: number) =>
    [...lmsKeys.leaderboard(), 'topic', topicId, limit] as const,
};

export const useLmsTopics = () => {
  return useQuery({
    queryKey: lmsKeys.topics(),
    queryFn: fetchMyLmsTopics,
    staleTime: 60 * 1000,
    retry: 2,
  });
};

export const useLmsTopic = (topicId: string) => {
  return useQuery({
    queryKey: lmsKeys.topic(topicId),
    queryFn: () => fetchMyLmsTopicById(topicId),
    enabled: !!topicId,
    staleTime: 60 * 1000,
    retry: 2,
  });
};

export const useLmsLevel = (levelId: string) => {
  return useQuery({
    queryKey: lmsKeys.level(levelId),
    queryFn: () => fetchMyLmsLevelById(levelId),
    enabled: !!levelId,
    staleTime: 30 * 1000,
    retry: 2,
  });
};

export const useLmsProgress = () => {
  return useQuery({
    queryKey: lmsKeys.progress(),
    queryFn: fetchMyLmsProgress,
    staleTime: 30 * 1000,
    retry: 2,
  });
};

export const useLmsGlobalLeaderboard = (limit = 50) => {
  return useQuery({
    queryKey: lmsKeys.globalLeaderboard(limit),
    queryFn: () => fetchLmsGlobalLeaderboard(limit),
    staleTime: 30 * 1000,
    retry: 2,
  });
};

export const useLmsTopicLeaderboard = (topicId: string, limit = 50) => {
  return useQuery({
    queryKey: lmsKeys.topicLeaderboard(topicId, limit),
    queryFn: () => fetchLmsTopicLeaderboard(topicId, limit),
    enabled: !!topicId,
    staleTime: 30 * 1000,
    retry: 2,
  });
};

export const useUpdateLmsVideoProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      levelId,
      payload,
    }: {
      levelId: string;
      payload: LmsVideoProgressPayload;
    }) => updateMyLmsVideoProgress(levelId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: lmsKeys.level(variables.levelId) });
      queryClient.invalidateQueries({ queryKey: lmsKeys.progress() });
    },
  });
};

export const useSubmitLmsLevelAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      levelId,
      payload,
    }: {
      levelId: string;
      payload: LmsCreateAttemptPayload;
    }) => submitMyLmsLevelAttempt(levelId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: lmsKeys.level(variables.levelId) });
      queryClient.invalidateQueries({ queryKey: lmsKeys.progress() });
      queryClient.invalidateQueries({ queryKey: lmsKeys.topics() });
    },
  });
};

export const useCompleteLmsLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ levelId, force = false }: { levelId: string; force?: boolean }) =>
      completeMyLmsLevel(levelId, force),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: lmsKeys.level(variables.levelId) });
      queryClient.invalidateQueries({ queryKey: lmsKeys.progress() });
      queryClient.invalidateQueries({ queryKey: lmsKeys.topics() });
      queryClient.invalidateQueries({ queryKey: lmsKeys.leaderboard() });
      queryClient.invalidateQueries({ queryKey: lmsKeys.all });
    },
  });
};
