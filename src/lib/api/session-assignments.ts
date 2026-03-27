import { axiosInstance } from '@/lib/axios';

export type AssignmentDeadlineStatus = 'OPEN' | 'CLOSED' | 'LATE_ALLOWED';

export interface MySessionAssignmentFile {
  id: string;
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
  fileUrl: string;
  createdAt: string;
}

export interface MySessionAssignmentSubmission {
  id: string;
  assignmentId: string;
  sessionId: string;
  userId: string;
  submittedAt: string;
  isLate: boolean;
  version: number;
  status: 'SUBMITTED' | 'REPLACED' | 'WITHDRAWN';
  files: MySessionAssignmentFile[];
  createdAt: string;
  updatedAt: string;
}

export interface MySessionAssignment {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: string;
  allowLateSubmission: boolean;
  maxFileSizeMb: number;
  maxFilesPerSubmission: number;
  allowedFileTypes: string[];
  isActive: boolean;
  deadlineStatus: AssignmentDeadlineStatus;
  canSubmit: boolean;
  mySubmission: MySessionAssignmentSubmission | null;
}

export const fetchMySessionAssignments = async (
  sessionId: string,
  params?: { upcomingOnly?: boolean; page?: number; limit?: number },
): Promise<{
  items: MySessionAssignment[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const response = await axiosInstance.get(`/sessions/${sessionId}/me/assignments`, {
    params: {
      ...(typeof params?.upcomingOnly !== 'undefined' && {
        upcomingOnly: params.upcomingOnly,
      }),
      ...(params?.page && { page: params.page }),
      ...(params?.limit && { limit: params.limit }),
    },
  });

  return response.data.data;
};

export const fetchMySessionAssignmentById = async (
  sessionId: string,
  assignmentId: string,
): Promise<MySessionAssignment> => {
  const response = await axiosInstance.get(`/sessions/${sessionId}/me/assignments/${assignmentId}`);
  return response.data.data.assignment;
};

export const fetchMySessionAssignmentSubmission = async (
  sessionId: string,
  assignmentId: string,
): Promise<MySessionAssignmentSubmission> => {
  const response = await axiosInstance.get(
    `/sessions/${sessionId}/me/assignments/${assignmentId}/submission`,
  );
  return response.data.data.submission;
};

export const submitMySessionAssignment = async (
  sessionId: string,
  assignmentId: string,
  files: File[],
  replaceExisting?: boolean,
): Promise<MySessionAssignmentSubmission> => {
  if (!files.length) {
    throw new Error('Please select at least one file');
  }

  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  if (typeof replaceExisting === 'boolean') {
    formData.append('replaceExisting', String(replaceExisting));
  }
  formData.append('fileCount', String(files.length));

  const response = await axiosInstance.post(
    `/sessions/${sessionId}/me/assignments/${assignmentId}/submission`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data.data.submission;
};
