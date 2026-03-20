'use client';

import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { useLmsTopics } from '@/hooks/lms';
import { LmsTopicCard } from '@/components/lms/topic-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function LmsHomePage() {
  const { data: topics = [], isLoading, isError } = useLmsTopics();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">LMS Learning Path</h1>
          <p className="text-muted-foreground mt-1">
            Pick a topic to continue your learning journey.
          </p>
        </div>

        <Link href="/dashboard/lms/leaderboard">
          <Button variant="outline" className="gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-9 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Could not load topics</CardTitle>
            <CardDescription>
              Please refresh and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : topics.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No LMS topics yet</CardTitle>
            <CardDescription>
              You do not have any published topics assigned right now.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topics.map(topic => (
            <LmsTopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </div>
  );
}
