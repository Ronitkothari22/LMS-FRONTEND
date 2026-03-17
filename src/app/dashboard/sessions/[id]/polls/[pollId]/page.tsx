'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { usePoll } from '@/hooks/polls';
import { PollQuestionComponent } from '@/components/polls/poll-question';
import { PollResultsComponent } from '@/components/polls/poll-results';
import { socketIOService } from '@/lib/socket-io';
import { toast } from 'sonner';
import { getCookie } from 'cookies-next';
import { Question, QuestionType } from '@/types/content';
import { PollResults } from '@/types/poll';
import type { PollQuestion as ApiPollQuestion } from '@/lib/api/polls';
import { getItem, setItem } from '@/lib/localStorageManager';
import * as keys from '@/lib/localStorageKeys';

// Helper function to convert API PollQuestion to content Question
const convertApiQuestionToContentQuestion = (apiQuestion: ApiPollQuestion, pollId: string): Question => {
  return {
    id: apiQuestion.id,
    text: apiQuestion.question,
    type: apiQuestion.type as QuestionType,
    options: apiQuestion.options?.map(opt => ({
      id: opt.id,
      text: opt.text,
      pollId,
      imageUrl: opt.imageUrl || null,
      order: opt.order
    })) || [],
    isActive: true
  };
};

export default function PollPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;
  const pollId = params?.pollId as string;

  // State for active question and results
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [activeQuestionData, setActiveQuestionData] = useState<Question | null>(null);
  const [questionResults, setQuestionResults] = useState<Record<string, PollResults>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set());
  const [isUsingPolling, setIsUsingPolling] = useState<boolean>(false);
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // State for joining code input (moved to top level to avoid conditional hooks)
  const [joiningCode, setJoiningCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoinedBefore, setHasJoinedBefore] = useState(false);
  const [isAutoRejoining, setIsAutoRejoining] = useState(false);
  const [showStaticText, setShowStaticText] = useState(false);

  // Refs for polling interval
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionAttempts = useRef(0);

  // Utility functions for managing joined polls in localStorage
  const getJoinedPolls = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const joined = (getItem(keys.JOINED_POLLS) as string[] || []);
      return joined;
    } catch {
      return [];
    }
  };

  const addJoinedPoll = (pollId: string) => {
    if (typeof window === 'undefined') return;
    try {
      const joined = getJoinedPolls();
      if (!joined.includes(pollId)) {
        joined.push(pollId);
        setItem(keys.JOINED_POLLS, joined);
      }
    } catch (error) {
      console.warn('Failed to save joined poll to localStorage:', error);
    }
  };

  const hasJoinedPoll = useCallback((pollId: string): boolean => {
    return getJoinedPolls().includes(pollId);
  }, []);

  // Fetch poll data
  const { data: poll, isLoading, isError, error, refetch } = usePoll(pollId);

  // Client-side validation: Check if poll belongs to the current session
  const isWrongSession = poll && poll.sessionId && poll.sessionId !== sessionId;
  
  // If poll belongs to different session, treat as error
  const effectiveIsError = isError || isWrongSession;
  const effectiveError = isWrongSession 
    ? new Error(`This poll belongs to a different session. Expected session: ${sessionId}, but poll belongs to: ${poll.sessionId}`)
    : error;

  // Check if user has joined this poll before and attempt immediate auto-rejoin
  useEffect(() => {
    if (pollId) {
      const hasJoined = hasJoinedPoll(pollId);
      setHasJoinedBefore(hasJoined);
      console.log(`🔍 Poll ${pollId} - Previously joined:`, hasJoined);

      // If user has joined before, try to auto-rejoin immediately
      if (hasJoined) {
        console.log('🚀 Attempting immediate auto-rejoin...');

        const attemptImmediateRejoin = async () => {
          setIsAutoRejoining(true);

          try {
            // Simply try to refetch the poll data
            // If the user is still joined, this should work
            await refetch();
            console.log('✅ Immediate auto-rejoin successful via refetch');
            toast.success('Automatically reconnected to poll');
          } catch (rejoinError) {
            console.log(
              '❌ Immediate auto-rejoin failed, user may need to rejoin manually',
              rejoinError
            );
            // Don't show error here, let the normal error handling take care of it
          } finally {
            setIsAutoRejoining(false);
          }
        };

        // Small delay to ensure component is mounted
        setTimeout(attemptImmediateRejoin, 500);
      }
    }
  }, [pollId, refetch, hasJoinedPoll]);

  // Auto-rejoin effect - attempt to rejoin if user has joined before and poll load failed
  useEffect(() => {
    if (effectiveIsError && hasJoinedBefore && pollId && !isWrongSession) {
      console.log(
        '🔄 Poll load failed but user has joined before - attempting auto-rejoin...'
      );

      // Small delay to ensure error state is stable
      const timer = setTimeout(async () => {
        try {
          // First try a simple refetch
          await refetch();
          console.log('✅ Auto-rejoin successful via refetch');
        } catch (refetchError) {
          console.log(
            '❌ Refetch failed, attempting to rejoin poll automatically...',
            refetchError
          );

          try {
            // If refetch fails, try to rejoin the poll automatically
            // The backend should recognize the user and allow access
            const response = await fetch('/api/poll/join', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getCookie('accessToken')}`,
              },
              body: JSON.stringify({
                pollId: pollId,
                autoRejoin: true, // Flag to indicate this is an auto-rejoin attempt
              }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log('✅ Auto-rejoin successful via poll join API', data);

              // Refetch poll data after successful rejoin
              await refetch();

              // Initialize Socket.IO connection
              const accessToken = getCookie('accessToken');
              if (accessToken) {
                socketIOService.initialize(accessToken.toString());
                socketIOService.joinPoll(pollId);
              }
            } else {
              throw new Error('Auto-rejoin API call failed');
            }
          } catch (rejoinError) {
            console.log(
              '❌ Auto-rejoin completely failed - user will need to enter code again'
            );
            console.error('Auto-rejoin error:', rejoinError);

            // Remove from localStorage since access is no longer valid
            const joined = getJoinedPolls().filter((id) => id !== pollId);
            setItem(keys.JOINED_POLLS, joined);
            setHasJoinedBefore(false);
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [effectiveIsError, hasJoinedBefore, pollId, refetch, isWrongSession]);

  // Show static text and refresh when disconnected
  useEffect(() => {
    if (!isConnected && !isUsingPolling && !isLoading) {
      console.log('🔄 Status is disconnected, showing static text and refreshing...');
      setShowStaticText(true);
      
      // Show static text for 2 seconds, then refresh
      const timer = setTimeout(() => {
        console.log('🔄 Refreshing page...');
        window.location.reload();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isConnected, isUsingPolling, isLoading]);

  // Define setupPolling function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setupPolling = useCallback(() => {
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setIsUsingPolling(true);
    setIsConnected(false);

    // Only show the toast once
    toast.info('Using regular updates instead of real-time connection', {
      id: 'using-polling',
      duration: 3000,
    });

    // Set up polling interval (every 5 seconds)
    pollingIntervalRef.current = setInterval(() => {
      console.log('Polling for updates...');
      refetch().catch((error) => {
        console.error('Error polling for updates:', error);
      });
    }, 5000);

    // Return cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [refetch]);

  // Set up WebSocket connection or polling fallback
  useEffect(() => {
    const accessToken = getCookie('accessToken');
    if (!accessToken || !pollId) return;

    // Function to connect to WebSocket with retry logic
    const connectWebSocket = () => {
      // Only initialize if not already connected
      if (!socketIOService.isConnected()) {
        // Set up event handlers for the centralized Socket.IO service
        socketIOService.setEventHandlers({
          onConnected: () => {
            console.log('WebSocket connected successfully');
            toast.success('Connected to live poll');
            setIsConnected(true);
            setIsUsingPolling(false);
            connectionAttempts.current = 0;

            // Clear any polling interval if we successfully connect to WebSocket
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            // Join the poll room
            socketIOService.joinPoll(pollId);
          },
          onDisconnected: () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
          },
          onError: (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
          },
          onMessage: (event) => {
            console.log('Socket.IO message received:', event);
          },
          onActiveQuestion: (event) => {
            if (event.data?.question) {
              const apiQuestion = event.data.question as ApiPollQuestion;
              if (apiQuestion.id && apiQuestion.question && apiQuestion.type) {
                const question = convertApiQuestionToContentQuestion(apiQuestion, pollId);
                setActiveQuestionData(question);
                setActiveQuestionId(question.id);
                toast.success('New question is now active!');
              }
            }
          },
          onJoinedPoll: (event) => {
            if (event.count) {
              setParticipantCount(event.count);
              toast.success(`Joined poll with ${event.count} participants`);
            }
          },
          onParticipantCountUpdated: (event) => {
            if (event.count) {
              setParticipantCount(event.count);
            }
          },
          onPollUpdated: (event) => {
            if (event.action === 'new-question' && event.data?.question) {
              const apiQuestion = event.data.question as ApiPollQuestion;
              if (apiQuestion.id && apiQuestion.question && apiQuestion.type) {
                const question = convertApiQuestionToContentQuestion(apiQuestion, pollId);
                setActiveQuestionData(question);
                setActiveQuestionId(question.id);
                toast.success('New question is now active!');
              }
            } else if (event.action === 'question-ended') {
              toast.info('Question has ended');
            } else if (event.action === 'question-results') {
              if (event.data.questionId && event.data.results) {
                // Map the WebSocket results to our PollResults type
                const wsResults = event.data.results as {
                  totalResponses?: number;
                  options?: Array<{
                    optionId: string;
                    text: string;
                    count?: number;
                    percentage?: number;
                  }>;
                  words?: Array<{
                    text: string;
                    count?: number;
                    weight?: number;
                  }>;
                };

                const results: PollResults = {
                  questionId: event.data.questionId as string,
                  totalResponses: wsResults.totalResponses || 0,
                  options: (wsResults.options || []).map((opt) => ({
                    id: opt.optionId,
                    text: opt.text,
                    count: opt.count || 0,
                    percentage: opt.percentage || 0
                  })),
                  // Add word cloud support
                  words: wsResults.words?.map((word) => ({
                    text: word.text,
                    weight: word.weight || word.count || 1
                  }))
                };

                // Update the results state
                setQuestionResults((prev) => ({
                  ...prev,
                  [event.data.questionId as string]: results,
                }));

                // Always mark the question as submitted when we receive results
                setSubmittedQuestions((prev) => new Set([...prev, event.data.questionId as string]));
                
                // If this is the current active question, show results
                if (event.data.questionId === activeQuestionId) {
                  toast.success('Results are now available!');
                }

                // If there's a next question and auto-advance is enabled, move to it
                const isFinalQuestion = (event.data as { isFinalQuestion?: boolean }).isFinalQuestion === true;
                if (!isFinalQuestion && poll?.autoAdvance && poll?.questions?.length) {
                  // Find the next question in the poll
                  const currentIndex = poll.questions.findIndex(
                    (q) => q.id === event.data.questionId
                  );
                  const nextQuestion = poll.questions[currentIndex + 1];

                  if (nextQuestion) {
                    setTimeout(() => {
                      setActiveQuestionId(nextQuestion.id);
                      const nextQuestionObj = convertApiQuestionToContentQuestion(nextQuestion, pollId);
                      toast.info(`Moving to next question: ${nextQuestionObj.text}`);
                    }, 3000); // Give user time to see results before moving
                  }
                }
              }
            } else if (event.action === 'new-response') {
              // Handle new response notifications for real-time word cloud updates
              console.log('New response received:', event.data);
              
              // Type the event data properly
              const eventData = event.data as {
                pollId?: string;
                questionId?: string;
                response?: {
                  answer: string;
                  type: string;
                  userId: string;
                  userName: string;
                };
              };
              
              // For word cloud questions, update the results in real-time
              if (eventData.response?.type === 'WORD_CLOUD' && eventData.questionId) {
                const questionId = eventData.questionId;
                const response = eventData.response;

                // Update the word cloud results in real-time
                setQuestionResults((prev) => {
                  const currentResults = prev[questionId];
                  if (!currentResults) {
                    // Create initial results if they don't exist
                    const newResults: PollResults = {
                      questionId,
                      totalResponses: 1,
                      words: [{ text: response.answer, weight: 1 }]
                    };
                    return {
                      ...prev,
                      [questionId]: newResults
                    };
                  }

                  // Update existing results
                  const existingWords = currentResults.words || [];
                  const wordIndex = existingWords.findIndex(w => w.text.toLowerCase() === response.answer.toLowerCase());
                  
                  let updatedWords;
                  if (wordIndex >= 0) {
                    // Increment existing word weight
                    updatedWords = existingWords.map((word, index) => 
                      index === wordIndex 
                        ? { ...word, weight: word.weight + 1 }
                        : word
                    );
                  } else {
                    // Add new word
                    updatedWords = [...existingWords, { text: response.answer, weight: 1 }];
                  }

                  const updatedResults: PollResults = {
                    ...currentResults,
                    totalResponses: currentResults.totalResponses + 1,
                    words: updatedWords
                  };

                  return {
                    ...prev,
                    [questionId]: updatedResults
                  };
                });

                toast.success(`New word added: "${response.answer}"`);
              } else {
                toast.info('New response received!');
              }
            }
          },
        });

        // Initialize the Socket.IO connection with the centralized service
        socketIOService.initialize(accessToken.toString());
      } else {
        // If already connected, just join the poll
        socketIOService.joinPoll(pollId);
      }
    };

    // Start the connection
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      socketIOService.leavePoll(pollId);
    };
  }, [pollId, activeQuestionId, poll?.autoAdvance, poll?.questions]);

  // Get the active question from the poll data
  useEffect(() => {
    if (poll && poll.questions && poll.questions.length > 0) {
      // If no active question is set, use the first one
      if (!activeQuestionId) {
        // Find the first unanswered question if any
        const unansweredQuestion = poll.questions.find(
          (q) =>
            !questionResults[q.id] || questionResults[q.id].totalResponses === 0
        );

        // Use the first unanswered question or the first question
        setActiveQuestionId(unansweredQuestion?.id || poll.questions[0].id);
      }
    }
  }, [poll, activeQuestionId, questionResults]);

  // Handle going back to session
  const handleBackToSession = () => {
    router.push(`/dashboard/sessions/${sessionId}`);
  };

  // Handle question submission with proper API call
  const handleQuestionSubmit = async (response: {
    type: string;
    answer: string | string[] | number;
  }) => {
    if (!response || !activeQuestionData) {
      toast.error('Invalid response data');
      return;
    }

    console.log('🚀 Submitting response:', response);

    try {
      // Prepare the request payload based on question type
      const payload: Record<string, unknown> = {
        pollId: pollId,
        anonymous: false,
      };

      // Map response data to API format based on question type
      switch (response.type) {
        case 'SINGLE_CHOICE':
          // For single choice, response.answer should be option ID
          payload.questionOptionId = response.answer;
          break;

        case 'MULTIPLE_CHOICE':
          // For multiple choice, we need to handle array of option IDs
          if (Array.isArray(response.answer)) {
            // For now, submit the first selected option
            // TODO: Backend should support multiple option IDs in a single request
            payload.questionOptionId = response.answer[0];
          } else {
            payload.questionOptionId = response.answer;
          }
          break;

        case 'WORD_CLOUD':
        case 'OPEN_TEXT':
        case 'Q_AND_A':
          payload.textResponse = response.answer;
          break;

        case 'SCALE':
          payload.scale = response.answer;
          break;

        case 'RANKING':
          payload.ranking = response.answer;
          break;

        default:
          toast.error('Unknown question type');
          return;
      }

      console.log('📤 API Payload:', payload);

      // Submit to API
      const apiResponse = await fetch(`/api/poll/${pollId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getCookie('accessToken')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.message || 'Failed to submit response');
      }

      const responseData = await apiResponse.json();
      console.log('✅ Response submitted successfully:', responseData);

      // Mark this question as submitted (except for word cloud questions which allow multiple submissions)
      if (activeQuestionId && response.type !== 'WORD_CLOUD') {
        setSubmittedQuestions((prev) => new Set([...prev, activeQuestionId]));
        console.log('📝 Marked question as submitted:', activeQuestionId);
      } else if (response.type === 'WORD_CLOUD') {
        console.log('📝 Word cloud response submitted, allowing more submissions');
      }
      toast.success('Response submitted successfully!');

      // Find the next question if available
      if (
        poll &&
        poll.questions &&
        poll.questions.length > 0 &&
        activeQuestionId
      ) {
        const currentIndex = poll.questions.findIndex(
          (q) => q.id === activeQuestionId
        );
        const nextQuestion = poll.questions[currentIndex + 1];

        // If there's a next question and auto-advance is enabled, move to it
        if (nextQuestion && poll.autoAdvance) {
          setTimeout(() => {
            setActiveQuestionId(nextQuestion.id);
            // Convert to UI Question type to get the .text property
            const nextQuestionObj = convertApiQuestionToContentQuestion(nextQuestion, pollId);
            toast.info(`Moving to next question: ${nextQuestionObj.text}`);
          }, 3000); // Give user time to see results before moving
        }
      }
    } catch (error) {
      console.error('❌ Error submitting response:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit response'
      );
    }
  };

  // Loading state
  if (isLoading || isAutoRejoining) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isAutoRejoining ? 'Reconnecting to poll...' : 'Loading poll...'}
          </p>
          {isAutoRejoining && (
            <p className="text-sm text-gray-500 mt-2">
              You&apos;ve joined this poll before, automatically connecting...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (effectiveIsError || !poll) {
    // Check if the error is an access denied or admin privileges error
    const errorMessage =
      effectiveError instanceof Error
        ? effectiveError.message
        : typeof effectiveError === 'object' && effectiveError !== null && 'message' in effectiveError
          ? String((effectiveError as { message: unknown }).message)
          : 'No poll data';

    const isAccessDenied =
      (typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        error.status === 403) ||
      errorMessage.toLowerCase().includes('access denied');

    const isAdminRequired =
      errorMessage.toLowerCase().includes('admin') ||
      errorMessage.toLowerCase().includes('privileges required');

    // Use a common variable for permission errors
    const isPermissionError = isAccessDenied || isAdminRequired;

    // Note: attemptAutoRejoin function removed as it's not used in this context
    // Auto-rejoin logic is handled in the useEffect hooks above

    // Handle joining the poll directly from this page
    const handleJoinWithCode = async () => {
      if (!joiningCode.trim()) {
        toast.error('Please enter a joining code');
        return;
      }

      setIsJoining(true);

      try {
        // Call the join poll API
        const response = await fetch('/api/poll/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ joiningCode: joiningCode.trim() }),
        });

        const data = await response.json();

        // Check if we have a poll in the response OR if it's an "already joined" success
        if (
          (data.poll && data.poll.id) ||
          (data.success && data.alreadyJoined)
        ) {
          if (data.alreadyJoined) {
            toast.success('You have already joined this poll. Welcome back!');
          } else {
            toast.success('Successfully joined poll');
          }

          // Save this poll as joined in localStorage
          const pollIdToSave = data.poll?.id || pollId;
          addJoinedPoll(pollIdToSave);
          setHasJoinedBefore(true);

          // Refetch the poll data
          await refetch();

          // Reset the joining code
          setJoiningCode('');
          setIsJoining(false);
        } else {
          toast.error(data.message || 'Failed to join poll');
          setIsJoining(false);
        }
      } catch (error) {
        console.error('Error joining poll:', error);

        // Check if this is an "already joined" error
        const errorMessage =
          error?.response?.data?.message || error?.message || '';
        if (
          errorMessage.toLowerCase().includes('already joined') ||
          errorMessage.toLowerCase().includes('already a participant') ||
          errorMessage.toLowerCase().includes('user already exists')
        ) {
          console.log('✅ User already joined this poll - treating as success');
          toast.success('You have already joined this poll. Welcome back!');

          // Save this poll as joined in localStorage
          addJoinedPoll(pollId);
          setHasJoinedBefore(true);

          // Try to refetch the poll data
          try {
            await refetch();
          } catch (refetchError) {
            console.log('Refetch failed after already joined:', refetchError);
          }

          // Reset the joining code
          setJoiningCode('');
          setIsJoining(false);
        } else {
          toast.error('Failed to join poll. Please try again.');
          setIsJoining(false);
        }
      }
    };

    return (
      <div className="container mx-auto py-12 max-w-md">
        <Card className="mx-auto shadow-md border border-gray-200">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-red-500">
              {isPermissionError ? 'Access Denied' : 'Poll Not Found'}
            </CardTitle>
            <CardDescription className="mt-2">
              {isPermissionError
                ? hasJoinedBefore
                  ? 'Auto-reconnection failed. Please re-enter the joining code to continue.'
                  : isAdminRequired
                    ? 'This poll requires admin privileges or a joining code to access.'
                    : 'You need to join this poll with a joining code to access it.'
                : 'The poll you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Poll ID: {pollId}</p>
              <p>Error: {errorMessage}</p>

              {isPermissionError && (
                <div className="mt-6">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                    <p className="text-yellow-800 font-medium">
                      Join with Code
                    </p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Enter the poll joining code provided by the session host
                      to access this poll.
                    </p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Input
                      placeholder="Enter joining code"
                      value={joiningCode}
                      onChange={(e) => setJoiningCode(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleJoinWithCode()
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={handleJoinWithCode}
                      className="bg-[#14C8C8] hover:bg-[#0FB6B6] text-white"
                      disabled={isJoining}
                    >
                      {isJoining ? 'Joining...' : 'Join'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4 pt-2">
            <Button
              onClick={handleBackToSession}
              variant="outline"
              className="border-gray-300 text-gray-700"
            >
              Back to Session
            </Button>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-gray-300 text-gray-700"
            >
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Get the active question object - prioritize Socket.IO data over API data
  const activeQuestion =
    activeQuestionData ||
    (poll.questions?.find((q) => q.id === activeQuestionId)
      ? convertApiQuestionToContentQuestion(poll.questions.find((q) => q.id === activeQuestionId)!, pollId)
      : null) ||
    (poll.question
      ? {
          id: 'default',
          text: poll.question,
          type: poll.type as QuestionType,
          options: (poll.options || []).map(opt => ({
            id: opt.id,
            text: opt.text,
            pollId: pollId,
            imageUrl: opt.imageUrl || null,
            order: opt.order,
          })),
          isActive: true,
        }
      : null);

  // Check if current question has been submitted
  const hasSubmittedCurrentQuestion = activeQuestionId
    ? submittedQuestions.has(activeQuestionId)
    : false;

  // Debug logging
  console.log('🔍 Debug Info:');
  console.log('  activeQuestionId:', activeQuestionId);
  console.log('  activeQuestionData (from Socket.IO):', activeQuestionData);
  console.log('  poll.questions (from API):', poll.questions);
  console.log('  activeQuestion (final):', activeQuestion);
  console.log('  submittedQuestions:', Array.from(submittedQuestions));
  console.log('  hasSubmittedCurrentQuestion:', hasSubmittedCurrentQuestion);
  console.log('  questionResults:', questionResults);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Back Button */}
      <Button
        variant="outline"
        className="mb-4 flex items-center gap-2 border-[#14C8C8] text-[#14C8C8] hover:bg-[#14C8C8]/10 transition-all duration-300"
        onClick={handleBackToSession}
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Session
      </Button>

      {/* Poll Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] bg-clip-text text-transparent">
              {poll.title}
            </h1>
            <Badge
              className={`${poll.isLive ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'} text-white shadow-sm`}
            >
              {poll.isLive ? 'Live' : 'Inactive'}
            </Badge>
            <Badge
              variant={isConnected ? 'default' : 'destructive'}
              className="ml-2 text-xs"
            >
              {isConnected
                ? 'Connected'
                : isUsingPolling
                  ? 'Regular Updates'
                  : 'Disconnected'}
            </Badge>
            {showStaticText && (
              <div className="ml-2 animate-pulse">
                <span className="text-xs text-orange-500 font-medium">Static</span>
              </div>
            )}
          </div>
          {participantCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {participantCount}{' '}
              {participantCount === 1 ? 'participant' : 'participants'}
            </p>
          )}
        </div>
      </div>

      {/* Poll Content */}
      <div className="space-y-8">
        {activeQuestion ? (
          activeQuestion.type === 'WORD_CLOUD' ? (
            // For word cloud questions, show both input and results
            <div className="space-y-6">
              {/* Always show the input form for word cloud questions */}
              <PollQuestionComponent
                pollId={pollId}
                question={activeQuestion}
                onSubmit={handleQuestionSubmit}
              />
              
              {/* Show results if available */}
              {activeQuestionId && questionResults[activeQuestionId] && questionResults[activeQuestionId].totalResponses > 0 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-[#14C8C8] mb-2">Live Word Cloud</h3>
                    <p className="text-sm text-muted-foreground">
                      {questionResults[activeQuestionId].totalResponses} {questionResults[activeQuestionId].totalResponses === 1 ? 'response' : 'responses'} so far
                    </p>
                  </div>
                  <PollResultsComponent
                    question={activeQuestion.text}
                    type={activeQuestion.type}
                    results={questionResults[activeQuestionId]}
                    hasUserSubmitted={hasSubmittedCurrentQuestion}
                  />
                </div>
              )}
            </div>
          ) : (
            // For other question types, show results after submission
            (hasSubmittedCurrentQuestion && questionResults[activeQuestionId || '']) ? (
              <PollResultsComponent
                question={activeQuestion.text}
                type={activeQuestion.type}
                results={
                  activeQuestionId && questionResults[activeQuestionId]
                    ? questionResults[activeQuestionId]
                    : { questionId: activeQuestionId || '', totalResponses: 0, options: [] }
                }
                hasUserSubmitted={hasSubmittedCurrentQuestion}
              />
            ) : (
              // Show question if not submitted yet
              <PollQuestionComponent
                pollId={pollId}
                question={activeQuestion}
                onSubmit={handleQuestionSubmit}
              />
            )
          )
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Questions Available</CardTitle>
              <CardDescription>
                This poll doesn&apos;t have any questions yet.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
