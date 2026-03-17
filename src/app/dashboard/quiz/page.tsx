'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeaderboardModal } from '@/components/quiz/leaderboard-modal';
import { TrophyIcon, RotateCcw, CheckCircleIcon } from 'lucide-react';
import { useSessions } from '@/hooks/sessions';
import { useQuizAccess } from '@/hooks/quizzes';
import { Session } from '@/lib/api/sessions';
import { fetchQuiz } from '@/lib/api/quizzes';

interface QuizData {
  id: string;
  title: string;
  description: string;
  questions: number;
  timeLimit: string;
  participants: number;
  sessionId: string;
  isCompleted: boolean;
  score?: number;
  timeLimitSeconds?: number;
  canRetake?: boolean;
}

// Component for individual quiz card with attempt status checking
function QuizCard({ quiz }: { quiz: QuizData }) {
  const { data: accessStatus, isLoading: isCheckingAccess } = useQuizAccess(quiz.id);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  const isCompleted = accessStatus?.userStatus === 'COMPLETED' || false;
  const canRetake = accessStatus?.userStatus === 'CAN_RETRY' || false;
  const lastScore = accessStatus?.lastAttemptScore;

  const handleTakeQuiz = () => {
    // Prevent navigation while checking access or if quiz is completed and retakes aren't allowed
    if (isCheckingAccess || (isCompleted && !canRetake)) {
      return;
    }
    window.location.href = `/dashboard/sessions/${quiz.sessionId}/quiz`;
  };

  return (
    <>
      <Card key={quiz.id}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {quiz.title}
                {isCompleted && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                )}
              </CardTitle>
              <CardDescription>{quiz.description}</CardDescription>
            </div>
            <Badge
              variant="secondary"
                          className={
              isCompleted
                ? canRetake
                  ? "bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white border-blue-300/50 shadow-md"
                  : "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white border-green-300/50 shadow-md"
                : "bg-gradient-to-r from-orange-500/90 to-amber-500/90 text-white border-orange-300/50 shadow-md"
            }
          >
            {isCheckingAccess 
              ? 'Checking...' 
              : isCompleted 
                ? canRetake 
                  ? 'Retakeable' 
                  : 'Completed' 
                : 'Available'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium">Questions</p>
              <p className="text-gray-500">{quiz.questions}</p>
            </div>
            <div>
              <p className="font-medium">Time Limit</p>
              <p className="text-gray-500">{quiz.timeLimit}</p>
            </div>
            <div>
              <p className="font-medium">Status</p>
              <p className="text-gray-500">
                {isCheckingAccess 
                  ? 'Checking...' 
                  : isCompleted 
                    ? canRetake 
                      ? 'Retakeable' 
                      : 'Completed' 
                    : 'Pending'}
              </p>
            </div>
          </div>
          
          {/* Show score if completed */}
          {isCompleted && lastScore !== undefined && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <TrophyIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-300">
                  Your Score: {lastScore}%
                </span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className={`w-full sm:w-auto sm:flex-1 ${
              isCheckingAccess || (isCompleted && !canRetake)
                ? 'opacity-60 cursor-not-allowed'
                : ''
            }`}
            onClick={handleTakeQuiz}
            disabled={isCheckingAccess || (isCompleted && !canRetake)}
            title={
              isCheckingAccess
                ? 'Checking quiz access...'
                : isCompleted && !canRetake
                  ? 'You have already completed this quiz'
                  : canRetake && isCompleted
                    ? 'Retake Quiz'
                    : 'Take Quiz'
            }
          >
            {isCheckingAccess
              ? 'Checking...'
              : isCompleted && !canRetake
                ? 'Quiz Completed'
                : canRetake && isCompleted
                  ? 'Retake Quiz'
                  : 'Take Quiz'}
          </Button>
          <Button
            variant="ghost"
            className="w-full sm:w-auto flex items-center gap-2"
            onClick={(e) => {
              e.preventDefault();
              setLeaderboardOpen(true);
            }}
          >
            <TrophyIcon className="h-4 w-4 text-yellow-500" />
            <span>View Leaderboard</span>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Individual Leaderboard Modal for this quiz */}
      <LeaderboardModal
        quizId={quiz.id}
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
      />
    </>
  );
}

export default function QuizPage() {
  const [joiningCode, setJoiningCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableQuizzes, setAvailableQuizzes] = useState<QuizData[]>([]);

  // Fetch sessions data to get real quiz information
  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isError: isSessionsError,
    refetch: refetchSessions,
  } = useSessions();

  // Process sessions data to extract quiz information
  useEffect(() => {
    const processQuizData = async () => {
      if (sessionsData) {
        const activeSessions =
          (sessionsData as { active: Session[] })?.active || [];
        const pastSessions = (sessionsData as { past: Session[] })?.past || [];
        const allSessions = [...activeSessions, ...pastSessions];

        // Extract quiz data from sessions that have quizzes
        const quizData: QuizData[] = [];

        // Process all sessions and try to fetch quiz data for each
        for (const session of allSessions) {
          // Try to fetch quiz details for this session
          try {
            const quizDetails = await fetchQuiz(session.id);

            // If we successfully fetched quiz details, create a quiz entry
            quizData.push({
              id: quizDetails.id,
              title: quizDetails.title,
              description:
                quizDetails.description ||
                'Complete this quiz to test your knowledge',
              questions: quizDetails.questions?.length || 0,
              timeLimit: `${quizDetails.timeLimit} minutes`,
              participants: session.participants || 0,
              sessionId: session.id,
              isCompleted: false, // Will be determined by attempt status check
              score: undefined, // Will be populated by attempt status
              timeLimitSeconds: quizDetails.timeLimit * 60,
              canRetake: true, // Will be determined by attempt status
            });
          } catch {
            // Session doesn't have a quiz or quiz couldn't be fetched
            // This is normal, not all sessions have quizzes
          }
        }

        setAvailableQuizzes(quizData);
      }
    };

    processQuizData();
  }, [sessionsData]);

  const handleJoinQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!joiningCode.trim()) {
      setError('Please enter a joining code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // This would be replaced with an actual API call
      console.log('Joining quiz with code:', joiningCode);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to the quiz
      window.location.href = `/dashboard/quiz/${joiningCode}`;
    } catch (err) {
      console.error('Error joining quiz:', err);
      setError('Failed to join quiz. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (isLoadingSessions) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isSessionsError) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Quizzes</h1>
        <Card className="bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">
              Error Loading Quizzes
            </CardTitle>
            <CardDescription className="text-red-600">
              There was a problem loading quiz data. Please try again.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={() => refetchSessions()}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Quizzes</h1>

      <Tabs defaultValue="join" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="join">Join Quiz</TabsTrigger>
          <TabsTrigger value="available">Available Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="join" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Join a Quiz</CardTitle>
              <CardDescription>
                Enter the quiz code provided by your instructor to join a quiz
                session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinQuiz}>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Input
                      id="code"
                      placeholder="Enter quiz code (e.g. ABC123)"
                      value={joiningCode}
                      onChange={(e) => setJoiningCode(e.target.value)}
                      disabled={loading}
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                  </div>
                </div>
                <Button
                  className="mt-4 w-full"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Joining...' : 'Join Quiz'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {availableQuizzes.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Quizzes Available</CardTitle>
                <CardDescription>
                  There are currently no quizzes available. Join a session that
                  has a quiz to see it here.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            availableQuizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
