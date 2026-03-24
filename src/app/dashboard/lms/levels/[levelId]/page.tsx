'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  useLmsLevel,
  useLmsProgress,
  useUpdateLmsVideoProgress,
} from '@/hooks/lms';
import { LmsLevelContentSection } from '@/components/lms/level-content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function LmsLevelPage() {
  const params = useParams<{ levelId: string }>();
  const levelId = params?.levelId || '';

  const { data: level, isLoading, isError } = useLmsLevel(levelId);
  const { data: lmsProgress } = useLmsProgress();
  const videoProgressMutation = useUpdateLmsVideoProgress();

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className="h-6 w-6 flex items-center justify-center rounded-full px-0">2</Badge>
            Phase 2: Quiz
          </CardTitle>
          <CardDescription>Start quiz from the dedicated quiz page once unlocked.</CardDescription>
        </CardHeader>
        <CardContent>
          {isQuizLocked ? (
            <div className="rounded-lg border p-3 text-sm text-muted-foreground">
              Complete required video/reading content to unlock this quiz.
            </div>
          ) : (
            <Link href={`/dashboard/lms/levels/${levelId}/quiz`}>
              <Button className="w-full">{isLevelCompleted ? 'View Quiz Result' : 'Open Quiz Page'}</Button>
            </Link>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
