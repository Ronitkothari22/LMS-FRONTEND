'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { useJoinPoll } from '@/hooks/polls';
import { toast } from 'sonner';
import { socketIOService as PollSocketAPI } from '@/lib/socket-io';
import { getCookie } from 'cookies-next';

export default function JoinPollPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params?.id as string;
  const pollId = searchParams.get('pollId');

  const [joiningCode, setJoiningCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Use the join poll mutation
  const joinPollMutation = useJoinPoll();

  // Handle joining the poll
  const handleJoinPoll = async () => {
    if (!joiningCode.trim()) {
      toast.error('Please enter a joining code');
      return;
    }

    setIsJoining(true);

    try {
      // Call the join poll API
      const response = await joinPollMutation.mutateAsync(joiningCode.trim());

      // Check if we have a poll in the response OR if it's an "already joined" success
      if (
        (response.poll && response.poll.id) ||
        (response.success && response.alreadyJoined)
      ) {
        if (response.alreadyJoined) {
          toast.success('You have already joined this poll. Welcome back!');
        } else {
          toast.success('Successfully joined poll');
        }

        // Initialize WebSocket connection for real-time updates
        const accessToken = getCookie('accessToken');
        if (accessToken && response.poll?.id) {
          try {
            PollSocketAPI.initialize(accessToken.toString());
            // Join the poll room via WebSocket
            PollSocketAPI.joinPoll(response.poll.id);
          } catch (wsError) {
            console.warn(
              'WebSocket connection failed, continuing without real-time updates:',
              wsError
            );
          }
        }

        // Navigate to the poll page
        if (pollId) {
          // If we have a specific poll ID, navigate to that poll
          router.push(`/dashboard/sessions/${sessionId}/polls/${pollId}`);
        } else if (response.poll?.id) {
          // Otherwise, navigate to the poll from the response
          router.push(
            `/dashboard/sessions/${sessionId}/polls/${response.poll.id}`
          );
        } else {
          // Fallback to session page
          router.push(`/dashboard/sessions/${sessionId}`);
        }
      } else {
        toast.error(response.message || 'Failed to join poll');
        setIsJoining(false);
      }
    } catch (error) {
      console.error('Error joining poll:', error);

      // Check if this is an "already joined" error
      const errorMessage =
        error?.response?.data?.message || error?.message || '';
      if (
        errorMessage.toLowerCase().includes('already joined') ||
        errorMessage.toLowerCase().includes('already a participant') ||
        errorMessage.toLowerCase().includes('user already exists')
      ) {
        console.log('✅ User already joined this poll - treating as success');
        toast.success('You have already joined this poll. Welcome back!');

        // Navigate to the poll page if we have pollId, otherwise to session
        if (pollId) {
          router.push(`/dashboard/sessions/${sessionId}/polls/${pollId}`);
        } else {
          router.push(`/dashboard/sessions/${sessionId}`);
        }
      } else {
        // Show error message
        if (error?.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error(
            'Failed to join poll. Please check the code and try again.'
          );
        }
      }

      setIsJoining(false);
    }
  };

  // Handle key press (Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinPoll();
    }
  };

  // Handle going back to session
  const handleBackToSession = () => {
    router.push(`/dashboard/sessions/${sessionId}`);
  };

  return (
    <div className="container mx-auto py-12 max-w-md">
      <Button
        variant="outline"
        className="mb-6 flex items-center gap-2 border-[#14C8C8] text-[#14C8C8] hover:bg-[#14C8C8]/10"
        onClick={handleBackToSession}
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Session
      </Button>

      <Card className="mx-auto shadow-md border border-gray-200">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-[#14C8C8]">
            Join Poll
          </CardTitle>
          <CardDescription className="mt-2">
            Enter the joining code provided by the session host to access this
            poll.
            {pollId && (
              <span className="block mt-1 text-xs text-gray-500">
                Poll ID: {pollId}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="joining-code">Joining Code</Label>
              <Input
                id="joining-code"
                placeholder="Enter joining code (e.g., ABC123)"
                value={joiningCode}
                onChange={(e) => setJoiningCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                className="w-full text-center font-mono text-lg tracking-wider"
                autoFocus
                maxLength={10}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <p className="text-sm text-blue-800">
                <strong>💡 How to join:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Enter the joining code provided by your session host</li>
                <li>• The code is usually 4-6 characters long</li>
                <li>
                  • Once joined, you&apos;ll be able to participate in real-time
                </li>
              </ul>
            </div>

            {joinPollMutation.isError && (
              <div className="bg-red-50 p-4 rounded-md border border-red-100">
                <p className="text-sm text-red-800">
                  <strong>❌ Error:</strong> Failed to join poll. Please check
                  your code and try again.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={handleJoinPoll}
            className="w-full bg-[#14C8C8] hover:bg-[#0FB6B6] text-white"
            disabled={isJoining || !joiningCode.trim()}
          >
            {isJoining ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Joining Poll...
              </div>
            ) : (
              'Join Poll'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
