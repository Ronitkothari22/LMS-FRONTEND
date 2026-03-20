'use client';

import Link from 'next/link';
import { CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LmsLevel, LmsProgressStatus } from '@/types/lms';

const statusLabelMap: Record<LmsProgressStatus, string> = {
  LOCKED: 'Locked',
  UNLOCKED: 'Unlocked',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const statusClassMap: Record<LmsProgressStatus, string> = {
  LOCKED: 'bg-muted text-muted-foreground border-border',
  UNLOCKED: 'bg-primary/10 text-primary border-primary/30',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40',
  COMPLETED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/40',
};

const ringClassMap: Record<LmsProgressStatus, string> = {
  LOCKED: 'ring-border/70',
  UNLOCKED: 'ring-primary/30',
  IN_PROGRESS: 'ring-amber-500/40 lms-node-pulse',
  COMPLETED: 'ring-emerald-500/40',
};

const getLevelStatus = (level: LmsLevel): LmsProgressStatus => {
  return level.progress?.status || 'LOCKED';
};

const getLevelIcon = (status: LmsProgressStatus) => {
  if (status === 'COMPLETED') return <CheckCircle2 className="h-4 w-4 lms-complete-pop" />;
  if (status === 'LOCKED') return <Lock className="h-4 w-4" />;
  return <PlayCircle className="h-4 w-4" />;
};

interface LmsLevelNodeProps {
  level: LmsLevel;
  index: number;
  className?: string;
}

export function LmsLevelNode({ level, index, className }: LmsLevelNodeProps) {
  const status = getLevelStatus(level);
  const isLocked = status === 'LOCKED';

  return (
    <div
      className={cn(
        'lms-node-reveal relative rounded-2xl border p-4 bg-card shadow-sm hover:shadow-md transition-all duration-300',
        'ring-1',
        ringClassMap[status],
        className,
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Level {level.position}
        </span>
        <Badge className={cn('gap-1 border', statusClassMap[status])} variant="outline">
          {getLevelIcon(status)}
          {statusLabelMap[status]}
        </Badge>
      </div>

      <h3 className="text-sm font-semibold mt-3 line-clamp-2">{level.title}</h3>
      <p className="text-xs text-muted-foreground mt-1 min-h-8 line-clamp-2">
        {level.description || 'Complete this level to progress on your learning path.'}
      </p>

      <div className="mt-4">
        {isLocked ? (
          <Button className="w-full" variant="secondary" disabled>
            Locked
          </Button>
        ) : (
          <Link href={`/dashboard/lms/levels/${level.id}`}>
            <Button className="w-full">{status === 'COMPLETED' ? 'Review Level' : 'Open Level'}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
