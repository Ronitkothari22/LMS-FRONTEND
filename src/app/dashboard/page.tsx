'use client';

import React, { useState, useEffect } from 'react';
import {
  ReloadIcon,
} from '@radix-ui/react-icons';
import { 
  CheckCircle,
  Activity,
  Calendar,
  Target,
  Zap,
  Trophy,
  BookOpen,
  Users,
  AlertCircle,
  Medal,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// API hooks
import { useDashboard } from '@/hooks/dashboard';
import { useSessions } from '@/hooks/sessions';
import { useUser } from '@/hooks/auth';
import { getUserNameFromToken, generateUserInitials } from '@/lib/utils/token';

// UI Components
import { DonutChart } from '@/components/ui/chart';

export default function DashboardPage() {
  const { data: dashboardData, loading, error, refetch } = useDashboard();
  const { data: sessionsData } = useSessions();
  const { data: user } = useUser();
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh every 30 seconds for real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && !dashboardData) {
    return <DashboardError onRetry={handleRefresh} error={error} />;
  }

  // Use real dashboard data or fallback to sessions data
  const userName = dashboardData?.userName || getUserNameFromToken() || user?.name || 'User';
  const userXp = dashboardData?.userXp || 0;
  const dailyStreak = dashboardData?.dailyStreak || 0;
  const courseProgress = dashboardData?.courseProgress || 0;
  const highestQuizScore = dashboardData?.highestQuizScore || 0;
  const quizScores = dashboardData?.quizScores || [];
  const upcomingSessions = dashboardData?.upcomingSessions || [];
  const topPerformers = dashboardData?.topPerformers || [];
  
  // Fallback session data
  const completedSessions = Array.isArray(sessionsData) ? sessionsData.filter(s => s.status === 'completed').length : 0;
  
  // Recent activity from real sessions data
  const recentActivity = Array.isArray(sessionsData) ? sessionsData.slice(0, 4).map(session => ({
    id: session.id,
    type: 'session' as const,
    title: session.title || 'Session',
    timestamp: session.createdAt || new Date().toISOString(),
    status: session.status || 'completed' as const,
  })) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            {getTimeGreeting()}, {userName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here&apos;s your learning progress overview
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Data
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <ReloadIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full p-2 pr-4 shadow-sm border">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {generateUserInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">{userName}</p>
              {userXp > 0 && (
                <p className="text-gray-500 text-xs">{userXp} XP</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Course Progress"
          value={courseProgress}
          unit="%"
          icon={<Target className="h-5 w-5" />}
          color="blue"
        />
        <MetricCard
          title="Highest Quiz Score"
          value={highestQuizScore}
          icon={<Trophy className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          title="Learning Streak"
          value={dailyStreak}
          unit="days"
          icon={<Zap className="h-5 w-5" />}
          color="orange"
        />
        <MetricCard
          title="Quizzes Completed"
          value={quizScores.length}
          icon={<CheckCircle className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Progress Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Learning Overview
            </CardTitle>
            <CardDescription>
              Your learning progress and statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courseProgress > 0 || quizScores.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {courseProgress}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Course Progress</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {quizScores.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Quizzes</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {completedSessions}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {dailyStreak}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No learning data available yet.</p>
                <p className="text-sm">Start participating in sessions and quizzes to see your progress!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>
              Your learning completion status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {courseProgress > 0 ? (
              <>
                <div className="text-center">
                  <DonutChart
                    value={courseProgress}
                    size={120}
                    thickness={8}
                    showLabel={true}
                    className="mx-auto mb-4"
                  />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {courseProgress}% course completion
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Quiz Performance</span>
                      <span>{highestQuizScore}</span>
                    </div>
                    <Progress value={highestQuizScore} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Learning Streak</span>
                      <span>{dailyStreak} days</span>
                    </div>
                    <Progress value={Math.min(dailyStreak * 10, 100)} className="h-2" />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No progress data yet.</p>
                <p className="text-sm">Complete your first quiz to see progress!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Recent Quiz Scores
            </CardTitle>
            <CardDescription>
              Your latest quiz performances
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quizScores.length > 0 ? (
              <div className="space-y-3">
                {quizScores.slice(0, 5).map((quiz, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{quiz.quiz}</p>
                        <p className="text-sm text-gray-500">Quiz</p>
                      </div>
                    </div>
                                         <Badge variant={quiz.score >= 70 ? 'default' : 'destructive'}>
                       {quiz.score}
                     </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No quiz scores yet.</p>
                <p className="text-sm">Take your first quiz to see scores here!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions or Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {upcomingSessions.length > 0 ? (
                <>
                  <Calendar className="h-5 w-5" />
                  Upcoming Sessions
                </>
              ) : (
                <>
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </>
              )}
            </CardTitle>
            <CardDescription>
              {upcomingSessions.length > 0 
                ? 'Sessions you can join' 
                : 'Your latest learning activities'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 4).map((session, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-blue-900 dark:text-blue-100">{session.title}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-300">{session.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                    <Badge variant={activity.status === 'completed' ? 'default' : 'outline'}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming sessions.</p>
                <p className="text-sm">New sessions will appear here when available!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Leading learners in your network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topPerformers.slice(0, 6).map((performer, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold text-sm">
                    #{performer.rank}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100">{performer.name}</p>
                                         <p className="text-sm text-amber-600 dark:text-amber-300">{performer.score} avg score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  total?: number;
  unit?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function MetricCard({ title, value, total, unit, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };

  return (
    <Card className={`border ${colorClasses[color].split(' ').slice(-2).join(' ')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${colorClasses[color].split(' ').slice(0, -2).join(' ')}`}>
            {icon}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="text-2xl font-bold">
            {value}{unit && unit}
            {total && <span className="text-gray-500 dark:text-gray-400 text-lg">/{total}</span>}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {title}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-6 w-64 mt-2" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-12 w-32 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-32 rounded-full mx-auto mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardError({ onRetry, error }: { onRetry: () => void; error: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle>Dashboard Error</CardTitle>
          <CardDescription>
            We encountered an error loading your dashboard data.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <Button onClick={onRetry} className="w-full">
            <ReloadIcon className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
