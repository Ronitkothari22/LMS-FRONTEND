'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Users,
  Crown,
  Calendar,
  MoreVertical,
  Eye,
  User,
} from 'lucide-react';
import { Team } from '@/types/teams';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TeamCardProps {
  team: Team;
  onViewDetails?: (team: Team) => void;
  onEdit?: (team: Team) => void;
  onDelete?: (team: Team) => void;
  showActions?: boolean;
  isUserTeam?: boolean;
  className?: string;
  index?: number;
}

export function TeamCard({
  team,
  onViewDetails,
  onEdit,
  onDelete,
  showActions = false,
  isUserTeam = false,
  className,
  index = 0,
}: TeamCardProps) {

  const getTeamColor = (color?: string | null, index?: number) => {
    // Clean, professional colors that work well in both light and dark modes
    const consistentColors = [
      'bg-[#14C8C8]', // Primary teal
      'bg-blue-500',
      'bg-emerald-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-green-500',
    ];

    // Always use index-based rotation for consistency
    return consistentColors[index ? index % consistentColors.length : 0];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const leaders = team.members.filter((member) => member.role === 'LEADER');
  const members = team.members.filter((member) => member.role === 'MEMBER');

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg group border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
        isUserTeam && 'ring-2 ring-[#14C8C8]/50 shadow-lg shadow-[#14C8C8]/10',
        className
      )}
    >
      {/* Team Color Strip */}
      <div className={cn('h-1 w-full', getTeamColor(team.color, index))} />

      {/* User Team Badge */}
      {isUserTeam && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
          <Badge className="bg-[#14C8C8] text-white border-0 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1">
            <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
            <span className="hidden sm:inline">My Team</span>
            <span className="sm:hidden">Mine</span>
          </Badge>
        </div>
      )}

      <CardHeader className="pb-2 pt-3 px-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-sm flex-shrink-0', getTeamColor(team.color, index))}>
              <span>{getInitials(team.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {team.name}
              </CardTitle>
              {team.description && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                  {team.description}
                </p>
              )}
            </div>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewDetails && (
                  <DropdownMenuItem onClick={() => onViewDetails(team)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(team)}>
                    <User className="mr-2 h-4 w-4" />
                    Edit Team
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(team)}
                    className="text-destructive"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Delete Team
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-1 px-3 sm:px-6">
        {/* Team Stats */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="flex items-center space-x-1.5 sm:space-x-2 p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="p-1 sm:p-1.5 rounded-md bg-[#14C8C8] text-white flex-shrink-0">
              <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Members</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                {team.memberCount}
                {team.maxMembers && `/${team.maxMembers}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2 p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="p-1 sm:p-1.5 rounded-md bg-blue-500 text-white flex-shrink-0">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400">Created</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                {new Date(team.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Team Members Preview */}
        {team.members.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            {/* Leaders */}
            {leaders.length > 0 && (
              <div>
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {leaders.length === 1 ? 'Leader' : 'Leaders'}
                  </span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  {leaders.slice(0, 3).map((leader) => (
                    <TooltipProvider key={leader.id}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Avatar className="h-6 w-6 sm:h-7 sm:w-7 border-2 border-yellow-400/50">
                            <AvatarImage src={leader.user.profilePhoto || undefined} />
                            <AvatarFallback className="text-xs bg-yellow-100 text-yellow-700">
                              {getInitials(leader.user.name)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{leader.user.name}</p>
                          <p className="text-xs text-muted-foreground">Team Leader</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {leaders.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{leaders.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Members */}
            {members.length > 0 && (
              <div>
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Members</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  {members.slice(0, 4).map((member) => (
                    <TooltipProvider key={member.id}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                            <AvatarImage src={member.user.profilePhoto || undefined} />
                            <AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {getInitials(member.user.name)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{member.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.user.companyPosition || 'Team Member'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {members.length > 4 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{members.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        {onViewDetails && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-3 sm:mt-4 border-[#14C8C8] text-[#14C8C8] hover:bg-[#14C8C8] hover:text-white transition-colors duration-200 text-xs sm:text-sm py-2"
            onClick={() => onViewDetails(team)}
          >
            <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 