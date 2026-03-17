'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/hooks/auth';
import { usePoll } from '@/hooks/polls';
import { socketIOService as PollSocketAPI } from '@/lib/socket-io';
import { getCookie } from 'cookies-next';
import { toast } from 'sonner';
import { Home } from 'lucide-react';
import type {
  Question,
  QuestionType,
  ActiveQuestionData,
} from '@/types/content';
import type { Poll, PollQuestion as ApiPollQuestion, PollOption } from '@/lib/api/polls';
import { PollQuestionComponent } from '@/components/polls/poll-question';
import { WordCloud } from '@/components/polls/word-cloud';
import { getItem, setItem } from '@/lib/localStorageManager';
import * as keys from '@/lib/localStorageKeys';

// Define types for results data structures
interface QuestionOptionResult {
  optionId: string;
  text: string;
  count: number;
  percentage: number;
}

interface WordResult {
  text: string;
  weight: number;
  count?: number;
}

interface QuestionResults {
  totalResponses: number;
  options?: QuestionOptionResult[];
  words?: WordResult[];
}

// Define type for the poll update event from socket
interface PollUpdateEvent {
  action: string;
  data?: {
    question?: unknown;
    count?: number;
    results?: unknown;
    questionId?: string;
    pollId?: string;
    poll?: Poll;
  };
  question?: unknown; // Direct question field for new-question events
  count?: number; // Direct count field for participant updates
  poll?: Poll;
}

// Helper function to convert API PollQuestion to content Question
const convertApiQuestionToContentQuestion = (apiQuestion: ApiPollQuestion, pollId: string): Question => {
  console.log('🔄 Converting API question to content question:', apiQuestion);
  
  return {
    id: apiQuestion.id,
    text: apiQuestion.question, // ApiPollQuestion uses 'question' field
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

export default function PollParticipationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: user } = useUser();
  const pollId = params.id as string;

  // Use the same poll hook as session polls
  const { data: poll, isLoading, isError, refetch } = usePoll(pollId);

  // Poll state
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [participants, setParticipants] = useState<number>(0);
  const [connected, setConnected] = useState<boolean>(false);
  const [questionEnded, setQuestionEnded] = useState<boolean>(false);
  const [questionResults, setQuestionResults] = useState<QuestionResults | null>(null);
  const [hasJoinedBefore, setHasJoinedBefore] = useState<boolean>(() => {
    // Initialize immediately from localStorage to prevent flash
    if (typeof window !== 'undefined' && pollId) {
      try {
        const joined = getItem(keys.JOINED_POLLS);
        const joinedPolls = joined ? JSON.parse(joined) : [];
        return joinedPolls.includes(pollId);
      } catch {
        return false;
      }
    }
    return false;
  });
  const [isAutoRejoining, setIsAutoRejoining] = useState<boolean>(false);
  const [joiningCode, setJoiningCode] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [showStaticText, setShowStaticText] = useState<boolean>(false);

  // Utility functions for managing joined polls in localStorage
  const getJoinedPolls = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const joined = getItem(keys.JOINED_POLLS);
      return joined ? JSON.parse(joined) : [];
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
        setItem(keys.JOINED_POLLS, JSON.stringify(joined));
      }
    } catch (error) {
      console.warn('Failed to save joined poll to localStorage:', error);
    }
  };

  // const hasJoinedPoll = (pollId: string): boolean => {
  //   return getJoinedPolls().includes(pollId);
  // };

  // Function to set active question from poll data
  const setActiveQuestionFromPoll = (pollData: Poll) => {
    console.log('📝 Setting active question from poll data:', pollData);
    console.log('📝 Current activeQuestion before setting:', activeQuestion);
    
    // If poll has questions, find the active one
    if (pollData.questions && pollData.questions.length > 0) {
      // Use the first question as active (server should send questions in order)
      const activeQ = pollData.questions[0];
      console.log('📝 Found question in poll.questions:', activeQ);
      const convertedQuestion = convertApiQuestionToContentQuestion(activeQ, pollId);
      setActiveQuestion(convertedQuestion);
      console.log('📝 Set active question from poll.questions:', convertedQuestion);
    } else if (pollData.question) {
      // Handle legacy single question format
      console.log('📝 Using legacy single question format:', pollData.question);
      const legacyQuestion: Question = {
        id: 'default',
        text: pollData.question,
        type: pollData.type as QuestionType,
        options: (pollData.options || []).map((opt: PollOption) => ({
          id: opt.id,
          text: opt.text,
          pollId: pollId,
          imageUrl: opt.imageUrl || null,
          order: opt.order,
        })),
        isActive: true,
      };
      setActiveQuestion(legacyQuestion);
      console.log('📝 Set legacy active question:', legacyQuestion);
    } else {
      console.log('📝 No questions found in poll data - poll might be waiting for questions');
    }
  };

  // Check if user has joined this poll before and attempt immediate auto-rejoin
  useEffect(() => {
    if (pollId && hasJoinedBefore) {
      console.log(`🚀 User has joined before, attempting auto-rejoin for poll ${pollId}`);

      // Attempt immediate auto-rejoin
      console.log('🚀 Attempting immediate auto-rejoin...');

      const attemptImmediateRejoin = async () => {
        setIsAutoRejoining(true);

        try {
          // Try to refetch poll data directly (same as session polls)
          await refetch();
          console.log('✅ Immediate auto-rejoin successful via refetch');
          toast.success('Automatically reconnected to poll');
        } catch (rejoinError) {
          console.log('❌ Immediate auto-rejoin failed, will try API rejoin', rejoinError);
          
          // Try auto-rejoin via API
          try {
            const response = await fetch('/api/poll/join', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getCookie('accessToken')}`,
              },
              body: JSON.stringify({
                pollId: pollId,
                autoRejoin: true,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log('✅ Auto-rejoin successful via poll join API', data);
              
              // Refetch poll data after successful rejoin
              await refetch();
              toast.success('Automatically reconnected to poll');
            } else {
              throw new Error('Auto-rejoin API call failed');
            }
          } catch (apiRejoinError) {
            console.log('❌ Auto-rejoin completely failed - user will need to enter code again');
            console.error('Auto-rejoin error:', apiRejoinError);

            // Remove from localStorage since access is no longer valid
            const joined = getJoinedPolls().filter((id) => id !== pollId);
            setItem(keys.JOINED_POLLS, JSON.stringify(joined));
            setHasJoinedBefore(false);
            
            // Show error but don't redirect - let user try to join manually
            toast.error('Unable to reconnect to poll. Please enter the joining code below.');
          }
        } finally {
          setIsAutoRejoining(false);
        }
      };

      // Small delay to ensure component is mounted
      setTimeout(attemptImmediateRejoin, 500);
    }
  }, [pollId, hasJoinedBefore, refetch]);

  // Set active question when poll data is loaded
  useEffect(() => {
    if (poll && !activeQuestion) {
      console.log('🔄 Setting active question from poll data in useEffect');
      setActiveQuestionFromPoll(poll);
    }
  }, [poll, activeQuestion]);

  // Debug: Track activeQuestion changes
  useEffect(() => {
    console.log('🎯 activeQuestion state changed:', activeQuestion);
  }, [activeQuestion]);

  // Auto-rejoin effect - attempt to rejoin if user has joined before and poll load failed
  useEffect(() => {
    if (isError && hasJoinedBefore && pollId) {
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
                PollSocketAPI.initialize(accessToken.toString());
                PollSocketAPI.joinPoll(pollId);
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
            setItem(keys.JOINED_POLLS, JSON.stringify(joined));
            setHasJoinedBefore(false);
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isError, hasJoinedBefore, pollId, refetch]);

  // Show static text and refresh when disconnected
  useEffect(() => {
    if (!connected && !isLoading && !isAutoRejoining) {
      console.log('🔄 Status is disconnected, showing static text and refreshing...');
      setShowStaticText(true);
      
      // Show static text for 2 seconds, then refresh
      const timer = setTimeout(() => {
        console.log('🔄 Refreshing page...');
        window.location.reload();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [connected, isLoading, isAutoRejoining]);

  // Initialize WebSocket connection and event handlers
  useEffect(() => {
    // Don't redirect during loading - wait for auth to be resolved
    if (isLoading || isAutoRejoining) {
      console.log('⏳ Skipping WebSocket init during loading/auto-rejoin');
      return;
    }

    if (!user) {
      toast.error('Please log in to participate in polls');
      router.push('/login');
      return;
    }

    const accessToken = getCookie('accessToken');
    if (!accessToken) {
      toast.error('Authentication required');
      router.push('/login');
      return;
    }

    // Set up event handlers for the centralized WebSocket service
    PollSocketAPI.setEventHandlers({
      onConnected: () => {
        console.log('✅ Connected to WebSocket server successfully');
        setConnected(true);

        // Join the poll room
        console.log(`🔄 Joining poll: ${pollId}`);
        PollSocketAPI.joinPoll(pollId);

        // Poll data is already available from the hook, just set active question
        if (poll) {
          setActiveQuestionFromPoll(poll);
        }
      },

      onDisconnected: () => {
        console.log('Disconnected from poll WebSocket');
        setConnected(false);
      },

      onActiveQuestion: (data: ActiveQuestionData) => {
        console.log('📨 New active question received:', data);
        console.log('📨 Question data structure:', data.data.question);
        
        // Check if we need to convert the question format
        const questionData = data.data.question as (ApiPollQuestion | Question);
        if ('question' in questionData && !('text' in questionData)) {
          // This is API format (has 'question' field but no 'text' field), convert it
          console.log('📨 Converting from API format to UI format');
          const convertedQuestion = convertApiQuestionToContentQuestion(questionData as ApiPollQuestion, pollId);
          setActiveQuestion(convertedQuestion);
        } else {
          // This is already in UI format (has 'text' field)
          console.log('📨 Using question data as-is (UI format)');
          setActiveQuestion(questionData as Question);
        }
        
        setQuestionEnded(false);
        setQuestionResults(null); // Reset results for new question

        // Reset any previous state when new question arrives
        toast.success('New question is now active!');
      },

      onPollUpdated: (data: PollUpdateEvent) => {
        console.log('📨 Poll update received:', data);

        switch (data.action) {
          case 'new-question':
            // Check both locations where question data might be
            const questionData = data.question || data.data?.question;
            if (questionData) {
              console.log('📨 Poll update - new question received:', questionData);
              
              // Check if this is API format (has 'question' property) or UI format (has 'text' property)
              const questionObj = questionData as Record<string, unknown>;
              
              if (questionObj.question && questionObj.id && questionObj.type) {
                // Convert from API format to UI format
                console.log('📨 Poll update - Converting from API format to UI format');
                const apiQuestion = questionData as ApiPollQuestion;
                const question = convertApiQuestionToContentQuestion(apiQuestion, pollId);
                setActiveQuestion(question);
                setQuestionEnded(false);
                setQuestionResults(null); // Reset results for new question
                toast.success('New question is now active!');
              } else if (questionObj.text && questionObj.id && questionObj.type) {
                // Already in UI format
                console.log('📨 Poll update - Using question data as-is (UI format)');
                setActiveQuestion(questionData as Question);
                setQuestionEnded(false);
                setQuestionResults(null); // Reset results for new question
                toast.success('New question is now active!');
              } else {
                console.warn('📨 Poll update - Received question data in unexpected format:', questionData);
                console.warn('📨 Available fields:', Object.keys(questionObj || {}));
              }
            } else {
              console.warn('📨 Poll update - No question data found in new-question event');
            }
            break;
          case 'participant-count-updated':
            const participantCount = data.count || data.data?.count;
            if (participantCount !== undefined) {
              setParticipants(participantCount);
            }
            break;
          case 'question-ended':
            console.log('Question ended via poll update');
            setQuestionEnded(true);
            toast.info('Question has ended. Waiting for next question...');
            break;
          case 'question-results':
            // Handle results display
            const results = data.data?.results;
            console.log('Question results:', results);
            if (results) {
              // Map the WebSocket results to our format
              const wsResults = results as {
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

              const formattedResults: QuestionResults = {
                totalResponses: wsResults.totalResponses || 0,
                options: wsResults.options?.map((opt) => ({
                  optionId: opt.optionId,
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

              setQuestionResults(formattedResults);
              
              // For word cloud questions, don't end the question automatically
              // Let the explicit question-ended event handle that
              if (activeQuestion?.type !== 'WORD_CLOUD') {
                setQuestionEnded(true);
              }
              
              toast.success('Results are now available!');
            }
            break;
          case 'new-response':
            // Handle new response notifications for real-time word cloud updates
            console.log('New response received:', data);
            
            // Type the event data properly - access data.data to match socket message structure
            const eventData = data.data as {
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
            // Check if this is a word cloud response - we can update even if activeQuestion isn't set yet
            const isWordCloudResponse = eventData.response?.type === 'WORD_CLOUD';
            const currentActiveQuestion = activeQuestion;
            const isActiveQuestionWordCloud = currentActiveQuestion?.type === 'WORD_CLOUD';
            
            console.log('🔍 Checking word cloud conditions:', {
              responseType: eventData.response?.type,
              activeQuestionType: currentActiveQuestion?.type,
              activeQuestionId: currentActiveQuestion?.id,
              eventQuestionId: eventData.questionId,
              isWordCloudResponse,
              isActiveQuestionWordCloud,
              shouldUpdate: isWordCloudResponse && (isActiveQuestionWordCloud || !currentActiveQuestion)
            });
            
            // Update word cloud if:
            // 1. The response is a word cloud type AND
            // 2. Either the active question is word cloud OR we don't have an active question yet (timing issue)
            // 3. We also check if the poll itself is a word cloud type (for single-question polls)
            const isPollWordCloud = poll?.type === 'WORD_CLOUD';
            const shouldUpdateWordCloud = isWordCloudResponse && (isActiveQuestionWordCloud || !currentActiveQuestion || isPollWordCloud);
            
            console.log('🔍 Additional word cloud checks:', {
              isPollWordCloud,
              shouldUpdateWordCloud,
              pollType: poll?.type
            });
            
            if (shouldUpdateWordCloud && eventData.response) {
              const response = eventData.response;
              console.log('🎯 Updating word cloud with response:', response.answer);

              // Update the word cloud results in real-time
              setQuestionResults((prev) => {
                console.log('📊 Current questionResults before update:', prev);
                if (!prev) {
                  // Create initial results if they don't exist
                  console.log('📊 Creating initial word cloud results');
                  return {
                    totalResponses: 1,
                    words: [{ text: response.answer, weight: 1 }]
                  };
                }

                // Update existing results
                const existingWords = prev.words || [];
                const wordIndex = existingWords.findIndex(w => w.text.toLowerCase() === response.answer.toLowerCase());
                
                let updatedWords;
                if (wordIndex >= 0) {
                  // Increment existing word weight
                  console.log('📊 Incrementing existing word:', response.answer);
                  updatedWords = existingWords.map((word, index) => 
                    index === wordIndex 
                      ? { ...word, weight: word.weight + 1 }
                      : word
                  );
                } else {
                  // Add new word
                  console.log('📊 Adding new word:', response.answer);
                  updatedWords = [...existingWords, { text: response.answer, weight: 1 }];
                }

                const newResults = {
                  ...prev,
                  totalResponses: prev.totalResponses + 1,
                  words: updatedWords
                };
                console.log('📊 New questionResults after update:', newResults);
                return newResults;
              });

              toast.success(`New word added: "${response.answer}"`);
            } else {
              console.log('🔍 Not updating word cloud - conditions not met');
              toast.info('New response received!');
            }
            break;
          case 'poll-ended':
            console.log('Poll has ended');
            toast.info('Poll has ended. Thank you for participating!');
            setQuestionEnded(true);
            break;
          default:
            console.log('Unknown poll update action:', data.action);
        }
      },

      onQuestionEnded: (event: {
        data?: { questionId?: string; pollId?: string };
      }) => {
        console.log('Question ended:', event);
        setQuestionEnded(true);
        toast.info('Question has ended. Waiting for next question...');
      },

      onParticipantCountUpdated: (event: {
        data?: { count?: number };
        count?: number;
      }) => {
        // Handle the backend's event format: data.data.count or event.count
        const participantCount = event.data?.count || event.count;
        if (participantCount !== undefined) {
          setParticipants(participantCount);
          console.log(`Participant count updated: ${participantCount}`);
        }
      },

      onJoinedPoll: (event: {
        data?: { count?: number; pollId?: string; poll?: Poll };
        count?: number;
        poll?: Poll;
      }) => {
        console.log('Successfully joined poll:', event);

        // Handle the backend's event format: data.data.count
        const participantCount = event.data?.count || event.count || 0;
        setParticipants(participantCount);

        console.log(
          `Joined poll ${event.data?.pollId || pollId} with ${participantCount} participants`
        );
        toast.success(`Joined poll with ${participantCount} participants`);

        // If there's poll data in the response, set active question
        const pollData = event.poll || event.data?.poll;
        if (pollData) {
          // Save this poll as joined in localStorage
          addJoinedPoll(pollId);
          setHasJoinedBefore(true);
          
          // Set active question from the poll data
          setActiveQuestionFromPoll(pollData);
          
          // Refetch to update the poll data in the hook
          refetch();
        }
      },

      onError: (error: Event) => {
        console.error('❌ WebSocket error:', error);
        setConnected(false);
        toast.error('Connection error. Poll will work in basic mode.');
      },

      onMessage: (event: unknown) => {
        console.log('📨 WebSocket message received:', event);
      },
    });

    // Initialize Socket.IO connection
    console.log('🚀 Initializing Socket.IO connection...');
    PollSocketAPI.initialize(accessToken.toString());

    // Cleanup on unmount
    return () => {
      PollSocketAPI.leavePoll(pollId);
      PollSocketAPI.disconnect();
    };
  }, [user, pollId, router, isAutoRejoining, isLoading, poll]);

  // Handle leaving the poll
  const handleLeavePoll = () => {
    PollSocketAPI.leavePoll(pollId);
    PollSocketAPI.disconnect();
    router.push('/dashboard');
  };

  // Handle joining the poll with a code
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
          Authorization: `Bearer ${getCookie('accessToken')}`,
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

        // Save this poll as joined in localStorage and map joining code to poll ID
        const pollIdToSave = data.poll?.id || pollId;
        addJoinedPoll(pollIdToSave);
        setHasJoinedBefore(true);

        // Save joining code to poll ID mapping
        try {
          const codeMapping = getItem(keys.POLL_CODE_MAPPING) as Record<string, string> || {};
          codeMapping[joiningCode.trim()] = pollIdToSave;
          setItem(keys.POLL_CODE_MAPPING, JSON.stringify(codeMapping));
        } catch (error) {
          console.warn('Failed to save code mapping:', error);
        }

        // Refetch poll data after successful join
        await refetch();

        // Reset the joining code
        setJoiningCode('');
        setIsJoining(false);

        // Initialize WebSocket connection
        const accessToken = getCookie('accessToken');
        if (accessToken) {
          PollSocketAPI.initialize(accessToken.toString());
          PollSocketAPI.joinPoll(pollId);
        }
      } else {
        toast.error(data.message || 'Failed to join poll');
        setIsJoining(false);
      }
    } catch (error) {
      console.error('Error joining poll:', error);

      // Check if this is an "already joined" error
      const errorMessage =
        error instanceof Error 
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : 'Unknown error';
            
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

        // Initialize WebSocket connection
        const accessToken = getCookie('accessToken');
        if (accessToken) {
          PollSocketAPI.initialize(accessToken.toString());
          PollSocketAPI.joinPoll(pollId);
        }
      } else {
        toast.error('Failed to join poll. Please try again.');
        setIsJoining(false);
      }
    }
  };

  // Handle response submission
  const handleResponseSubmit = async (
    answer: string | string[] | number,
    type: QuestionType
  ) => {
    if (!activeQuestion) {
      toast.error('No active question to respond to');
      return;
    }

    console.log('🚀 Submitting response:', { answer, type });

    try {
      // Prepare the request payload based on question type
      const payload: Record<string, unknown> = {
        pollId: pollId,
        anonymous: false,
      };

      // Map response data to API format based on question type
      switch (type) {
        case 'SINGLE_CHOICE':
          // For single choice, answer should be option ID
          payload.questionOptionId = answer;
          break;

        case 'MULTIPLE_CHOICE':
          // For multiple choice, we need to handle array of option IDs
          if (Array.isArray(answer)) {
            // For now, submit the first selected option
            // TODO: Backend should support multiple option IDs in a single request
            payload.questionOptionId = answer[0];
          } else {
            payload.questionOptionId = answer;
          }
          break;

        case 'WORD_CLOUD':
        case 'OPEN_TEXT':
        case 'Q_AND_A':
          payload.textResponse = answer;
          break;

        case 'SCALE':
          payload.scale = answer;
          break;

        case 'RANKING':
          payload.ranking = answer;
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

      toast.success('Response submitted successfully!');

      // Also send via WebSocket for real-time updates (optional)
      PollSocketAPI.sendPollResponse(pollId, activeQuestion.id, answer);
    } catch (error) {
      console.error('❌ Error submitting response:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit response'
      );
    }
  };

  // Show loading state during initial load, auto-rejoin, or when we should have poll data but don't
  if (isLoading || isAutoRejoining || (hasJoinedBefore && !poll && !isError)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14C8C8] mx-auto mb-4"></div>
            <p className="text-foreground">
              {isAutoRejoining ? 'Reconnecting to poll...' : 'Connecting to poll...'}
            </p>
            {hasJoinedBefore && (
              <p className="text-sm text-muted-foreground mt-2">
                You&apos;ve joined this poll before. Attempting automatic reconnection.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - only show join form when we've confirmed user hasn't joined before
  // Don't show join form during initial loading or if user has joined before
  if ((isError || !poll) && !hasJoinedBefore && !isLoading && !isAutoRejoining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#14C8C8] mb-2">Join Poll</h2>
              <p className="text-muted-foreground">
                Enter the joining code to participate in this poll.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="joining-code">Joining Code</Label>
                <Input
                  id="joining-code"
                  placeholder="Enter the poll code"
                  value={joiningCode}
                  onChange={(e) => setJoiningCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && joiningCode.trim()) {
                      handleJoinWithCode();
                    }
                  }}
                  className="text-center text-lg font-mono tracking-wider"
                  autoFocus
                  disabled={isJoining}
                />
              </div>

              <Button
                onClick={handleJoinWithCode}
                className="w-full bg-[#14C8C8] hover:bg-[#0FB6B6] text-white"
                disabled={isJoining || !joiningCode.trim()}
              >
                {isJoining ? 'Joining...' : 'Join Poll'}
              </Button>

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we have poll data, always show the main content (like session polls)
  // This ensures that when results are showing and user refreshes, they stay on the poll page
  if (poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Breadcrumb Navigation */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">
                  Live Poll
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Poll Header */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-[#14C8C8]">
                    {poll?.title || 'Live Poll'}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={connected ? 'default' : 'destructive'}>
                    {connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  {showStaticText && (
                    <div className="animate-pulse">
                      <span className="text-xs text-orange-500 font-medium">Static</span>
                    </div>
                  )}
                  <Badge variant="outline">{participants} participants</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Question Display */}
          {activeQuestion && !questionEnded ? (
            activeQuestion.type === 'WORD_CLOUD' ? (
              // For word cloud questions, show both input and results
              <div className="space-y-6">
                {/* Always show the input form for word cloud questions */}
                <PollQuestionComponent
                  question={activeQuestion}
                  onSubmitResponse={handleResponseSubmit}
                />
                
                {/* Show live word cloud results if available */}
                {questionResults && questionResults.totalResponses > 0 && (
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <div className="text-center">
                        <CardTitle className="text-lg text-[#14C8C8] mb-2">Live Word Cloud</CardTitle>
                        <CardDescription>
                          {questionResults.totalResponses} {questionResults.totalResponses === 1 ? 'response' : 'responses'} so far
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {questionResults.words && questionResults.words.length > 0 ? (
                        <WordCloud 
                          words={questionResults.words.map(word => ({
                            text: word.text,
                            count: word.weight,
                            weight: word.weight
                          }))}
                          animate={true}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Building word cloud...</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              // For other question types, show just the question
              <PollQuestionComponent
                question={activeQuestion}
                onSubmitResponse={handleResponseSubmit}
              />
            )
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  {questionEnded ? (
                    <>
                      <h3 className="text-xl font-semibold text-foreground">
                        Question Ended
                      </h3>
                      {questionResults ? (
                        activeQuestion?.type === 'WORD_CLOUD' ? (
                          // For word cloud questions, show the word cloud results
                          <div className="space-y-4">
                            <p className="text-muted-foreground">
                              Final results for: {activeQuestion?.text}
                            </p>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-4">
                                Total Responses: {questionResults.totalResponses}
                              </p>
                            </div>
                            {questionResults.words && questionResults.words.length > 0 ? (
                              <WordCloud 
                                words={questionResults.words.map(word => ({
                                  text: word.text,
                                  count: word.weight,
                                  weight: word.weight
                                }))}
                                animate={true}
                              />
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">No responses received</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          // For other question types, show traditional results
                          <div className="space-y-4">
                            <p className="text-muted-foreground">
                              Results for: {activeQuestion?.text}
                            </p>
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                Total Responses: {questionResults.totalResponses}
                              </p>
                              {questionResults.options?.map((option: QuestionOptionResult) => (
                                <div key={option.optionId} className="bg-muted/50 p-3 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">{option.text}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {option.count} votes ({option.percentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div 
                                      className="bg-[#14C8C8] h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${option.percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ) : (
                        <p className="text-muted-foreground">
                          Waiting for the next question...
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold text-foreground">
                        Waiting for Question
                      </h3>
                      <p className="text-muted-foreground">
                        The poll host will start the questions soon.
                      </p>
                    </>
                  )}
                  {!questionResults && (
                    <div className="animate-pulse flex justify-center">
                      <div className="h-2 w-32 bg-muted rounded"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leave Poll Button */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleLeavePoll}
              className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-950/20"
            >
              Leave Poll
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If no poll data and user hasn't joined, show join form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#14C8C8] mb-2">Join Poll</h2>
            <p className="text-muted-foreground">
              Enter the joining code to participate in this poll.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="joining-code">Joining Code</Label>
              <Input
                id="joining-code"
                placeholder="Enter the poll code"
                value={joiningCode}
                onChange={(e) => setJoiningCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && joiningCode.trim()) {
                    handleJoinWithCode();
                  }
                }}
                className="text-center text-lg font-mono tracking-wider"
                autoFocus
                disabled={isJoining}
              />
            </div>

            <Button
              onClick={handleJoinWithCode}
              className="w-full bg-[#14C8C8] hover:bg-[#0FB6B6] text-white"
              disabled={isJoining || !joiningCode.trim()}
            >
              {isJoining ? 'Joining...' : 'Join Poll'}
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
