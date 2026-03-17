'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJoinPollWithCode } from '@/hooks/user-polls';
import { useUser } from '@/hooks/auth';
import { toast } from 'sonner';
import { socketIOService as PollSocketAPI } from '@/lib/socket-io';
import { getCookie } from 'cookies-next';

function JoinPollContent() {
  const [joiningCode, setJoiningCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user } = useUser();

  // Get joining code from URL if provided
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setJoiningCode(codeFromUrl);
    }
  }, [searchParams]);

  // Use the join poll mutation
  const joinPollMutation = useJoinPollWithCode();

  // Handle joining the poll
  const handleJoinPoll = async () => {
    if (!joiningCode.trim()) {
      toast.error('Please enter a joining code');
      return;
    }

    if (!user) {
      toast.error('Please log in to join a poll');
      router.push('/login');
      return;
    }

    setIsLoading(true);

    try {
      // Call the join poll mutation
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

        // Save this poll as joined in localStorage and map joining code to poll ID
        if (response.poll?.id) {
          try {
            // Save to joined polls list
            const joined = JSON.parse(localStorage.getItem('joinedPolls') || '[]');
            if (!joined.includes(response.poll.id)) {
              joined.push(response.poll.id);
              localStorage.setItem('joinedPolls', JSON.stringify(joined));
            }

            // Save joining code to poll ID mapping
            const codeMapping = JSON.parse(localStorage.getItem('pollCodeMapping') || '{}');
            codeMapping[joiningCode.trim()] = response.poll.id;
            localStorage.setItem('pollCodeMapping', JSON.stringify(codeMapping));
          } catch (error) {
            console.warn('Failed to save joined poll to localStorage:', error);
          }
        } else if (response.alreadyJoined && response.joiningCode) {
          // If already joined, try to get poll ID from stored mapping
          try {
            const codeMapping = JSON.parse(localStorage.getItem('pollCodeMapping') || '{}');
            const pollId = codeMapping[response.joiningCode];
            if (pollId) {
              console.log('Found poll ID from code mapping:', pollId);
              router.push(`/poll/${pollId}`);
              return;
            } else {
              // No poll ID found in mapping - this means the user joined this poll before
              // but we don't have the poll ID stored. Show helpful message.
              toast.error('You have already joined this poll, but we cannot find the poll page. Please contact the poll administrator for the direct link.');
              // Clear the joining code so user can try a different one
              setJoiningCode('');
              return;
            }
          } catch (error) {
            console.warn('Failed to retrieve poll ID from code mapping:', error);
            toast.error('You have already joined this poll, but we cannot access it right now. Please try again or contact the poll administrator.');
            // Clear the joining code so user can try a different one
            setJoiningCode('');
            return;
          }
        }

        // Initialize WebSocket connection
        const accessToken = getCookie('accessToken');
        if (accessToken && response.poll?.id) {
          PollSocketAPI.initialize(accessToken.toString());

          // Join the poll room via WebSocket
          PollSocketAPI.joinPoll(response.poll.id);
        }

        // Navigate to the poll participation page if we have poll ID, otherwise to dashboard
        if (response.poll?.id) {
          router.push(`/poll/${response.poll.id}`);
        } else if (response.alreadyJoined) {
          // If already joined but no poll ID, provide helpful guidance
          toast.success('You have already joined this poll!');
          toast.info('Check your sessions page or look for an open poll tab. You can also try refreshing this page.');
          
          // Clear the joining code so user can try a different one
          setJoiningCode('');
        } else {
          router.push('/dashboard');
        }
      } else {
        toast.error(response.message || 'Failed to join poll');
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

        // Navigate to dashboard since we don't have specific poll ID
        router.push('/dashboard');
      } else {
        toast.error(
          'Failed to join poll. Please check the code and try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press for Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinPoll();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#14C8C8]">
            Join a Poll
          </CardTitle>
          <CardDescription>
            Enter the poll joining code to participate in real-time polling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="joining-code">Joining Code</Label>
            <Input
              id="joining-code"
              placeholder="Enter the poll code"
              value={joiningCode}
              onChange={(e) => setJoiningCode(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-center text-lg font-mono tracking-wider"
              autoFocus
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleJoinPoll}
            className="w-full bg-[#14C8C8] hover:bg-[#0FB6B6] text-white"
            disabled={isLoading || !joiningCode.trim()}
          >
            {isLoading ? 'Joining...' : 'Join Poll'}
          </Button>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinPollPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14C8C8] mx-auto mb-4"></div>
              <p>Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <JoinPollContent />
    </Suspense>
  );
}
