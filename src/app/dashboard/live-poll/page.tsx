'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, Plus, Share2, Eye, ArrowRight } from 'lucide-react';
import { useJoinPollWithCode } from '@/hooks/user-polls';
import { useUser } from '@/hooks/auth';
import { toast } from 'sonner';
import { socketIOService as PollSocketAPI } from '@/lib/socket-io';
import { getCookie } from 'cookies-next';
import type { Poll } from '@/types/content';
import { getItem, setItem } from '@/lib/localStorageManager';
import * as keys from '@/lib/localStorageKeys';

// Extended interface to handle additional response properties
interface ExtendedJoinPollResponse {
  message: string;
  poll?: Poll;
  success?: boolean;
  alreadyJoined?: boolean;
}

// Error interface for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function LivePollPage() {
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [joiningCode, setJoiningCode] = useState('');
  const router = useRouter();
  const { data: user } = useUser();

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

    try {
      // Show loading state
      toast.loading('Joining poll...');

      // Call the join poll mutation - cast to extended response type
      const response = await joinPollMutation.mutateAsync(joiningCode.trim()) as ExtendedJoinPollResponse;

      // Dismiss loading toast
      toast.dismiss();

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

        // Save this poll as joined in localStorage
        if (response.poll?.id) {
          try {
            const joined = (getItem(keys.JOINED_POLLS) as string[] || []);
            if (!joined.includes(response.poll.id)) {
              joined.push(response.poll.id);
              setItem(keys.JOINED_POLLS, joined);
            }
          } catch (error) {
            console.warn('Failed to save joined poll to localStorage:', error);
          }
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

        // Close the dialog
        setIsJoinDialogOpen(false);

        // Reset the joining code
        setJoiningCode('');

        // Navigate to the poll page if we have poll ID
        if (response.poll?.id) {
          router.push(`/poll/${response.poll.id}`);
        } else if (response.alreadyJoined) {
          // If already joined but no poll ID, provide helpful guidance
          toast.success('You have already joined this poll!');
          toast.info('Check your sessions page or look for an open poll tab. You can also try a different joining code.');
          
          // Clear the joining code so user can try a different one
          setJoiningCode('');
        } else {
          // Last resort fallback
          router.push('/dashboard');
        }
      } else {
        toast.error(response.message || 'Failed to join poll');
      }
    } catch (error) {
      toast.dismiss();

      const apiError = error as ApiError;
      
      // Check if this is an "already joined" error
      const errorMessage =
        apiError?.response?.data?.message || apiError?.message || '';
      if (
        errorMessage.toLowerCase().includes('already joined') ||
        errorMessage.toLowerCase().includes('already a participant') ||
        errorMessage.toLowerCase().includes('user already exists')
      ) {
        console.log('✅ User already joined this poll - treating as success');
        toast.success('You have already joined this poll. Welcome back!');

        // Close the dialog
        setIsJoinDialogOpen(false);

        // Reset the joining code
        setJoiningCode('');

        // Show a better message for already joined polls without poll ID
        toast.info('Try accessing the poll from your sessions page, or check if you have the poll open in another tab.');
      } else {
        // Show error message
        if (apiError?.response?.data?.message) {
          toast.error(apiError.response.data.message);
        } else {
          toast.error(
            'Failed to join poll. Please check the code and try again.'
          );
        }
      }
    }
  };

  // Handle key press (Enter)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinPoll();
    }
  };

  // Handle navigate to join poll page  
  const handleGoToJoinPoll = () => {
    router.push('/join-poll');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#14C8C8] to-[#0FB6B6] rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#14C8C8] to-[#0FB6B6] bg-clip-text text-transparent">
              Live Polls
            </h1>
            <p className="text-muted-foreground">
              Join live polls and participate in real-time voting
            </p>
          </div>
        </div>
      </div>

      {/* Poll Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Join Poll with Code */}
        <Card className="hover:shadow-lg transition-shadow duration-300 border-[#14C8C8]/20 hover:border-[#14C8C8]/40">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#14C8C8]/10 to-[#0FB6B6]/10 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-[#14C8C8]" />
            </div>
                         <CardTitle className="text-xl text-[#14C8C8]">Join with Code</CardTitle>
             <CardDescription>
               Enter a poll joining code to participate in real-time voting
             </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-[#14C8C8] hover:bg-[#0FB6B6] text-white">
                  Join Poll with Code
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-[#14C8C8]">Join a Poll</DialogTitle>
                  <DialogDescription>
                    Enter the poll joining code provided by the session host.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="joining-code">Joining Code</Label>
                      <Input
                        id="joining-code"
                        placeholder="Enter joining code (e.g., ABC123)"
                        value={joiningCode}
                        onChange={(e) => setJoiningCode(e.target.value.toUpperCase())}
                        onKeyPress={handleKeyPress}
                        className="w-full text-center font-mono text-lg tracking-wider"
                        autoFocus
                        maxLength={10}
                      />
                    </div>

                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50">
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        💡 Enter the code provided by your session host to join the poll
                      </p>
                    </div>

                    {joinPollMutation.isError && (
                      <div className="bg-red-50 p-3 rounded-md border border-red-100 dark:bg-red-950/20 dark:border-red-900/50">
                        <p className="text-xs text-red-800 dark:text-red-200">
                          ❌ Failed to join poll. Please check your code and try again.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsJoinDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleJoinPoll}
                    className="bg-[#14C8C8] hover:bg-[#0FB6B6] text-white"
                    disabled={joinPollMutation.isPending || !joiningCode.trim()}
                  >
                    {joinPollMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Joining...
                      </div>
                    ) : (
                      'Join Poll'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Join Poll Page */}
        <Card className="hover:shadow-lg transition-shadow duration-300 border-[#14C8C8]/20 hover:border-[#14C8C8]/40">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full flex items-center justify-center mb-4">
              <Share2 className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl text-blue-600">Join Poll Page</CardTitle>
            <CardDescription>
              Go to the dedicated poll joining page for a better experience
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={handleGoToJoinPoll}
              variant="outline"
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-600/10"
            >
              Open Join Poll Page
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Browse Sessions */}
        <Card className="hover:shadow-lg transition-shadow duration-300 border-[#14C8C8]/20 hover:border-[#14C8C8]/40">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-full flex items-center justify-center mb-4">
              <Eye className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-600">Browse Sessions</CardTitle>
            <CardDescription>
              View all available sessions and their polls
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => router.push('/dashboard/sessions')}
              variant="outline"
              className="w-full border-green-600 text-green-600 hover:bg-green-600/10"
            >
              View All Sessions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions Section */}
      <Card className="bg-gradient-to-r from-[#14C8C8]/5 to-[#0FB6B6]/5 border-[#14C8C8]/20">
        <CardHeader>
          <CardTitle className="text-[#14C8C8] flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            How to Join Live Polls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#14C8C8] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Get the Code</h3>
              <p className="text-sm text-muted-foreground">
                Ask your session host for the poll joining code (usually 4-6 characters)
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#14C8C8] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Enter the Code</h3>
              <p className="text-sm text-muted-foreground">
                Click &quot;Join with Code&quot; above and enter the code provided by your host
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#14C8C8] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Start Voting</h3>
              <p className="text-sm text-muted-foreground">
                Once joined, you can participate in real-time polls and see live results
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 