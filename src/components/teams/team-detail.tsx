'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Calendar,
  Shield,
  Crown,
  Award,
  Star,
  Trophy,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamLeaderboard, Team } from '@/types/teams';

interface TeamDetailProps {
  team: TeamLeaderboard | Team;
  userTeamMetrics?: {
    totalQuizScore: number;
    averageQuizScore: number;
    quizzesCompleted: number;
    rank?: number;
  };
  className?: string;
}

export function TeamDetail({ team, userTeamMetrics, className }: TeamDetailProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTeamColor = () => {
    if (team.color) {
      return team.color;
    }
    // Default color based on team name hash
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500',
    ];
    const hash = team.name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const formatJoinDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  // Separate team leaders and members
  const leaders = team.members?.filter(member => member.role === 'LEADER') || [];
  const members = team.members?.filter(member => member.role === 'MEMBER') || [];

  return (
    <div className={cn('space-y-4 sm:space-y-6 px-3 sm:px-0', className)}>
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className={cn('relative h-auto sm:h-32 py-4 sm:py-0 sm:flex sm:items-center sm:justify-center', getTeamColor())}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20" />
          <div className="relative z-10 w-full px-3 sm:px-8">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-white">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="p-2 sm:p-4 bg-black/30 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border border-white/30 flex-shrink-0">
                    <div className="w-8 h-8 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl sm:rounded-2xl bg-black/20">
                      <span className="text-sm sm:text-3xl font-bold text-white drop-shadow-lg">{getInitials(team.name)}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate">{team.name}</h1>
                    {team.description && (
                      <p className="text-sm sm:text-lg text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate">{team.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {userTeamMetrics?.rank && (
                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="inline-flex items-center space-x-2 sm:space-x-4 bg-black/30 backdrop-blur-md text-white px-3 sm:px-8 py-2 sm:py-6 rounded-xl sm:rounded-2xl shadow-2xl border border-white/30">
                    <div className="p-1.5 sm:p-3 bg-amber-400/40 rounded-lg sm:rounded-xl flex-shrink-0">
                      <Award className="h-4 w-4 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white/90 uppercase tracking-wide drop-shadow-md">Team Rank</p>
                      <p className="text-xl sm:text-4xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">#{userTeamMetrics.rank}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-3 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex-1 sm:flex-none">
              <div className="p-1.5 sm:p-2 bg-blue-500 rounded-md sm:rounded-lg">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Members</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                  {team.maxMembers && ` of ${team.maxMembers}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex-1 sm:flex-none">
              <div className="p-1.5 sm:p-2 bg-emerald-500 rounded-md sm:rounded-lg">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Created</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatJoinDate(team.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Quiz Metrics */}
      {userTeamMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                  <Trophy className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Total Score</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{userTeamMetrics.totalQuizScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <Star className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Avg Score</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{Math.round(userTeamMetrics.averageQuizScore)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md">
                  <GraduationCap className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Quizzes</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{userTeamMetrics.quizzesCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Members Section */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
      {/* Team Leaders */}
      {leaders.length > 0 && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center text-sm sm:text-base">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-yellow-500" />
                Team Leaders
            </CardTitle>
          </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-0">
              {leaders.map((leader) => (
                <div
                  key={leader.id}
                  className="flex items-center space-x-2 sm:space-x-4 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border border-yellow-200 dark:border-yellow-800/50"
                >
                  <Avatar className="h-8 w-8 sm:h-12 sm:w-12 border-2 border-yellow-400 flex-shrink-0">
                    <AvatarImage src={leader.user.profilePhoto || undefined} />
                    <AvatarFallback className="bg-yellow-500 text-white font-bold text-xs sm:text-sm">
                      {getInitials(leader.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {leader.user.name}
                      </p>
                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 flex-shrink-0">
                        Leader
                      </Badge>
                    </div>
                    {'quizContribution' in leader && leader.quizContribution && (
                      <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0" />
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{leader.quizContribution.totalQuizScore} total quiz score</p>
                      </div>
                    )}
                  </div>
                    <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formatJoinDate(leader.joinedAt)}
                    </p>
                    </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
        {members.length > 0 && (
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center text-sm sm:text-base">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
                Team Members
          </CardTitle>
        </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-0">
            {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center space-x-2 sm:space-x-4 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/50"
                >
                  <Avatar className="h-8 w-8 sm:h-12 sm:w-12 border-2 border-blue-400 flex-shrink-0">
                    <AvatarImage src={member.user.profilePhoto || undefined} />
                     <AvatarFallback className="bg-blue-500 text-white font-bold text-xs sm:text-sm">
                    {getInitials(member.user.name)}
                  </AvatarFallback>
                </Avatar>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center space-x-2">
                       <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                         {member.user.name}
                       </p>
                       <Badge variant="outline" className="text-xs flex-shrink-0">
                         Member
                       </Badge>
                    </div>
                     {'quizContribution' in member && member.quizContribution && (
                       <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                         <Star className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                         <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{member.quizContribution.totalQuizScore} total quiz score</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formatJoinDate(member.joinedAt)}
                    </p>
                  </div>
              </div>
            ))}
        </CardContent>
      </Card>
        )}
      </div>
    </div>
  );
} 