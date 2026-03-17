'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarIcon,
  ClockIcon,
  PersonIcon,
  PlusIcon,
  CheckIcon,
  CrossCircledIcon,
  ReloadIcon,
  EnterIcon,
} from '@radix-ui/react-icons';
import { Badge } from '@/components/ui/badge';
import { useSessions, useJoinSession } from '@/hooks/sessions';
import { useQueryClient } from '@tanstack/react-query';
import { sessionKeys } from '@/hooks/sessions';
import { Session } from '@/lib/api/sessions';
import { toast } from 'sonner';

export default function SessionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [joiningCode, setJoiningCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [joinedSession, setJoinedSession] = useState<Session | null>(null);

  // Fetch sessions data
  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isError: isSessionsError,
    refetch: refetchSessions,
  } = useSessions();

  // Join session mutation
  const joinSessionMutation = useJoinSession();

  // Get active and past sessions from the data or use empty arrays if not available
  const activeSessions = (sessionsData as { active: Session[] })?.active || [];
  const pastSessions = (sessionsData as { past: Session[] })?.past || [];

  // Load sessions on component mount
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      try {
        console.log('Fetching sessions from API...');

        // Fetch the latest sessions from the API
        refetchSessions();
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    }
  }, [refetchSessions]);

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the joining code
    if (!joiningCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    // Additional validation - check if the code has a valid format
    // This is a simple validation that can be adjusted based on your requirements
    const codeRegex = /^[A-Za-z0-9]{3,10}$/; // Alphanumeric, 3-10 characters
    if (!codeRegex.test(joiningCode.trim())) {
      setError(
        'Invalid code format. Please enter a valid session code (3-10 alphanumeric characters)'
      );
      return;
    }

    setError(null);

    try {
      // Normalize the joining code (trim whitespace, convert to uppercase)
      const normalizedCode = joiningCode.trim().toUpperCase();

      // Call the join session API
      console.log('Joining session with code:', normalizedCode);

      // Force the dialog to stay open during the API call
      setShowJoinSuccess(true);

      const response = await joinSessionMutation.mutateAsync(normalizedCode);
      console.log('Join session response:', response);

      // Extract the session data and session ID from the response based on its structure
      let sessionData: Session | undefined;
      let sessionId: string | undefined;

      console.log('Processing join session response:', response);

      // Extract session ID first
      if (response?.data?.sessionId) {
        sessionId = response.data.sessionId;
        console.log('Found session ID in response.data.sessionId:', sessionId);
      }

      // Then try to get the session data
      if (response?.data?.session) {
        // Format: { success, message, data: { session, sessionId } }
        sessionData = response.data.session;
        console.log('Found session in response.data.session:', sessionData);
      } else if (response?.session) {
        // Format: { success, message, session } (backward compatibility)
        sessionData = response.session;
        console.log('Found session in response.session:', sessionData);
      }

      // If we have a session ID but no session data, try to fetch the session details
      if (sessionId && !sessionData) {
        try {
          console.log('Fetching session details using ID:', sessionId);
          // Get the session details from the cache if available
          const cachedSession = queryClient.getQueryData(
            sessionKeys.detail(sessionId)
          );

          if (cachedSession) {
            console.log('Found session in cache:', cachedSession);
            sessionData = cachedSession as Session;
          } else {
            // Fetch the session details from the API
            console.log('Session not in cache, fetching from API');
            // We'll refetch sessions which should include this session
            await refetchSessions();

            // Try to find the session in the refetched data
            const currentData = (queryClient.getQueryData(
              sessionKeys.lists()
            ) as {
              active: Session[];
              past: Session[];
            }) || { active: [], past: [] };

            // Look for the session in both active and past sessions
            const allSessions = [
              ...(Array.isArray(currentData.active) ? currentData.active : []),
              ...(Array.isArray(currentData.past) ? currentData.past : []),
            ];

            sessionData = allSessions.find((s) => s.id === sessionId);
            console.log('Found session after refetching:', sessionData);
          }
        } catch (fetchError) {
          console.error('Error fetching session details:', fetchError);
          // Continue with what we have
        }
      }

      // Validate the response before using it
      if (!sessionId) {
        console.error('No session ID found in response:', response);
        throw new Error('No session ID found in response. Please try again.');
      }

      // If we still don't have session data, create a minimal session object with the ID
      if (!sessionData) {
        console.log('Creating minimal session object with ID:', sessionId);
        sessionData = {
          id: sessionId,
          title: 'Session',
          state: 'UPCOMING',
          status: 'upcoming',
          date: 'Date will be available when you enter the session',
          time: 'Time will be available when you enter the session',
          participants: 0,
          hasQuiz: false,
          joiningCode: joiningCode,
          code: joiningCode,
        };
      }

      // Ensure the session has the correct ID
      if (sessionData.id !== sessionId) {
        console.log(
          `Updating session ID from ${sessionData.id} to ${sessionId}`
        );
        sessionData.id = sessionId;
      }

      // Log the session data we're using
      console.log('Using session data for display:', sessionData);

      // Set the joined session
      setJoinedSession(sessionData);
      setShowJoinSuccess(true);

      // No need to manually update the cache here as the useJoinSession hook now handles this
      // The refetchSessions call below will ensure we have the latest data

      // Also refetch sessions to ensure we have the latest data
      refetchSessions();

      // Clear the joining code after successful join
      setJoiningCode('');
    } catch (err) {
      console.error('Error joining session:', err);

      // Check if this is an "already a participant" error
      const errorMessage = err instanceof Error ? err.message : '';
      const isAlreadyParticipant = errorMessage
        .toLowerCase()
        .includes('already a participant');

      if (isAlreadyParticipant) {
        // If user is already a participant, try to fetch the session details
        try {
          console.log(
            'User is already a participant, fetching session details...'
          );

          // Refetch sessions to get the latest data
          await refetchSessions();

          // Check if the session exists in the refetched data
          const currentData = (queryClient.getQueryData(
            sessionKeys.lists()
          ) as {
            active: Session[];
            past: Session[];
          }) || { active: [], past: [] };

          // Combine active and past sessions
          const allSessions = [
            ...(Array.isArray(currentData.active) ? currentData.active : []),
            ...(Array.isArray(currentData.past) ? currentData.past : []),
          ];

          // Try to find the session by code
          const foundSession = allSessions.find((s) => s.code === joiningCode);

          if (foundSession) {
            console.log('Found session after refetching:', foundSession);
            setJoinedSession(foundSession);
            setShowJoinSuccess(true);
            setJoiningCode('');
            return;
          }

          // If not found, show an error
          setError('Session not found. Please check the code and try again.');
          setJoiningCode('');
        } catch (fetchError) {
          console.error('Error fetching session details:', fetchError);
          setError('Error fetching session details. Please try again.');
        }
      }

      // Display the error message from the API if available
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          'Failed to join session. Please check the code and try again.'
        );
      }

      // Clear the joining code input on error for better UX
      setJoiningCode('');
    }
  };

  const handleEnterSession = (sessionId: string) => {
    // Navigate to the session details page
    router.push(`/dashboard/sessions/${sessionId}`);
  };

  const handleTakeQuiz = (sessionId: string) => {
    router.push(`/dashboard/sessions/${sessionId}/quiz`);
  };

  // Loading state
  if (isLoadingSessions) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isSessionsError) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Learning Sessions</h1>
        </div>
        <Card className="bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">
              Error Loading Sessions
            </CardTitle>
            <CardDescription className="text-red-600">
              There was a problem loading your sessions. Please try again.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={() => refetchSessions()}
              className="flex items-center gap-2"
            >
              <ReloadIcon className="h-4 w-4" />
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            My Sessions
          </h1>
          <p className="text-muted-foreground mt-2">
            Sessions you&apos;ve joined as a participant
          </p>
        </div>
        <Dialog
          open={showJoinSuccess}
          onOpenChange={(open) => {
            // If trying to close the dialog
            if (!open) {
              // If we have a joined session, don't close the dialog when clicking outside
              if (joinedSession) {
                // Keep the dialog open
                return;
              }

              // If we're in the process of joining (isPending), don't close
              if (joinSessionMutation.isPending) {
                return;
              }

              // Otherwise, allow closing
              setShowJoinSuccess(false);
            } else {
              // Opening the dialog
              setShowJoinSuccess(true);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-md transition-all duration-300 hover:shadow-lg">
              <PlusIcon className="h-4 w-4" />
              Join Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-background to-muted/50 dark:from-slate-900 dark:to-slate-800 border-primary/20 shadow-lg dark:shadow-2xl">
            {joinedSession ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                      Successfully Joined!
                    </span>
                  </DialogTitle>
                  <DialogDescription className="mt-2">
                    You have joined the session successfully.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Card className="enhanced-card overflow-hidden">
                    <div
                      className={`status-indicator ${
                        joinedSession?.state === 'LIVE'
                          ? 'status-indicator-live'
                          : joinedSession?.state === 'UPCOMING'
                            ? 'status-indicator-upcoming'
                            : joinedSession?.state === 'CANCELLED'
                              ? 'status-indicator-cancelled'
                              : 'status-indicator-completed'
                      }`}
                    />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-primary">
                          {joinedSession?.title || 'Session'}
                        </CardTitle>
                        <Badge
                          className={`${
                            joinedSession?.state === 'LIVE'
                              ? 'bg-gradient-to-r from-green-500 to-green-600'
                              : joinedSession?.state === 'UPCOMING'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                : joinedSession?.state === 'CANCELLED'
                                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                                  : 'bg-gradient-to-r from-gray-500 to-gray-600'
                          } text-white shadow-sm`}
                        >
                          {joinedSession?.state === 'LIVE'
                            ? 'Live Now'
                            : joinedSession?.state === 'UPCOMING'
                              ? 'Upcoming'
                              : joinedSession?.state === 'CANCELLED'
                                ? 'Cancelled'
                                : 'Completed'}
                        </Badge>
                      </div>
                      <CardDescription className="mt-2">
                        {joinedSession?.description ||
                          'No description available'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm">
                          <div className="bg-primary/10 p-2 rounded-md">
                            <PersonIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">
                              Instructor
                            </p>
                            <p className="text-primary font-medium">
                              {joinedSession?.createdBy?.name || 'Instructor'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm">
                          <div className="bg-primary/10 p-2 rounded-md">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Date</p>
                            <p className="text-primary font-medium">
                              {joinedSession?.date || 'Date not specified'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm">
                          <div className="bg-primary/10 p-2 rounded-md">
                            <ClockIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Time</p>
                            <p className="text-primary font-medium">
                              {joinedSession?.time || 'Time not specified'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-1">
                          {joinedSession?.code && (
                            <div className="bg-primary/10 px-3 py-1.5 rounded-md text-sm">
                              <span className="font-medium text-primary">
                                Code: {joinedSession.code}
                              </span>
                            </div>
                          )}
                          {joinedSession?.hasQuiz && (
                            <div className="bg-blue-50 px-3 py-1.5 rounded-md text-sm">
                              <span className="font-medium text-blue-600">
                                Has Quiz
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-white shadow-md transition-all duration-300 hover:shadow-lg"
                        onClick={() => {
                          // Make sure we have a valid session ID
                          if (joinedSession?.id) {
                            console.log(
                              'Entering session with ID:',
                              joinedSession.id
                            );

                            // First close the dialog
                            setShowJoinSuccess(false);

                            // Then navigate to the session after a short delay
                            // This ensures the dialog is fully closed before navigation
                            setTimeout(() => {
                              handleEnterSession(joinedSession.id);
                            }, 100);
                          } else {
                            console.error('No valid session ID found');
                            // Fallback to refetching sessions if ID is missing
                            refetchSessions();
                            toast.error(
                              'Session ID is missing. Please try again.'
                            );
                          }
                        }}
                      >
                        <EnterIcon className="mr-2 h-4 w-4" />
                        Enter Session
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-primary">
                    Join a Session
                  </DialogTitle>
                  <DialogDescription className="mt-2">
                    Enter the session code provided by your instructor to join.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleJoinSession}>
                  <div className="grid gap-4 py-6">
                    <div className="flex flex-col space-y-2">
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            id="code"
                            placeholder="Enter session code (e.g. ABC123)"
                            value={joiningCode}
                            onChange={(e) => setJoiningCode(e.target.value)}
                            disabled={joinSessionMutation.isPending}
                            className={`pl-10 border-gray-300 focus:border-primary focus:ring-primary transition-all duration-300 shadow-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                            maxLength={10}
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <EnterIcon className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-600">
                            Session code should be 3-10 alphanumeric characters.
                            Try{' '}
                            <span className="font-mono bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                              TEST123
                            </span>{' '}
                            for a demo session.
                          </p>
                        </div>
                      </div>
                      {error && (
                        <p className="text-sm text-red-500 bg-red-50 p-2 rounded-md border border-red-100">
                          {error}
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={joinSessionMutation.isPending}
                      className="w-full bg-primary hover:bg-primary/90 text-white shadow-md transition-all duration-300 hover:shadow-lg"
                    >
                      {joinSessionMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <ReloadIcon className="h-4 w-4 animate-spin" />
                          Joining...
                        </span>
                      ) : (
                        'Join Session'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 dark:bg-slate-800/50 p-1 rounded-xl border border-border/50">
          <TabsTrigger
            value="active"
            className="rounded-lg data-[state=active]:bg-background dark:data-[state=active]:bg-slate-700 data-[state=active]:text-primary data-[state=active]:shadow-md transition-all duration-300"
          >
            Active Sessions
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="rounded-lg data-[state=active]:bg-background dark:data-[state=active]:bg-slate-700 data-[state=active]:text-primary data-[state=active]:shadow-md transition-all duration-300"
          >
            Past Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {activeSessions.length === 0 ? (
            <Card className="enhanced-card bg-gradient-to-r from-background to-muted/30 dark:from-slate-900 dark:to-slate-800 overflow-hidden border border-border/50">
              <div className="status-indicator status-indicator-upcoming" />
              <CardHeader className="pb-2">
                <CardTitle className="text-primary">
                  No Active Sessions
                </CardTitle>
                <CardDescription className="mt-2">
                  You haven&apos;t joined any active sessions yet. Use the
                  &quot;Join Session&quot; button to participate in a session.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-center py-8">
                  <div className="bg-primary/10 dark:bg-primary/20 p-6 rounded-full">
                    <div className="bg-primary/20 dark:bg-primary/30 p-4 rounded-full">
                      <div className="bg-primary p-3 rounded-full flex items-center justify-center">
                        <PlusIcon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            activeSessions.map((session: Session) => (
              <Card key={session.id} className="session-card">
                <div
                  className={`status-indicator ${
                    session.state === 'LIVE'
                      ? 'status-indicator-live'
                      : session.state === 'UPCOMING'
                        ? 'status-indicator-upcoming'
                        : session.state === 'CANCELLED'
                          ? 'status-indicator-cancelled'
                          : 'status-indicator-completed'
                  }`}
                />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {session.title}
                        {session.hasQuiz && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Has Quiz
                          </Badge>
                        )}
                        {session.code && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs bg-muted"
                          >
                            Code: {session.code}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {session.description || 'No description available'}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        session.state === 'LIVE'
                          ? 'default'
                          : session.state === 'UPCOMING'
                            ? 'secondary'
                            : session.state === 'CANCELLED'
                              ? 'destructive'
                              : 'outline'
                      }
                    >
                      {session.state === 'LIVE'
                        ? 'Live Now'
                        : session.state === 'UPCOMING'
                          ? 'Upcoming'
                          : session.state === 'CANCELLED'
                            ? 'Cancelled'
                            : 'Completed'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-3 bg-muted/30 dark:bg-slate-800/30 p-3 rounded-lg border border-border/50 shadow-sm">
                      <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-md">
                        <PersonIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground/80">Instructor</p>
                        <p className="text-primary font-medium">
                          {session.createdBy?.name || 'Instructor'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/30 dark:bg-slate-800/30 p-3 rounded-lg border border-border/50 shadow-sm">
                      <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-md">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground/80">Date</p>
                        <p className="text-primary font-medium">
                          {session.date || 'Date not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/30 dark:bg-slate-800/30 p-3 rounded-lg border border-border/50 shadow-sm">
                      <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-md">
                        <ClockIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground/80">Time</p>
                        <p className="text-primary font-medium">
                          {session.time || 'Time not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-md transition-all duration-300 hover:shadow-lg"
                    onClick={() => handleEnterSession(session.id)}
                  >
                    Enter Session
                  </Button>
                  {session.hasQuiz && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10 transition-all duration-300"
                      onClick={() => handleTakeQuiz(session.id)}
                      disabled={session.state === 'UPCOMING'}
                    >
                      {session.quizCompleted ? 'Review Quiz' : 'Take Quiz'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          {pastSessions.length === 0 ? (
            <Card className="border border-border/50 shadow-sm bg-gradient-to-r from-background to-muted/30 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/20" />
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground">
                  No Past Sessions
                </CardTitle>
                <CardDescription className="mt-2">
                  You haven&apos;t participated in any completed sessions yet.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-center py-8">
                  <div className="bg-muted/30 dark:bg-slate-800/30 p-6 rounded-full">
                    <div className="bg-muted/50 dark:bg-slate-700/50 p-4 rounded-full">
                      <div className="bg-muted-foreground/60 p-3 rounded-full flex items-center justify-center">
                        <ClockIcon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            pastSessions.map((session: Session) => (
              <Card key={session.id} className="session-card">
                <div className="status-indicator status-indicator-completed" />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {session.title}
                        {session.code && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs bg-muted"
                          >
                            Code: {session.code}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {session.description || 'No description available'}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        session.state === 'CANCELLED'
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {session.state === 'CANCELLED'
                        ? 'Cancelled'
                        : 'Completed'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-3 bg-muted/30 dark:bg-slate-800/30 p-3 rounded-lg border border-border/50 shadow-sm">
                      <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-md">
                        <PersonIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground/80">Instructor</p>
                        <p className="text-primary font-medium">
                          {session.createdBy?.name || 'Instructor'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/30 dark:bg-slate-800/30 p-3 rounded-lg border border-border/50 shadow-sm">
                      <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-md">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground/80">Date</p>
                        <p className="text-primary font-medium">
                          {session.date || 'Date not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/30 dark:bg-slate-800/30 p-3 rounded-lg border border-border/50 shadow-sm">
                      <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-md">
                        <ClockIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground/80">Time</p>
                        <p className="text-primary font-medium">
                          {session.time || 'Time not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {session.hasQuiz && (
                    <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-muted/20 to-muted/10 dark:from-slate-800/20 dark:to-slate-700/10 border border-border/50 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${session.quizCompleted ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}
                          >
                            {session.quizCompleted ? (
                              <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <CrossCircledIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground/80">
                              Quiz Status
                            </p>
                            {session.quizCompleted ? (
                              <p className="text-green-600 dark:text-green-400 font-medium">
                                Completed
                              </p>
                            ) : (
                              <p className="text-amber-600 dark:text-amber-400 font-medium">
                                Not Taken
                              </p>
                            )}
                          </div>
                        </div>
                        {session.quizCompleted && session.score && (
                          <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg border border-green-100 dark:border-green-800/50">
                            <p className="text-sm text-green-700 dark:text-green-300">Score</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {session.score}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10 transition-all duration-300"
                    onClick={() => handleEnterSession(session.id)}
                  >
                    View Session
                  </Button>
                  {session.hasQuiz && !session.quizCompleted && (
                    <Button
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-md transition-all duration-300 hover:shadow-lg"
                      onClick={() => handleTakeQuiz(session.id)}
                    >
                      Take Quiz
                    </Button>
                  )}
                  {session.hasQuiz && session.quizCompleted && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10 transition-all duration-300"
                      onClick={() => handleTakeQuiz(session.id)}
                    >
                      Review Quiz
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
