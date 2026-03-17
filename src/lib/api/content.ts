import { axiosInstance } from '@/lib/axios';
import { toast } from 'sonner';
import {
  Content,
  ContentUploadRequest,
  ContentUpdateRequest,
  ContentListResponse,
  ContentResponse,
  ContentListParams,
  validateContentFile,
  getContentTypeFromFile,
} from '@/types/content';

// API Functions for Content Management

/**
 * Upload a new content file to a session
 */
export const uploadContent = async (
  request: ContentUploadRequest
): Promise<Content> => {
  try {
    // Validate the file before upload
    const validation = validateContentFile(request.file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Auto-detect content type if not provided
    const contentType = request.type || getContentTypeFromFile(request.file);
    if (!contentType) {
      throw new Error('Unable to determine content type from file');
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('title', request.title);
    formData.append('sessionId', request.sessionId);
    formData.append('type', contentType);

    console.log('Uploading content:', {
      fileName: request.file.name,
      fileSize: request.file.size,
      title: request.title,
      sessionId: request.sessionId,
      type: contentType,
    });

    const response = await axiosInstance.post<ContentResponse>(
      '/content',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Add upload progress tracking if needed
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        },
      }
    );

    console.log('Content uploaded successfully:', response.data);
    toast.success('Content uploaded successfully');
    return response.data.content;
  } catch (error: unknown) {
    console.error('Error uploading content:', error);
    const errorMessage =
      (
        error as {
          response?: { data?: { message?: string } };
          message?: string;
        }
      )?.response?.data?.message ||
      (error as { message?: string })?.message ||
      'Failed to upload content';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Get content by ID
 */
export const fetchContentById = async (contentId: string): Promise<Content> => {
  try {
    console.log(`Fetching content with ID: ${contentId}`);
    const response = await axiosInstance.get<{ content: Content }>(
      `/content/${contentId}`
    );

    console.log('Content fetched successfully:', response.data);
    return response.data.content;
  } catch (error: unknown) {
    console.error('Error fetching content:', error);
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message || 'Failed to fetch content';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Get all content for a session with pagination and filtering
 */
export const fetchSessionContent = async (
  sessionId: string,
  params: ContentListParams = {}
): Promise<ContentListResponse> => {
  try {
    const { page = 1, limit = 10, type } = params;

    // Build query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) {
      queryParams.append('type', type);
    }

    const url = `/content/session/${sessionId}?${queryParams.toString()}`;
    console.log(`Fetching session content: ${url}`);

    const response = await axiosInstance.get<ContentListResponse>(url);

    console.log('Session content fetched successfully:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching session content:', error);
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message || 'Failed to fetch session content';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Update content metadata and permissions
 */
export const updateContent = async (
  contentId: string,
  request: ContentUpdateRequest
): Promise<Content> => {
  try {
    console.log(`Updating content ${contentId}:`, request);

    const response = await axiosInstance.put<ContentResponse>(
      `/content/${contentId}`,
      request
    );

    console.log('Content updated successfully:', response.data);
    toast.success('Content updated successfully');
    return response.data.content;
  } catch (error: unknown) {
    console.error('Error updating content:', error);
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message || 'Failed to update content';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Delete content
 */
export const deleteContent = async (contentId: string): Promise<void> => {
  try {
    console.log(`Deleting content with ID: ${contentId}`);

    await axiosInstance.delete(`/content/${contentId}`);

    console.log('Content deleted successfully');
    toast.success('Content deleted successfully');
  } catch (error: unknown) {
    console.error('Error deleting content:', error);
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message || 'Failed to delete content';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Download content file using the new download endpoint
 */
export const downloadContent = async (content: Content): Promise<void> => {
  try {
    console.log(`Downloading content: ${content.title}`);

    // Use the new download endpoint with proper headers
    const response = await axiosInstance.get(
      `/content/download/${content.id}`,
      {
        responseType: 'blob', // Important for file downloads
        headers: {
          'Accept': 'application/octet-stream',
        },
      }
    );

    // Create a blob URL and trigger download
    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    
    // Extract filename from Content-Disposition header or use title with extension
    let filename = content.title;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    } else {
      // Fallback: add extension based on content type
      const contentType = response.headers['content-type'];
      filename = getFilenameWithExtension(content.title, contentType);
    }

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success(`Downloaded: ${filename}`);
  } catch (error: unknown) {
    console.error('Error downloading content:', error);
    
    // Check if it's a network error or backend error
    const errorMessage = 
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as { message?: string })?.message ||
      'Failed to download content';
    
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Helper function to add appropriate file extension based on content type
 */
function getFilenameWithExtension(title: string, contentType: string): string {
  // Remove any existing extension from title
  const baseTitle = title.replace(/\.[^/.]+$/, '');
  
  // Map content types to extensions
  const extensionMap: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'video/mp4': '.mp4',
    'video/avi': '.avi',
    'video/mov': '.mov',
    'video/wmv': '.wmv',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar',
  };

  const extension = extensionMap[contentType] || '';
  return baseTitle + extension;
}
