import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  fetchSessions,
  fetchSessionDetails,
  joinSession,
  leaveSession,
  Session,
  JoinSessionResponse,
} from '@/lib/api/sessions';

// Query keys
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => ['sessions', 'list'] as const,
  list: (filters: string) => ['sessions', 'list', { filters }] as const,
  details: () => ['sessions', 'detail'] as const,
  detail: (id: string) => ['sessions', 'detail', id] as const,
};

// Hooks
export const useSessions = () => {
  return useQuery({
    queryKey: sessionKeys.lists(),
    queryFn: fetchSessions,
    // Keep previous data when refetching to prevent UI flicker
    placeholderData: keepPreviousData,
    // Retry failed requests to improve reliability
    retry: 2,
    // Refetch on window focus to keep data fresh
    refetchOnWindowFocus: true,
  });
};

export const useSessionDetails = (sessionId: string) => {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => fetchSessionDetails(sessionId),
    enabled: !!sessionId,
  });
};

export const useJoinSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => joinSession(code),
    onSuccess: (data: JoinSessionResponse, code: string) => {
      // Log the data for debugging
      console.log('Join session mutation success data:', data);

      // Extract the session ID from the response
      let sessionId: string | undefined;

      if (data?.data?.sessionId) {
        sessionId = data.data.sessionId;
        console.log('Found session ID in data.data.sessionId:', sessionId);
      }

      // If we don't have a session ID, we can't proceed
      if (!sessionId) {
        console.error('No session ID found in response:', data);
        return; // Don't throw an error, just return
      }

      // Extract the session data from the response based on its structure
      let sessionData: Session | undefined;

      if (data?.data?.session) {
        // Format: { success, message, data: { session, sessionId } }
        sessionData = data.data.session;
        console.log('Found session in data.data.session:', sessionData);
      } else if (data?.session) {
        // Format: { success, message, session } (backward compatibility)
        sessionData = data.session;
        console.log('Found session in data.session:', sessionData);
      }

      // If we don't have session data but have a session ID, try to fetch the session details
      if (!sessionData && sessionId) {
        try {
          // Try to fetch the session details using the session ID
          console.log(
            'No session data in response, will fetch using ID:',
            sessionId
          );

          // We'll let the component handle fetching the session details
          // Just create a minimal session object with the ID
          sessionData = {
            id: sessionId,
            title: 'Session',
            state: 'UPCOMING',
            status: 'upcoming',
            date: 'Date will be available when you enter the session',
            time: 'Time will be available when you enter the session',
            participants: 0,
            hasQuiz: false,
            joiningCode: code,
            code: code,
          };
        } catch (error) {
          console.error('Error creating minimal session object:', error);
        }
      }

      // Ensure the session has the correct ID
      if (sessionData && sessionData.id !== sessionId) {
        console.log(
          `Updating session ID from ${sessionData.id} to ${sessionId}`
        );
        sessionData.id = sessionId;
      }

      // Make sure we have a valid session object
      if (sessionData && sessionData.id) {
        // Log the session data we're going to use
        console.log('Using session data:', sessionData);

        // Add the new session to the cache
        queryClient.setQueryData(
          sessionKeys.detail(sessionData.id),
          sessionData
        );

        // Update the sessions list in the cache to include this session
        const currentData = (queryClient.getQueryData(sessionKeys.lists()) as {
          active: Session[];
          past: Session[];
        }) || { active: [], past: [] };

        // Create deep copies of the arrays to avoid reference issues
        const activeArray = Array.isArray(currentData.active)
          ? [...currentData.active]
          : [];
        const pastArray = Array.isArray(currentData.past)
          ? [...currentData.past]
          : [];

        // Check if the session is already in the list
        const isActiveSession =
          sessionData.status === 'active' ||
          sessionData.status === 'upcoming' ||
          sessionData.state === 'LIVE' ||
          sessionData.state === 'UPCOMING';

        const targetList = isActiveSession ? activeArray : pastArray;
        const sessionExists = targetList.some((s) => s.id === sessionData.id);

        if (!sessionExists) {
          // Add the session to the appropriate list
          if (isActiveSession) {
            activeArray.push(sessionData);
          } else {
            pastArray.push(sessionData);
          }

          // Update the query cache directly
          queryClient.setQueryData(sessionKeys.lists(), {
            active: activeArray,
            past: pastArray,
          });
        }

        // No longer using localStorage for persistence
        console.log('Session added to React Query cache:', sessionData.id);

        // After updating the cache and localStorage, invalidate the query to trigger a refetch
        // This ensures we have the latest data from the server
        // But we do this AFTER updating the cache so we don't lose our changes
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
        }, 100);
      } else {
        console.error('Invalid session data received:', data);
      }
    },
    onError: (error) => {
      console.error('Join session mutation error:', error);
    },
  });
};

export const useLeaveSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => leaveSession(sessionId),
    onSuccess: (_data, sessionId) => {
      // Invalidate sessions list to refetch without the left session
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });

      // Remove the session from the cache
      queryClient.removeQueries({ queryKey: sessionKeys.detail(sessionId) });
    },
  });
};
