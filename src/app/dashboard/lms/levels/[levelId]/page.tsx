'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCompleteLmsLevel,
  useLmsLevel,
  useLmsProgress,
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
  const { data: lmsProgress } = useLmsProgress();
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

  const levelProgress = useMemo(
    () =>
      (lmsProgress?.levels || []).find(progress => progress.levelId === levelId) ||
      level?.progress ||
      null,
    [lmsProgress?.levels, levelId, level?.progress],
  );

  const hasVideoContent = contentStats.videos > 0;
  const requiredWatchPercent = level?.requireVideoCompletion
    ? (level?.minVideoWatchPercent ?? 0) > 0
      ? level.minVideoWatchPercent || 100
      : 100
    : 100;
  const currentWatchPercent = Math.round(levelProgress?.watchPercent || 0);
  const completionRules = level?.completionRules;
  const isContentPhaseComplete =
    completionRules?.contentPassed ??
    (!level?.requireVideoCompletion || !hasVideoContent || currentWatchPercent >= requiredWatchPercent);
  const isQuizLocked = !isContentPhaseComplete;
  const isLevelCompleted = levelProgress?.status === 'COMPLETED';

  const latestAttemptResult = useMemo<LmsLevelAttemptResult | null>(() => {
    if (!level?.latestAttempt) return null;
    return {
      attempt: {
        id: level.latestAttempt.id,
        status: level.latestAttempt.status,
        scorePercent: level.latestAttempt.scorePercent ?? undefined,
        createdAt: level.latestAttempt.submittedAt || undefined,
      },
      summary: {
        passed: level.latestAttempt.status === 'PASSED',
        scorePercent: level.latestAttempt.scorePercent ?? 0,
        passThreshold: level.quizPassingPercent || 0,
      },
    };
  }, [level?.latestAttempt, level?.quizPassingPercent]);

  const handleVideoProgress = async (payload: {
    contentId: string;
    eventType: 'START' | 'PROGRESS' | 'PAUSE' | 'SEEK' | 'COMPLETE';
    watchPercent?: number;
    watchSeconds?: number;
    videoPositionSeconds?: number;
    contentType?: 'VIDEO' | 'READING';
  }) => {
    try {
      await videoProgressMutation.mutateAsync({ levelId, payload });
      if (payload.contentType === 'READING') {
        toast.success('Reading progress updated');
      } else {
        toast.success('Video progress updated');
      }
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
        try {
          await completeLevelMutation.mutateAsync({ levelId, force: false });
          toast.success('Level marked completed and next step unlocked.');
        } catch {
          // Error toast handled in API layer
        }
      } else {
        toast.error('Attempt submitted. Pass threshold not met yet.');
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
          Finish required content first, then quiz. Level completion is auto-processed once rules are met.
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
              Video: {level.requireVideoCompletion ? `Required (${requiredWatchPercent}%)` : 'Optional'}
            </Badge>
            <Badge variant={level.requireReadingAcknowledgement ? 'default' : 'secondary'}>
              Reading: {level.requireReadingAcknowledgement ? 'Required' : 'Optional'}
            </Badge>
            <Badge variant={level.requireQuizPass ? 'default' : 'secondary'}>
              Quiz: {level.requireQuizPass ? `Required (${level.quizPassingPercent || 0}%)` : 'Optional'}
            </Badge>
            <Badge variant="outline">XP Reward: {level.xpOnCompletion || 0}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className="h-6 w-6 flex items-center justify-center rounded-full px-0">1</Badge>
            Phase 1: Video & Content
          </CardTitle>
          <CardDescription>
            Watch the video content to unlock the quiz phase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(level.requireVideoCompletion || level.requireReadingAcknowledgement) && (
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">Required Content Progress</p>
              <p className="text-xs text-muted-foreground mt-1">
                Completed: {Math.round(completionRules?.reasons?.currentContentGatePercent ?? currentWatchPercent)}%
              </p>
            </div>
          )}
          <LmsLevelContentSection
            levelId={levelId}
            isLevelCompleted={isLevelCompleted}
            contents={level.contents || []}
            onVideoProgress={handleVideoProgress}
            isUpdatingVideoProgress={videoProgressMutation.isPending}
          />
        </CardContent>
      </Card>

      {!isQuizLocked && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="h-6 w-6 flex items-center justify-center rounded-full px-0">2</Badge>
              Phase 2: Quiz
            </CardTitle>
            <CardDescription>
              Quiz unlocks only after all required content is completed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LmsLevelQuizSection
              questions={level.questions || []}
              isSubmitting={submitAttemptMutation.isPending}
              result={attemptResult || latestAttemptResult}
              readOnly={isLevelCompleted}
              initialAnswers={isLevelCompleted ? level.latestAttempt?.answers || [] : []}
              onSubmitAttempt={handleSubmitAttempt}
            />
          </CardContent>
        </Card>
      )}

    </div>
  );
}
