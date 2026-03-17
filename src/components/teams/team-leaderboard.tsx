/**
 * Enhanced Team Leaderboard Component
 * 
 * Features implemented based on new API structure:
 * - Displays total score (quiz score + manual point awards + individual points)
 * - Shows point awards and bonus points
 * - Enhanced team metrics with participation rates
 * - Team member contributions and top contributors
 * - Individual member points and awards tracking
 * - Session state display
 * - Improved responsive design with better mobile support
 * - Color-coded team avatars with hex color support
 * - Expandable team details with comprehensive stats
 */
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Target,
  Trophy,
  Medal,
  Award,
  TrendingUp,
  ChevronDown,
  Crown,
  Zap,
  Gift,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TeamLeaderboardResponse } from '@/types/teams';

interface TeamLeaderboardProps {
  data: TeamLeaderboardResponse;
  onSortChange?: (sortBy: string, order: 'asc' | 'desc') => void;
  userTeamId?: string;
  className?: string;
}

export function TeamLeaderboard({
  data,
  onSortChange,
  userTeamId,
  className,
}: TeamLeaderboardProps) {
  const [sortBy, setSortBy] = useState('totalScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const sortOptions = [
    { value: 'totalScore', label: 'Total Score' },
    { value: 'totalQuizScore', label: 'Quiz Score' },
    { value: 'averageQuizScore', label: 'Average Quiz Score' },
    { value: 'totalQuizzesCompleted', label: 'Quizzes Completed' },
    { value: 'participationRate', label: 'Participation Rate' },
    { value: 'manualPointsAwarded', label: 'Bonus Points' },
    { value: 'individualPoints', label: 'Individual Points' },
  ];

  const handleSortChange = (newSortBy: string) => {
    const newOrder = sortBy === newSortBy && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(newSortBy);
    setSortOrder(newOrder);
    onSortChange?.(newSortBy, newOrder);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-3 w-3 sm:h-5 sm:w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-3 w-3 sm:h-5 sm:w-5 text-gray-400" />;
      case 3:
        return <Award className="h-3 w-3 sm:h-5 sm:w-5 text-amber-600" />;
      default:
        return <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{rank}</div>;
    }
  };

  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Sort teams by total score in descending order (client-side fallback)
  const sortedTeams = [...data.leaderboard].sort((a, b) => {
    if (sortBy === 'totalScore') {
      return sortOrder === 'desc' ? b.totalScore - a.totalScore : a.totalScore - b.totalScore;
    } else if (sortBy === 'totalQuizScore') {
      return sortOrder === 'desc' ? b.quizMetrics.totalQuizScore - a.quizMetrics.totalQuizScore : a.quizMetrics.totalQuizScore - b.quizMetrics.totalQuizScore;
    } else if (sortBy === 'averageQuizScore') {
      return sortOrder === 'desc' ? b.quizMetrics.averageQuizScore - a.quizMetrics.averageQuizScore : a.quizMetrics.averageQuizScore - b.quizMetrics.averageQuizScore;
    } else if (sortBy === 'totalQuizzesCompleted') {
      return sortOrder === 'desc' ? b.quizMetrics.totalQuizzesCompleted - a.quizMetrics.totalQuizzesCompleted : a.quizMetrics.totalQuizzesCompleted - b.quizMetrics.totalQuizzesCompleted;
    } else if (sortBy === 'participationRate') {
      return sortOrder === 'desc' ? b.quizMetrics.participationRate - a.quizMetrics.participationRate : a.quizMetrics.participationRate - b.quizMetrics.participationRate;
    } else if (sortBy === 'manualPointsAwarded') {
      return sortOrder === 'desc' ? b.pointAwards.manualPointsAwarded - a.pointAwards.manualPointsAwarded : a.pointAwards.manualPointsAwarded - b.pointAwards.manualPointsAwarded;
    } else if (sortBy === 'individualPoints') {
      return sortOrder === 'desc' ? b.individualPointAwards.totalIndividualPoints - a.individualPointAwards.totalIndividualPoints : a.individualPointAwards.totalIndividualPoints - b.individualPointAwards.totalIndividualPoints;
    }
    // Default to totalScore
    return sortOrder === 'desc' ? b.totalScore - a.totalScore : a.totalScore - b.totalScore;
  }).map((team, index) => ({
    ...team,
    rank: index + 1 // Recalculate rank based on sorted order
  }));

  return (
    <div className={cn('space-y-4 sm:space-y-6 px-3 sm:px-0', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold truncate">Team Leaderboard</h2>
          <p className="text-muted-foreground text-sm sm:text-base truncate">
            {data.session.title} • {data.summary.totalTeams} teams competing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Session: {data.session.state}
          </Badge>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px] sm:w-[180px] text-xs sm:text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">Teams</p>
                <p className="text-lg sm:text-2xl font-bold">{data.summary.totalTeams}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">Participants</p>
                <p className="text-lg sm:text-2xl font-bold">{data.summary.totalParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">Quizzes</p>
                <p className="text-lg sm:text-2xl font-bold">{data.summary.totalQuizzes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">Quiz Points</p>
                <p className="text-lg sm:text-2xl font-bold">{data.summary.totalQuizPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-pink-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">Bonus Points</p>
                <p className="text-lg sm:text-2xl font-bold">{data.summary.totalManualPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">Top Score</p>
                <p className="text-lg sm:text-2xl font-bold">{data.summary.highestTeamScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <div className="space-y-2 sm:space-y-3">
        {sortedTeams.map((team) => {
          const isUserTeam = team.id === userTeamId;
          const isExpanded = expandedTeams.has(team.id);

          return (
            <Card
              key={team.id}
              className={cn(
                'transition-all duration-200 hover:shadow-md',
                isUserTeam && 'ring-2 ring-primary/50 shadow-lg',
                team.rank <= 3 && 'shadow-md'
              )}
            >
              <Collapsible>
                <CollapsibleTrigger
                  className="w-full"
                  onClick={() => toggleTeamExpansion(team.id)}
                >
                  <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-6 h-6 sm:w-10 sm:h-10 flex-shrink-0">
                          {getRankIcon(team.rank)}
                        </div>

                        {/* Team Info */}
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div 
                            className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-base flex-shrink-0"
                            style={{ 
                              background: team.color 
                                ? team.color.startsWith('#') 
                                  ? `linear-gradient(135deg, ${team.color}, ${team.color}80)` 
                                  : `linear-gradient(135deg, ${team.color}, ${team.color})`
                                : 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                            }}
                          >
                            {getInitials(team.name)}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <h3 className="font-semibold text-sm sm:text-lg truncate">{team.name}</h3>
                              {isUserTeam && (
                                <Badge className="bg-primary/10 text-primary text-xs flex-shrink-0">My Team</Badge>
                              )}
                              {team.pointAwards.totalAwardsCount > 0 && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs flex-shrink-0">
                                  <Gift className="h-3 w-3 mr-1" />
                                  {team.pointAwards.totalAwardsCount}
                                </Badge>
                              )}
                              {team.individualPointAwards.totalIndividualAwards > 0 && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs flex-shrink-0">
                                  <Star className="h-3 w-3 mr-1" />
                                  {team.individualPointAwards.totalIndividualAwards}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'} • {team.quizMetrics.participationRate}% participation
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-1 sm:space-x-6 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-xs sm:text-sm text-muted-foreground">Total Score</p>
                          <p className="text-sm sm:text-lg font-bold text-primary">{team.totalScore}</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <p className="text-sm text-muted-foreground">Quiz Score</p>
                          <p className="text-lg font-bold">{team.quizMetrics.totalQuizScore}</p>
                        </div>
                        {team.pointAwards.manualPointsAwarded > 0 && (
                        <div className="text-center hidden lg:block">
                            <p className="text-sm text-muted-foreground">Bonus</p>
                            <p className="font-semibold text-yellow-600">+{team.pointAwards.manualPointsAwarded}</p>
                        </div>
                        )}
                        {team.individualPointAwards.totalIndividualPoints > 0 && (
                        <div className="text-center hidden xl:block">
                            <p className="text-sm text-muted-foreground">Individual</p>
                            <p className="font-semibold text-green-600">+{team.individualPointAwards.totalIndividualPoints}</p>
                        </div>
                        )}

                        <ChevronDown className={cn('h-3 w-3 sm:h-4 sm:w-4 transition-transform flex-shrink-0', isExpanded && 'rotate-180')} />
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="px-2 sm:px-4 pb-2 sm:pb-4 pt-0">
                    <div className="border-t pt-2 sm:pt-4 space-y-3 sm:space-y-4">
                      
                      {/* Team Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Quiz Score</p>
                          <p className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300">{team.quizMetrics.totalQuizScore}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/30 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Avg Score</p>
                          <p className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-300">{Math.round(team.quizMetrics.averageQuizScore)}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950/30 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Completed</p>
                          <p className="text-lg sm:text-xl font-bold text-purple-700 dark:text-purple-300">{team.quizMetrics.totalQuizzesCompleted}</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Bonus Points</p>
                          <p className="text-lg sm:text-xl font-bold text-yellow-700 dark:text-yellow-300">{team.pointAwards.manualPointsAwarded}</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950/30 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Individual Points</p>
                          <p className="text-lg sm:text-xl font-bold text-orange-700 dark:text-orange-300">{team.individualPointAwards.totalIndividualPoints}</p>
                        </div>
                      </div>

                      {/* Team Composition */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            <p className="font-medium text-gray-700 dark:text-gray-300">Team Stats</p>
                          </div>
                          <div className="space-y-1 text-xs">
                            <p className="text-gray-600 dark:text-gray-400">Members: {team.memberCount}/{team.maxMembers}</p>
                            <p className="text-gray-600 dark:text-gray-400">Participation: {team.quizMetrics.participationRate}%</p>
                            <p className="text-gray-600 dark:text-gray-400">Awards: {team.pointAwards.totalAwardsCount + team.individualPointAwards.totalIndividualAwards}</p>
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="font-medium text-green-700 dark:text-green-300">Top Quiz Contributor</p>
                          </div>
                          <div className="space-y-1 text-xs">
                            <p className="font-medium text-green-700 dark:text-green-300">{team.quizMetrics.topContributor || 'None'}</p>
                            <p className="text-green-600 dark:text-green-400">Score: {team.quizMetrics.topContribution}</p>
                          </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <p className="font-medium text-blue-700 dark:text-blue-300">Top Individual Contributor</p>
                          </div>
                          <div className="space-y-1 text-xs">
                            <p className="font-medium text-blue-700 dark:text-blue-300">{team.individualPointAwards.topIndividualContributor?.userName || 'None'}</p>
                            <p className="text-blue-600 dark:text-blue-400">Points: {team.individualPointAwards.topIndividualContributor?.totalIndividualPoints ?? 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Team Members */}
                      <div>
                      <h4 className="font-semibold mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Team Members ({team.members.length})
                        </h4>
                        <div className="grid grid-cols-1 gap-2 sm:gap-3">
                          {team.members.map((member) => (
                          <div key={member.id} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg bg-muted/50">
                              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                                <AvatarImage src={member.user.profilePhoto || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(member.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  <p className="font-medium text-xs sm:text-sm truncate">{member.user.name}</p>
                                  {member.role === 'LEADER' && (
                                    <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                  )}
                                  {member.user.name === team.quizMetrics.topContributor && (
                                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">★ Quiz Top</Badge>
                                  )}
                                  {member.user.name === team.individualPointAwards.topIndividualContributor?.userName && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">★ Individual Top</Badge>
                                  )}
                              </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-1">
                                  <div>
                                    <span className="font-medium">Quiz:</span> {member.quizContribution.totalQuizScore} pts
                                  </div>
                                  <div>
                                    <span className="font-medium">Individual:</span> {member.individualPoints.totalPoints} pts
                                  </div>
                                  <div>
                                    <span className="font-medium">Quizzes:</span> {member.quizContribution.quizzesCompleted}
                                  </div>
                                  <div>
                                    <span className="font-medium">Awards:</span> {member.individualPoints.totalAwards}
                                  </div>
                                </div>
                            </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
      
      {data.leaderboard.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground">Teams will appear here once they join the session.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 