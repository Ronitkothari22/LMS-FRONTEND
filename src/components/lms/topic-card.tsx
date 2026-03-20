'use client';

import Link from 'next/link';
import { BookOpen, Clock3 } from 'lucide-react';
import type { LmsTopic } from '@/types/lms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface LmsTopicCardProps {
  topic: LmsTopic;
}

export function LmsTopicCard({ topic }: LmsTopicCardProps) {
  const completed = topic.progress?.completedLevels || 0;
  const total = topic.progress?.totalLevels || topic._count?.levels || 0;
  const completion = topic.progress?.completionPercent || 0;

  return (
    <Card className="border-border/70 hover:border-primary/40 transition-colors">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="gap-1">
            <BookOpen className="h-3 w-3" />
            Topic
          </Badge>
          {!!topic.estimatedDurationMinutes && (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {topic.estimatedDurationMinutes} min
            </span>
          )}
        </div>
        <CardTitle className="line-clamp-2">{topic.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {topic.description || 'Continue your structured learning path for this topic.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {completed}/{total} levels completed
          </span>
          <span>{Math.round(completion)}%</span>
        </div>
        <Progress value={completion} className="h-2" />
        <Link href={`/dashboard/lms/${topic.id}`}>
          <Button className="w-full">{completion > 0 ? 'Continue Topic' : 'Start Topic'}</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
