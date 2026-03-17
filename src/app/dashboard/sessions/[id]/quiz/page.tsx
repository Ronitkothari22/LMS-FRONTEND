'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckIcon,
  CrossCircledIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TimerIcon,
  ExclamationTriangleIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useQuiz, useSubmitQuiz, useQuizAccess } from '@/hooks/quizzes';
import { toast } from 'sonner';
import React from 'react';

type QuizParams = {
  id: string;
};

// Extended question type that includes imageUrl for consistent typing
interface ExtendedQuizQuestion {
  id: string;
  text: string;
  type?: string;
  options: string | { id: string; text: string }[];
  correctAnswer?: string;
  imageUrl?: string;
}

export default function QuizPage({ params }: { params: Promise<QuizParams> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string | string[]>
  >({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState<{
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    answers: Record<number, string>;
  } | null>(null);
  
  // Store questionResults from backend for accurate question review
  const [questionResults, setQuestionResults] = useState<Array<{
    questionId: string;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
  }> | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );
  const [questionTimeTaken, setQuestionTimeTaken] = useState<
    Record<number, number>
  >({});
  const [isRetaking, setIsRetaking] = useState(false);

  // Get query parameters
  const searchParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const quizId = searchParams.get('quizId');

  console.log(
    `Quiz page loaded with sessionId: ${sessionId}, quizId: ${quizId || 'not specified'}`
  );

  // Fetch quiz data - use quizId from URL if available
  const {
    data: quiz,
    isLoading,
    isError,
    refetch,
  } = useQuiz(sessionId, quizId || undefined);

  // Check quiz access status if we have a quizId
  const {
    data: accessStatus,
    isLoading: isCheckingAccess,
    refetch: refetchAccessStatus,
  } = useQuizAccess(quiz?.id || quizId || '');

  // Debug access status
  useEffect(() => {
    if (accessStatus) {
      console.log('Quiz access status:', accessStatus);
      console.log('Is retaking:', isRetaking);
      console.log('Quiz submitted:', quizSubmitted);
    }
  }, [accessStatus, isRetaking, quizSubmitted]);

  // Redirect if quiz access is denied (but not for retries or after submission)
  useEffect(() => {
    if (accessStatus && quiz) {
      // Only redirect if access is denied AND it's not a retry scenario AND quiz hasn't been submitted
      if (!accessStatus.canAccess && accessStatus.userStatus !== 'CAN_RETRY' && !quizSubmitted) {
        toast.error(accessStatus.message || 'You cannot access this quiz.');
        router.push(`/dashboard/sessions/${sessionId}`);
      }
    }
  }, [accessStatus, quiz, router, sessionId, quizSubmitted]);

  // Process questions to ensure consistent format
  const formattedQuestions = useMemo(() => {
    if (!quiz?.questions) return [];

    return quiz.questions.map(
      (
        question: import('@/lib/api/quizzes').QuizQuestion & {
          correctAnswer?: string;
          options: string | { id: string; text: string }[];
          imageUrl?: string;
        }
      ) => {
        // Create a copy of the question to avoid modifying the original
        const processedQuestion = { ...question };

        // Process options if they're a string
        if (
          typeof processedQuestion.options === 'string' &&
          processedQuestion.options.trim() !== ''
        ) {
          let optionsArray: string[] = [];
          
          // Try to parse as JSON array first (new format)
          try {
            const parsedOptions = JSON.parse(processedQuestion.options);
            if (Array.isArray(parsedOptions)) {
              optionsArray = parsedOptions;
            } else {
              throw new Error('Not an array');
            }
          } catch {
            // Fallback to comma-separated parsing (old format)
            optionsArray = processedQuestion.options
            .split(',')
            .map((opt: string) => opt.trim());
          }
          
          processedQuestion.options = optionsArray.map(
            (opt: string, index: number) => ({
              id: `${processedQuestion.id}-${String.fromCharCode(97 + index)}`,
              text: opt,
            })
          );
        } else if (!processedQuestion.options) {
          processedQuestion.options = [];
        }

        return processedQuestion;
      }
    );
  }, [quiz?.questions]);

  // Submit quiz mutation
  const submitQuizMutation = useSubmitQuiz();

  // Helper function to convert option ID to actual text
  const convertOptionIdToText = (
    question: {
      id: string;
      text: string;
      type?: string;
      options: string | { id: string; text: string }[];
    },
    optionId: string
  ): string | null => {
    if (typeof question.options === 'string') {
      // Handle string options (could be JSON array or comma-separated)
      let optionsArray: string[] = [];
      
      // Try to parse as JSON array first (new format)
      try {
        const parsedOptions = JSON.parse(question.options);
        if (Array.isArray(parsedOptions)) {
          optionsArray = parsedOptions;
        } else {
          throw new Error('Not an array');
        }
      } catch {
        // Fallback to comma-separated parsing (old format)
        optionsArray = question.options.split(',').map((opt: string) => opt.trim());
      }
      
      const optionIndex = optionId.split('-').pop();
      if (optionIndex) {
        const index = optionIndex.charCodeAt(0) - 97; // 'a' is 97 in ASCII
        if (index >= 0 && index < optionsArray.length) {
          return optionsArray[index];
        }
      }
    } else if (Array.isArray(question.options)) {
      // Handle array of option objects
      const option = question.options.find(
        (opt: { id: string; text: string }) => opt.id === optionId
      );
      if (option) {
        return option.text;
      }
    }
    return null;
  };

  // Record time spent on the current question
  const recordQuestionTime = useCallback(() => {
    const now = Date.now();
    const timeSpent = Math.floor((now - questionStartTime) / 1000); // Convert to seconds

    // Only record time if it's reasonable (more than 0 and less than 5 minutes)
    if (timeSpent > 0 && timeSpent < 300) {
      console.log(
        `Recording time for question ${currentQuestionIndex}: ${timeSpent} seconds`
      );

      setQuestionTimeTaken((prev) => {
        const updatedTimeTaken = {
          ...prev,
          [currentQuestionIndex]: (prev[currentQuestionIndex] || 0) + timeSpent,
        };

        // Log the updated time taken for debugging
        console.log('Updated time taken:', updatedTimeTaken);

        return updatedTimeTaken;
      });
    } else {
      console.log(
        `Skipping unreasonable time value for question ${currentQuestionIndex}: ${timeSpent} seconds`
      );
    }

    // Reset the timer for the next question
    setQuestionStartTime(now);
  }, [currentQuestionIndex, questionStartTime]);

  const handleSubmitQuiz = useCallback(async () => {
    if (!quiz || !formattedQuestions || formattedQuestions.length === 0) return;

    try {
      // Record time for the current question before submitting
      recordQuestionTime();

      // Use the quizId from URL params if available, otherwise use the quiz.id
      const targetQuizId = quizId || quiz.id;
      console.log(
        'Submitting quiz with ID:',
        targetQuizId,
        'for session:',
        sessionId
      );
      console.log('Selected answers:', selectedAnswers);
      console.log('Time taken per question:', questionTimeTaken);
      console.log('Formatted questions:', formattedQuestions);

      // Create a payload with user information and session details
      // Also include question data to help with answer formatting
      const questionData = {};

      // Extract question data to help with answer formatting on the server
      if (formattedQuestions && formattedQuestions.length > 0) {
        formattedQuestions.forEach((question) => {
          questionData[question.id] = {
            text: question.text,
            options:
              typeof question.options === 'string'
                ? question.options
                : Array.isArray(question.options)
                  ? question.options
                      .map(
                        (opt: { id: string; text: string }) => opt.text || ''
                      )
                      .join(',')
                  : '',
          };
        });
      }

      // Format answers for submission using question IDs as keys and answer text as values
      const formattedAnswers: Record<string, string> = {};
      const formattedTimeTaken: Record<string, number> = {};

      Object.entries(selectedAnswers).forEach(([questionIndex, answer]) => {
        const qIndex = parseInt(questionIndex);
        const question = formattedQuestions[qIndex];

        if (question) {
          const questionId = question.id;
          const timeSpent = questionTimeTaken[qIndex] || 30; // Default to 30 seconds

          // Convert answer to actual text
          let answerText = '';

          if (question.type === 'MULTI_CORRECT' && Array.isArray(answer)) {
            // For multiple correct answers, convert option IDs to text and join with commas
            const answerTexts: string[] = [];
            answer.forEach((optionId) => {
              const text = convertOptionIdToText(question, optionId);
              if (text) answerTexts.push(text);
            });
            answerText = answerTexts.join(' , '); // Use space-comma-space format like in your example
          } else if (typeof answer === 'string') {
            // For single answers, convert option ID to text
            answerText = convertOptionIdToText(question, answer) || answer;
          } else if (Array.isArray(answer)) {
            // Fallback for arrays - convert each to text and join
            const answerTexts: string[] = [];
            answer.forEach((optionId) => {
              const text = convertOptionIdToText(question, optionId);
              if (text) answerTexts.push(text);
            });
            answerText = answerTexts.join(' , ');
          }

          formattedAnswers[questionId] = answerText;
          formattedTimeTaken[questionId] = timeSpent;
        }
      });

      const payload = {
        quizId: targetQuizId,
        answers: formattedAnswers, // Now contains question IDs as keys and answer text as values
        timeTaken: formattedTimeTaken, // Now contains question IDs as keys and time in seconds as values
        sessionId: sessionId, // Pass sessionId to associate the quiz response with the session
      };

      console.log('Submitting quiz with payload:', payload);

      let results: {
        score: number;
        correctAnswers: number;
        totalQuestions: number;
        answers: Record<number, string>;
        responseId?: string;
        questionResults?: Array<{
          questionId: string;
          isCorrect: boolean;
          userAnswer: string;
          correctAnswer: string;
        }>;
      };

      try {
        // Try to submit the quiz to the API
        results = await submitQuizMutation.mutateAsync(payload);
        console.log('Quiz submission results from API:', results);
      } catch (apiError) {
        console.error('Error submitting quiz to API:', apiError);

        // Instead of using local storage fallback, throw the error to be handled by the component
        toast.error(
          'Failed to submit quiz. Please check your connection and try again.'
        );
        throw apiError;
      }

      // Log the quiz results for debugging
      console.log('Setting quiz results:', {
        score: results.score,
        correctAnswers: results.correctAnswers,
        totalQuestions: results.totalQuestions,
        answers: results.answers,
        responseId: results.responseId,
      });

      // 🚫 DISABLED: Faulty frontend validation that was overriding backend results
      // Backend already calculated correct results using questionResults array
      /*
      let correctAnswersCount = 0;
      if (formattedQuestions && formattedQuestions.length > 0) {
        formattedQuestions.forEach((question, index) => {
          const selectedAnswer = selectedAnswers[index];
          console.log(`Question ${index + 1}:`, {
            questionId: question.id,
            questionText: question.text,
            selectedAnswer: selectedAnswer,
            correctAnswer: question.correctAnswer,
            questionType: question.type,
            options: question.options,
          });

          if (selectedAnswer && question.correctAnswer) {
            const questionType = question.type || 'MULTIPLE_CHOICE';
            let isCorrect = false;

            switch (questionType) {
              case 'MULTIPLE_CHOICE':
                // Single correct answer - improved logic
                // First, try direct comparison
                isCorrect = selectedAnswer === question.correctAnswer;

                if (!isCorrect && Array.isArray(question.options)) {
                  // For array options, find the selected option and compare its text
                  const selectedOption = question.options.find(
                    (opt: { id: string; text: string }) =>
                      opt.id === selectedAnswer
                  );
                  if (selectedOption) {
                    isCorrect = selectedOption.text === question.correctAnswer;
                    console.log(
                      `Array option comparison: ${selectedOption.text} === ${question.correctAnswer} = ${isCorrect}`
                    );
                  }
                }

                if (!isCorrect && typeof question.options === 'string' && typeof selectedAnswer === 'string') {
                  // For string options, extract the option text from the selected answer ID
                  const optionsArray = (question.options as string)
                    .split(',')
                    .map((opt: string) => opt.trim());
                  const optionIndex = selectedAnswer.split('-').pop();
                  if (optionIndex) {
                    const index = optionIndex.charCodeAt(0) - 97; // 'a' is 97 in ASCII
                    if (index >= 0 && index < optionsArray.length) {
                      const selectedText = optionsArray[index];
                      isCorrect = selectedText === question.correctAnswer;
                      console.log(
                        `String option comparison: ${selectedText} === ${question.correctAnswer} = ${isCorrect}`
                      );
                    }
                  }
                }
                break;

              case 'MULTI_CORRECT':
                // Multiple correct answers - check if all correct answers are selected
                if (Array.isArray(selectedAnswer)) {
                  const correctAnswers = question.correctAnswer
                    .split(',')
                    .map((ans) => ans.trim());
                  const selectedTexts: string[] = [];

                  // Convert selected IDs to text values
                  selectedAnswer.forEach((answerId) => {
                    if (typeof question.options === 'string') {
                      const optionsArray = (question.options as string)
                        .split(',')
                        .map((opt: string) => opt.trim());
                      const optionIndex = answerId.split('-').pop();
                      if (optionIndex) {
                        const index = optionIndex.charCodeAt(0) - 97; // 'a' is 97 in ASCII
                        if (index >= 0 && index < optionsArray.length) {
                          selectedTexts.push(optionsArray[index]);
                        }
                      }
                    } else if (Array.isArray(question.options)) {
                      const option = question.options.find(
                        (opt: { id: string; text: string }) =>
                          opt.id === answerId
                      );
                      if (option) {
                        selectedTexts.push(option.text);
                      }
                    }
                  });

                  // Check if all correct answers are selected and no incorrect ones
                  isCorrect =
                    correctAnswers.length === selectedTexts.length &&
                    correctAnswers.every((correctAns) =>
                      selectedTexts.includes(correctAns)
                    );
                }
                break;

              case 'TEXT':
                // Text answer - case-insensitive comparison
                if (typeof selectedAnswer === 'string') {
                  isCorrect =
                    selectedAnswer.toLowerCase().trim() ===
                    question.correctAnswer.toLowerCase().trim();
                }
                break;

              case 'MATCHING':
                // Matching questions not implemented yet
                isCorrect = false;
                break;

              default:
                isCorrect = false;
            }

            if (isCorrect) {
              correctAnswersCount++;
              console.log(`✅ Question ${index + 1} is CORRECT`);
            } else {
              console.log(`❌ Question ${index + 1} is INCORRECT`);
            }
          } else {
            console.log(
              `⚠️ Question ${index + 1} - No answer selected or no correct answer provided`
            );
          }
        });
      }

      console.log('Counted correct answers from UI data:', correctAnswersCount);
      console.log('Total questions:', formattedQuestions.length);
      console.log(
        'Calculated score:',
        Math.round((correctAnswersCount / formattedQuestions.length) * 100)
      );
      */

      // 🚀 FIXED: Trust the backend's accurate calculation instead of overriding it
      // The backend has already processed the answers correctly using questionResults
      console.log('✅ Using backend quiz results (accurate):', results);
      console.log('Backend calculated correctly:', {
        score: results.score,
        correctAnswers: results.correctAnswers,
        totalQuestions: results.totalQuestions,
        note: 'Backend used questionResults array for accurate calculation'
      });

      // Just ensure we have valid numbers (NO recalculation that overrides backend)
      const trustedResults = {
        ...results,
        // Trust backend values but ensure they're properly formatted
        score: Math.max(0, Math.min(100, parseInt(String(results.score || 0), 10))),
        correctAnswers: Math.max(0, parseInt(String(results.correctAnswers || 0), 10)),
        totalQuestions: Math.max(1, parseInt(String(results.totalQuestions || 1), 10))
      };

      console.log('✅ Final trusted quiz results (no frontend override):', trustedResults);

      // Set the results (using backend's accurate calculation)
      setQuizResults(trustedResults);
      
      // 🎯 Store questionResults from backend for accurate question review
      if (results.questionResults && Array.isArray(results.questionResults)) {
        console.log('📋 Storing questionResults for question review:', results.questionResults);
        setQuestionResults(results.questionResults);
      }
      setQuizSubmitted(true);
      
      // Reset retaking state and refetch access status after a short delay
      setTimeout(async () => {
        setIsRetaking(false);
        // Refetch access status to get updated retry information
        await refetchAccessStatus();
      }, 100);

      // Store completion status in localStorage to update UI in session page
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`quiz-completed-${sessionId}`, 'true');
          localStorage.setItem(
            `quiz-score-${sessionId}`,
            String(results.score)
          );

          // Also store the quiz response ID if available in the results
          if (results.responseId) {
            console.log(
              'Storing quiz response ID in localStorage:',
              results.responseId
            );
            localStorage.setItem(
              `quiz-response-id-${sessionId}`,
              results.responseId
            );
          } else {
            console.log('No responseId received from the server');
          }
        } catch (storageError) {
          console.error('Error storing quiz completion status:', storageError);
        }
      }

      // Show success message to user
      toast.success('Quiz submitted successfully!');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Show error message to user
      toast.error('Failed to submit quiz. Please try again.');

      // Don't set quizSubmitted to true on error
      // This allows the user to try submitting again
    }
  }, [
    quiz,
    formattedQuestions,
    selectedAnswers,
    submitQuizMutation,
    quizId,
    sessionId,
    questionTimeTaken,
    recordQuestionTime,
    refetchAccessStatus,
  ]);

  // Debug current question options
  useEffect(() => {
    if (
      currentQuestionIndex >= 0 &&
      formattedQuestions &&
      formattedQuestions.length > 0
    ) {
      const currentQ = formattedQuestions[currentQuestionIndex] as {
        id: string;
        text: string;
        options: string | { id: string; text: string }[];
        correctAnswer?: string;
      };
      console.log('Current question:', currentQ);
      console.log('Current question options:', currentQ?.options);

      // Check if options are missing but available as a string
      if (
        currentQ &&
        (!currentQ.options ||
          (Array.isArray(currentQ.options) && currentQ.options.length === 0))
      ) {
        // Check if the raw question has options as a string
        const rawOptions = currentQ.options;
        if (typeof rawOptions === 'string' && rawOptions.trim() !== '') {
          console.log('Options available as string, parsing:', rawOptions);
          const optionsArray = rawOptions
            .split(',')
            .map((opt: string) => opt.trim());
          currentQ.options = optionsArray.map((opt: string, index: number) => ({
            id: `${currentQ.id}-${String.fromCharCode(97 + index)}`,
            text: opt,
          }));
          console.log('Parsed options:', currentQ.options);
        }
      }
    }
  }, [currentQuestionIndex, formattedQuestions]);

  // Set timer when quiz data is loaded
  useEffect(() => {
    if (quiz && !quizSubmitted && timeLeft === 0) {
      setTimeLeft(quiz.timeLimit * 60); // Convert minutes to seconds
    }
  }, [quiz, quizSubmitted, timeLeft]);

  // Initialize question timer when component mounts or when changing questions
  useEffect(() => {
    // Reset the question start time whenever the current question changes
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  // Timer effect for quiz countdown
  useEffect(() => {
    if (!quiz || quizSubmitted || timeLeft <= 0)
      return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, quizSubmitted, timeLeft, handleSubmitQuiz]);

  // Timer effect to periodically record time spent on current question
  useEffect(() => {
    if (quizSubmitted) return;

    // Record time every 30 seconds to ensure we don't lose tracking if user stays on one question
    const timeTrackingTimer = setInterval(() => {
      recordQuestionTime();
    }, 30000); // 30 seconds

    return () => clearInterval(timeTrackingTimer);
  }, [quizSubmitted, recordQuestionTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAnswerSelect = (
    questionIndex: number,
    answerId: string | string[]
  ) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answerId,
    });
  };

  const handleMultipleChoiceToggle = (
    questionIndex: number,
    optionId: string
  ) => {
    const currentAnswers = (selectedAnswers[questionIndex] as string[]) || [];
    const newAnswers = currentAnswers.includes(optionId)
      ? currentAnswers.filter((id) => id !== optionId)
      : [...currentAnswers, optionId];

    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: newAnswers,
    });
  };

  const handleTextAnswer = (questionIndex: number, text: string) => {
    setTextAnswers({
      ...textAnswers,
      [questionIndex]: text,
    });
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: text,
    });
  };

  // Function to render different question types
  const renderQuestionInput = (
    question: {
      id: string;
      text: string;
      type?: string;
      options: string | { id: string; text: string }[];
      imageUrl?: string;
    },
    questionIndex: number
  ) => {
    const questionType = question.type || 'MULTIPLE_CHOICE';

    switch (questionType) {
      case 'MULTIPLE_CHOICE':
        return (
          <RadioGroup
            value={
              typeof selectedAnswers[questionIndex] === 'string'
                ? (selectedAnswers[questionIndex] as string)
                : ''
            }
            onValueChange={(value) => handleAnswerSelect(questionIndex, value)}
            className="space-y-3"
          >
            {(() => {
              // Handle options as a string (could be JSON array or comma-separated)
              if (typeof question.options === 'string') {
                const optionsString = question.options as string;
                let optionsArray: string[] = [];
                
                // Try to parse as JSON array first (new format)
                try {
                  const parsedOptions = JSON.parse(optionsString);
                  if (Array.isArray(parsedOptions)) {
                    optionsArray = parsedOptions;
                  } else {
                    throw new Error('Not an array');
                  }
                } catch {
                  // Fallback to comma-separated parsing (old format)
                  optionsArray = optionsString
                  .split(',')
                  .map((opt: string) => opt.trim());
                }
                
                return optionsArray.map((optionText: string, index: number) => {
                  const optionId = `${question.id}-${String.fromCharCode(97 + index)}`;
                  return (
                    <div
                      key={optionId}
                      className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                    >
                      <RadioGroupItem value={optionId} id={optionId} />
                      <Label
                        htmlFor={optionId}
                        className="flex-1 cursor-pointer"
                      >
                        {optionText}
                      </Label>
                    </div>
                  );
                });
              }

              // Handle options as an array
              if (Array.isArray(question.options)) {
                return question.options.map(
                  (
                    option: { id?: string; text?: string } | string,
                    index: number
                  ) => {
                    const optionId =
                      typeof option === 'string'
                        ? `${question.id}-${String.fromCharCode(97 + index)}`
                        : option.id ||
                          `${question.id}-${String.fromCharCode(97 + index)}`;
                    const optionText =
                      typeof option === 'string'
                        ? option
                        : option.text || String(option);

                    return (
                      <div
                        key={optionId}
                        className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                      >
                        <RadioGroupItem value={optionId} id={optionId} />
                        <Label
                          htmlFor={optionId}
                          className="flex-1 cursor-pointer"
                        >
                          {optionText}
                        </Label>
                      </div>
                    );
                  }
                );
              }

              return (
                <div className="p-3 text-muted-foreground">
                  No options available for this question.
                </div>
              );
            })()}
          </RadioGroup>
        );

      case 'MULTI_CORRECT':
        const currentMultiAnswers = Array.isArray(
          selectedAnswers[questionIndex]
        )
          ? (selectedAnswers[questionIndex] as string[])
          : [];
        return (
          <div className="space-y-3">
            {(() => {
              // Handle options as a string (could be JSON array or comma-separated)
              if (typeof question.options === 'string') {
                const optionsString = question.options as string;
                let optionsArray: string[] = [];
                
                // Try to parse as JSON array first (new format)
                try {
                  const parsedOptions = JSON.parse(optionsString);
                  if (Array.isArray(parsedOptions)) {
                    optionsArray = parsedOptions;
                  } else {
                    throw new Error('Not an array');
                  }
                } catch {
                  // Fallback to comma-separated parsing (old format)
                  optionsArray = optionsString
                  .split(',')
                  .map((opt: string) => opt.trim());
                }
                
                return optionsArray.map((optionText: string, index: number) => {
                  const optionId = `${question.id}-${String.fromCharCode(97 + index)}`;
                  return (
                    <div
                      key={optionId}
                      className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                    >
                      <Checkbox
                        id={optionId}
                        checked={currentMultiAnswers.includes(optionId)}
                        onCheckedChange={() =>
                          handleMultipleChoiceToggle(questionIndex, optionId)
                        }
                      />
                      <Label
                        htmlFor={optionId}
                        className="flex-1 cursor-pointer"
                      >
                        {optionText}
                      </Label>
                    </div>
                  );
                });
              }

              // Handle options as an array
              if (Array.isArray(question.options)) {
                return question.options.map(
                  (
                    option: { id?: string; text?: string } | string,
                    index: number
                  ) => {
                    const optionId =
                      typeof option === 'string'
                        ? `${question.id}-${String.fromCharCode(97 + index)}`
                        : option.id ||
                          `${question.id}-${String.fromCharCode(97 + index)}`;
                    const optionText =
                      typeof option === 'string'
                        ? option
                        : option.text || String(option);

                    return (
                      <div
                        key={optionId}
                        className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                      >
                        <Checkbox
                          id={optionId}
                          checked={currentMultiAnswers.includes(optionId)}
                          onCheckedChange={() =>
                            handleMultipleChoiceToggle(questionIndex, optionId)
                          }
                        />
                        <Label
                          htmlFor={optionId}
                          className="flex-1 cursor-pointer"
                        >
                          {optionText}
                        </Label>
                      </div>
                    );
                  }
                );
              }

              return (
                <div className="p-3 text-muted-foreground">
                  No options available for this question.
                </div>
              );
            })()}
          </div>
        );

      case 'TEXT':
        return (
          <div className="space-y-3">
            <Textarea
              placeholder="Type your answer here..."
              value={textAnswers[questionIndex] || ''}
              onChange={(e) => handleTextAnswer(questionIndex, e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        );

      case 'MATCHING':
        return (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-800 font-medium">Matching Questions</p>
            <p className="text-amber-700 text-sm mt-1">
              Matching questions are not yet supported. Please contact the
              administrator.
            </p>
          </div>
        );

      default:
        return (
          <div className="p-3 text-muted-foreground">
            Unknown question type: {questionType}
          </div>
        );
    }
  };





  // Using the recordQuestionTime function defined above

  const handleNextQuestion = () => {
    if (
      formattedQuestions &&
      currentQuestionIndex < formattedQuestions.length - 1
    ) {
      // Record time spent on current question
      recordQuestionTime();

      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Record time spent on current question
      recordQuestionTime();

      // Move to previous question
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getQuestionStatus = (index: number) => {
    if (quizSubmitted && quiz?.questions && quiz.questions[index]) {
      const question = quiz.questions[index];
      // Check if correctAnswer exists before comparing
      if (question.correctAnswer) {
        const selectedAnswer = selectedAnswers[index];
        const questionType = question.type || 'MULTIPLE_CHOICE';
        let isCorrect = false;

        switch (questionType) {
          case 'MULTIPLE_CHOICE':
            // Single correct answer
            isCorrect =
              selectedAnswer === question.correctAnswer ||
              // For array options, check if the selected answer's text matches the correct answer
              (Array.isArray(question.options) &&
                question.options.some(
                  (opt: { id: string; text: string }) =>
                    (opt.id === selectedAnswer &&
                      (opt.text === question.correctAnswer ||
                        opt.id === question.correctAnswer)) ||
                    (opt.id === question.correctAnswer &&
                      opt.id === selectedAnswer)
                )) ||
              // For string options, check if the selected answer's ID corresponds to the correct text
              (typeof question.options === 'string' &&
                (question.options as string)
                  .split(',')
                  .map((opt: string) => opt.trim())
                  .some(
                    (optText: string, idx: number) =>
                      selectedAnswer ===
                        `${question.id}-${String.fromCharCode(97 + idx)}` &&
                      optText === question.correctAnswer
                  ));
            break;

          case 'MULTI_CORRECT':
            // Multiple correct answers
            if (Array.isArray(selectedAnswer)) {
              const correctAnswers = question.correctAnswer
                .split(',')
                .map((ans) => ans.trim());
              const selectedTexts: string[] = [];

              // Convert selected IDs to text values
              selectedAnswer.forEach((answerId) => {
                if (typeof question.options === 'string') {
                  const optionsArray = (question.options as string)
                    .split(',')
                    .map((opt: string) => opt.trim());
                  const optionIndex = answerId.split('-').pop();
                  if (optionIndex) {
                    const index = optionIndex.charCodeAt(0) - 97; // 'a' is 97 in ASCII
                    if (index >= 0 && index < optionsArray.length) {
                      selectedTexts.push(optionsArray[index]);
                    }
                  }
                } else if (Array.isArray(question.options)) {
                  const option = question.options.find(
                    (opt: { id: string; text: string }) =>
                      opt.id === answerId
                  );
                  if (option) {
                    selectedTexts.push(option.text);
                  }
                }
              });

              // Check if all correct answers are selected and no incorrect ones
              isCorrect =
                correctAnswers.length === selectedTexts.length &&
                correctAnswers.every((correctAns) =>
                  selectedTexts.includes(correctAns)
                );
            }
            break;

            case 'TEXT':
              // Text answer - case-insensitive comparison
              if (typeof selectedAnswer === 'string') {
                isCorrect =
                  selectedAnswer.toLowerCase().trim() ===
                  question.correctAnswer.toLowerCase().trim();
              }
              break;

              case 'MATCHING':
                // Matching questions not implemented yet
                isCorrect = false;
                break;

              default:
                isCorrect = false;
        }

        return isCorrect ? 'correct' : 'incorrect';
      }
      // If no correctAnswer is provided, just show as answered
      return selectedAnswers[index] ? 'answered' : 'unanswered';
    }
    return selectedAnswers[index] ? 'answered' : 'unanswered';
  };

  // Loading state
  if (isLoading || isCheckingAccess) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isCheckingAccess ? 'Checking quiz access...' : 'Loading quiz...'}
          </p>
        </div>
      </div>
    );
  }

  // If quiz access is denied, check if retries are allowed
  if (accessStatus && !accessStatus.canAccess && !quizSubmitted) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="text-center">
          <div className="mb-4">
            <CheckIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Quiz Already Completed
          </h2>
          <p className="text-muted-foreground mb-6">
            {accessStatus.message || 'You cannot access this quiz.'}
          </p>
          {accessStatus.lastAttemptScore !== undefined && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 max-w-sm mx-auto">
              <p className="text-green-800 dark:text-green-200 font-medium">
                Your Previous Score: {accessStatus.lastAttemptScore}%
              </p>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => router.push(`/dashboard/sessions/${sessionId}`)}
              variant="outline"
            >
              Back to Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If user can retry the quiz, show appropriate UI (but not if they're actively retaking)
  if (accessStatus && accessStatus.userStatus === 'CAN_RETRY' && !quizSubmitted && !isRetaking && quiz) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ReloadIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Retake Quiz
          </h2>
          <p className="text-muted-foreground mb-6">
            This quiz allows retakes. You can attempt it again to improve your score.
          </p>
          {accessStatus.lastAttemptScore !== undefined && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                Previous Score: {accessStatus.lastAttemptScore}%
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                Try to beat your previous score!
              </p>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => router.push(`/dashboard/sessions/${sessionId}`)}
              variant="outline"
            >
              Back to Session
            </Button>
            <Button 
              onClick={async () => {
                try {
                  console.log('Retaking quiz...');
                  
                  // Set retaking state to bypass retry UI
                  setIsRetaking(true);
                  
                  // Reset quiz state and allow retake
                  setQuizSubmitted(false);
                  setQuizResults(null);
                  setCurrentQuestionIndex(0);
                  setSelectedAnswers({});
                  setTextAnswers({});
                  setQuestionTimeTaken({});
                  setTimeLeft(quiz?.timeLimitSeconds || 1800);
                  setShowSubmitDialog(false);
                  
                  // Reset question timer
                  setQuestionStartTime(Date.now());
                  
                  // Clear any stored quiz completion status
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem(`quiz-completed-${sessionId}`);
                    localStorage.removeItem(`quiz-score-${sessionId}`);
                    localStorage.removeItem(`quiz-response-id-${sessionId}`);
                  }
                  
                  // Force refetch of quiz data and access status
                  await refetch();
                  await refetchAccessStatus();
                  
                  // The component should re-render and show the quiz interface
                  console.log('Quiz state reset complete');
                } catch (error) {
                  console.error('Error retaking quiz:', error);
                  // Reset retaking state on error
                  setIsRetaking(false);
                  toast.error('Failed to retake quiz. Please try again.');
                }
              }}
              className="bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] hover:from-[#0FB6B6] hover:to-[#14C8C8] text-white"
            >
              <ReloadIcon className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !quiz) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Not Available</CardTitle>
            <CardDescription>
              We couldn&apos;t load the quiz data. This could be because:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>The quiz doesn&apos;t exist or has been removed</li>
              <li>You don&apos;t have permission to access this quiz</li>
              <li>There was a network error connecting to the server</li>
              <li>The server is currently unavailable</li>
            </ul>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              onClick={() => router.push(`/dashboard/sessions/${sessionId}`)}
            >
              Back to Session
            </Button>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <ReloadIcon className="h-4 w-4" />
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Results view
  if (quizSubmitted && quizResults) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                className="p-0 h-auto font-normal text-muted-foreground"
                onClick={() => router.push(`/dashboard/sessions/${sessionId}`)}
              >
                Session
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium truncate">Quiz Results</span>
            </div>
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
          </div>
          <Button
            onClick={() => router.push(`/dashboard/sessions/${sessionId}`)}
          >
            Back to Session
          </Button>
        </div>

        <Card className="mb-6 group relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-lg border-gray-200 dark:border-gray-700">
          {/* Gradient border effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl bg-gradient-to-r from-[#14C8C8]/20 via-[#0FB6B6]/20 to-[#14C8C8]/20" />
          
          {/* Top accent line */}
          <div className="h-1 bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6]" />
          
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-[#14C8C8] dark:text-[#14C8C8] font-bold">Quiz Results</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              You scored {quizResults.score}% (
              {parseInt(String(quizResults.correctAnswers), 10) || 0} out of{' '}
              {formattedQuestions.length}{' '}
              {formattedQuestions.length === 1 ? 'question' : 'questions'}{' '}
              correct)
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Score</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {quizResults.score}%
                </span>
              </div>
              <Progress
                value={quizResults.score}
                className="h-3 bg-gray-200 dark:bg-gray-700"
                style={
                  {
                    '--progress-foreground':
                      quizResults.score >= 70
                        ? '#10b981' // emerald-500
                        : quizResults.score >= 50
                          ? '#f59e0b' // amber-500
                          : '#ef4444', // red-500
                  } as React.CSSProperties
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800/50 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                  <CheckIcon className="h-4 w-4" />
                  <span className="font-medium">Correct Answers</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-200">
                  {parseInt(String(quizResults.correctAnswers), 10) || 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-50/50 dark:from-red-950/30 dark:to-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800/50 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
                  <CrossCircledIcon className="h-4 w-4" />
                  <span className="font-medium">Incorrect Answers</span>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-200">
                  {Math.max(
                    0,
                    formattedQuestions.length -
                      parseInt(String(quizResults.correctAnswers), 10)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
          
          {/* Hover effect overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl bg-gradient-to-br from-[#14C8C8]/5 to-[#0FB6B6]/5 pointer-events-none" />
        </Card>

        <div className="space-y-6">
          <h2 className="text-xl font-bold">Question Review</h2>

          {formattedQuestions &&
            formattedQuestions.length > 0 &&
            formattedQuestions.map(
              (
                question: {
                  id: string;
                  text: string;
                  type?: string;
                  options: string | { id: string; text: string }[];
                  correctAnswer?: string;
                  imageUrl?: string;
                },
                index: number
              ) => {
                const selectedAnswer = selectedAnswers[index];
                const questionType = question.type || 'MULTIPLE_CHOICE';

                // 🎯 FIX: Use backend's questionResults instead of local calculation
                let isCorrect = false;
                
                // Check if we have questionResults from backend for this question
                const backendResult = questionResults?.find(
                  result => result.questionId === question.id
                );
                
                if (backendResult) {
                  // Use backend's accurate calculation
                  isCorrect = backendResult.isCorrect;
                  console.log(`✅ Question ${index + 1}: Using backend result - isCorrect: ${isCorrect}`);
                } else if (question.correctAnswer) {
                  // Fallback to local calculation (if questionResults not available)
                  switch (questionType) {
                    case 'MULTIPLE_CHOICE':
                      isCorrect =
                        selectedAnswer === question.correctAnswer ||
                        // For array options, check if the selected answer's text matches the correct answer
                        (Array.isArray(question.options) &&
                          question.options.some(
                            (opt: { id: string; text: string }) =>
                              (opt.id === selectedAnswer &&
                                (opt.text === question.correctAnswer ||
                                  opt.id === question.correctAnswer)) ||
                              (opt.id === question.correctAnswer &&
                                opt.id === selectedAnswer)
                          )) ||
                        // For string options, check if the selected answer's ID corresponds to the correct text
                        (typeof question.options === 'string' &&
                          (question.options as string)
                            .split(',')
                            .map((opt: string) => opt.trim())
                            .some(
                              (optText: string, idx: number) =>
                                selectedAnswer ===
                                  `${question.id}-${String.fromCharCode(97 + idx)}` &&
                                optText === question.correctAnswer
                            ));
                      break;

                    case 'MULTI_CORRECT':
                      if (Array.isArray(selectedAnswer)) {
                        const correctAnswers = question.correctAnswer
                          .split(',')
                          .map((ans) => ans.trim());
                        const selectedTexts: string[] = [];

                        // Convert selected IDs to text values
                        selectedAnswer.forEach((answerId) => {
                          if (typeof question.options === 'string') {
                            const optionsArray = (question.options as string)
                              .split(',')
                              .map((opt: string) => opt.trim());
                            const optionIndex = answerId.split('-').pop();
                            if (optionIndex) {
                              const index = optionIndex.charCodeAt(0) - 97; // 'a' is 97 in ASCII
                              if (index >= 0 && index < optionsArray.length) {
                                selectedTexts.push(optionsArray[index]);
                              }
                            }
                          } else if (Array.isArray(question.options)) {
                            const option = question.options.find(
                              (opt: { id: string; text: string }) =>
                                opt.id === answerId
                            );
                            if (option) {
                              selectedTexts.push(option.text);
                            }
                          }
                        });

                        // Check if all correct answers are selected and no incorrect ones
                        isCorrect =
                          correctAnswers.length === selectedTexts.length &&
                          correctAnswers.every((correctAns) =>
                            selectedTexts.includes(correctAns)
                          );
                      }
                      break;

                    case 'TEXT':
                      if (typeof selectedAnswer === 'string') {
                        isCorrect =
                          selectedAnswer.toLowerCase().trim() ===
                          question.correctAnswer.toLowerCase().trim();
                      }
                      break;

                    case 'MATCHING':
                      // Matching questions not implemented yet
                      isCorrect = false;
                      break;

                    default:
                      isCorrect = false;
                  }
                }

                return (
                  <Card
                    key={question.id}
                    className={`group relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-lg border-gray-200 dark:border-gray-700 border-l-4 ${
                      isCorrect
                        ? 'border-l-green-500 dark:border-l-green-400'
                        : 'border-l-red-500 dark:border-l-red-400'
                    } transition-all duration-300 hover:shadow-xl`}
                  >
                    {/* Gradient border effect */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl ${
                      isCorrect 
                        ? 'bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10' 
                        : 'bg-gradient-to-r from-red-500/10 via-red-500/10 to-red-500/10'
                    }`} />
                    
                    <CardHeader
                      className={`pb-2 relative ${
                        isCorrect 
                          ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20' 
                          : 'bg-gradient-to-r from-red-50/50 to-red-50/50 dark:from-red-950/20 dark:to-red-950/20'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
                              Question {index + 1}
                            </CardTitle>
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-[#14C8C8]/10 dark:bg-[#14C8C8]/20 text-[#14C8C8] dark:text-[#14C8C8] border-[#14C8C8]/30"
                            >
                              {(() => {
                                switch (questionType) {
                                  case 'MULTIPLE_CHOICE':
                                    return 'Single Choice';
                                  case 'MULTI_CORRECT':
                                    return 'Multiple Correct';
                                  case 'TEXT':
                                    return 'Text Answer';
                                  case 'MATCHING':
                                    return 'Matching';
                                  default:
                                    return questionType;
                                }
                              })()}
                            </Badge>
                          </div>
                          <CardDescription className="text-base font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                            {question.text}
                          </CardDescription>
                          
                          {/* Question Image in Results */}
                          {(question as ExtendedQuizQuestion).imageUrl && (
                            <div className="mt-4">
                              <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <img
                                  src={(question as ExtendedQuizQuestion).imageUrl || ''}
                                  alt={`Question ${index + 1} illustration`}
                                  className="w-full max-w-full h-auto object-contain max-h-64"
                                  onError={(e) => {
                                    const imageUrl = (question as ExtendedQuizQuestion).imageUrl;
                                    console.error('Failed to load question image:', imageUrl);
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        {isCorrect ? (
                          <Badge
                            variant="outline"
                            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50 flex items-center gap-1.5 ml-4 shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            Correct
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gradient-to-r from-red-50 to-red-50 dark:from-red-950/30 dark:to-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50 ml-4 shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            Incorrect
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="relative">
                      {/* Add summary for multi-correct questions */}
                      {questionType === 'MULTI_CORRECT' && backendResult && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border">
                          <div className="text-sm space-y-2">
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Your Selection: </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {Array.isArray(selectedAnswer) && selectedAnswer.length > 0 ? (
                                  selectedAnswer.map((answerId) => {
                                    // Convert option ID back to text
                                    const optIndex = answerId.split('-').pop();
                                    if (optIndex && Array.isArray(question.options)) {
                                      const index = optIndex.charCodeAt(0) - 97;
                                      const option = question.options[index];
                                      const optionText = typeof option === 'string' ? option : option?.text || String(option);
                                      
                                      // Check if this selected option is correct
                                      const isActuallyCorrect = backendResult.correctAnswer && backendResult.correctAnswer.includes(optionText);
                                      
                                      return (
                                        <span key={answerId} className={`inline-block mr-2 px-2 py-1 rounded text-xs ${
                                          isActuallyCorrect
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                        }`}>
                                          {optionText}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })
                                ) : (
                                  <span className="text-gray-500 italic">No selection</span>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Correct Answer(s): </span>
                              <span className="text-green-600 dark:text-green-400">
                                {Array.isArray(question.options) && question.options
                                  .filter((option) => {
                                    const optionText = typeof option === 'string' ? option : option?.text || String(option);
                                    return backendResult.correctAnswer && backendResult.correctAnswer.includes(optionText);
                                  })
                                  .map((option, idx) => {
                                    const optionText = typeof option === 'string' ? option : option?.text || String(option);
                                    return (
                                      <span key={idx} className="inline-block mr-2 px-2 py-1 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                        {optionText}
                                      </span>
                                    );
                                  })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        {/* Render question options with correct styling */}
                        {Array.isArray(question.options) && question.options.map((option: string | { id?: string; text?: string }, optIndex: number) => {
                          const optionId = `${question.id}-${String.fromCharCode(97 + optIndex)}`;
                          const optionText = typeof option === 'string' ? option : option.text || String(option);
                          
                          // Use backend's questionResults to determine correctness
                          const backendResult = questionResults?.find(
                            result => result.questionId === question.id
                          );
                          
                          // Handle different question types for selection checking
                          let isSelected = false;
                          if (questionType === 'MULTI_CORRECT') {
                            // For multi-correct, selectedAnswer is an array
                            isSelected = Array.isArray(selectedAnswer) && selectedAnswer.includes(optionId);
                          } else {
                            // For single choice, selectedAnswer is a string
                            isSelected = selectedAnswer === optionId;
                          }
                          
                          // Check if this option is a correct answer (handle multi-correct)
                          let isCorrectOption = false;
                          if (backendResult?.correctAnswer) {
                            if (questionType === 'MULTI_CORRECT') {
                              // For multi-correct, check if the option text is included in the correctAnswer string
                              isCorrectOption = backendResult.correctAnswer.includes(optionText);
                            } else {
                              // For single choice, direct comparison
                              isCorrectOption = backendResult.correctAnswer === optionText;
                            }
                          }
                          
                          // Determine styling based on selection and correctness
                          let optionClass = "flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ";
                          let iconElement: React.ReactNode = null;
                          let badgeElement: React.ReactNode = null;
                          
                          if (isSelected && isCorrectOption) {
                            // Selected and correct - green
                            optionClass += "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200";
                            iconElement = <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />;
                            badgeElement = <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">Your Answer ✓</span>;
                          } else if (isSelected && !isCorrectOption) {
                            // Selected but incorrect - red  
                            optionClass += "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200";
                            iconElement = <CrossCircledIcon className="h-4 w-4 text-red-600 dark:text-red-400" />;
                            badgeElement = <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full">Your Answer ✗</span>;
                          } else if (!isSelected && isCorrectOption) {
                            // This is a correct answer but user didn't select it
                            optionClass += "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200";
                            iconElement = <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />;
                            badgeElement = <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">Correct Answer</span>;
                          } else {
                            // Not selected and not the correct answer - gray
                            optionClass += "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400";
                          }
                          
                          return (
                            <div key={optionId} className={optionClass}>
                              <span className="flex-1">{optionText}</span>
                              <div className="flex items-center gap-2">
                                {badgeElement}
                                {iconElement}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl bg-gradient-to-br from-[#14C8C8]/5 to-[#0FB6B6]/5 pointer-events-none" />
                  </Card>
                );
              }
            )}
        </div>
      </div>
    );
  }

  // Quiz taking view
  if (!quiz?.questions || quiz.questions.length === 0) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>No Questions Available</CardTitle>
            <CardDescription>
              This quiz doesn&apos;t have any questions yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The quiz exists but doesn&apos;t contain any questions. Please
              contact the session administrator.
            </p>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              onClick={() => router.push(`/dashboard/sessions/${sessionId}`)}
            >
              Back to Session
            </Button>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <ReloadIcon className="h-4 w-4" />
              Refresh Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQuestion = formattedQuestions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / formattedQuestions.length) * 100;

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              className="p-0 h-auto font-normal text-muted-foreground"
              onClick={() => router.push(`/dashboard/sessions/${sessionId}`)}
            >
              Session
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium truncate">Quiz</span>
          </div>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <TimerIcon className="h-4 w-4" />
          <span
            className={`font-medium ${timeLeft < 60 ? 'text-red-500 animate-pulse' : ''}`}
          >
            Time Remaining: {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle>
                  Question {currentQuestionIndex + 1} of{' '}
                  {formattedQuestions.length}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
              <Progress value={progress} className="h-2 mt-2" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-medium flex-1">
                  {currentQuestion.text}
                </h2>
                <Badge variant="outline" className="ml-4 shrink-0">
                  {(() => {
                    const questionType =
                      currentQuestion.type || 'MULTIPLE_CHOICE';
                    switch (questionType) {
                      case 'MULTIPLE_CHOICE':
                        return 'Single Choice';
                      case 'MULTI_CORRECT':
                        return 'Multiple Correct';
                      case 'TEXT':
                        return 'Text Answer';
                      case 'MATCHING':
                        return 'Matching';
                      default:
                        return questionType;
                    }
                  })()}
                </Badge>
              </div>

              {/* Question Image */}
              {(currentQuestion as ExtendedQuizQuestion).imageUrl && (
                <div className="mb-6">
                  <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <img
                      src={(currentQuestion as ExtendedQuizQuestion).imageUrl || ''}
                      alt={`Question ${currentQuestionIndex + 1} illustration`}
                      className="w-full max-w-full h-auto object-contain max-h-96"
                      onError={(e) => {
                        const imageUrl = (currentQuestion as ExtendedQuizQuestion).imageUrl;
                        console.error('Failed to load question image:', imageUrl);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {renderQuestionInput(currentQuestion, currentQuestionIndex)}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-1"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </Button>

              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <Button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              ) : (
                <AlertDialog
                  open={showSubmitDialog}
                  onOpenChange={setShowSubmitDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button className="flex items-center gap-1">
                      Submit Quiz
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to submit your quiz? You
                        won&apos;t be able to change your answers after
                        submission.
                        {Object.keys(selectedAnswers).length <
                          formattedQuestions.length && (
                          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2 text-amber-800">
                            <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">
                                Warning: Unanswered Questions
                              </p>
                              <p className="text-sm">
                                You have answered{' '}
                                {Object.keys(selectedAnswers).length} out of{' '}
                                {formattedQuestions.length} questions.
                              </p>
                            </div>
                          </div>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSubmitQuiz}>
                        Submit Quiz
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-lg border-gray-200 dark:border-gray-700">
            {/* Gradient border effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl bg-gradient-to-r from-[#14C8C8]/20 via-[#0FB6B6]/20 to-[#14C8C8]/20" />
            
            {/* Top accent line */}
            <div className="h-1 bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6]" />
            
            <CardHeader className="relative">
              <CardTitle className="text-[#14C8C8] dark:text-[#14C8C8] font-bold">Question Navigator</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Track your progress through the quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-5 gap-2">
                {formattedQuestions &&
                  formattedQuestions.length > 0 &&
                  formattedQuestions.map((_: unknown, index: number) => {
                    const status = getQuestionStatus(index);
                    const isCurrentQuestion = index === currentQuestionIndex;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        size="icon"
                        className={`h-12 w-12 font-bold transition-all duration-300 hover:scale-105 ${
                          isCurrentQuestion
                            ? 'border-2 border-[#14C8C8] dark:border-[#14C8C8] bg-gradient-to-r from-[#14C8C8]/20 to-[#0FB6B6]/20 dark:from-[#14C8C8]/30 dark:to-[#0FB6B6]/30 text-[#14C8C8] dark:text-[#14C8C8] shadow-lg'
                            : status === 'answered'
                              ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50 hover:shadow-md'
                              : status === 'correct'
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50 hover:shadow-md'
                                : status === 'incorrect'
                                  ? 'bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-950/30 dark:to-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50 hover:shadow-md'
                                  : 'bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:shadow-md'
                        }`}
                        onClick={() => setCurrentQuestionIndex(index)}
                      >
                        {status === 'correct' && !isCurrentQuestion ? (
                          <div className="flex items-center justify-center">
                            <CheckIcon className="h-4 w-4" />
                          </div>
                        ) : status === 'incorrect' && !isCurrentQuestion ? (
                          <div className="flex items-center justify-center">
                            <CrossCircledIcon className="h-4 w-4" />
                          </div>
                        ) : (
                          index + 1
                        )}
                      </Button>
                    );
                  })}
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm"></div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    Answered: {Object.keys(selectedAnswers).length}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg border border-gray-200/50 dark:border-gray-600/30">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 shadow-sm"></div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Unanswered:{' '}
                    {formattedQuestions.length -
                      Object.keys(selectedAnswers).length}
                  </span>
                </div>
              </div>

              <Button
                className="w-full mt-6 bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] hover:from-[#0FB6B6] hover:to-[#14C8C8] text-white shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-0 font-semibold"
                onClick={() => setShowSubmitDialog(true)}
              >
                Submit Quiz
              </Button>
            </CardContent>
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl bg-gradient-to-br from-[#14C8C8]/5 to-[#0FB6B6]/5 pointer-events-none" />
          </Card>
        </div>
      </div>
    </div>
  );
}
