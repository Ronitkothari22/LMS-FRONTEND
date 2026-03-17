import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  uploadContent,
  fetchContentById,
  fetchSessionContent,
  updateContent,
  deleteContent,
  downloadContent,
} from '@/lib/api/content';
import {
  ContentUploadRequest,
  ContentUpdateRequest,
  ContentListParams,
} from '@/types/content';

// Query keys for content
export const contentKeys = {
  all: ['content'] as const,
  lists: () => [...contentKeys.all, 'list'] as const,
  list: (sessionId: string, params?: ContentListParams) =>
    [...contentKeys.lists(), sessionId, params] as const,
  details: () => [...contentKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentKeys.details(), id] as const,
  session: (sessionId: string) =>
    [...contentKeys.all, 'session', sessionId] as const,
};

/**
 * Hook to fetch content by ID
 */
export const useContent = (contentId: string) => {
  return useQuery({
    queryKey: contentKeys.detail(contentId),
    queryFn: () => fetchContentById(contentId),
    enabled: !!contentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * Hook to fetch session content with pagination and filtering
 */
export const useSessionContent = (
  sessionId: string,
  params?: ContentListParams
) => {
  return useQuery({
    queryKey: contentKeys.list(sessionId, params),
    queryFn: () => fetchSessionContent(sessionId, params),
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

/**
 * Hook to upload content
 */
export const useUploadContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ContentUploadRequest) => uploadContent(request),
    onSuccess: (data, variables) => {
      // Invalidate and refetch session content
      queryClient.invalidateQueries({
        queryKey: contentKeys.session(variables.sessionId),
      });

      // Invalidate session content list
      queryClient.invalidateQueries({
        queryKey: contentKeys.lists(),
      });

      // Add the new content to the cache
      queryClient.setQueryData(contentKeys.detail(data.id), data);
    },
    onError: (error) => {
      console.error('Upload content mutation error:', error);
    },
  });
};

/**
 * Hook to update content
 */
export const useUpdateContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contentId,
      request,
    }: {
      contentId: string;
      request: ContentUpdateRequest;
    }) => updateContent(contentId, request),
    onSuccess: (data) => {
      // Update the content in cache
      queryClient.setQueryData(contentKeys.detail(data.id), data);

      // Invalidate session content lists
      queryClient.invalidateQueries({
        queryKey: contentKeys.session(data.sessionId),
      });

      queryClient.invalidateQueries({
        queryKey: contentKeys.lists(),
      });
    },
    onError: (error) => {
      console.error('Update content mutation error:', error);
    },
  });
};

/**
 * Hook to delete content
 */
export const useDeleteContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId: string) => deleteContent(contentId),
    onSuccess: (_, contentId) => {
      // Remove the content from cache
      queryClient.removeQueries({
        queryKey: contentKeys.detail(contentId),
      });

      // Invalidate all content lists to refresh
      queryClient.invalidateQueries({
        queryKey: contentKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: contentKeys.all,
      });
    },
    onError: (error) => {
      console.error('Delete content mutation error:', error);
    },
  });
};

/**
 * Hook to download content
 */
export const useDownloadContent = () => {
  return useMutation({
    mutationFn: downloadContent,
    onError: (error) => {
      console.error('Download content mutation error:', error);
    },
  });
};

/**
 * Hook to get content statistics for a session
 */
export const useContentStats = (sessionId: string) => {
  const { data: contentData } = useSessionContent(sessionId, { limit: 1000 }); // Get all content for stats

  const stats = {
    total: contentData?.content.length || 0,
    byType: {
      IMAGE: contentData?.content.filter((c) => c.type === 'IMAGE').length || 0,
      VIDEO: contentData?.content.filter((c) => c.type === 'VIDEO').length || 0,
      PDF: contentData?.content.filter((c) => c.type === 'PDF').length || 0,
      TEXT: contentData?.content.filter((c) => c.type === 'TEXT').length || 0,
    },
  };

  return stats;
};
