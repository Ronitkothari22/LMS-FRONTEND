'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useLmsGlobalLeaderboard, useLmsTopicLeaderboard, useLmsTopics } from '@/hooks/lms';
import { LmsLeaderboardSection } from '@/components/lms/leaderboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function LmsLeaderboardPage() {
  const { data: topics = [], isLoading: isTopicsLoading } = useLmsTopics();
  const { data: globalData, isLoading: isGlobalLoading, isError: isGlobalError } =
    useLmsGlobalLeaderboard(50);

  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const normalizedTopicId = selectedTopicId || topics[0]?.id || '';

  const {
    data: topicData,
    isLoading: isTopicLoading,
    isError: isTopicError,
  } = useLmsTopicLeaderboard(normalizedTopicId, 50);

  const topicTitle = useMemo(() => {
    if (!normalizedTopicId) return 'Topic Leaderboard';
    return topics.find(topic => topic.id === normalizedTopicId)?.title || 'Topic Leaderboard';
  }, [normalizedTopicId, topics]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/dashboard/lms">
          <Button variant="ghost" size="sm" className="px-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to LMS
          </Button>
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold inline-flex items-center gap-2">
          <Trophy className="h-7 w-7 text-primary" />
          LMS Leaderboards
        </h1>
        <p className="text-muted-foreground">Track top learners globally and by topic.</p>
      </div>

      {isGlobalLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : isGlobalError ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load global leaderboard</CardTitle>
            <CardDescription>Please try again.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <LmsLeaderboardSection
          title="Global Leaderboard"
          description="Top learners across all LMS topics"
          entries={globalData?.leaderboard || []}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Topic Leaderboard</CardTitle>
          <CardDescription>Select a topic to view topic-specific rankings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTopicsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No LMS topics available.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="topic-select" className="text-sm font-medium">
                Topic
              </label>
              <select
                id="topic-select"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={normalizedTopicId}
                onChange={event => setSelectedTopicId(event.target.value)}
              >
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!normalizedTopicId ? null : isTopicLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : isTopicError ? (
            <p className="text-sm text-muted-foreground">Unable to load topic leaderboard.</p>
          ) : (
            <LmsLeaderboardSection
              title={topicTitle}
              description="Top learners in this topic"
              entries={topicData?.rankings || []}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
