'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatCard } from '@/components/ui/stat-card';
import {
  CalendarIcon,
  ClockIcon,
  PersonIcon,
  ArrowLeftIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { sessionKeys, useSessionDetails } from '@/hooks/sessions';
import { useSessionPolls } from '@/hooks/polls';
import { useUser } from '@/hooks/auth';
import { getCookie } from 'cookies-next';
import { ContentList } from '@/components/content';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { PollCard } from '@/components/polls/poll-card';
import { JoinPollModal } from '@/components/polls/join-poll-modal';
import { LeaderboardModal } from '@/components/quiz/leaderboard-modal';
import { FeedbackList } from '@/components/feedback';
import { TrophyIcon, HelpCircleIcon, CheckCircleIcon, UploadIcon } from 'lucide-react';
import { fetchQuiz } from '@/lib/api/quizzes';
import { TeamsPageClient } from './teams/teams-page-client';
import { useQuizAccess } from '@/hooks/quizzes';
import { useSessionSurveys } from '@/hooks/surveys';
import { SurveyCard } from '@/components/surveys/survey-card';
import { useMySurveyResponses } from '@/hooks/surveys';
import { useMySessionAssignments, useSubmitMySessionAssignment } from '@/hooks/session-assignments';
import { toast } from 'sonner';

interface SessionPageClientProps {
  id: string;
}

// QuizCard Component
interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    timeLimitSeconds?: number;
  };
  session: {
    id: string;
    quizzes?: Array<{ id: string; title: string }>;
  };
  index: number;
  onTakeQuiz: (quizId?: string) => void;
  onViewLeaderboard: (quizId: string, quizTitle: string) => void;
  quizDetails?: {
    questions?: Array<unknown>;
    timeLimit?: number;
  };
}

function QuizCard({
  quiz,
  session,
  index,
  onTakeQuiz,
  onViewLeaderboard,
  quizDetails,
}: QuizCardProps) {
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [details, setDetails] = useState<{
    questions?: Array<unknown>;
    timeLimit?: number;
  } | null>(null);

  // Check if user can access this quiz
  const { data: accessStatus, isLoading: isCheckingAccess } = useQuizAccess(quiz.id);

  // Fetch quiz details when component mounts
  useEffect(() => {
    const loadQuizDetails = async () => {
      if (quizDetails) {
        setDetails(quizDetails);
        return;
      }

      setIsLoadingDetails(true);
      try {
        const fetchedDetails = await fetchQuiz(session.id, quiz.id);
        setDetails(fetchedDetails);
      } catch (error) {
        console.log('Could not fetch quiz details:', error);
        // Use fallback data
        setDetails({
          questions: [],
          timeLimit: quiz.timeLimitSeconds
            ? Math.ceil(quiz.timeLimitSeconds / 60)
            : 30,
        });
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadQuizDetails();
  }, [quiz.id, session.id, quizDetails, quiz.timeLimitSeconds]);

  const questionCount = details?.questions?.length || 0;
  const timeLimitMinutes =
    details?.timeLimit ||
    (quiz.timeLimitSeconds ? Math.ceil(quiz.timeLimitSeconds / 60) : 30);

  // Determine quiz status based on access data
  const isQuizCompleted = accessStatus?.userStatus === 'COMPLETED' || false;
  const canRetakeQuiz = accessStatus?.userStatus === 'CAN_RETRY' || false;
  const lastScore = accessStatus?.lastAttemptScore;

  // Function to handle quiz taking
  const handleTakeQuizClick = () => {
    // Prevent navigation while checking access or if quiz is completed and retakes not allowed
    if (isCheckingAccess || (isQuizCompleted && !canRetakeQuiz)) {
      return;
    }
    onTakeQuiz(quiz.id);
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-lg border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-[#14C8C8]/10">
      {/* Top accent line */}
      <div className="h-2 bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6]" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-[#14C8C8] dark:text-[#14C8C8] text-lg flex items-center gap-2">
              {quiz.title}
            </CardTitle>
            <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
              Quiz for this session • {index + 1} of{' '}
              {session.quizzes?.length || 1}
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className={
              isQuizCompleted
                ? canRetakeQuiz
                  ? "bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white border-blue-300/50 shadow-md"
                  : "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white border-green-300/50 shadow-md"
                : "bg-gradient-to-r from-orange-500/90 to-amber-500/90 text-white border-orange-300/50 shadow-md"
            }
          >
            {isCheckingAccess 
              ? 'Checking...' 
              : isQuizCompleted 
                ? canRetakeQuiz 
                  ? 'Retakeable' 
                  : 'Completed' 
                : 'Available'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800/50 transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="font-medium text-blue-800 dark:text-blue-300">Questions</p>
            </div>
            <p className="text-blue-700 dark:text-blue-200 font-bold text-lg">
              {isLoadingDetails ? (
                <span className="animate-pulse">...</span>
              ) : (
                questionCount || 'N/A'
              )}
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800/50 transition-all duration-300 hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <p className="font-medium text-orange-800 dark:text-orange-300">Time Limit</p>
            </div>
            <p className="text-orange-700 dark:text-orange-200 font-bold text-lg">
              {isLoadingDetails ? (
                <span className="animate-pulse">...</span>
              ) : (
                `${timeLimitMinutes} min`
              )}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800/50 transition-all duration-300 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <p className="font-medium text-purple-800 dark:text-purple-300">Status</p>
            </div>
            <p className="font-bold text-lg text-purple-700 dark:text-purple-200">
              {isCheckingAccess 
                ? 'Checking...' 
                : isQuizCompleted 
                  ? canRetakeQuiz 
                    ? 'Retakeable' 
                    : 'Completed' 
                  : 'Pending'}
            </p>
          </div>
        </div>
        
        {/* Show score if quiz is completed */}
        {isQuizCompleted && lastScore !== undefined && (
          <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/30 rounded-lg border border-green-200 dark:border-green-800/50">
            <div className="flex items-center gap-2 mb-2">
              <TrophyIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="font-medium text-green-800 dark:text-green-300">Your Score</p>
            </div>
            <p className="text-green-700 dark:text-green-200 font-bold text-xl">
              {lastScore}%
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-3 pt-0 pb-6 relative">
        <Button
          onClick={handleTakeQuizClick}
          disabled={isCheckingAccess || (isQuizCompleted && !canRetakeQuiz)}
          className={`flex-1 ${
            isCheckingAccess || (isQuizCompleted && !canRetakeQuiz)
              ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] hover:from-[#0FB6B6] hover:to-[#14C8C8]'
          } text-white shadow-md border-0 transition-all duration-300 hover:shadow-lg`}
          title={
            isCheckingAccess
              ? 'Checking quiz access...'
              : isQuizCompleted && !canRetakeQuiz
                ? 'You have already completed this quiz'
                : canRetakeQuiz && isQuizCompleted
                  ? 'Retake Quiz'
                  : 'Take Quiz'
          }
        >
          {isCheckingAccess
            ? 'Checking...'
            : isQuizCompleted && !canRetakeQuiz
              ? 'Quiz Completed'
              : canRetakeQuiz && isQuizCompleted
                ? 'Retake Quiz'
                : 'Take Quiz'}
        </Button>
        <Button
          onClick={() => onViewLeaderboard(quiz.id, quiz.title)}
          variant="outline"
          className="flex items-center gap-1 border-[#14C8C8]/30 text-[#14C8C8] dark:border-[#14C8C8]/50 dark:text-[#14C8C8] hover:!bg-[#14C8C8]/10 hover:!border-[#14C8C8]/60 transition-all duration-300"
        >
          <TrophyIcon className="h-4 w-4" />
          Leaderboard
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function SessionPageClient({ id }: SessionPageClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State for leaderboard modal
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [selectedQuizTitle, setSelectedQuizTitle] = useState<string>('');

  // State for quiz details
  const [quizDetails] = useState<
    Record<
      string,
      {
        questions?: Array<unknown>;
        timeLimit?: number;
      }
    >
  >({});

  // Get the current user
  const { data: user } = useUser();

  // Check if user is authenticated
  useEffect(() => {
    const accessToken = getCookie('accessToken');
    console.log('Access token present:', !!accessToken);

    if (!accessToken) {
      console.log('No access token found, redirecting to login');
      router.push('/login');
    }
  }, [router]);

  // Fetch session details
  const {
    data: session,
    isLoading,
    isError,
    error,
    refetch,
  } = useSessionDetails(id);

  // Debug session data
  useEffect(() => {
    console.log('Session ID:', id);
    console.log('User data:', user);
    console.log('Session data:', session);
    console.log('Is loading:', isLoading);
    console.log('Is error:', isError);
    console.log('Error:', error);
  }, [id, user, session, isLoading, isError, error]);

  // We'll rely on the session data from the API for quiz completion status
  // This ensures we're only using real data

  // Ensure sessions are loaded when navigating back to sessions page
  useEffect(() => {
    // This effect will run when the component mounts
    // It ensures that when we navigate back to the sessions page,
    // the sessions data will be available in the cache
    const invalidateSessionsQuery = () => {
      try {
        // Invalidate the sessions query to trigger a refetch when navigating back
        queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      } catch (error) {
        console.error('Error invalidating sessions query:', error);
      }
    };

    invalidateSessionsQuery();
  }, [queryClient]);

  // Auto-refresh session data when page regains focus (user comes back from quiz)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Session page regained focus, refreshing data...');
      refetch();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  // Refresh data when component mounts (user navigates to session page)
  useEffect(() => {
    console.log('Session page mounted, refreshing data...');
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading session details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !session) {
    return (
      <Card className="mx-auto max-w-md mt-8">
        <CardHeader>
          <CardTitle>Session Not Found</CardTitle>
          <CardDescription>
            {error instanceof Error
              ? error.message
              : "The session you're looking for doesn't exist or you don't have access to it."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Session ID: {id}</p>
            <p>
              Error:{' '}
              {isError
                ? error instanceof Error
                  ? error.message
                  : 'Unknown error'
                : 'No session data'}
            </p>
            <p>This could be due to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The session ID is invalid</li>
              <li>You don&apos;t have permission to view this session</li>
              <li>The backend API is not responding correctly</li>
              <li>Authentication issues with your account</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button onClick={() => router.back()}>Go Back</Button>
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
    );
  }

  // Check if session data is incomplete
  if (!session.title || !session.state) {
    return (
      <Card className="mx-auto max-w-md mt-8">
        <CardHeader>
          <CardTitle>Incomplete Session Data</CardTitle>
          <CardDescription>
            The session data received from the server is incomplete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Session ID: {id}</p>
            <p>Received data: {JSON.stringify(session, null, 2)}</p>
            <p>This could be due to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The API response format has changed</li>
              <li>The session data is corrupted</li>
              <li>Authentication issues with your account</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button onClick={() => router.back()}>Go Back</Button>
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
    );
  }

  // Handle navigation back to sessions list
  const handleBackToSessions = () => {
    // Navigate back to sessions page
    router.push('/dashboard/sessions');
  };

  // Handle quiz navigation
  const handleTakeQuiz = (quizId?: string) => {
    router.push(
      `/dashboard/sessions/${session.id}/quiz${quizId ? `?quizId=${quizId}` : ''}`
    );
  };

  // Get session status badge color
  const getStatusColor = () => {
    switch (session.state) {
      case 'LIVE':
        return 'bg-green-500';
      case 'UPCOMING':
        return 'bg-blue-500';
      case 'COMPLETED':
        return 'bg-gray-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  // Get session status text
  const getStatusText = () => {
    switch (session.state) {
      case 'LIVE':
        return 'Live Now';
      case 'UPCOMING':
        return 'Upcoming';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Back Button */}
      <Button
        variant="outline"
        className="mb-4 flex items-center gap-2 border-[#14C8C8] text-[#14C8C8] hover:bg-[#14C8C8]/10 transition-all duration-300"
        onClick={handleBackToSessions}
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Sessions
      </Button>

      {/* Session Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] bg-clip-text text-transparent">
              {session.title}
            </h1>
            <Badge
              className={
                getStatusColor().replace('bg-', 'bg-gradient-to-r from-') +
                (getStatusColor().includes('green')
                  ? ' to-green-600'
                  : getStatusColor().includes('blue')
                    ? ' to-blue-600'
                    : getStatusColor().includes('red')
                      ? ' to-red-600'
                      : ' to-gray-600') +
                ' text-white shadow-sm'
              }
            >
              {getStatusText()}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">{session.description}</p>
        </div>
        {session.hasQuiz && (
          <Button
            onClick={() => handleTakeQuiz()}
            aria-label="Take quiz"
            className="bg-[#14C8C8] hover:bg-[#0FB6B6] text-white shadow-md transition-all duration-300 hover:shadow-lg"
          >
            Take Quiz
          </Button>
        )}
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Participants"
          value={session.participants.toString()}
          icon={<PersonIcon className="h-4 w-4 text-[#14C8C8]" />}
          className="border-t-4 border-t-[#14C8C8] shadow-md hover:shadow-lg transition-all duration-300"
        />
        <StatCard
          title="Date"
          value={session.date}
          icon={<CalendarIcon className="h-4 w-4 text-[#14C8C8]" />}
          className="border-t-4 border-t-[#14C8C8] shadow-md hover:shadow-lg transition-all duration-300"
        />
        <StatCard
          title="Time"
          value={session.time}
          icon={<ClockIcon className="h-4 w-4 text-[#14C8C8]" />}
          className="border-t-4 border-t-[#14C8C8] shadow-md hover:shadow-lg transition-all duration-300"
        />
        {session.duration && (
          <StatCard
            title="Duration"
            value={session.duration}
            icon={<ClockIcon className="h-4 w-4 text-[#14C8C8]" />}
            className="border-t-4 border-t-[#14C8C8] shadow-md hover:shadow-lg transition-all duration-300"
          />
        )}
      </div>

      {/* Session Creator Info */}
      {session.createdBy && (
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-base text-[#14C8C8]">
              Session Host
            </CardTitle>
            <div className="flex items-center gap-4 mt-3">
              <div className="h-14 w-14 rounded-full bg-[#14C8C8]/10 flex items-center justify-center overflow-hidden border-2 border-[#14C8C8] shadow-md relative">
                {session.createdBy.avatar ? (
                  <Image
                    src={session.createdBy.avatar}
                    alt={session.createdBy.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <PersonIcon className="h-7 w-7 text-[#14C8C8]" />
                )}
              </div>
              <div>
                <p className="font-medium text-lg">{session.createdBy.name}</p>
                <p className="text-sm text-muted-foreground">
                  {session.createdBy.email}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Session Tabs */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-xl gap-1 h-auto">
          <TabsTrigger
            value="content"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:text-[#14C8C8] data-[state=active]:shadow-md transition-all duration-300 text-xs sm:text-sm px-2 py-2 sm:px-3"
          >
            Content
          </TabsTrigger>
          <TabsTrigger
            value="participants"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:text-[#14C8C8] data-[state=active]:shadow-md transition-all duration-300 text-xs sm:text-sm px-2 py-2 sm:px-3"
          >
            Participants
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:text-[#14C8C8] data-[state=active]:shadow-md transition-all duration-300 text-xs sm:text-sm px-2 py-2 sm:px-3"
          >
            Teams
          </TabsTrigger>
          <TabsTrigger
            value="polls"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:text-[#14C8C8] data-[state=active]:shadow-md transition-all duration-300 text-xs sm:text-sm px-2 py-2 sm:px-3"
          >
            Polls
          </TabsTrigger>
          <TabsTrigger
            value="quizzes"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:text-[#14C8C8] data-[state=active]:shadow-md transition-all duration-300 text-xs sm:text-sm px-2 py-2 sm:px-3"
          >
            Quizzes
          </TabsTrigger>
          <TabsTrigger
            value="surveys"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:text-[#14C8C8] data-[state=active]:shadow-md transition-all duration-300 text-xs sm:text-sm px-2 py-2 sm:px-3"
          >
            Surveys
          </TabsTrigger>
          <TabsTrigger
            value="feedback"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:text-[#14C8C8] data-[state=active]:shadow-md transition-all duration-300 text-xs sm:text-sm px-2 py-2 sm:px-3"
          >
            Feedback
          </TabsTrigger>
          <TabsTrigger
            value="assignments"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:text-[#14C8C8] data-[state=active]:shadow-md transition-all duration-300 text-xs sm:text-sm px-2 py-2 sm:px-3"
          >
            Assignments
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4 mt-4">
          <ContentList sessionId={id} />
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-6 mt-4">
          {(() => {
            // Calculate actual participant count (excluding hosts)
            const actualParticipants = session.participantsList ?
              session.participantsList.filter((participant) => {
                const isHost = session.createdBy && (
                  // Only use reliable identifiers - ID and email
                  (participant.id && session.createdBy.id && participant.id.toString() === session.createdBy.id.toString()) ||
                  (participant.email && session.createdBy.email && participant.email.toLowerCase() === session.createdBy.email.toLowerCase())
                );
                return !isHost;
              }).length : 0;

            return (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] bg-clip-text text-transparent">
                  Participants ({actualParticipants})
                </h2>
                <div className="text-sm text-muted-foreground bg-gradient-to-r from-[#14C8C8]/10 to-[#0FB6B6]/10 px-4 py-2 rounded-full border border-[#14C8C8]/20 self-start sm:self-auto">
                  {actualParticipants} member{actualParticipants !== 1 ? 's' : ''} joined
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {session.participantsList && session.participantsList.length > 0 ? (
              // Filter out hosts and show only regular participants
              [...session.participantsList]
                .filter((participant) => {
                  // Check if this participant is the session host using only reliable identifiers
                  const isHost = session.createdBy && (
                    // Primary: ID match (most reliable)
                    (participant.id && session.createdBy.id && participant.id.toString() === session.createdBy.id.toString()) ||
                    // Secondary: Email match (reliable)
                    (participant.email && session.createdBy.email && participant.email.toLowerCase() === session.createdBy.email.toLowerCase())
                    // Removed name matching to avoid false positives
                  );

                  // Return false for hosts (exclude them), true for regular participants
                  return !isHost;
                })
                .map((participant, index) => {

                  return (
                <Card
                  key={participant.id}
                  className="relative overflow-hidden border animate-in fade-in slide-in-from-bottom-4 bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-lg border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-[#14C8C8]/10"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                >

                  {/* Top accent line */}
                  <div className="h-1 w-full bg-gradient-to-r from-[#14C8C8] via-[#0FB6B6] to-[#14C8C8]" />

                  <CardHeader className="pb-4 pt-6 relative">
                    <div className="flex flex-col items-center text-center space-y-4">
                      {/* Avatar with simple styling */}
                      <div className="relative">
                        {/* Avatar container */}
                        <div className="relative h-16 w-16 rounded-full p-0.5 shadow-xl bg-gradient-to-br from-[#14C8C8] to-[#0FB6B6]">
                          <div className="h-full w-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                            {participant.avatar ? (
                              <Image
                                src={participant.avatar}
                                alt={participant.name}
                                width={60}
                                height={60}
                                className="object-cover rounded-full"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-[#14C8C8]/10 to-[#0FB6B6]/10 flex items-center justify-center rounded-full">
                                <PersonIcon className="h-8 w-8 text-[#14C8C8]" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Online status indicator */}
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-lg">
                          <div className="h-full w-full bg-green-400 rounded-full animate-pulse" />
                          <div className="absolute inset-0 bg-green-300 rounded-full animate-ping opacity-75" />
                        </div>
                      </div>

                      {/* Participant info */}
                      <div className="space-y-2">
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                          {participant.name}
                        </CardTitle>

                        {/* Participant badge */}
                        <div className="flex flex-wrap justify-center gap-2">
                          <div className="px-3 py-1 bg-gradient-to-r from-[#14C8C8]/10 to-[#0FB6B6]/10 text-[#14C8C8] text-xs font-medium rounded-full border border-[#14C8C8]/20">
                            Participant
                          </div>
                        </div>
                      </div>
                    </div>


                  </CardHeader>
                </Card>
                  );
                })
            ) : (
              <Card className="col-span-full border-dashed border-2 border-gray-200 bg-gray-50/30 dark:border-gray-700 dark:bg-gray-800/30">
                <CardHeader className="text-center py-12">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#14C8C8]/10 to-[#0FB6B6]/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <PersonIcon className="w-10 h-10 text-[#14C8C8]" />
                  </div>
                  <CardTitle className="text-gray-600 dark:text-gray-300 text-xl">
                    No Participants Yet
                  </CardTitle>
                  <CardDescription className="max-w-sm mx-auto text-gray-500 dark:text-gray-400 mt-2">
                    Participants will appear here once they join the session. Share the session link to invite others.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] bg-clip-text text-transparent">
              Session Quizzes
            </h2>
            <div className="text-sm text-muted-foreground bg-gradient-to-r from-[#14C8C8]/10 to-[#0FB6B6]/10 px-4 py-2 rounded-full border border-[#14C8C8]/20 self-start sm:self-auto">
              {session.quizzes?.length || 0} quiz
              {(session.quizzes?.length || 0) !== 1 ? 'es' : ''} available
            </div>
          </div>
          {session.quizzes && session.quizzes.length > 0 ? (
            <div className="space-y-6">
              {session.quizzes.map((quiz, index) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  session={session}
                  index={index}
                  onTakeQuiz={handleTakeQuiz}
                  onViewLeaderboard={(quizId: string, quizTitle: string) => {
                    setSelectedQuizId(quizId);
                    setSelectedQuizTitle(quizTitle);
                    setLeaderboardOpen(true);
                  }}
                  quizDetails={quizDetails[quiz.id]}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-gray-200 bg-gray-50/30 dark:border-gray-700 dark:bg-gray-800/30">
              <CardHeader className="text-center py-12">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#14C8C8]/10 to-[#0FB6B6]/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <HelpCircleIcon className="w-10 h-10 text-[#14C8C8]" />
                </div>
                <CardTitle className="text-gray-600 dark:text-gray-300 text-xl">
                  No Quizzes Available
                </CardTitle>
                <CardDescription className="max-w-sm mx-auto text-gray-500 dark:text-gray-400 mt-2">
                  There are no quizzes available for this session yet. Check
                  back later or contact the session instructor for more
                  information.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        {/* Surveys Tab */}
        <TabsContent value="surveys" className="space-y-6 mt-4">
          <SurveysTabContent sessionId={id} />
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4 mt-4">
          <TeamsTabContent sessionId={id} />
        </TabsContent>

        {/* Polls Tab */}
        <TabsContent value="polls" className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] bg-clip-text text-transparent">
              Live Polls
            </h2>
            <div className="text-sm text-muted-foreground bg-gradient-to-r from-[#14C8C8]/10 to-[#0FB6B6]/10 px-4 py-2 rounded-full border border-[#14C8C8]/20 self-start sm:self-auto">
              Interactive polling sessions
            </div>
          </div>
          <PollsTabContent sessionId={id} />
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] bg-clip-text text-transparent">
              Session Feedback
            </h2>
            <div className="text-sm text-muted-foreground bg-gradient-to-r from-[#14C8C8]/10 to-[#0FB6B6]/10 px-4 py-2 rounded-full border border-[#14C8C8]/20 self-start sm:self-auto">
              Share your experience
            </div>
          </div>
          <FeedbackTabContent sessionId={id} />
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6 mt-4">
          <AssignmentsTabContent sessionId={id} />
        </TabsContent>
      </Tabs>

      {/* Leaderboard Modal */}
      <LeaderboardModal
        quizId={selectedQuizId}
        quizTitle={selectedQuizTitle}
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
      />
    </div>
  );
}

// Teams Tab Content Component
function TeamsTabContent({ sessionId }: { sessionId: string }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#14C8C8]">Teams</h2>
      <TeamsPageClient sessionId={sessionId} />
    </div>
  );
}

function AssignmentsTabContent({ sessionId }: { sessionId: string }) {
  const { data, isLoading, isError } = useMySessionAssignments(sessionId);
  const submitAssignment = useSubmitMySessionAssignment(sessionId);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);

  const assignments = data?.items || [];
  const selectedAssignment =
    assignments.find(a => a.id === selectedAssignmentId) || assignments[0] || null;

  useEffect(() => {
    if (selectedAssignment && selectedAssignment.id !== selectedAssignmentId) {
      setSelectedAssignmentId(selectedAssignment.id);
    }
  }, [selectedAssignment, selectedAssignmentId]);

  const acceptedExtensions = selectedAssignment?.allowedFileTypes?.length
    ? selectedAssignment.allowedFileTypes.map(ext => `.${ext}`).join(',')
    : '.pdf,.doc,.docx';

  const onSubmit = async () => {
    if (!selectedAssignment) return;
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    try {
      await submitAssignment.mutateAsync({
        assignmentId: selectedAssignment.id,
        files: selectedFiles,
        replaceExisting: selectedAssignment.mySubmission ? replaceExisting : undefined,
      });
      setSelectedFiles([]);
      setReplaceExisting(false);
      toast.success('Assignment submitted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit assignment';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#14C8C8] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive dark:text-red-400">Error Loading Assignments</CardTitle>
          <CardDescription className="text-destructive/80 dark:text-red-300/80">
            Failed to load assignment data for this session.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!assignments.length) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-gray-50/30 dark:border-gray-700 dark:bg-gray-800/30">
        <CardHeader className="text-center py-12">
          <CardTitle className="text-gray-600 dark:text-gray-300 text-xl">
            No Assignments Available
          </CardTitle>
          <CardDescription className="max-w-sm mx-auto text-gray-500 dark:text-gray-400 mt-2">
            There are no assignments for this session yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {assignments.map(assignment => (
          <Card
            key={assignment.id}
            className={`cursor-pointer transition-all ${
              selectedAssignment?.id === assignment.id ? 'border-[#14C8C8] shadow-md' : ''
            }`}
            onClick={() => setSelectedAssignmentId(assignment.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{assignment.title}</CardTitle>
                  <CardDescription>
                    Due: {format(new Date(assignment.dueDate), 'PPP p')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{assignment.deadlineStatus}</Badge>
                  {assignment.mySubmission ? (
                    <Badge className="bg-green-600 text-white">Submitted</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {selectedAssignment && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedAssignment.title}</CardTitle>
            <CardDescription>
              Upload your files before the deadline. Allowed types:{' '}
              {selectedAssignment.allowedFileTypes.join(', ').toUpperCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedAssignment.instructions && (
              <div className="rounded-md border p-3 text-sm whitespace-pre-wrap">
                {selectedAssignment.instructions}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">Max File Size</p>
                <p className="font-medium">{selectedAssignment.maxFileSizeMb} MB / file</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">Max Files</p>
                <p className="font-medium">{selectedAssignment.maxFilesPerSubmission}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">Late Submission</p>
                <p className="font-medium">
                  {selectedAssignment.allowLateSubmission ? 'Allowed' : 'Not Allowed'}
                </p>
              </div>
            </div>

            {selectedAssignment.mySubmission && (
              <div className="space-y-2 rounded-md border p-3">
                <p className="font-medium">Your Latest Submission</p>
                <p className="text-sm text-muted-foreground">
                  Submitted at {format(new Date(selectedAssignment.mySubmission.submittedAt), 'PPP p')}
                  {' • '}
                  {selectedAssignment.mySubmission.isLate ? 'Late' : 'On Time'}
                  {' • '}Version {selectedAssignment.mySubmission.version}
                </p>
                <div className="space-y-1">
                  {selectedAssignment.mySubmission.files.map(file => (
                    <a
                      key={file.id}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-[#14C8C8] hover:underline"
                    >
                      {file.fileName}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="assignment-files">Upload Files</Label>
              <Input
                id="assignment-files"
                type="file"
                multiple
                accept={acceptedExtensions}
                onChange={e => setSelectedFiles(Array.from(e.target.files || []))}
                disabled={!selectedAssignment.canSubmit}
              />
              {selectedFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {selectedAssignment.mySubmission && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={e => setReplaceExisting(e.target.checked)}
                />
                Replace existing submission
              </label>
            )}

            <Button
              onClick={onSubmit}
              disabled={
                submitAssignment.isPending ||
                !selectedAssignment.canSubmit ||
                selectedFiles.length === 0
              }
              className="bg-[#14C8C8] hover:bg-[#0FB6B6] text-white"
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              {submitAssignment.isPending ? 'Submitting...' : 'Submit Assignment'}
            </Button>

            {!selectedAssignment.canSubmit && (
              <p className="text-sm text-destructive">
                Submission is closed for this assignment.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Polls Tab Content Component
function PollsTabContent({ sessionId }: { sessionId: string }) {
  // Fetch polls for this session
  const { data: pollsData, isLoading, isError, error } = useSessionPolls(sessionId);

  // Client-side filtering: Ensure we only show polls that belong to this session
  const polls = pollsData?.filter(poll => 
    !poll.sessionId || poll.sessionId === sessionId
  ) || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#14C8C8] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading polls...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive dark:text-red-400">Error Loading Polls</CardTitle>
          <CardDescription className="text-destructive/80 dark:text-red-300/80">
            {error instanceof Error
              ? error.message
              : 'Failed to load polls for this session.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This could be due to a network issue or the polls feature may not be
            available for this session.
          </p>
        </CardContent>
      </Card>
    );
  }

  // No polls state
  if (!polls || polls.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-gray-50/30 dark:border-gray-700 dark:bg-gray-800/30 transition-all duration-300 hover:shadow-lg">
        <CardHeader className="text-center py-12">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#14C8C8]/10 to-[#0FB6B6]/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <div className="bg-[#14C8C8]/20 p-4 rounded-full">
              <div className="bg-[#14C8C8] p-3 rounded-full flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 32 29"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M2.52629 26.105H9.82979V12.6314H2.52629V26.105ZM12.3561 26.105H19.6436V2.52629H12.3561V26.105ZM22.1699 26.105H29.4734V15.9998H22.1699V26.105ZM0 28.6313V10.1052H9.82979V0H22.1699V13.4735H31.9997V28.6313H0Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
          </div>
          <CardTitle className="text-gray-600 dark:text-gray-300 text-xl">
            No Polls Available
          </CardTitle>
          <CardDescription className="max-w-sm mx-auto text-gray-500 dark:text-gray-400 mt-2">
            There are no active polls in this session at the moment. The session host may start a poll later.
          </CardDescription>
          <div className="mt-6">
            <div className="inline-flex items-center gap-2 text-sm text-[#14C8C8] bg-[#14C8C8]/10 px-4 py-2 rounded-full border border-[#14C8C8]/20">
              <div className="w-2 h-2 bg-[#14C8C8] rounded-full animate-pulse"></div>
              Check back soon for new polls
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Display polls
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Polls</h3>
          <p className="text-sm text-muted-foreground">
            {polls.length} poll{polls.length !== 1 ? 's' : ''} ready for interaction
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground bg-gradient-to-r from-[#14C8C8]/10 to-[#0FB6B6]/10 px-3 py-1.5 rounded-full border border-[#14C8C8]/20">
            Real-time polling
          </div>
          <JoinPollModal sessionId={sessionId} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {polls.map((poll, index) => (
          <div
            key={poll.id}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
          >
            <PollCard poll={poll} sessionId={sessionId} />
          </div>
        ))}
      </div>
      
      {/* Additional information */}
      <div className="mt-8 p-4 bg-gradient-to-r from-[#14C8C8]/5 to-[#0FB6B6]/5 rounded-lg border border-[#14C8C8]/10 dark:border-[#14C8C8]/20">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-[#14C8C8] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">Interactive Polling</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Participate in real-time polls to share your thoughts and see live results from other participants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Surveys Tab Content Component
function SurveysTabContent({ sessionId }: { sessionId: string }) {
  const { data: surveys, isLoading, isError } = useSessionSurveys(sessionId);
  const { data: myResponses } = useMySurveyResponses(sessionId);
 
  // Create a set of completed survey IDs for quick lookup
  const completedSurveyIds = new Set(myResponses?.map(r => r.surveyId) || []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] bg-clip-text text-transparent">
          Surveys
        </h2>
        <div className="text-sm text-muted-foreground bg-gradient-to-r from-[#14C8C8]/10 to-[#0FB6B6]/10 px-4 py-2 rounded-full border border-[#14C8C8]/20 self-start sm:self-auto">
          {surveys?.length || 0} survey{surveys && surveys.length !== 1 ? 's' : ''} available
        </div>
      </div>

      {isLoading && <p>Loading surveys...</p>}
      {isError && <p className="text-red-500">Failed to load surveys.</p>}

      {surveys && surveys.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map((survey, index) => (
            <div
              key={survey.id}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
            >
              <SurveyCard 
                survey={survey} 
                sessionId={sessionId}
                isCompleted={completedSurveyIds.has(survey.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        !isLoading && <p>No surveys available.</p>
      )}
    </div>
  );
}

// Feedback Tab Content Component
function FeedbackTabContent({ sessionId }: { sessionId: string }) {
  return (
    <div className="space-y-4">
      <FeedbackList sessionId={sessionId} />
    </div>
  );
}
