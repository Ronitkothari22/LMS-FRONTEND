'use client';

import { Crown, Medal, Trophy } from 'lucide-react';
import type { LmsLeaderboardEntry } from '@/types/lms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LmsLeaderboardSectionProps {
  title: string;
  description: string;
  entries: LmsLeaderboardEntry[];
}

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-4 w-4 text-amber-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-500" />;
  if (rank === 3) return <Trophy className="h-4 w-4 text-orange-600" />;
  return null;
};

export function LmsLeaderboardSection({ title, description, entries }: LmsLeaderboardSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!entries.length ? (
          <p className="text-sm text-muted-foreground">No leaderboard entries available yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div
                key={`${entry.rank}-${entry.user.id}`}
                className="rounded-xl border p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                    {entry.rank}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{entry.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{entry.user.email || 'Learner'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold">
                  {rankIcon(entry.rank)}
                  <span>{entry.lmsXp || 0} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
