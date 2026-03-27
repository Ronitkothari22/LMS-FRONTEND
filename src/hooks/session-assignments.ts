import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMySessionAssignmentById,
  fetchMySessionAssignments,
  fetchMySessionAssignmentSubmission,
  submitMySessionAssignment,
} from '@/lib/api/session-assignments';

export const sessionAssignmentKeys = {
  all: ['sessionAssignments'] as const,
  lists: () => [...sessionAssignmentKeys.all, 'list'] as const,
  list: (sessionId: string, upcomingOnly?: boolean) =>
    [...sessionAssignmentKeys.lists(), sessionId, upcomingOnly ?? 'all'] as const,
  detail: (sessionId: string, assignmentId: string) =>
    [...sessionAssignmentKeys.all, 'detail', sessionId, assignmentId] as const,
  submission: (sessionId: string, assignmentId: string) =>
    [...sessionAssignmentKeys.all, 'submission', sessionId, assignmentId] as const,
};

export const useMySessionAssignments = (sessionId: string, upcomingOnly?: boolean) => {
  return useQuery({
    queryKey: sessionAssignmentKeys.list(sessionId, upcomingOnly),
    queryFn: () => fetchMySessionAssignments(sessionId, { upcomingOnly, limit: 100 }),
    enabled: !!sessionId,
  });
};

export const useMySessionAssignment = (sessionId: string, assignmentId?: string) => {
  return useQuery({
    queryKey: sessionAssignmentKeys.detail(sessionId, assignmentId || ''),
    queryFn: () => fetchMySessionAssignmentById(sessionId, assignmentId!),
    enabled: !!sessionId && !!assignmentId,
  });
};

export const useMySessionAssignmentSubmission = (sessionId: string, assignmentId?: string) => {
  return useQuery({
    queryKey: sessionAssignmentKeys.submission(sessionId, assignmentId || ''),
    queryFn: () => fetchMySessionAssignmentSubmission(sessionId, assignmentId!),
    enabled: !!sessionId && !!assignmentId,
    retry: false,
  });
};

export const useSubmitMySessionAssignment = (sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assignmentId,
      files,
      replaceExisting,
    }: {
      assignmentId: string;
      files: File[];
      replaceExisting?: boolean;
    }) => submitMySessionAssignment(sessionId, assignmentId, files, replaceExisting),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: sessionAssignmentKeys.list(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: sessionAssignmentKeys.detail(sessionId, variables.assignmentId),
      });
      queryClient.invalidateQueries({
        queryKey: sessionAssignmentKeys.submission(sessionId, variables.assignmentId),
      });
    },
  });
};
