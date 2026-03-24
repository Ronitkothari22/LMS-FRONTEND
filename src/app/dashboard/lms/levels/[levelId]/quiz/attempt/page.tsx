'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useCompleteLmsLevel, useLmsLevel, useSubmitLmsLevelAttempt } from '@/hooks/lms';
import { LmsLevelQuizSection } from '@/components/lms/level-quiz';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function LmsLevelQuizAttemptPage() {
  const params = useParams<{ levelId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const levelId = params?.levelId || '';

  const { data: level, isLoading, isError } = useLmsLevel(levelId);
  const submitAttemptMutation = useSubmitLmsLevelAttempt();
  const completeLevelMutation = useCompleteLmsLevel();

  const completionRules = level?.completionRules;
  const isContentPhaseComplete = completionRules?.contentPassed ?? true;
  const hasQuestions = (level?.questions || []).length > 0;
  const hasPassed = level?.latestAttempt?.status === 'PASSED';
  const isReviewMode = searchParams.get('mode') === 'review';
  const isReadOnly = isReviewMode && !!level?.latestAttempt;

  const latestAttemptResult = useMemo(() => {
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

      if (response.summary.passed) {
        toast.success('Great work! You passed this level quiz.');
        try {
          await completeLevelMutation.mutateAsync({ levelId, force: false });
        } catch {
          // Error toast handled in API layer
        }
      } else {
        toast.error('Attempt submitted. Pass threshold not met yet.');
      }

      router.push(`/dashboard/lms/levels/${levelId}/quiz`);
    } catch {
      // Error toast handled in API layer
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (isError || !level) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load quiz attempt</CardTitle>
          <CardDescription>Please return to your quiz start page and retry.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isContentPhaseComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz is locked</CardTitle>
          <CardDescription>Complete required video/reading content before attempting quiz.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!hasQuestions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No quiz questions found</CardTitle>
          <CardDescription>This level currently has no quiz questions configured.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (hasPassed && !isReviewMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz already passed</CardTitle>
          <CardDescription>
            Reattempt is only available when required passing marks are not met.
          </CardDescription>
          <div>
            <Link href={`/dashboard/lms/levels/${levelId}/quiz`}>
              <Button variant="outline">Back to Quiz Start</Button>
            </Link>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href={`/dashboard/lms/levels/${levelId}/quiz`}>
          <Button variant="ghost" size="sm" className="px-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {isReviewMode ? 'Back to Quiz Summary' : 'Back to Quiz Start'}
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">
          {isReviewMode ? `${level.title} Quiz Review` : `${level.title} Quiz Attempt`}
        </h1>
      </div>

      <LmsLevelQuizSection
        questions={level.questions || []}
        isSubmitting={submitAttemptMutation.isPending}
        result={latestAttemptResult}
        readOnly={isReadOnly}
        initialAnswers={isReadOnly ? level.latestAttempt?.answers || [] : []}
        onSubmitAttempt={handleSubmitAttempt}
      />
    </div>
  );
}
