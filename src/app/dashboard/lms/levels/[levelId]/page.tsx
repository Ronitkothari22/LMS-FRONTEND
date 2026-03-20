'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, CircleAlert, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCompleteLmsLevel,
  useLmsLevel,
  useSubmitLmsLevelAttempt,
  useUpdateLmsVideoProgress,
} from '@/hooks/lms';
import { LmsLevelContentSection } from '@/components/lms/level-content';
import { LmsLevelQuizSection } from '@/components/lms/level-quiz';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { LmsLevelAttemptResult } from '@/types/lms';

export default function LmsLevelPage() {
  const params = useParams<{ levelId: string }>();
  const levelId = params?.levelId || '';

  const { data: level, isLoading, isError } = useLmsLevel(levelId);
  const videoProgressMutation = useUpdateLmsVideoProgress();
  const submitAttemptMutation = useSubmitLmsLevelAttempt();
  const completeLevelMutation = useCompleteLmsLevel();

  const [attemptResult, setAttemptResult] = useState<LmsLevelAttemptResult | null>(null);

  const contentStats = useMemo(() => {
    const items = level?.contents || [];
    return {
      total: items.length,
      videos: items.filter(item => item.type === 'VIDEO').length,
      readings: items.filter(item => item.type === 'READING').length,
    };
  }, [level?.contents]);

  const handleVideoProgress = async (payload: {
    contentId: string;
    eventType: 'START' | 'PROGRESS' | 'PAUSE' | 'SEEK' | 'COMPLETE';
    watchPercent?: number;
    watchSeconds?: number;
    videoPositionSeconds?: number;
  }) => {
    try {
      await videoProgressMutation.mutateAsync({ levelId, payload });
      toast.success('Video progress updated');
    } catch {
      // Error toast handled in API layer
    }
  };

  const handleSubmitAttempt = async (payload: {
    answers: {
      questionId: string;
      selectedOptionIds?: string[];
      textAnswer?: string;
    }[];
    timeSpentSeconds?: number;
  }) => {
    try {
      const response = await submitAttemptMutation.mutateAsync({ levelId, payload });
      setAttemptResult(response);

      if (response.summary.passed) {
        toast.success('Great work! You passed this level quiz.');
      } else {
        toast.error('Attempt submitted. Pass threshold not met yet.');
      }
    } catch {
      // Error toast handled in API layer
    }
  };

  const handleCompleteLevel = async () => {
    try {
      const completion = await completeLevelMutation.mutateAsync({ levelId, force: false });

      if (completion.nextLevelId) {
        toast.success('Level completion processed. Next level is now unlocked.');
      } else {
        toast.success('Level completion processed successfully.');
      }
    } catch {
      // Error toast handled in API layer
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (isError || !level) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load level</CardTitle>
          <CardDescription>Please retry from your topic board.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const topicBackHref = level.topic?.id ? `/dashboard/lms/${level.topic.id}` : '/dashboard/lms';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href={topicBackHref}>
          <Button variant="ghost" size="sm" className="px-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Topic
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">{level.title}</h1>
        <p className="text-muted-foreground">
          Complete content, pass quiz, and finish this level to unlock your next step.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Level Rules
          </CardTitle>
          <CardDescription>These checks come from backend LMS completion logic.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total Content</p>
              <p className="text-lg font-semibold mt-1">{contentStats.total}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Videos</p>
              <p className="text-lg font-semibold mt-1">{contentStats.videos}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Readings</p>
              <p className="text-lg font-semibold mt-1">{contentStats.readings}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={level.requireVideoCompletion ? 'default' : 'secondary'}>
              Video: {level.requireVideoCompletion ? `Required (${level.minVideoWatchPercent || 0}%)` : 'Optional'}
            </Badge>
            <Badge variant={level.requireQuizPass ? 'default' : 'secondary'}>
              Quiz: {level.requireQuizPass ? `Required (${level.quizPassingPercent || 0}%)` : 'Optional'}
            </Badge>
            <Badge variant="outline">XP Reward: {level.xpOnCompletion || 0}</Badge>
          </div>
        </CardContent>
      </Card>

      <LmsLevelContentSection
        contents={level.contents || []}
        onVideoProgress={handleVideoProgress}
        isUpdatingVideoProgress={videoProgressMutation.isPending}
      />

      <LmsLevelQuizSection
        questions={level.questions || []}
        isSubmitting={submitAttemptMutation.isPending}
        result={attemptResult}
        onSubmitAttempt={handleSubmitAttempt}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Finalize Level Completion
          </CardTitle>
          <CardDescription>
            This checks backend rules and unlocks the next level when requirements are met.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleCompleteLevel} disabled={completeLevelMutation.isPending}>
            {completeLevelMutation.isPending ? 'Evaluating...' : 'Complete Level'}
          </Button>

          {completeLevelMutation.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive inline-flex items-center gap-2">
              <CircleAlert className="h-4 w-4" />
              Completion requirements are not met yet. Please finish required content/quiz.
            </div>
          )}

          {completeLevelMutation.data?.nextLevelId && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
              Next level unlocked successfully.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
