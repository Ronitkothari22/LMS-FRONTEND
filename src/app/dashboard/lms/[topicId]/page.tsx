'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import { useLmsTopic } from '@/hooks/lms';
import { LmsSnakeBoard } from '@/components/lms/snake-board';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function LmsTopicBoardPage() {
  const params = useParams<{ topicId: string }>();
  const topicId = params?.topicId || '';
  const { data: topic, isLoading, isError } = useLmsTopic(topicId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-24 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !topic) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load topic</CardTitle>
          <CardDescription>Please go back and retry.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const levels = [...(topic.levels || [])].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="mb-2">
            <Link href="/dashboard/lms">
              <Button variant="ghost" size="sm" className="px-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Topics
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{topic.title}</h1>
          <p className="text-muted-foreground mt-1">
            Progress through levels in snake-and-ladder fashion to complete this topic.
          </p>
        </div>
        <Badge variant="secondary">{levels.length} levels</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learning Path</CardTitle>
          <CardDescription>
            Complete each level in order to unlock the next step.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 bg-muted/60">
              <Lock className="h-3 w-3" />
              Locked
            </Badge>
            <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/30">
              <PlayCircle className="h-3 w-3" />
              Unlocked/In Progress
            </Badge>
            <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/40">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </Badge>
          </div>

          <LmsSnakeBoard levels={levels} />
        </CardContent>
      </Card>
    </div>
  );
}
