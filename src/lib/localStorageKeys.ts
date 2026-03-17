// All localStorage keys used in the app
export const USER_DATA = 'userData';
export const QUIZ_RESPONSES = 'quiz-responses';
export const JOINED_POLLS = 'joinedPolls';
export const POLL_CODE_MAPPING = 'pollCodeMapping';

export const QUIZ_COMPLETED = (sessionId: string) => `quiz-completed-${sessionId}`;
export const QUIZ_SCORE = (sessionId: string) => `quiz-score-${sessionId}`;
export const QUIZ_RESPONSE_ID = (sessionId: string) => `quiz-response-id-${sessionId}`;
export const QUIZ_RESULT = (quizId: string) => `quiz-result-${quizId}`;
export const QUIZ_SESSION = (quizId: string) => `quiz-session-${quizId}`;
export const QUIZ_CACHE = (quizId: string) => `quiz-${quizId}`;
export const SESSION_CACHE = (sessionId: string) => `session-${sessionId}`; 