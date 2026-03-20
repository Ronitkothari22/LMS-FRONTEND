'use client';

import { Flag, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LmsLevel } from '@/types/lms';
import { LmsLevelNode } from '@/components/lms/level-node';

interface LmsSnakeBoardProps {
  levels: LmsLevel[];
}

const chunkLevels = (levels: LmsLevel[], chunkSize: number): LmsLevel[][] => {
  const chunks: LmsLevel[][] = [];

  for (let idx = 0; idx < levels.length; idx += chunkSize) {
    chunks.push(levels.slice(idx, idx + chunkSize));
  }

  return chunks;
};

export function LmsSnakeBoard({ levels }: LmsSnakeBoardProps) {
  const sortedLevels = [...levels].sort((a, b) => a.position - b.position);

  if (sortedLevels.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No levels are published for this topic yet.
      </div>
    );
  }

  const rows = chunkLevels(sortedLevels, 3);

  return (
    <div className="space-y-5">
      <div className="hidden lg:block rounded-2xl border bg-gradient-to-br from-background via-background to-primary/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Route className="h-4 w-4 text-primary" />
            Snake Path Journey
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flag className="h-3.5 w-3.5" />
            Start at Level {sortedLevels[0]?.position}
          </div>
        </div>

        <div className="space-y-4">
          {rows.map((rowLevels, rowIndex) => {
            const isReverse = rowIndex % 2 === 1;
            const displayLevels = isReverse ? [...rowLevels].reverse() : rowLevels;

            return (
              <div key={rowIndex} className="space-y-4">
                <div className="grid grid-cols-3 gap-4 items-stretch">
                  {displayLevels.map((level, colIndex) => {
                    const globalIndex = sortedLevels.findIndex(item => item.id === level.id);
                    return (
                      <div key={level.id} className="relative">
                        <LmsLevelNode level={level} index={globalIndex} />
                        {colIndex < displayLevels.length - 1 && (
                          <div
                            className={cn(
                              'lms-connector-draw absolute top-1/2 -right-2 h-[2px] w-4 bg-gradient-to-r',
                              isReverse ? 'from-primary/70 to-primary/30' : 'from-primary/30 to-primary/70',
                            )}
                          />
                        )}
                      </div>
                    );
                  })}

                  {displayLevels.length < 3 &&
                    Array.from({ length: 3 - displayLevels.length }).map((_, idx) => (
                      <div key={`empty-${rowIndex}-${idx}`} />
                    ))}
                </div>

                {rowIndex < rows.length - 1 && (
                  <div className="flex items-center justify-center">
                    <div className="lms-connector-draw h-8 w-[2px] bg-gradient-to-b from-primary/60 to-primary/20" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:hidden space-y-3">
        {sortedLevels.map((level, index) => (
          <div key={level.id} className="relative">
            <LmsLevelNode level={level} index={index} />
            {index < sortedLevels.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="lms-connector-draw h-6 w-[2px] bg-gradient-to-b from-primary/60 to-primary/20" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
