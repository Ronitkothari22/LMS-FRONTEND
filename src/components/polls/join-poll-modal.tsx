'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJoinPoll } from '@/hooks/polls';
import { toast } from 'sonner';
import { socketIOService as PollSocketAPI } from '@/lib/socket-io';
import { getCookie } from 'cookies-next';

interface JoinPollModalProps {
  sessionId: string;
  trigger?: React.ReactNode;
}

export function JoinPollModal({ sessionId, trigger }: JoinPollModalProps) {
  const [joiningCode, setJoiningCode] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Use the join poll mutation
  const joinPollMutation = useJoinPoll();

  // Handle joining the poll
  const handleJoinPoll = async () => {
    if (!joiningCode.trim()) {
      toast.error('Please enter a joining code');
      return;
    }

    try {
      // Show loading state
      toast.loading('Joining poll...');

      // Call the join poll mutation
      const response = await joinPollMutation.mutateAsync(joiningCode.trim());

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
        try {
          const joined = JSON.parse(
            localStorage.getItem('joinedPolls') || '[]'
          );
          const pollIdToSave = response.poll?.id;
          if (pollIdToSave && !joined.includes(pollIdToSave)) {
            joined.push(pollIdToSave);
            localStorage.setItem('joinedPolls', JSON.stringify(joined));
          }
        } catch (error) {
          console.warn('Failed to save joined poll to localStorage:', error);
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

        // Close the modal
        setIsOpen(false);

        // Reset the joining code
        setJoiningCode('');

        // Navigate to the poll page if we have poll ID, otherwise to session
        if (response.poll?.id) {
          router.push(
            `/dashboard/sessions/${sessionId}/polls/${response.poll.id}`
          );
        } else {
          router.push(`/dashboard/sessions/${sessionId}`);
        }
      } else {
        toast.error(response.message || 'Failed to join poll');
      }
    } catch (error) {
      toast.dismiss();

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

        // Close the modal
        setIsOpen(false);

        // Reset the joining code
        setJoiningCode('');

        // Navigate to session page since we don't have specific poll ID
        router.push(`/dashboard/sessions/${sessionId}`);
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
    }
  };

  // Handle key press (Enter)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinPoll();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="border-[#14C8C8] text-[#14C8C8] hover:bg-[#14C8C8]/10 hover:text-[#14C8C8]"
          >
            Join Poll with Code
          </Button>
        )}
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

            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <p className="text-xs text-blue-800">
                💡 Enter the code provided by your session host to join the poll
              </p>
            </div>

            {joinPollMutation.isError && (
              <div className="bg-red-50 p-3 rounded-md border border-red-100">
                <p className="text-xs text-red-800">
                  ❌ Failed to join poll. Please check your code and try again.
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
