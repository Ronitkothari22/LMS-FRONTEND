import { axiosInstance } from '@/lib/axios';
import { toast } from 'sonner';

// Types
export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'MULTI_CORRECT'
  | 'TEXT'
  | 'MATCHING';

export interface QuizQuestion {
  id: string;
  text: string;
  type?: QuestionType; // Question type from backend
  options: {
    id: string;
    text: string;
  }[];
  correctAnswer?: string; // Only included in results
  imageUrl?: string; // Image URL for the question
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  sessionId: string;
  sessionTitle: string;
  timeLimit: number; // in minutes
  totalQuestions: number;
  questions: QuizQuestion[];
  retryQuiz?: boolean; // Whether retries are allowed for this quiz
  canRetake?: boolean; // Whether the current user can retake this quiz
  timeLimitSeconds?: number; // Time limit in seconds from API
  pointsPerQuestion?: number; // Points per question
  passingScore?: number; // Passing score
  totalMarks?: number; // Total marks
  userStatus?: 'AVAILABLE' | 'COMPLETED' | 'CAN_RETRY' | 'ADMIN_ACCESS'; // User's status with this quiz
  message?: string; // Message about quiz status
}

export interface QuizResults {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  answers: Record<number, string>;
  responseId?: string; // ID of the stored quiz response in the database
  questionResults?: Array<{
    questionId: string;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
  }>; // Accurate per-question results from backend
}

export interface QuizSubmission {
  quizId: string;
  answers: Record<number, string>;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  completedAt?: string;
}

export interface QuizLeaderboard {
  leaderboard: LeaderboardEntry[];
  quizTitle?: string;
}

export interface QuizAttemptStatus {
  hasAttempted: boolean;
  canRetake: boolean;
  lastAttemptScore?: number;
  lastAttemptDate?: string;
}

export interface QuizAccessStatus {
  canAccess: boolean;
  userStatus: 'AVAILABLE' | 'COMPLETED' | 'CAN_RETRY';
  lastAttemptScore?: number;
  lastAttemptDate?: string;
  message?: string;
}

// Raw API data interfaces
interface RawQuestionOption {
  id?: string;
  text?: string;
  value?: string;
  label?: string;
}

interface RawQuizQuestion {
  id?: string;
  text: string;
  type?: QuestionType;
  options?: string | RawQuestionOption[];
  correctAnswer?: string;
  imageUrl?: string;
}



interface QuizSubmissionPayload {
  answers: Record<string, string>;
  attemptTime: string;
  timeTaken: Record<string, number>;
  sessionId?: string;
}

interface QuizAnswerData {
  isCorrect?: boolean;
  userAnswer?: string;
}

interface RawLeaderboardEntry {
  userId?: string;
  name?: string;
  userName?: string;
  score?: number;
  completedAt?: string;
}

// API Functions
export const fetchQuiz = async (
  sessionId: string,
  quizId?: string
): Promise<Quiz> => {
  try {
    let response;

    // If quizId is provided, fetch that specific quiz directly
    if (quizId) {
      const encodedQuizId = encodeURIComponent(quizId);
      console.log(`Fetching specific quiz with ID: ${quizId}`);
      response = await axiosInstance.get(`quizzes/${encodedQuizId}`);
    } else {
      // Otherwise, fetch quizzes by sessionId (original behavior)
      const encodedSessionId = encodeURIComponent(sessionId);
      console.log(`Fetching quizzes for session: ${sessionId}`);
      response = await axiosInstance.get(
        `quizzes?sessionId=${encodedSessionId}`
      );
    }

    console.log('Quiz data from API:', response.data);
    console.log('Quiz data structure:', JSON.stringify(response.data, null, 2));

    // Process the API response
    if (response.data && response.data.data) {
      const quizData = response.data.data;

      // Handle different response formats based on whether we fetched by quizId or sessionId
      let singleQuiz;

      if (quizId) {
        // When fetching by quizId, the response is a single quiz object
        console.log('Processing single quiz fetched by ID');
        singleQuiz = quizData;
      } else {
        // When fetching by sessionId, the response is an array of quizzes
        console.log(
          'Quiz questions structure:',
          JSON.stringify(quizData[0]?.questions, null, 2)
        );

        // Check if we have a quiz or an array of quizzes
        singleQuiz =
          Array.isArray(quizData) && quizData.length > 0
            ? quizData[0]
            : quizData;
      }

      // If we have a quiz ID but no questions or incomplete questions, fetch the full quiz
      if (
        singleQuiz &&
        singleQuiz.id &&
        (!singleQuiz.questions ||
          (Array.isArray(singleQuiz.questions) &&
            singleQuiz.questions.length > 0 &&
            !singleQuiz.questions[0].options))
      ) {
        console.log(`Fetching complete quiz data for ID: ${singleQuiz.id}`);
        try {
          // Fetch the complete quiz by ID to get all details including options
          const fullQuizResponse = await axiosInstance.get(
            `quizzes/${singleQuiz.id}`
          );
          console.log('Full quiz data:', fullQuizResponse.data);

          if (fullQuizResponse.data && fullQuizResponse.data.data) {
            // Use the complete quiz data which should include options
            const fullQuiz = fullQuizResponse.data.data;

            // Update the questions with the complete data
            if (fullQuiz.questions) {
              singleQuiz.questions = fullQuiz.questions;
            }
          }
        } catch (fullQuizError) {
          console.error('Error fetching complete quiz:', fullQuizError);
        }
      }

      // Cache the quiz data for later use in answer formatting
      if (typeof window !== 'undefined' && singleQuiz && singleQuiz.id) {
        try {
          localStorage.setItem(
            `quiz-${singleQuiz.id}`,
            JSON.stringify(singleQuiz)
          );
        } catch (cacheError) {
          console.error('Error caching quiz data:', cacheError);
        }
      }

      // Format the quiz data to match our frontend format
      return {
        id: singleQuiz.id || `quiz-${sessionId}`,
        title: singleQuiz.title || 'Session Quiz',
        description:
          singleQuiz.description ||
          'Test your knowledge of concepts covered in this session.',
        sessionId: singleQuiz.sessionId || sessionId,
        sessionTitle: quizData.sessionTitle || 'Learning Session',
        timeLimit: singleQuiz.timeLimitSeconds
          ? Math.ceil(singleQuiz.timeLimitSeconds / 60)
          : 15, // Convert seconds to minutes
        totalQuestions: singleQuiz.questions?.length || 0,
        questions: Array.isArray(singleQuiz.questions)
                      ? singleQuiz.questions.map((q: RawQuizQuestion, qIndex: number) => {
              console.log(`Processing question ${qIndex}:`, q);
              console.log(`Question ${qIndex} imageUrl:`, q.imageUrl);
              return {
                id: q.id || `question-${qIndex}`,
                text: q.text,
                type: q.type || 'MULTIPLE_CHOICE', // Default to MULTIPLE_CHOICE if not specified
                options: (() => {
                  console.log(`Processing options for question ${q.id}:`, q.options, 'Type:', typeof q.options);
                  
                  // PRIORITY 1: Handle options as an array (new backend format)
                  if (Array.isArray(q.options) && q.options.length > 0) {
                    console.log(`✅ Processing as array for question ${q.id}:`, q.options);
                    return q.options.map(
                      (opt: RawQuestionOption | string, index: number) => {
                        if (typeof opt === 'string') {
                          // String option - IMPORTANT: Do NOT split by commas, treat as single option
                          console.log(`  ✅ Array item ${index} is string (preserving commas):`, opt);
                          return {
                            id: `${q.id}-${String.fromCharCode(97 + index)}`,
                            text: opt, // Keep the full string, including any commas
                          };
                        } else if (typeof opt === 'object' && opt !== null) {
                          // Object option
                          console.log(`  ✅ Array item ${index} is object:`, opt);
                          return {
                            id:
                              opt.id ||
                              `${q.id}-${String.fromCharCode(97 + index)}`,
                            text:
                              opt.text ||
                              opt.value ||
                              opt.label ||
                              `Option ${index + 1}`,
                          };
                        } else {
                          // Fallback for other types
                          console.log(`  ⚠️ Array item ${index} unknown type:`, opt);
                          return {
                            id: `${q.id}-${String.fromCharCode(97 + index)}`,
                            text: String(opt),
                          };
                        }
                      }
                    );
                  }

                  // PRIORITY 2: Handle options as a string (legacy format only)
                  if (
                    typeof q.options === 'string' &&
                    q.options.trim() !== ''
                  ) {
                    console.log(
                      `⚠️ Processing as string for question ${q.id}: ${q.options}`
                    );
                    
                    let optionsArray: string[] = [];
                    
                    // Try to parse as JSON array first (new format stored as string)
                    try {
                      const parsedOptions = JSON.parse(q.options);
                      if (Array.isArray(parsedOptions)) {
                        optionsArray = parsedOptions;
                        console.log(`✅ Parsed string as JSON array:`, optionsArray);
                      } else {
                        throw new Error('Not an array');
                      }
                    } catch {
                      // Fallback to comma-separated parsing (old format)
                      optionsArray = q.options
                      .split(',')
                      .map((opt) => opt.trim());
                      console.log(`⚠️ Parsed string as comma-separated:`, optionsArray);
                    }
                    
                    return optionsArray.map((opt: string, index: number) => ({
                      id: `${q.id}-${String.fromCharCode(97 + index)}`,
                      text: opt,
                    }));
                  }

                  // If no options are found, try to create them from correctAnswer if available
                  if (q.correctAnswer && typeof q.correctAnswer === 'string') {
                    console.log(
                      `No options found, but correctAnswer exists: ${q.correctAnswer}`
                    );
                    // Create some basic options including the correct answer
                    const dummyOptions = [
                      'Option A',
                      'Option B',
                      q.correctAnswer,
                      'Option C',
                    ];
                    return dummyOptions.map((opt: string, index: number) => ({
                      id: `${q.id}-${String.fromCharCode(97 + index)}`,
                      text: opt,
                    }));
                  }

                  // If no options are provided, return an empty array
                  console.log(`No options found for question ${q.id}`);
                  return [];
                })(),
                correctAnswer: q.correctAnswer,
                imageUrl: q.imageUrl, // Include the image URL
              };
            })
          : [],
        retryQuiz: singleQuiz.retryQuiz,
        canRetake: singleQuiz.canRetake,
        timeLimitSeconds: singleQuiz.timeLimitSeconds,
        pointsPerQuestion: singleQuiz.pointsPerQuestion,
        passingScore: singleQuiz.passingScore,
        totalMarks: singleQuiz.totalMarks,
        userStatus: singleQuiz.userStatus,
        message: singleQuiz.message,
      };
    }

    // If the response format is unexpected, throw an error
    throw new Error('Invalid quiz data format from API');
  } catch (error) {
    console.error('Error fetching quiz:', error);
    // Re-throw the error to be handled by the component
    throw error;
  }
};

export const submitQuiz = async (
  quizId: string,
  answers: Record<string, string>, // Changed to use question IDs as keys and answer text as values
  sessionId?: string, // Add sessionId parameter to associate with the session
  timeTaken?: Record<string, number> // Changed to use question IDs as keys
): Promise<QuizResults> => {
  try {
    const encodedQuizId = encodeURIComponent(quizId);

    // Format the answers according to the expected API format
    // The backend expects:
    // {
    //   "answers": {
    //     "66a4d645-3e01-4dae-bd09-efe0f054d479": "RED , BLUE",
    //     "b7c09923-a39c-43f5-b48e-0fa7df1b7acd": "Delhi",
    //     "6510ead2-a384-4225-9f91-a28fa1173fd5": "RED"
    //   },
    //   "attemptTime": "2025-05-30T13:15:00.000Z",
    //   "timeTaken": {
    //     "66a4d645-3e01-4dae-bd09-efe0f054d479": 25,
    //     "b7c09923-a39c-43f5-b48e-0fa7df1b7acd": 20,
    //     "6510ead2-a384-4225-9f91-a28fa1173fd5": 30
    //   }
    // }

    console.log('Submitting quiz with answers:', answers);
    console.log('Time taken data:', timeTaken);

    // The answers and timeTaken are already in the correct format with question IDs as keys
    // and actual answer text as values, so we can use them directly
    const formattedAnswers: Record<string, string> = { ...answers };
    const formattedTimeTaken: Record<string, number> = timeTaken ? { ...timeTaken } : {};

    // Ensure all questions have time data (default to 30 seconds if missing)
    Object.keys(formattedAnswers).forEach((questionId) => {
      if (!formattedTimeTaken[questionId]) {
        formattedTimeTaken[questionId] = 30;
      }
    });

    console.log('Formatted answers:', formattedAnswers);
    console.log('Formatted timeTaken:', formattedTimeTaken);

    // Prepare the request payload according to the expected format
    const payload: QuizSubmissionPayload = {
      answers: formattedAnswers,
      attemptTime: new Date().toISOString(),
      timeTaken: formattedTimeTaken,
    };

    // Include sessionId if provided (though it might not be needed in the new format)
    if (sessionId) {
      console.log('Including sessionId in quiz submission:', sessionId);
      payload.sessionId = sessionId;
    }

    // Log the full payload for debugging
    console.log(
      'Full quiz submission payload:',
      JSON.stringify(payload, null, 2)
    );

    // Use the correct endpoint for submitting quiz answers
    const response = await axiosInstance.post(
      `quizzes/${encodedQuizId}/submit`,
      payload
    );

    console.log('Quiz submission response:', response.data);
    console.log('Full response object:', JSON.stringify(response, null, 2));

    // Process the API response
    if (response.data) {
      // Handle different response formats
      const resultData = response.data.data || response.data;
      console.log('Processed result data:', resultData);

      // Store the quiz results in localStorage for persistence
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            `quiz-result-${quizId}`,
            JSON.stringify(resultData)
          );

          // Also store the association with the session if provided
          if (sessionId) {
            localStorage.setItem(`quiz-session-${quizId}`, sessionId);
          }
        } catch (storageError) {
          console.error(
            'Error storing quiz results in localStorage:',
            storageError
          );
        }
      }

      // Calculate correct answers if not provided
      let correctAnswersCount = resultData.correctAnswers;
      
      // Check questionResults array (new backend format)
      if (
        correctAnswersCount === undefined &&
        Array.isArray(resultData.questionResults)
      ) {
        correctAnswersCount = resultData.questionResults.filter(
          (result: { isCorrect: boolean }) => result.isCorrect
        ).length;
      }
      
      // Fallback to old answers format
      if (
        correctAnswersCount === undefined &&
        Array.isArray(resultData.answers)
      ) {
        correctAnswersCount = resultData.answers.filter(
          (a: QuizAnswerData) => a.isCorrect
        ).length;
      }

      // Show success message
      toast.success('Quiz submitted successfully!');

      // Format the results to match our frontend format
      // Ensure totalQuestions is a whole number
      const totalQuestions = Math.round(
        resultData.totalQuestions ||
          (Array.isArray(resultData.questionResults)
            ? resultData.questionResults.length
            : resultData.totalMarks && typeof resultData.totalMarks === 'number'
            ? Math.round(resultData.totalMarks / 10)
            : Object.keys(answers).length)
      );

      // Ensure correctAnswers is a whole number and doesn't exceed totalQuestions
      const finalCorrectAnswers = Math.min(
        Math.round(correctAnswersCount || 0),
        totalQuestions
      );

      console.log(
        'Raw correctAnswersCount:',
        correctAnswersCount,
        'type:',
        typeof correctAnswersCount
      );

      // Calculate score as a percentage (0-100)
      let score = 0;
      
      // Use backend's score calculation if available
      if (resultData.marksObtained !== undefined && resultData.totalMarks !== undefined) {
        score = resultData.totalMarks > 0 
          ? Math.round((resultData.marksObtained / resultData.totalMarks) * 100)
          : 0;
      } else if (totalQuestions > 0) {
        // Fallback to our calculation
        score = Math.round((finalCorrectAnswers / totalQuestions) * 100);
      }

      console.log('Calculated quiz results:', {
        score,
        correctAnswers: finalCorrectAnswers,
        totalQuestions,
        originalValues: {
          score: resultData.score,
          correctAnswers: correctAnswersCount,
          totalQuestions: resultData.totalQuestions,
          totalMarks: resultData.totalMarks,
        },
      });

      // Debug: Log questionResults to confirm they're being passed through
      if (resultData.questionResults) {
        console.log('✅ Passing through questionResults from backend:', resultData.questionResults);
      } else {
        console.log('⚠️ No questionResults found in backend response');
      }

      return {
        score: score,
        correctAnswers: finalCorrectAnswers,
        totalQuestions: totalQuestions,
        answers: answers,
        responseId:
          resultData.id || resultData.responseId || resultData.attemptId, // Include the response ID from the backend
        // 🎯 FIX: Pass through questionResults from backend for accurate question review
        questionResults: resultData.questionResults || [],
      };
    }

    // If the response format is unexpected but we still got a response, return a basic result
    console.warn('Unexpected response format, creating default result object');
    return {
      score: 0,
      correctAnswers: 0,
      totalQuestions: Object.keys(answers).length,
      answers: answers,
      responseId: `local-${Date.now()}`, // Generate a local ID for tracking
      questionResults: [], // No question results available in fallback
    };
  } catch (error) {
    console.error('Error submitting quiz:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    const errorMessage =
      error.response?.data?.message || 'Failed to submit quiz';
    toast.error(errorMessage);

    // Re-throw the error to be handled by the component
    throw error;
  }
};

export const fetchQuizResults = async (
  quizId: string
): Promise<QuizResults> => {
  try {
    const encodedQuizId = encodeURIComponent(quizId);
    // Use the correct endpoint for fetching quiz results
    const response = await axiosInstance.get(
      `quizzes/${encodedQuizId}/results`
    );

    console.log('Quiz results from API:', response.data);

    // Process the API response
    if (response.data && response.data.data) {
      const resultData = response.data.data;

      // Store the quiz results in localStorage for persistence
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            `quiz-result-${quizId}`,
            JSON.stringify(resultData)
          );
        } catch (storageError) {
          console.error(
            'Error storing quiz results in localStorage:',
            storageError
          );
        }
      }

      // Format the results to match our frontend format
      const formattedAnswers: Record<number, string> = {};

      // If we have answers in the response, format them
      if (Array.isArray(resultData.answers)) {
        resultData.answers.forEach((answer: QuizAnswerData, index: number) => {
          formattedAnswers[index] = answer.userAnswer || '';
        });
      }

      // Ensure totalQuestions is a whole number
      const totalQuestions = Math.round(
        resultData.totalQuestions ||
          (resultData.totalMarks && typeof resultData.totalMarks === 'number'
            ? Math.round(resultData.totalMarks / 10)
            : Object.keys(formattedAnswers).length || 1)
      );

      // Ensure correctAnswers is a whole number and doesn't exceed totalQuestions
      const finalCorrectAnswers = Math.min(
        Math.round(resultData.correctAnswers || 0),
        totalQuestions
      );

      console.log(
        'Raw correctAnswers from fetch:',
        resultData.correctAnswers,
        'type:',
        typeof resultData.correctAnswers
      );

      // Calculate score as a percentage (0-100)
      const score =
        totalQuestions > 0
          ? Math.round((finalCorrectAnswers / totalQuestions) * 100)
          : 0;

      console.log('Calculated quiz results from fetch:', {
        score,
        correctAnswers: finalCorrectAnswers,
        totalQuestions,
        originalValues: {
          score: resultData.score,
          correctAnswers: resultData.correctAnswers,
          totalQuestions: resultData.totalQuestions,
          totalMarks: resultData.totalMarks,
        },
      });

      return {
        score: score,
        correctAnswers: finalCorrectAnswers,
        totalQuestions: totalQuestions,
        answers: formattedAnswers,
      };
    }

    // If the response format is unexpected, throw an error
    throw new Error('Invalid quiz result format from API');
  } catch (error) {
    console.error('Error fetching quiz results:', error);

    // Re-throw the error to be handled by the component
    throw error;
  }
};

/**
 * Fetches the leaderboard for a specific quiz
 * @param quizId The ID of the quiz to fetch the leaderboard for
 * @returns Promise with the leaderboard data
 */
export const fetchQuizLeaderboard = async (
  quizId: string
): Promise<QuizLeaderboard> => {
  try {
    const encodedQuizId = encodeURIComponent(quizId);
    // Use the leaderboard endpoint
    console.log(
      `Fetching leaderboard for quiz ID: ${quizId} from endpoint: quizzes/${encodedQuizId}/leaderboard`
    );

    const response = await axiosInstance.get(
      `quizzes/${encodedQuizId}/leaderboard`
    );

    console.log('Quiz leaderboard API response status:', response.status);
    console.log('Quiz leaderboard from API:', response.data);

    // Log the structure of the response for debugging
    console.log(
      'Response structure:',
      JSON.stringify(
        {
          hasData: !!response.data,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          hasLeaderboard: response.data && 'leaderboard' in response.data,
          hasDataProperty: response.data && 'data' in response.data,
          dataPropertyType:
            response.data && 'data' in response.data
              ? typeof response.data.data
              : 'N/A',
          isDataArray:
            response.data && 'data' in response.data
              ? Array.isArray(response.data.data)
              : false,
        },
        null,
        2
      )
    );

    // Process the API response - handle different possible response formats
    if (response.data) {
      // If the response has a data property with leaderboard array
      if (response.data.data && Array.isArray(response.data.data.leaderboard)) {
        const leaderboardData = response.data.data;

        return {
          leaderboard: leaderboardData.leaderboard.map(
            (entry: RawLeaderboardEntry) => ({
              userId: entry.userId || '',
              userName: entry.name || entry.userName || 'Anonymous',
              score: typeof entry.score === 'number' ? entry.score : 0,
              completedAt: entry.completedAt || undefined,
            })
          ),
          quizTitle: leaderboardData.quizTitle || undefined,
        };
      }

      // If the response has a direct leaderboard array
      if (Array.isArray(response.data.leaderboard)) {
        return {
          leaderboard: response.data.leaderboard.map(
            (entry: RawLeaderboardEntry) => ({
              userId: entry.userId || '',
              userName: entry.name || entry.userName || 'Anonymous',
              score: typeof entry.score === 'number' ? entry.score : 0,
              completedAt: entry.completedAt || undefined,
            })
          ),
          quizTitle: response.data.quizTitle || undefined,
        };
      }

      // If the response itself is an array
      if (Array.isArray(response.data)) {
        return {
          leaderboard: response.data.map((entry: RawLeaderboardEntry) => ({
            userId: entry.userId || '',
            userName: entry.name || entry.userName || 'Anonymous',
            score: typeof entry.score === 'number' ? entry.score : 0,
            completedAt: entry.completedAt || undefined,
          })),
        };
      }

      // If the response has a data array directly
      if (Array.isArray(response.data.data)) {
        return {
          leaderboard: response.data.data.map((entry: RawLeaderboardEntry) => ({
            userId: entry.userId || '',
            userName: entry.name || entry.userName || 'Anonymous',
            score: typeof entry.score === 'number' ? entry.score : 0,
            completedAt: entry.completedAt || undefined,
          })),
        };
      }

      // If the response has a success property and data
      if (response.data.success && response.data.data) {
        // Try to extract leaderboard data from various possible structures
        const data = response.data.data;

        if (Array.isArray(data)) {
          return {
            leaderboard: data.map((entry: RawLeaderboardEntry) => ({
              userId: entry.userId || '',
              userName: entry.name || entry.userName || 'Anonymous',
              score: typeof entry.score === 'number' ? entry.score : 0,
              completedAt: entry.completedAt || undefined,
            })),
          };
        }
      }
    }

    // If the response format is unexpected but we still got a response, return an empty leaderboard
    console.warn('Unexpected leaderboard response format:', response.data);
    return {
      leaderboard: [],
    };
  } catch (error) {
    console.error('Error fetching quiz leaderboard:', error);

    // Show error toast
    toast.error('Failed to load leaderboard data');

    // Throw the error to be handled by the component
    throw error;
  }
};

/**
 * Checks if a user has attempted a specific quiz and their attempt status
 * @param quizId The ID of the quiz to check attempt status for
 * @returns Promise with the attempt status data
 */
export const checkQuizAttempt = async (
  quizId: string
): Promise<QuizAttemptStatus> => {
  try {
    const encodedQuizId = encodeURIComponent(quizId);
    console.log(`Checking quiz attempt status for quiz ID: ${quizId}`);

    const response = await axiosInstance.get(
      `quizzes/${encodedQuizId}/attempt-status`
    );

    console.log('Quiz attempt status API response:', response.data);

    // Process the API response
    if (response.data) {
      const statusData = response.data.data || response.data;

      return {
        hasAttempted: statusData.hasAttempted || false,
        canRetake: statusData.canRetake !== false, // Default to true if not specified
        lastAttemptScore: statusData.lastAttemptScore || undefined,
        lastAttemptDate: statusData.lastAttemptDate || undefined,
      };
    }

    // Default response if no data
    return {
      hasAttempted: false,
      canRetake: true,
    };
  } catch (error) {
    console.error('Error checking quiz attempt status:', error);

    // If it's a 404, the user hasn't attempted the quiz yet
    if (error.response?.status === 404) {
      return {
        hasAttempted: false,
        canRetake: true,
      };
    }

    // For other errors, show a toast and re-throw
    toast.error('Failed to check quiz attempt status');
    throw error;
  }
};

/**
 * Checks if a user can access a specific quiz (new backend endpoint)
 * @param quizId The ID of the quiz to check access for
 * @returns Promise with the access status data
 */
export const checkQuizAccess = async (
  quizId: string
): Promise<QuizAccessStatus> => {
  try {
    const encodedQuizId = encodeURIComponent(quizId);
    console.log(`Checking quiz access for quiz ID: ${quizId}`);

    const response = await axiosInstance.get(
      `quizzes/${encodedQuizId}/access`
    );

    console.log('Quiz access API response:', response.data);

    // Process the API response
    if (response.data) {
      const accessData = response.data.data || response.data;

      return {
        canAccess: accessData.canAccess !== false, // Default to true
        userStatus: accessData.userStatus || 'AVAILABLE',
        lastAttemptScore: accessData.lastAttemptScore || undefined,
        lastAttemptDate: accessData.lastAttemptDate || undefined,
        message: accessData.message || undefined,
      };
    }

    // Default response if no data
    return {
      canAccess: true,
      userStatus: 'AVAILABLE',
    };
  } catch (error) {
    console.error('Error checking quiz access:', error);

    // Handle 403 Forbidden (user cannot access quiz)
    if (error.response?.status === 403) {
      const errorData = error.response.data || {};
      
      // Check if this is a completed quiz with retry enabled
      const retryQuiz = errorData.retryQuiz || errorData.data?.retryQuiz;
      
      if (retryQuiz) {
        return {
          canAccess: true,
          userStatus: 'CAN_RETRY',
          message: errorData.message || 'You can retake this quiz',
          lastAttemptScore: errorData.lastAttemptScore || errorData.data?.lastAttemptScore,
          lastAttemptDate: errorData.lastAttemptDate || errorData.data?.lastAttemptDate,
        };
      }
      
      return {
        canAccess: false,
        userStatus: 'COMPLETED',
        message: errorData.message || 'You have already completed this quiz',
        lastAttemptScore: errorData.lastAttemptScore,
        lastAttemptDate: errorData.lastAttemptDate,
      };
    }

    // If it's a 404, the quiz doesn't exist
    if (error.response?.status === 404) {
      toast.error('Quiz not found');
      throw error;
    }

    // For other errors, show a toast and re-throw
    toast.error('Failed to check quiz access');
    throw error;
  }
};
