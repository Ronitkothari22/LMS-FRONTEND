import { axiosInstance } from '@/lib/axios';
import { toast } from 'sonner';
import {
  Feedback,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  GetFeedbackFormsResponse,
} from '@/types/feedback';

// API Functions for Feedback Module

/**
 * Get all feedback forms for a session
 * @param sessionId - Session ID
 * @returns Array of feedback forms
 */
export const getFeedbackForms = async (sessionId: string): Promise<Feedback[]> => {
  try {
    console.log(`Fetching feedback forms for session ID: ${sessionId}`);
    const response = await axiosInstance.get<GetFeedbackFormsResponse>(`/feedback/${sessionId}`);
    console.log('Feedback forms data from API:', response.data);

    if (response.data && response.data.success) {
      const feedbackForms = response.data.data;
      
      // Sort feedback forms by creation date (newest first)
      if (Array.isArray(feedbackForms)) {
        feedbackForms.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

        // Sort questions within each feedback form by order
        feedbackForms.forEach((feedback) => {
          if (feedback.questions && Array.isArray(feedback.questions)) {
            feedback.questions.sort((a, b) => a.order - b.order);
          }
        });
      }

      return feedbackForms || [];
    }

    return [];
  } catch (error) {
    console.error('Error fetching feedback forms:', error);

    // Show more specific error message if available
    if (error.response?.status === 404) {
      toast.error('No feedback forms found for this session');
    } else if (error.response?.status === 403) {
      toast.error('You do not have access to this session');
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Failed to fetch feedback forms');
    }

    return [];
  }
};

/**
 * Submit feedback response
 * @param sessionId - Session ID
 * @param feedbackData - Feedback submission data
 * @returns Submission response
 */
export const submitFeedback = async (
  sessionId: string,
  feedbackData: SubmitFeedbackRequest
): Promise<SubmitFeedbackResponse | null> => {
  try {
    console.log('Submitting feedback:', { sessionId, feedbackData });
    const response = await axiosInstance.post<SubmitFeedbackResponse>(
      `/feedback/${sessionId}/submit`,
      feedbackData
    );
    console.log('Submit feedback response:', response.data);

    if (response.data && response.data.success) {
      toast.success(response.data.message || 'Feedback submitted successfully');
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Error submitting feedback:', error);

    // Show more specific error message if available
    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.message || 'Invalid feedback data';
      toast.error(errorMessage);
    } else if (error.response?.status === 403) {
      toast.error('You do not have access to submit feedback for this session');
    } else if (error.response?.status === 404) {
      toast.error('Feedback form not found');
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Failed to submit feedback. Please try again.');
    }

    throw error;
  }
};

/**
 * Get a specific feedback form by ID from a session
 * @param feedbackId - Feedback form ID
 * @param sessionId - Session ID (optional, will be extracted from feedback if not provided)
 * @returns Feedback form data
 */
export const getFeedbackById = async (feedbackId: string, sessionId?: string): Promise<Feedback | null> => {
  try {
    console.log(`Fetching feedback with ID: ${feedbackId}`);
    
    // If sessionId is not provided, we need to find it first
    // For now, let's assume we have sessionId from the context
    if (!sessionId) {
      console.error('Session ID is required to fetch feedback');
      toast.error('Session information is missing');
      return null;
    }

    // Get all feedback forms for the session
    const feedbackForms = await getFeedbackForms(sessionId);
    
    // Find the specific feedback form by ID
    const feedbackData = feedbackForms.find(feedback => feedback.id === feedbackId);
    
    if (!feedbackData) {
      console.log('Feedback form not found in session');
      toast.error('Feedback form not found or you don\'t have access to it');
      return null;
    }

    // Sort questions by order
    if (feedbackData.questions && Array.isArray(feedbackData.questions)) {
      feedbackData.questions.sort((a, b) => a.order - b.order);
    }

    return feedbackData;
  } catch (error) {
    console.error('Error fetching feedback form:', error);

    // Show more specific error message if available
    if (error.response?.status === 404) {
      toast.error('Feedback form not found');
    } else if (error.response?.status === 403) {
      toast.error('You do not have access to this feedback form');
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Failed to fetch feedback form');
    }

    return null;
  }
};

/**
 * Check if user has already submitted feedback for a specific form
 * @param sessionId - Session ID
 * @param feedbackId - Feedback form ID
 * @returns Boolean indicating if user has submitted
 */
export const hasUserSubmittedFeedback = async (
  sessionId: string,
  feedbackId: string
): Promise<boolean> => {
  try {
    // This is inferred from the hasSubmitted field in the feedback form response
    // We'll use the getFeedbackForms API and check the hasSubmitted field
    const feedbackForms = await getFeedbackForms(sessionId);
    const targetFeedback = feedbackForms.find(feedback => feedback.id === feedbackId);
    
    return targetFeedback?.hasSubmitted || false;
  } catch (error) {
    console.error('Error checking feedback submission status:', error);
    return false;
  }
}; 