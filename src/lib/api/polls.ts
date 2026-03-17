import { axiosInstance } from '@/lib/axios';
import { toast } from 'sonner';

// Types
export interface PollOption {
  id: string;
  text: string;
  imageUrl?: string;
  order: number;
}

export interface PollQuestion {
  id: string;
  question: string;
  type: PollType;
  order: number;
  timeLimit?: number;
  options?: PollOption[];
}

export type PollType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'WORD_CLOUD'
  | 'RANKING'
  | 'SCALE'
  | 'OPEN_TEXT'
  | 'Q_AND_A';

export interface Poll {
  id: string;
  title: string;
  sessionId: string;
  type: PollType;
  isLive: boolean;
  showResults: boolean;
  isPublic: boolean;
  maxVotes?: number;
  timeLimit?: number;
  joiningCode: string;
  question?: string; // For backward compatibility
  questions?: PollQuestion[];
  options?: PollOption[]; // For backward compatibility
  createdAt: string;
  updatedAt: string;
  participants?: number;
  responses?: number;
  autoAdvance?: boolean; // Whether to automatically advance to the next question
  allowReview?: boolean; // Whether to allow reviewing previous answers
  anonymous?: boolean; // Whether the poll is anonymous by default
}

export interface PollResponse {
  id: string;
  pollId: string;
  questionId?: string;
  optionId?: string;
  questionOptionId?: string;
  textResponse?: string;
  ranking?: number;
  scale?: number;
  anonymous: boolean;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface PollResults {
  questionId?: string;
  totalResponses: number;
  options?: {
    id: string;
    text: string;
    count: number;
    percentage: number;
  }[];
  words?: {
    text: string;
    weight: number;
  }[];
  average?: number;
  distribution?: {
    value: number;
    count: number;
  }[];
  responses?: {
    id: string;
    text: string;
    user: {
      id: string;
      name: string;
    };
  }[];
}

export interface JoinPollResponse {
  message: string;
  poll: Poll;
}

// API Functions
export const fetchPollsBySession = async (
  sessionId: string
): Promise<Poll[]> => {
  try {
    console.log(`Fetching polls for session ID: ${sessionId}`);
    const response = await axiosInstance.get(`/poll?sessionId=${sessionId}`);
    console.log('Polls data from API:', response.data);

    // Process the polls data if needed
    const pollsData = response.data;

    // Sort polls by creation date (newest first)
    if (Array.isArray(pollsData)) {
      pollsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      // Prioritize live polls
      pollsData.sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        return 0;
      });
    }

    return pollsData || [];
  } catch (error) {
    console.error('Error fetching polls:', error);

    // Show more specific error message if available
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Failed to fetch polls');
    }

    return [];
  }
};

export const fetchPollById = async (pollId: string): Promise<Poll | null> => {
  try {
    console.log(`Fetching poll with ID: ${pollId}`);
    const response = await axiosInstance.get(`/poll/${pollId}`);
    console.log('Poll data from API:', response.data);

    // Process the poll data if needed
    const pollData = response.data;

    // If the poll has questions, sort them by order
    if (pollData.questions && Array.isArray(pollData.questions)) {
      pollData.questions.sort((a, b) => a.order - b.order);

      // Sort options within each question by order
      pollData.questions.forEach((question) => {
        if (question.options && Array.isArray(question.options)) {
          question.options.sort((a, b) => a.order - b.order);
        }
      });
    }

    // If the poll has options (for backward compatibility), sort them by order
    if (pollData.options && Array.isArray(pollData.options)) {
      pollData.options.sort((a, b) => a.order - b.order);
    }

    return pollData;
  } catch (error) {
    console.error('Error fetching poll:', error);

    // Show more specific error message if available
    if (error.response?.status === 404) {
      toast.error('Poll not found or you do not have access to it');
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Failed to fetch poll details');
    }

    return null;
  }
};

export const joinPoll = async (
  joiningCode: string
): Promise<JoinPollResponse> => {
  try {
    const response = await axiosInstance.post('/poll/join', { joiningCode });
    console.log('Join poll response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error joining poll:', error);
    toast.error('Failed to join poll. Please check the code and try again.');
    throw error;
  }
};

export const submitPollResponse = async (
  pollId: string,
  data: {
    questionId?: string;
    optionId?: string;
    questionOptionId?: string;
    textResponse?: string;
    ranking?: number;
    scale?: number;
    anonymous: boolean;
    timeTaken?: number; // Time taken to answer in seconds
  }
): Promise<PollResponse> => {
  try {
    // Add timestamp to track when the response was submitted
    const payload = {
      pollId,
      timestamp: new Date().toISOString(),
      ...data,
    };

    console.log('Submitting poll response with payload:', payload);

    const response = await axiosInstance.post(
      `/poll/${pollId}/response`,
      payload
    );
    console.log('Submit poll response successful:', response.data);

    // Show success message
    toast.success('Response submitted successfully');

    return response.data;
  } catch (error) {
    console.error('Error submitting poll response:', error);

    // Show more specific error message if available
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Failed to submit your response. Please try again.');
    }

    throw error;
  }
};
