'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Trophy,
  AlertCircle,
  Loader,
  Crown,
} from 'lucide-react';
// Import our team components
import { TeamCard } from '@/components/teams/team-card';
import { TeamDetail } from '@/components/teams/team-detail';
import { TeamLeaderboard } from '@/components/teams/team-leaderboard';

// Import API functions
import {
  getTeams,
  getTeamLeaderboard,
} from '@/lib/api/teams';
import { useUser } from '@/hooks/auth';
import { TeamsResponse, TeamLeaderboardResponse, Team } from '@/types/teams';

interface TeamsPageClientProps {
  sessionId: string;
}

export function TeamsPageClient({ sessionId }: TeamsPageClientProps) {
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user to determine role
  const { data: currentUser } = useUser();

  // Fetch teams data
  const {
    data: teamsData,
    isLoading: teamsLoading,
    error: teamsError,
  } = useQuery<TeamsResponse>({
    queryKey: ['teams', sessionId],
    queryFn: () => getTeams(sessionId, false), // Only active teams for regular users
    enabled: !!sessionId,
  });

  // Fetch leaderboard data
  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
  } = useQuery<TeamLeaderboardResponse>({
    queryKey: ['teamLeaderboard', sessionId],
    queryFn: () => getTeamLeaderboard(sessionId),
    enabled: !!sessionId,
  });

  // Find user's team
  useEffect(() => {
    if (currentUser && teamsData) {
      // Find user's team
      const userTeamFound = teamsData.teams.find((team) =>
        team.members.some((member) => member.user.id === currentUser.id)
      );
      
      setUserTeam(userTeamFound || null);
      setLoading(false);
    }
  }, [currentUser, teamsData]);

  // Show loading state
  if (loading || teamsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (teamsError) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Teams</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load team information. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For this implementation, we only show user view (no admin functionality)
  // Admin functionality would be implemented separately

  // User view - restricted to their team and leaderboard
  const userTeamFromLeaderboard = leaderboardData?.leaderboard.find(
    (team) => team.id === userTeam?.id
  );

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-900 via-gray-900 to-black p-4 sm:p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:20px_20px]" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-5xl font-bold mb-2 sm:mb-3 text-white drop-shadow-lg">
                Teams
              </h1>
              <p className="text-gray-200 text-sm sm:text-xl font-medium mb-4 sm:mb-6">
                {teamsData?.session.title}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2 sm:space-x-3 bg-white/15 rounded-lg sm:rounded-xl px-3 sm:px-5 py-2 sm:py-3 backdrop-blur-sm border border-white/10">
                  <div className="p-1 sm:p-1.5 bg-blue-500 rounded-md sm:rounded-lg">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Teams</p>
                    <p className="text-sm font-bold text-white">{teamsData?.totalTeams || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 bg-white/15 rounded-lg sm:rounded-xl px-3 sm:px-5 py-2 sm:py-3 backdrop-blur-sm border border-white/10">
                  <div className="p-1 sm:p-1.5 bg-emerald-500 rounded-md sm:rounded-lg">
                    <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">Active</p>
                    <p className="text-sm font-bold text-white">{teamsData?.activeTeams || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {userTeam && (
              <div className="sm:text-right">
                <div className="inline-flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white border-0 shadow-2xl px-3 sm:px-6 py-2 sm:py-4 rounded-lg sm:rounded-xl">
                  <div className="p-1 sm:p-2 bg-white/20 rounded-md sm:rounded-lg">
                    <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold opacity-90 uppercase tracking-wide">My Team</p>
                    <p className="text-sm sm:text-lg font-bold">{userTeam.name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="teams" className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          <TabsList className="grid w-full grid-cols-3 bg-transparent gap-1">
            <TabsTrigger
              value="teams"
              className="data-[state=active]:bg-[#14C8C8] data-[state=active]:text-white font-medium transition-all duration-200 text-xs sm:text-sm px-2 py-2"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">All Teams</span>
              <span className="sm:hidden">Teams</span>
            </TabsTrigger>
            <TabsTrigger
              value="my-team"
              disabled={!userTeam}
              className="data-[state=active]:bg-[#14C8C8] data-[state=active]:text-white font-medium transition-all duration-200 disabled:opacity-50 text-xs sm:text-sm px-2 py-2"
            >
              <Crown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">My Team</span>
              <span className="sm:hidden">Mine</span>
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="data-[state=active]:bg-[#14C8C8] data-[state=active]:text-white font-medium transition-all duration-200 text-xs sm:text-sm px-2 py-2"
            >
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Leaderboard</span>
              <span className="sm:hidden">Board</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* All Teams Tab */}
        <TabsContent value="teams" className="mt-4">
          {teamsData && teamsData.teams.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {teamsData.teams.map((team, index) => (
                  <div
                    key={team.id}
                    className="animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                  >
                    <TeamCard
                      team={team}
                      index={index}
                      isUserTeam={userTeam?.id === team.id}
                      onViewDetails={(team) => setSelectedTeam(team)}
                    />
                  </div>
                ))}
              </div>
              
              {/* Team Detail Modal/Side Panel */}
              {selectedTeam && (
                <div className="mt-4 sm:mt-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-semibold">Team Details</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTeam(null)}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      Close
                    </Button>
                  </div>
                  <TeamDetail
                    team={leaderboardData?.leaderboard.find(t => t.id === selectedTeam.id) || selectedTeam}
                    userTeamMetrics={selectedTeam.id === userTeam?.id && userTeamFromLeaderboard?.quizMetrics ? {
                      totalQuizScore: userTeamFromLeaderboard.quizMetrics.totalQuizScore,
                      averageQuizScore: userTeamFromLeaderboard.quizMetrics.averageQuizScore,
                      quizzesCompleted: userTeamFromLeaderboard.quizMetrics.totalQuizzesCompleted,
                      rank: userTeamFromLeaderboard.rank,
                    } : undefined}
                  />
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 sm:p-12">
                <div className="text-center">
                  <Users className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No Teams</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    No teams have been created for this session yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Team Tab */}
        <TabsContent value="my-team" className="mt-4">
          {userTeam ? (
            <TeamDetail
              team={userTeamFromLeaderboard || userTeam}
              userTeamMetrics={userTeamFromLeaderboard?.quizMetrics ? {
                totalQuizScore: userTeamFromLeaderboard.quizMetrics.totalQuizScore,
                averageQuizScore: userTeamFromLeaderboard.quizMetrics.averageQuizScore,
                quizzesCompleted: userTeamFromLeaderboard.quizMetrics.totalQuizzesCompleted,
                rank: userTeamFromLeaderboard.rank,
              } : undefined}
            />
          ) : (
            <Card>
              <CardContent className="p-6 sm:p-12">
                <div className="text-center">
                  <Users className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Not Assigned to a Team</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    You haven&apos;t been assigned to a team yet. Please contact your session administrator.
                  </p>
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    No Team Assignment
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="mt-4">
          {leaderboardLoading ? (
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="animate-pulse space-y-3 sm:space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 sm:space-x-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="h-3 sm:h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-2 sm:h-3 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="h-6 w-12 sm:h-8 sm:w-16 bg-muted rounded flex-shrink-0"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : leaderboardData ? (
            <TeamLeaderboard
              data={leaderboardData}
              userTeamId={userTeam?.id}
            />
          ) : (
            <Card>
              <CardContent className="p-6 sm:p-12">
                <div className="text-center">
                  <Trophy className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No Leaderboard Data</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Team rankings will appear here once teams start participating in activities.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 