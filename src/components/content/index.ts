// Content Module Components Export Barrel

export { ContentCard } from './content-card';
export { ContentUpload } from './content-upload';
export { ContentList } from './content-list';

// Read-only content components for users
import React from 'react';
import { Content } from '@/types/content';

interface ReadOnlyContentListProps {
  sessionId: string;
  className?: string;
}

interface ReadOnlyContentCardProps {
  content: Content;
  className?: string;
  showActions?: boolean;
}

export const ReadOnlyContentList = (props: ReadOnlyContentListProps) =>
  React.createElement(ContentList, { ...props, readOnly: true });

export const ReadOnlyContentCard = (props: ReadOnlyContentCardProps) =>
  React.createElement(ContentCard, { ...props, readOnly: true });

// Re-export types for convenience
export type {
  Content,
  ContentType,
  ContentUploadRequest,
  ContentUpdateRequest,
  ContentListResponse,
  ContentResponse,
  ContentListParams,
} from '@/types/content';

// Re-export hooks for convenience
export {
  useContent,
  useSessionContent,
  useUploadContent,
  useUpdateContent,
  useDeleteContent,
  useDownloadContent,
  useContentStats,
  contentKeys,
} from '@/hooks/content';

// Re-export API functions for convenience
export {
  uploadContent,
  fetchContentById,
  fetchSessionContent,
  updateContent,
  deleteContent,
  downloadContent,
} from '@/lib/api/content';

// Re-export utility functions
export {
  validateContentFile,
  getContentTypeFromFile,
  formatFileSize,
  getContentTypeIcon,
  CONTENT_CONFIG,
} from '@/types/content';
