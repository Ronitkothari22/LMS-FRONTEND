/**
 * Local storage utilities for storing quiz responses when the backend is unavailable
 */

import { getItem, setItem } from './localStorageManager';
import * as keys from './localStorageKeys';

interface QuizAnswerData {
  answer: string;
  timeTaken: number;
}

interface QuizResponse {
  id: string;
  quizId: string;
  sessionId?: string;
  userId?: string;
  answers: Record<string, QuizAnswerData>;
  score: number;
  completedAt: string;
  createdAt: string;
}

/**
 * Stores a quiz response in local storage
 * @param quizId The ID of the quiz
 * @param sessionId The ID of the session
 * @param answers The user's answers
 * @param score The user's score
 * @returns The stored quiz response
 */
export const storeQuizResponse = (
  quizId: string,
  sessionId: string | undefined,
  answers: Record<number, string>,
  score: number,
  timeTaken?: Record<number, number>
): QuizResponse => {
  try {
    // Get existing responses
    const existingResponses = getStoredQuizResponses();

    // Create a new response
    const now = new Date().toISOString();
    const responseId = `local-${Date.now()}`;

    // Format the answers for storage
    const formattedAnswers: Record<string, QuizAnswerData> = {};
    Object.entries(answers).forEach(([questionIndex, answerId]) => {
      // Get the time taken for this question, or use default if not available
      const questionTime =
        timeTaken && timeTaken[parseInt(questionIndex)]
          ? timeTaken[parseInt(questionIndex)]
          : 30; // Default 30 seconds if no time data

      formattedAnswers[`question-${questionIndex}`] = {
        answer: answerId,
        timeTaken: questionTime,
      };
    });

    // Create the response object
    const response: QuizResponse = {
      id: responseId,
      quizId,
      sessionId,
      userId: (getItem(keys.USER_DATA) as { id?: string } | null)?.id || undefined,
      answers: formattedAnswers,
      score,
      completedAt: now,
      createdAt: now,
    };

    // Add to existing responses
    existingResponses.push(response);

    // Store in localStorage
    setItem(keys.QUIZ_RESPONSES, existingResponses);

    // Also store completion status for this session
    if (sessionId) {
      setItem(keys.QUIZ_COMPLETED(sessionId), 'true');
      setItem(keys.QUIZ_SCORE(sessionId), String(score));
      setItem(keys.QUIZ_RESPONSE_ID(sessionId), responseId);
    }

    console.log('Stored quiz response locally:', response);

    return response;
  } catch (error) {
    console.error('Error storing quiz response locally:', error);
    throw error;
  }
};

/**
 * Gets all stored quiz responses
 * @returns An array of stored quiz responses
 */
export const getStoredQuizResponses = (): QuizResponse[] => {
  try {
    const storedResponses = (getItem(keys.QUIZ_RESPONSES) as QuizResponse[] | null) || [];
    return storedResponses;
  } catch (error) {
    console.error('Error getting stored quiz responses:', error);
    return [];
  }
};

/**
 * Gets a stored quiz response by ID
 * @param responseId The ID of the response to get
 * @returns The stored quiz response, or undefined if not found
 */
export const getStoredQuizResponseById = (
  responseId: string
): QuizResponse | undefined => {
  try {
    const storedResponses = getStoredQuizResponses();
    return storedResponses.find((response) => response.id === responseId);
  } catch (error) {
    console.error('Error getting stored quiz response by ID:', error);
    return undefined;
  }
};

/**
 * Gets stored quiz responses by quiz ID
 * @param quizId The ID of the quiz
 * @returns An array of stored quiz responses for the quiz
 */
export const getStoredQuizResponsesByQuizId = (
  quizId: string
): QuizResponse[] => {
  try {
    const storedResponses = getStoredQuizResponses();
    return storedResponses.filter((response) => response.quizId === quizId);
  } catch (error) {
    console.error('Error getting stored quiz responses by quiz ID:', error);
    return [];
  }
};

/**
 * Gets stored quiz responses by session ID
 * @param sessionId The ID of the session
 * @returns An array of stored quiz responses for the session
 */
export const getStoredQuizResponsesBySessionId = (
  sessionId: string
): QuizResponse[] => {
  try {
    const storedResponses = getStoredQuizResponses();
    return storedResponses.filter(
      (response) => response.sessionId === sessionId
    );
  } catch (error) {
    console.error('Error getting stored quiz responses by session ID:', error);
    return [];
  }
};
