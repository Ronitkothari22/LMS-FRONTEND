'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fetchQuizLeaderboard, LeaderboardEntry } from '@/lib/api/quizzes';
import { TrophyIcon, MedalIcon, Award } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { generateUserInitials } from '@/lib/utils/token';

interface LeaderboardModalProps {
  quizId: string;
  quizTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LeaderboardModal({
  quizId,
  quizTitle,
  isOpen,
  onClose,
}: LeaderboardModalProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(quizTitle || 'Quiz Leaderboard');

  const loadLeaderboardData = useCallback(async () => {
    // Don't attempt to load data if no quizId is provided
    if (!quizId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching leaderboard for quiz ID:', quizId);
      const data = await fetchQuizLeaderboard(quizId);
      console.log('Leaderboard data received:', data);

      // Even if we get an empty leaderboard array, that's valid - it just means no one has taken the quiz yet
      if (!data) {
        throw new Error('Invalid leaderboard data format');
      }

      // Set the leaderboard data (might be an empty array, which is fine)
      const sortedLeaderboard = [...(data.leaderboard || [])].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.completedAt && b.completedAt) {
          return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
        }
        return 0;
      });
      setLeaderboard(sortedLeaderboard);

      // Update title if available from API
      if (data.quizTitle) {
        setTitle(data.quizTitle);
      }

      // Log the leaderboard data for debugging
      console.log(
        'Leaderboard entries:',
        data.leaderboard ? data.leaderboard.length : 0
      );
      if (data.leaderboard && data.leaderboard.length > 0) {
        console.log('First entry sample:', data.leaderboard[0]);
      }
    } catch (err: unknown) {
      console.error('Error loading leaderboard:', err);

      // Provide more specific error messages based on the error
      if (err && typeof err === 'object' && 'response' in err) {
        const errorWithResponse = err as { response: { status: number } };
        console.error('Error response:', errorWithResponse.response);
        if (errorWithResponse.response.status === 404) {
          setError('Quiz leaderboard not found. The quiz may not exist.');
        } else if (errorWithResponse.response.status === 403) {
          setError('You do not have permission to view this leaderboard.');
        } else if (errorWithResponse.response.status === 401) {
          setError('Authentication required. Please log in again.');
        } else {
          setError(
            `Server error (${errorWithResponse.response.status}). Please try again later.`
          );
        }
      } else if (err && typeof err === 'object' && 'message' in err) {
        const errorWithMessage = err as { message: string };
        if (errorWithMessage.message === 'Network Error') {
          setError(
            'Network error. Please check your connection and try again.'
          );
        } else if (
          errorWithMessage.message === 'Invalid leaderboard data format'
        ) {
          setError(
            'The leaderboard data format is invalid. Please try again later.'
          );
        } else {
          setError('Failed to load leaderboard data. Please try again later.');
        }
      } else {
        setError('Failed to load leaderboard data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    if (isOpen) {
      loadLeaderboardData();
    }
  }, [isOpen, quizId, loadLeaderboardData]);

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Get medal icon based on rank
  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <TrophyIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />;
      case 2:
        return <MedalIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-700 dark:text-amber-400" />;
      default:
        return <span className="text-sm font-medium dark:text-gray-200">{rank}</span>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>
            See how you rank against other participants
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            // Loading state
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-red-500 dark:text-red-400"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
              </div>
              <p className="text-red-500 mb-4">{error}</p>
              <Button
                onClick={loadLeaderboardData}
                className="bg-primary hover:bg-primary/90"
              >
                Retry
              </Button>
            </div>
          ) : leaderboard.length === 0 ? (
            // Empty state
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <TrophyIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No leaderboard data available yet.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Be the first to complete this quiz!
              </p>
            </div>
          ) : (
            // Leaderboard data
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={`${entry.userId}-${index}`}
                  className={`flex items-center p-3 rounded-lg ${
                    index === 0
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      : index === 1
                        ? 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                        : index === 2
                          ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 mr-3">
                    {getMedalIcon(index + 1)}
                  </div>
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {generateUserInitials(entry.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm dark:text-gray-100">{entry.userName}</p>
                    {entry.completedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Completed {formatDate(entry.completedAt)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{entry.score} pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
