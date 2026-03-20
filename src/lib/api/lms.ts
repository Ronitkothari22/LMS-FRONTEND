import { axiosInstance } from '@/lib/axios';
import { toast } from 'sonner';
import type {
  LmsApiError,
  LmsApiResponse,
  LmsCreateAttemptPayload,
  LmsGlobalLeaderboardData,
  LmsLevel,
  LmsLevelAttemptResult,
  LmsLevelCompletionResult,
  LmsProgressOverview,
  LmsTopic,
  LmsTopicLeaderboardData,
  LmsVideoProgressPayload,
} from '@/types/lms';

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const apiError = error as LmsApiError;
  return apiError?.response?.data?.message || apiError?.message || fallback;
};

export const fetchMyLmsTopics = async (): Promise<LmsTopic[]> => {
  try {
    const response = await axiosInstance.get<LmsApiResponse<{ topics: LmsTopic[] }>>('/lms/me/topics');
    return response.data?.data?.topics || [];
  } catch (error) {
    const message = getApiErrorMessage(error, 'Failed to fetch LMS topics');
    toast.error(message);
    throw error;
  }
};

export const fetchMyLmsTopicById = async (topicId: string): Promise<LmsTopic> => {
  try {
    const response = await axiosInstance.get<LmsApiResponse<{ topic: LmsTopic }>>(
      `/lms/me/topics/${topicId}`,
    );

    if (!response.data?.data?.topic) {
      throw new Error('Topic not found in LMS response');
    }

    return response.data.data.topic;
  } catch (error) {
    const message = getApiErrorMessage(error, 'Failed to fetch LMS topic');
    toast.error(message);
    throw error;
  }
};

export const fetchMyLmsLevelById = async (levelId: string): Promise<LmsLevel> => {
  try {
    const response = await axiosInstance.get<LmsApiResponse<{ level: LmsLevel }>>(
      `/lms/me/levels/${levelId}`,
    );

    if (!response.data?.data?.level) {
      throw new Error('Level not found in LMS response');
    }

    return response.data.data.level;
  } catch (error) {
    const message = getApiErrorMessage(error, 'Failed to fetch LMS level');
    toast.error(message);
    throw error;
  }
};

export const updateMyLmsVideoProgress = async (
  levelId: string,
  payload: LmsVideoProgressPayload,
): Promise<{ event?: unknown; progress?: unknown }> => {
  try {
    const response = await axiosInstance.post<LmsApiResponse<{ event?: unknown; progress?: unknown }>>(
      `/lms/me/levels/${levelId}/video-progress`,
      payload,
    );

    return response.data?.data || {};
  } catch (error) {
    const message = getApiErrorMessage(error, 'Failed to update video progress');
    toast.error(message);
    throw error;
  }
};

export const submitMyLmsLevelAttempt = async (
  levelId: string,
  payload: LmsCreateAttemptPayload,
): Promise<LmsLevelAttemptResult> => {
  try {
    const response = await axiosInstance.post<LmsApiResponse<LmsLevelAttemptResult>>(
      `/lms/me/levels/${levelId}/attempts`,
      payload,
    );

    if (!response.data?.data?.attempt) {
      throw new Error('Attempt result is missing in LMS response');
    }

    return response.data.data;
  } catch (error) {
    const message = getApiErrorMessage(error, 'Failed to submit level attempt');
    toast.error(message);
    throw error;
  }
};

export const completeMyLmsLevel = async (
  levelId: string,
  force = false,
): Promise<LmsLevelCompletionResult> => {
  try {
    const response = await axiosInstance.post<LmsApiResponse<LmsLevelCompletionResult>>(
      `/lms/me/levels/${levelId}/complete`,
      { force },
    );

    return (
      response.data?.data || {
        completion: {
          status: 'IN_PROGRESS',
        },
      }
    );
  } catch (error) {
    const message = getApiErrorMessage(error, 'Failed to complete level');
    toast.error(message);
    throw error;
  }
};

export const fetchMyLmsProgress = async (): Promise<LmsProgressOverview> => {
  try {
    const response = await axiosInstance.get<LmsApiResponse<LmsProgressOverview>>('/lms/me/progress');
    return response.data?.data || { topics: [], levels: [] };
  } catch (error) {
    const message = getApiErrorMessage(error, 'Failed to fetch LMS progress');
    toast.error(message);
    throw error;
  }
};

export const fetchLmsGlobalLeaderboard = async (
  limit = 50,
): Promise<LmsGlobalLeaderboardData> => {
  try {
    const response = await axiosInstance.get<LmsApiResponse<LmsGlobalLeaderboardData>>(
      `/lms/leaderboard/global?limit=${limit}`,
    );

    return response.data?.data || { leaderboard: [] };
  } catch (error) {
    const message = getApiErrorMessage(error, 'Failed to fetch global leaderboard');
    toast.error(message);
    throw error;
  }
};

export const fetchLmsTopicLeaderboard = async (
  topicId: string,
  limit = 50,
): Promise<LmsTopicLeaderboardData> => {
  try {
    const response = await axiosInstance.get<LmsApiResponse<LmsTopicLeaderboardData>>(
      `/lms/leaderboard/topics/${topicId}?limit=${limit}`,
    );

    const fallback: LmsTopicLeaderboardData = {
      topic: {
        id: topicId,
        title: 'Topic Leaderboard',
      },
      rankings: [],
    };

    return response.data?.data || fallback;
  } catch (error) {
    const message = getApiErrorMessage(error, 'Failed to fetch topic leaderboard');
    toast.error(message);
    throw error;
  }
};
