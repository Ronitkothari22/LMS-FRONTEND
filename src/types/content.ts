// Content Module Types

export type ContentType = 'IMAGE' | 'VIDEO' | 'PDF' | 'TEXT';

export interface ContentUser {
  id: string;
  name: string;
  email: string;
}

export interface ContentSession {
  id: string;
  title: string;
}

export interface Content {
  id: string;
  title: string;
  url: string;
  type: ContentType;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  session?: ContentSession;
  canView?: ContentUser[];
  canEdit?: ContentUser[];
}

export interface ContentUploadRequest {
  file: File;
  title: string;
  sessionId: string;
  type: ContentType;
}

export interface ContentUpdateRequest {
  title?: string;
  canView?: string[]; // Array of user UUIDs
  canEdit?: string[]; // Array of user UUIDs
}

export interface ContentListResponse {
  content: Content[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ContentResponse {
  message: string;
  content: Content;
}

export interface ContentListParams {
  page?: number;
  limit?: number;
  type?: ContentType;
}

// File validation constants
export const CONTENT_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB in bytes
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
  SUPPORTED_PDF_TYPES: ['application/pdf'],
  SUPPORTED_TEXT_TYPES: [
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

// Helper function to get content type from file
export function getContentTypeFromFile(file: File): ContentType | null {
  const { type } = file;

  if (CONTENT_CONFIG.SUPPORTED_IMAGE_TYPES.includes(type)) {
    return 'IMAGE';
  }

  if (CONTENT_CONFIG.SUPPORTED_VIDEO_TYPES.includes(type)) {
    return 'VIDEO';
  }

  if (CONTENT_CONFIG.SUPPORTED_PDF_TYPES.includes(type)) {
    return 'PDF';
  }

  if (CONTENT_CONFIG.SUPPORTED_TEXT_TYPES.includes(type)) {
    return 'TEXT';
  }

  return null;
}

// Helper function to validate file
export function validateContentFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > CONTENT_CONFIG.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${CONTENT_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check file type
  const contentType = getContentTypeFromFile(file);
  if (!contentType) {
    return {
      isValid: false,
      error:
        'Unsupported file type. Please upload an image, video, PDF, or text document.',
    };
  }

  return { isValid: true };
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to get content type icon
export function getContentTypeIcon(type: ContentType): string {
  switch (type) {
    case 'IMAGE':
      return '🖼️';
    case 'VIDEO':
      return '🎥';
    case 'PDF':
      return '📄';
    case 'TEXT':
      return '📝';
    default:
      return '📁';
  }
}

// Poll Types for User Participation
export interface Poll {
  id: string;
  title: string;
  joiningCode: string;
  isLive: boolean;
  showResults: boolean;
  questions: Question[];
  _count?: {
    participants: number;
    responses: number;
  };
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  isActive?: boolean;
  startedAt?: string;
  endedAt?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  pollId: string;
  imageUrl: string | null;
  order: number;
}

export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'WORD_CLOUD'
  | 'RANKING'
  | 'SCALE'
  | 'OPEN_TEXT'
  | 'Q_AND_A';

export interface WebSocketMessage {
  event?: string;
  type?: string;
  data: Record<string, unknown>;
}

export interface PollResponse {
  pollId: string;
  answer: string | string[] | number;
  type: QuestionType;
}

export interface ActiveQuestionData {
  action: 'new-question';
  data: {
    pollId: string;
    question: Question;
  };
}

export interface PollUpdateData {
  action: string;
  data: {
    pollId?: string;
    question?: Question;
    count?: number;
    results?: unknown;
    questionId?: string;
  };
}

export interface QuestionEndedData {
  pollId: string;
  timestamp: string;
  questionId: string;
}
