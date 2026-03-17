// API functions for user poll participation
import { axiosInstance } from '@/lib/axios';
import { toast } from 'sonner';
import type { Poll } from '@/types/content';

// API Response Types
export interface JoinPollResponse {
  message: string;
  poll?: Poll;
  success?: boolean;
  alreadyJoined?: boolean;
  joiningCode?: string;
}

// Join a poll via REST API then WebSocket
export async function joinPollWithCode(
  joiningCode: string
): Promise<JoinPollResponse> {
  try {
    const response = await axiosInstance.post('/poll/join', { joiningCode });
    console.log('Join poll response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error joining poll:', error);
    toast.error('Failed to join poll. Please check the code and try again.');
    throw error;
  }
}

// Submit response via REST API (fallback if WebSocket fails)
export async function submitPollResponse(
  pollId: string,
  responseData: {
    questionId?: string;
    optionId?: string;
    questionOptionId?: string;
    textResponse?: string;
    ranking?: number;
    scale?: number;
    anonymous?: boolean;
    timeTaken?: number;
  }
): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    const response = await axiosInstance.post(
      `/poll/${pollId}/response`,
      responseData
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting response:', error);
    throw error;
  }
}

// Get poll details by ID
export async function getPollById(pollId: string): Promise<Poll | null> {
  try {
    const response = await axiosInstance.get(`/poll/${pollId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching poll:', error);
    return null;
  }
}
