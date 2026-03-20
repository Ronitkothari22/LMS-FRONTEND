'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpenText, CheckCircle2, ExternalLink, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { LmsLevelContent, LmsWatchEventType } from '@/types/lms';

interface LmsLevelContentProps {
  levelId?: string;
  isLevelCompleted?: boolean;
  contents: LmsLevelContent[];
  onVideoProgress: (payload: {
    contentId: string;
    eventType: LmsWatchEventType;
    watchPercent?: number;
    watchSeconds?: number;
    videoPositionSeconds?: number;
  }) => void | Promise<void>;
  isUpdatingVideoProgress?: boolean;
}

const isDirectVideoUrl = (url: string): boolean => {
  const cleanUrl = url.split('?')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.ogg') ||
    cleanUrl.endsWith('.m3u8')
  );
};

const toAbsoluteUrl = (rawUrl: string): string | null => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com|drive\.google\.com|docs\.google\.com)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
};

const getYouTubeEmbedUrl = (rawUrl: string): string | null => {
  try {
    const absoluteUrl = toAbsoluteUrl(rawUrl);
    if (!absoluteUrl) return null;
    const parsed = new URL(absoluteUrl);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.toString();
      }

      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/').filter(Boolean)[1];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
};

const getVimeoEmbedUrl = (rawUrl: string): string | null => {
  try {
    const absoluteUrl = toAbsoluteUrl(rawUrl);
    if (!absoluteUrl) return null;
    const parsed = new URL(absoluteUrl);
    const host = parsed.hostname.toLowerCase();

    if (!host.includes('vimeo.com')) return null;
    if (host.includes('player.vimeo.com') && parsed.pathname.startsWith('/video/')) {
      return parsed.toString();
    }

    const id = parsed.pathname.split('/').filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${id}` : null;
  } catch {
    return null;
  }
};

const getGoogleDriveEmbedUrl = (rawUrl: string): string | null => {
  try {
    const absoluteUrl = toAbsoluteUrl(rawUrl);
    if (!absoluteUrl) return null;
    const parsed = new URL(absoluteUrl);
    const host = parsed.hostname.toLowerCase();

    if (!host.includes('drive.google.com') && !host.includes('docs.google.com')) {
      return null;
    }

    const openId = parsed.searchParams.get('id');
    if (openId) {
      return `https://drive.google.com/file/d/${openId}/preview`;
    }

    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const dIndex = pathParts.findIndex(part => part === 'd');
    if (dIndex >= 0 && pathParts[dIndex + 1]) {
      return `https://drive.google.com/file/d/${pathParts[dIndex + 1]}/preview`;
    }
  } catch {
    return null;
  }

  return null;
};

const getPlayableVideoConfig = (content: LmsLevelContent): {
  mode: 'video' | 'iframe' | 'external-only';
  url: string | null;
} => {
  const sourceUrl = content.videoUrl || content.externalUrl || null;
  if (!sourceUrl) {
    return { mode: 'external-only', url: null };
  }

  if (isDirectVideoUrl(sourceUrl)) {
    return { mode: 'video', url: sourceUrl };
  }

  const youtubeEmbedUrl = getYouTubeEmbedUrl(sourceUrl);
  if (youtubeEmbedUrl) {
    return { mode: 'iframe', url: youtubeEmbedUrl };
  }

  const vimeoEmbedUrl = getVimeoEmbedUrl(sourceUrl);
  if (vimeoEmbedUrl) {
    return { mode: 'iframe', url: vimeoEmbedUrl };
  }

  const driveEmbedUrl = getGoogleDriveEmbedUrl(sourceUrl);
  if (driveEmbedUrl) {
    return { mode: 'iframe', url: driveEmbedUrl };
  }

  return { mode: 'iframe', url: toAbsoluteUrl(sourceUrl) };
};

export function LmsLevelContentSection({
  levelId,
  isLevelCompleted = false,
  contents,
  onVideoProgress,
  isUpdatingVideoProgress,
}: LmsLevelContentProps) {
  const [startedVideoIds, setStartedVideoIds] = useState<Record<string, boolean>>({});
  const [reportedPercentByVideo, setReportedPercentByVideo] = useState<Record<string, number>>({});
  const [completedVideoIds, setCompletedVideoIds] = useState<Record<string, boolean>>({});

  const sortedContents = useMemo(
    () => [...contents].sort((a, b) => a.position - b.position),
    [contents],
  );
  const completedStorageKey = levelId ? `lms-video-completed:${levelId}` : null;

  useEffect(() => {
    if (!completedStorageKey) return;

    try {
      const raw = window.localStorage.getItem(completedStorageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as string[];
      if (!Array.isArray(parsed)) return;

      const validVideoIds = new Set(
        sortedContents.filter(item => item.type === 'VIDEO').map(item => item.id),
      );

      const restored: Record<string, boolean> = {};
      for (const contentId of parsed) {
        if (validVideoIds.has(contentId)) {
          restored[contentId] = true;
        }
      }

      setCompletedVideoIds(restored);
    } catch {
      // Ignore malformed local storage and continue with empty state.
    }
  }, [completedStorageKey, sortedContents]);

  useEffect(() => {
    if (!completedStorageKey) return;

    const completedIds = Object.entries(completedVideoIds)
      .filter(([, isCompleted]) => isCompleted)
      .map(([contentId]) => contentId);

    try {
      window.localStorage.setItem(completedStorageKey, JSON.stringify(completedIds));
    } catch {
      // Ignore storage failures (private mode / quota).
    }
  }, [completedStorageKey, completedVideoIds]);

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
          Watch required video content first, then move to the quiz phase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedContents.map(content => {
          const contentUrl = content.externalUrl || content.videoUrl || content.attachmentUrl;
          const isVideo = content.type === 'VIDEO';
          const playableVideo = isVideo ? getPlayableVideoConfig(content) : null;
          const videoUrl = content.videoUrl || content.externalUrl || null;
          const isVideoCompleted = isVideo && (isLevelCompleted || completedVideoIds[content.id]);

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
                  {isVideo && isVideoCompleted && (
                    <Badge className="text-xs gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {contentUrl && (
                  <a href={contentUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in New Tab
                    </Button>
                  </a>
                )}

                {isVideo && videoUrl && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1"
                    disabled={isUpdatingVideoProgress}
                    onClick={() => {
                      if (startedVideoIds[content.id]) return;
                      setStartedVideoIds(prev => ({ ...prev, [content.id]: true }));
                      onVideoProgress({
                        contentId: content.id,
                        eventType: 'START',
                        watchPercent: 0,
                        watchSeconds: 0,
                        videoPositionSeconds: 0,
                      });
                    }}
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Start Tracking
                  </Button>
                )}

                {isVideo && (
                  <Button
                    size="sm"
                    className="gap-1"
                    variant={isVideoCompleted ? 'secondary' : 'default'}
                    disabled={isLevelCompleted || isUpdatingVideoProgress || isVideoCompleted}
                    onClick={() => {
                      if (isLevelCompleted || isVideoCompleted) return;
                      setCompletedVideoIds(prev => ({ ...prev, [content.id]: true }));
                      onVideoProgress({
                        contentId: content.id,
                        eventType: 'COMPLETE',
                        watchPercent: 100,
                        watchSeconds: content.videoDurationSeconds || 0,
                        videoPositionSeconds: content.videoDurationSeconds || 0,
                      });
                    }}
                  >
                    {isVideoCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <PlayCircle className="h-3.5 w-3.5" />
                    )}
                    {isVideoCompleted
                      ? 'Completed'
                      : isUpdatingVideoProgress
                        ? 'Updating...'
                        : 'Mark as Watched'}
                  </Button>
                )}

                {content.type === 'READING' && (
                  <Button size="sm" variant="secondary" disabled className="gap-1">
                    <BookOpenText className="h-3.5 w-3.5" />
                    Reading Item
                  </Button>
                )}
              </div>

              {isVideo && playableVideo?.url && (
                <div className="mt-4 rounded-lg border bg-muted/10 overflow-hidden">
                  {playableVideo.mode === 'video' ? (
                    <video
                      controls
                      preload="metadata"
                      className="w-full max-h-[480px] bg-black"
                      src={playableVideo.url}
                      onPlay={() => {
                        if (startedVideoIds[content.id]) return;
                        setStartedVideoIds(prev => ({ ...prev, [content.id]: true }));
                        onVideoProgress({
                          contentId: content.id,
                          eventType: 'START',
                          watchPercent: 0,
                          watchSeconds: 0,
                          videoPositionSeconds: 0,
                        });
                      }}
                      onTimeUpdate={event => {
                        const element = event.currentTarget;
                        const duration = Number.isFinite(element.duration)
                          ? element.duration
                          : (content.videoDurationSeconds ?? 0);

                        if (!duration || duration <= 0) return;

                        const currentPercent = Math.min(
                          100,
                          Math.max(0, Math.floor((element.currentTime / duration) * 100)),
                        );
                        const reportedPercent = reportedPercentByVideo[content.id] || 0;

                        if (currentPercent >= reportedPercent + 10 && currentPercent < 100) {
                          setReportedPercentByVideo(prev => ({
                            ...prev,
                            [content.id]: currentPercent,
                          }));
                          onVideoProgress({
                            contentId: content.id,
                            eventType: 'PROGRESS',
                            watchPercent: currentPercent,
                            watchSeconds: Math.floor(element.currentTime),
                            videoPositionSeconds: Math.floor(element.currentTime),
                          });
                        }
                      }}
                      onEnded={event => {
                        const element = event.currentTarget;
                        const watchedSeconds = Math.floor(
                          Number.isFinite(element.duration)
                            ? element.duration
                            : (content.videoDurationSeconds ?? 0),
                        );

                        setCompletedVideoIds(prev => ({ ...prev, [content.id]: true }));
                        onVideoProgress({
                          contentId: content.id,
                          eventType: 'COMPLETE',
                          watchPercent: 100,
                          watchSeconds: watchedSeconds,
                          videoPositionSeconds: watchedSeconds,
                        });
                      }}
                    />
                  ) : (
                    <div className="relative w-full overflow-hidden pb-[56.25%]">
                      <iframe
                        src={playableVideo.url}
                        title={content.title}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
