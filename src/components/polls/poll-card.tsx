'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Poll } from '@/lib/api/polls';
import { CalendarIcon, ClockIcon } from '@radix-ui/react-icons';
import { formatDistanceToNow } from 'date-fns';
import { BarChart3Icon, Users } from 'lucide-react';

interface PollCardProps {
  poll: Poll;
  sessionId: string;
}

export function PollCard({ poll, sessionId }: PollCardProps) {
  const router = useRouter();

  // Format the creation date
  const formattedDate = poll.createdAt
    ? formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })
    : 'Unknown date';

  // Handle joining the poll - now requires code entry
  const handleJoinPoll = () => {
    // Instead of directly navigating, we'll show a modal to enter the joining code
    router.push(
      `/dashboard/sessions/${sessionId}/polls/join?pollId=${poll.id}`
    );
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 shadow-lg border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-[#14C8C8]/10"
    >
      
      {/* Top accent line */}
      <div
        className={`h-2 ${
          poll.isLive 
            ? 'bg-gradient-to-r from-green-400 to-green-600' 
            : 'bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6]'
        }`}
      />
      
      <CardHeader className="pb-3 relative">
        <div className="flex justify-between items-start">
          <CardTitle className="text-[#14C8C8] dark:text-[#14C8C8] text-lg font-bold">
            {poll.title}
          </CardTitle>
          <Badge
            className={
              poll.isLive
                ? 'bg-gradient-to-r from-green-500/90 to-green-600/90 text-white border-green-300/50 shadow-md'
                : 'bg-gradient-to-r from-gray-400/90 to-gray-500/90 text-white border-gray-300/50 shadow-md'
            }
          >
            {poll.isLive ? (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Live
              </div>
            ) : (
              'Inactive'
            )}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-400">
          <CalendarIcon className="h-4 w-4 text-[#14C8C8]" />
          <span className="text-sm">{formattedDate}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-6 relative">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800/50 transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="font-medium text-blue-800 dark:text-blue-300">Type</p>
            </div>
            <p className="text-blue-700 dark:text-blue-200 font-bold">
              {poll.type.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800/50 transition-all duration-300 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <p className="font-medium text-purple-800 dark:text-purple-300">
                {poll.participants !== undefined ? 'Participants' : 'Questions'}
              </p>
            </div>
            <p className="text-purple-700 dark:text-purple-200 font-bold">
              {poll.participants !== undefined
                ? poll.participants
                : poll.questions?.length || 1}
            </p>
          </div>
        </div>

        {poll.timeLimit && (
          <div className="mt-4 flex items-center gap-2 text-sm bg-gradient-to-r from-orange-50/50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/20 p-3 rounded-lg border border-orange-200/50 dark:border-orange-800/30">
            <ClockIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-orange-700 dark:text-orange-200 font-medium">
              Time limit: {poll.timeLimit} seconds
            </span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 pb-6 relative">
        <Button
          className="w-full bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] hover:from-[#0FB6B6] hover:to-[#14C8C8] text-white shadow-md transition-all duration-300 hover:shadow-lg border-0 font-semibold"
          onClick={handleJoinPoll}
        >
          {poll.isLive ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              Join Live Poll
            </div>
          ) : (
            'View Poll'
          )}
        </Button>
      </CardFooter>
      

    </Card>
  );
}