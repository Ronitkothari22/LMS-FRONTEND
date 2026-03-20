'use client';

import { BookOpenText, ExternalLink, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { LmsLevelContent, LmsWatchEventType } from '@/types/lms';

interface LmsLevelContentProps {
  contents: LmsLevelContent[];
  onVideoProgress: (payload: {
    contentId: string;
    eventType: LmsWatchEventType;
    watchPercent?: number;
    watchSeconds?: number;
    videoPositionSeconds?: number;
  }) => void;
  isUpdatingVideoProgress?: boolean;
}

export function LmsLevelContentSection({
  contents,
  onVideoProgress,
  isUpdatingVideoProgress,
}: LmsLevelContentProps) {
  if (!contents.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>No content items found for this level.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Content</CardTitle>
        <CardDescription>
          Complete required items before submitting your level attempt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {contents.map(content => {
          const contentUrl = content.externalUrl || content.videoUrl || content.attachmentUrl;
          const isVideo = content.type === 'VIDEO';

          return (
            <div key={content.id} className="rounded-xl border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{content.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {content.description || 'No description provided.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {content.type}
                  </Badge>
                  <Badge variant={content.isRequired ? 'default' : 'secondary'} className="text-xs">
                    {content.isRequired ? 'Required' : 'Optional'}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {contentUrl && (
                  <a href={contentUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Resource
                    </Button>
                  </a>
                )}

                {isVideo && (
                  <Button
                    size="sm"
                    className="gap-1"
                    disabled={isUpdatingVideoProgress}
                    onClick={() =>
                      onVideoProgress({
                        contentId: content.id,
                        eventType: 'COMPLETE',
                        watchPercent: 100,
                        watchSeconds: content.videoDurationSeconds || 0,
                        videoPositionSeconds: content.videoDurationSeconds || 0,
                      })
                    }
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    {isUpdatingVideoProgress ? 'Updating...' : 'Mark Video Complete'}
                  </Button>
                )}

                {content.type === 'READING' && (
                  <Button size="sm" variant="secondary" disabled className="gap-1">
                    <BookOpenText className="h-3.5 w-3.5" />
                    Reading Item
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
