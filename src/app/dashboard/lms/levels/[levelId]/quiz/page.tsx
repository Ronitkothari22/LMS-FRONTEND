'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, CircleSlash2, NotebookPen, Timer } from 'lucide-react';
import { useLmsLevel } from '@/hooks/lms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function LmsLevelQuizStartPage() {
  const params = useParams<{ levelId: string }>();
  const levelId = params?.levelId || '';

  const { data: level, isLoading, isError } = useLmsLevel(levelId);

  const completionRules = level?.completionRules;
  const isContentPhaseComplete = completionRules?.contentPassed ?? true;
  const hasQuestions = (level?.questions || []).length > 0;
  const latestScore = level?.latestAttempt?.scorePercent ?? null;
  const hasPassed = level?.latestAttempt?.status === 'PASSED';
  const hasFailed = level?.latestAttempt?.status === 'FAILED';
  const hasNoAttempt = !level?.latestAttempt;
  const requiredScore = level?.quizPassingPercent ?? 0;
  const topicBackHref = level?.topic?.id
    ? `/dashboard/lms/${level.topic.id}`
    : `/dashboard/lms/levels/${levelId}`;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !level) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load quiz page</CardTitle>
          <CardDescription>Please return to your level and try again.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <Link href={`/dashboard/lms/levels/${levelId}`}>
          <Button variant="ghost" size="sm" className="px-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Level
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">{level.title} Quiz</h1>
        <p className="text-muted-foreground">
          Start your quiz attempt here. After submission, your score will be shown on this page.
        </p>
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <CardDescription>Complete content first, then start quiz attempt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-muted-foreground">Questions</p>
              <p className="text-lg font-semibold mt-1">{(level.questions || []).length}</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-muted-foreground">Pass Mark</p>
              <p className="text-lg font-semibold mt-1">{requiredScore}%</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-muted-foreground">Attempts</p>
              <p className="text-lg font-semibold mt-1">{level.latestAttempt?.attemptNumber || 0}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={isContentPhaseComplete ? 'default' : 'secondary'} className="gap-1">
              <NotebookPen className="h-3 w-3" />
              Content {isContentPhaseComplete ? 'Completed' : 'Incomplete'}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Timer className="h-3 w-3" />
              Retakes allowed
            </Badge>
          </div>

          <div>
            {isContentPhaseComplete && hasQuestions && (hasNoAttempt || hasFailed) ? (
              <Link href={`/dashboard/lms/levels/${levelId}/quiz/attempt`}>
                <Button size="lg">{hasFailed ? 'Reattempt Quiz' : 'Start Quiz'}</Button>
              </Link>
            ) : (
              <Button disabled size="lg">
                {hasPassed ? 'Quiz Passed' : 'Start Quiz'}
              </Button>
            )}
          </div>

          {hasPassed && (
            <div>
              <Link href={`/dashboard/lms/levels/${levelId}/quiz/attempt?mode=review`}>
                <Button variant="outline">Review Answers</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Grade</CardTitle>
          <CardDescription>
            {level.latestAttempt
              ? 'Highest/latest LMS score from your submitted attempts.'
              : "You haven't submitted this quiz yet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {level.latestAttempt ? (
            <>
              <div className="text-2xl font-semibold">{Math.round(latestScore || 0)}%</div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    hasPassed
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/40'
                  }
                >
                  {hasPassed ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Pass
                    </>
                  ) : (
                    <>
                      <CircleSlash2 className="h-3.5 w-3.5 mr-1" />
                      Fail
                    </>
                  )}
                </Badge>
                <span className="text-xs text-muted-foreground">Required: {requiredScore}%</span>
              </div>
            </>
          ) : (
            <div className="text-2xl font-semibold text-muted-foreground">--</div>
          )}

          <div>
            <Link href={topicBackHref}>
              <Button variant="outline">Back to Topic Board</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
