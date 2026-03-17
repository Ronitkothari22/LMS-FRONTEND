import { axiosInstance } from '@/lib/axios';
import { toast } from 'sonner';

// Temporarily disable the no-explicit-any rule for this file
/* eslint-disable @typescript-eslint/no-explicit-any */

// Types
export interface Session {
  id: string;
  title: string;
  description?: string;
  state: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  status: 'active' | 'upcoming' | 'completed'; // Mapped from state for backward compatibility
  startTime?: string;
  endTime?: string;
  date: string; // Formatted date from startTime
  time: string; // Formatted time from startTime
  joiningCode?: string;
  code?: string; // Alias for joiningCode for backward compatibility
  participants: number; // Count of participants
  participantsList?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }[];
  createdBy?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  invited?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }[];
  quizzes?: {
    id: string;
    title: string;
    timeLimitSeconds?: number;
    pointsPerQuestion?: number;
    passingScore?: number;
  }[];
  hasQuiz: boolean; // Derived from quizzes array
  quizCompleted?: boolean;
  score?: number;
  maxParticipants?: number;
  allowGuests?: boolean;
  isActive?: boolean;
}

export interface SessionDetails extends Session {
  duration: string; // Calculated from startTime and endTime
  progress: number; // Calculated based on current time vs session time
  materials?: {
    id: string;
    title: string;
    type: string;
    size: string;
    url: string;
  }[];
  modules?: {
    id: string;
    title: string;
    duration: string;
    completed: boolean;
    type: string;
    current?: boolean;
  }[];
}

export interface JoinSessionRequest {
  joiningCode: string;
}

export interface JoinSessionResponse {
  success?: boolean;
  message?: string;
  data?: {
    session?: Session;
    sessionId?: string;
  };
  session?: Session; // For backward compatibility
}

// API Functions
export const fetchSessions = async (): Promise<{
  active: Session[];
  past: Session[];
}> => {
  try {
    console.log('Fetching user sessions (only where user is a participant)');

    // Fetch only sessions where the user is a participant
    const response = await axiosInstance.get('/sessions/user');
    console.log('User sessions data from API:', response.data);

    // Initialize arrays for API sessions
    let apiActive: Session[] = [];
    let apiPast: Session[] = [];

    // Process the API response to ensure it matches our expected format
    if (response.data) {
      // Check for the new API response format first
      if (
        response.data.success &&
        response.data.data &&
        response.data.data.sessions
      ) {
        // Format: { success: true, message: "...", data: { sessions: [...] } }
        const sessions = response.data.data.sessions;
        console.log(
          'Found sessions in response.data.data.sessions:',
          sessions?.length || 0
        );

        if (Array.isArray(sessions)) {
          // Process sessions where the user is a participant
          apiActive = sessions
            .filter(
              (s: { state?: string; status?: string }) =>
                s.state === 'IN_PROGRESS' ||
                s.state === 'LIVE' ||
                s.state === 'UPCOMING' ||
                s.status === 'active' ||
                s.status === 'upcoming'
            )
            .map((s: Record<string, unknown>) => formatSessionFromApi(s));

          apiPast = sessions
            .filter(
              (s: { state?: string; status?: string }) =>
                s.state === 'COMPLETED' ||
                s.state === 'CANCELLED' ||
                s.status === 'completed'
            )
            .map((s: Record<string, unknown>) => formatSessionFromApi(s));
        }
      } else if (response.data.data && response.data.data.sessions) {
        // Format: { data: { sessions: [...] } }
        const sessions = response.data.data.sessions;
        console.log(
          'Found sessions in response.data.data.sessions:',
          sessions?.length || 0
        );

        if (Array.isArray(sessions)) {
          apiActive = sessions
            .filter(
              (s: { state?: string; status?: string }) =>
                s.state === 'IN_PROGRESS' ||
                s.state === 'LIVE' ||
                s.state === 'UPCOMING' ||
                s.status === 'active' ||
                s.status === 'upcoming'
            )
            .map((s: Record<string, unknown>) => formatSessionFromApi(s));

          apiPast = sessions
            .filter(
              (s: { state?: string; status?: string }) =>
                s.state === 'COMPLETED' ||
                s.state === 'CANCELLED' ||
                s.status === 'completed'
            )
            .map((s: Record<string, unknown>) => formatSessionFromApi(s));
        }
      } else if (response.data.data && response.data.data.session) {
        // Format: { success, message, data: { session } } - single session
        const session = response.data.data.session;
        console.log('Found single session in response.data.data.session');

        if (session) {
          const formattedSession = formatSessionFromApi(session);

          if (
            formattedSession.state === 'COMPLETED' ||
            formattedSession.state === 'CANCELLED' ||
            formattedSession.status === 'completed'
          ) {
            apiPast = [formattedSession];
          } else {
            apiActive = [formattedSession];
          }
        }
      } else if (response.data.sessions) {
        // Format: { sessions: [...] }
        const sessions = response.data.sessions;
        console.log(
          'Found sessions in response.data.sessions:',
          sessions?.length || 0
        );

        if (Array.isArray(sessions)) {
          apiActive = sessions
            .filter(
              (s: { state?: string; status?: string }) =>
                s.state === 'IN_PROGRESS' ||
                s.state === 'LIVE' ||
                s.state === 'UPCOMING' ||
                s.status === 'active' ||
                s.status === 'upcoming'
            )
            .map((s: Record<string, unknown>) => formatSessionFromApi(s));

          apiPast = sessions
            .filter(
              (s: { state?: string; status?: string }) =>
                s.state === 'COMPLETED' ||
                s.state === 'CANCELLED' ||
                s.status === 'completed'
            )
            .map((s: Record<string, unknown>) => formatSessionFromApi(s));
        }
      } else if (response.data.active || response.data.past) {
        // Format: { active: [...], past: [...] }
        console.log('Found sessions in response.data.active/past format');

        if (Array.isArray(response.data.active)) {
          apiActive = response.data.active.map((s: Record<string, unknown>) =>
            formatSessionFromApi(s)
          );
        }
        if (Array.isArray(response.data.past)) {
          apiPast = response.data.past.map((s: Record<string, unknown>) =>
            formatSessionFromApi(s)
          );
        }
      } else if (response.data.data) {
        // Try to extract from generic data object
        console.log('Trying to extract sessions from generic data object');

        const data = response.data.data;

        // Check if data is an array of sessions
        if (Array.isArray(data)) {
          console.log('Data is an array, processing as sessions array');

          apiActive = data
            .filter(
              (s: { state?: string; status?: string }) =>
                s.state === 'IN_PROGRESS' ||
                s.state === 'LIVE' ||
                s.state === 'UPCOMING' ||
                s.status === 'active' ||
                s.status === 'upcoming'
            )
            .map((s: Record<string, unknown>) => formatSessionFromApi(s));

          apiPast = data
            .filter(
              (s: { state?: string; status?: string }) =>
                s.state === 'COMPLETED' ||
                s.state === 'CANCELLED' ||
                s.status === 'completed'
            )
            .map((s: Record<string, unknown>) => formatSessionFromApi(s));
        }
      }
    }

    console.log('Active sessions from API:', apiActive.length);
    console.log('Past sessions from API:', apiPast.length);

    return {
      active: apiActive,
      past: apiPast,
    };
  } catch (error) {
    console.error('Error fetching sessions:', error);
    // Return empty arrays if there's an error
    return {
      active: [],
      past: [],
    };
  }
};

export const fetchSessionDetails = async (
  sessionId: string
): Promise<SessionDetails> => {
  try {
    // Fetch real session details from the API
    console.log('Fetching session details for ID:', sessionId);
    console.log('API Base URL:', axiosInstance.defaults.baseURL);

    // Make sure we have a valid session ID
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    // Log the full URL being requested
    const requestUrl = `/sessions/${sessionId}`;
    console.log('Making API request to:', requestUrl);
    console.log('Full URL:', `${axiosInstance.defaults.baseURL}${requestUrl}`);

    // Helper function to process the session response
    const processSessionResponse = (response: any): SessionDetails => {
      console.log('Processing session response:', response.data);

      if (response.data && response.data.success) {
        // Get the session data from the API response
        const apiSessionData = response.data.data?.session;

        if (!apiSessionData) {
          throw new Error('Session data not found in API response');
        }

        // Format the session using our helper function
        const formattedSession = formatSessionFromApi(apiSessionData);

        // Calculate duration from startTime and endTime
        let duration = '';
        if (formattedSession.startTime && formattedSession.endTime) {
          try {
            const start = new Date(formattedSession.startTime);
            const end = new Date(formattedSession.endTime);
            const durationMs = end.getTime() - start.getTime();
            const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
            const durationHours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const durationMinutes = Math.floor(
              (durationMs % (1000 * 60 * 60)) / (1000 * 60)
            );

            if (durationDays > 0) {
              if (durationHours > 0) {
                duration = `${durationDays}d ${durationHours}h`;
              } else {
                duration = `${durationDays}d`;
              }
            } else if (durationHours > 0) {
              duration = `${durationHours}h ${durationMinutes}m`;
            } else {
              duration = `${durationMinutes}m`;
            }
          } catch (e) {
            console.error('Error calculating duration:', e);
            duration = 'Duration not available';
          }
        }

        // Calculate progress based on current time vs session time
        let progress = 0;
        if (formattedSession.startTime && formattedSession.endTime) {
          try {
            const now = new Date();
            const start = new Date(formattedSession.startTime);
            const end = new Date(formattedSession.endTime);

            if (now < start) {
              // Session hasn't started yet
              progress = 0;
            } else if (now > end) {
              // Session has ended
              progress = 100;
            } else {
              // Session is in progress
              const totalDuration = end.getTime() - start.getTime();
              const elapsed = now.getTime() - start.getTime();
              progress = Math.round((elapsed / totalDuration) * 100);
            }
          } catch (e) {
            console.error('Error calculating progress:', e);
          }
        }

        // Create default empty arrays for materials and modules if not provided
        const materials = Array.isArray(apiSessionData.materials)
          ? apiSessionData.materials.map((m: any) => ({
              id:
                m.id ||
                `material-${Math.random().toString(36).substring(2, 9)}`,
              title: m.title || 'Untitled Material',
              type: m.type || 'Document',
              size: m.size || 'Unknown size',
              url: m.url || '#',
            }))
          : [];

        const modules = Array.isArray(apiSessionData.modules)
          ? apiSessionData.modules.map((m: any) => ({
              id:
                m.id || `module-${Math.random().toString(36).substring(2, 9)}`,
              title: m.title || 'Untitled Module',
              duration: m.duration || '30m',
              completed: m.completed || false,
              type: m.type || 'Video',
              current: m.current || false,
            }))
          : [];

        // Return the session details with additional fields
        return {
          ...formattedSession,
          duration,
          progress,
          materials,
          modules,
        };
      } else {
        throw new Error(
          response.data?.message || 'Invalid response format from API'
        );
      }
    };

    // Make the API request with proper URL
    try {
      console.log('Attempting to fetch with path:', requestUrl);
      const response = await axiosInstance.get(requestUrl);
      console.log('Session details API response status:', response.status);
      console.log('Session details API response headers:', response.headers);
      console.log('Session details from API:', response.data);

      // If we get here, the request was successful
      return processSessionResponse(response);
    } catch (firstError) {
      console.error('Error with first URL attempt:', firstError);

      // If the first attempt failed, try with a different URL format
      // This is a fallback in case the API URL structure is different
      try {
        const alternativeUrl = `/api/sessions/${sessionId}`;
        console.log(
          'Attempting to fetch with alternative path:',
          alternativeUrl
        );
        const response = await axiosInstance.get(alternativeUrl);
        console.log(
          'Session details API response status (alternative):',
          response.status
        );
        console.log('Session details from API (alternative):', response.data);

        return processSessionResponse(response);
      } catch (secondError) {
        console.error('Error with alternative URL attempt:', secondError);
        throw firstError; // Throw the original error
      }
    }
  } catch (error) {
    console.error('Error fetching session details:', error);

    // Throw the error to be handled by the caller
    throw new Error(
      `Failed to fetch session details: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Helper function to format a session from the API to match our frontend format
const formatSessionFromApi = (apiSession: Record<string, unknown>): Session => {
  // Map session state to status if needed
  let status: 'active' | 'upcoming' | 'completed' = 'active';
  let state: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED' = 'LIVE';

  if (apiSession.state) {
    // Convert API state to our state enum
    const apiState = apiSession.state as string;
    if (apiState === 'UPCOMING') {
      state = 'UPCOMING';
      status = 'upcoming';
    } else if (apiState === 'COMPLETED') {
      state = 'COMPLETED';
      status = 'completed';
    } else if (apiState === 'CANCELLED') {
      state = 'CANCELLED';
      status = 'completed';
    } else if (apiState === 'IN_PROGRESS' || apiState === 'LIVE') {
      state = 'LIVE';
      status = 'active';
    }
  } else if (apiSession.status) {
    // If we have status but not state, derive state from status
    const apiStatus = apiSession.status as string;
    if (apiStatus === 'upcoming') {
      status = 'upcoming';
      state = 'UPCOMING';
    } else if (apiStatus === 'completed') {
      status = 'completed';
      state = 'COMPLETED';
    } else {
      status = 'active';
      state = 'LIVE';
    }
  }

  // Format date and time if they're provided as ISO strings
  let formattedDate = apiSession.date as string | undefined;
  let formattedTime = apiSession.time as string | undefined;

  if (apiSession.startTime) {
    try {
      const startDate = new Date(apiSession.startTime as string);
      formattedDate = startDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      if (apiSession.endTime) {
        const endDate = new Date(apiSession.endTime as string);
        formattedTime = `${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })} - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })}`;
      } else {
        formattedTime = startDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
        });
      }
    } catch (e) {
      console.error('Error formatting date/time:', e);
    }
  }

  // Check if the session has a quiz
  const hasQuiz: boolean =
    apiSession.hasQuiz !== undefined
      ? Boolean(apiSession.hasQuiz)
      : !!(apiSession.quizzes &&
        Array.isArray(apiSession.quizzes) &&
        (apiSession.quizzes as any[]).length > 0);

  // Get participants count
  const participantsCount =
    typeof apiSession.participants === 'number'
      ? (apiSession.participants as number)
      : (apiSession._count && (apiSession._count as any).participants) ||
        (Array.isArray(apiSession.participants)
          ? (apiSession.participants as any[]).length
          : 0);

  // Format participants list if available
  const participantsList = Array.isArray(apiSession.participants)
    ? (apiSession.participants as any[]).map((p) => ({
        id: p.id || '',
        name: p.name || 'Unknown',
        email: p.email || '',
        avatar: p.avatar || p.profilePhoto || undefined,
      }))
    : undefined;

  // Format created by if available
  const createdBy = apiSession.createdBy
    ? {
        id: (apiSession.createdBy as any).id || '',
        name: (apiSession.createdBy as any).name || 'Unknown',
        email: (apiSession.createdBy as any).email || '',
        avatar:
          (apiSession.createdBy as any).avatar ||
          (apiSession.createdBy as any).profilePhoto ||
          undefined,
      }
    : undefined;

  // Format invited users if available
  const invited = Array.isArray(apiSession.invited)
    ? (apiSession.invited as any[]).map((p) => ({
        id: p.id || '',
        name: p.name || 'Unknown',
        email: p.email || '',
        avatar: p.avatar || p.profilePhoto || undefined,
      }))
    : undefined;

  // Format quizzes if available
  const quizzes = Array.isArray(apiSession.quizzes)
    ? (apiSession.quizzes as any[]).map((q) => ({
        id: q.id || '',
        title: q.title || 'Untitled Quiz',
        timeLimitSeconds: q.timeLimitSeconds,
        pointsPerQuestion: q.pointsPerQuestion,
        passingScore: q.passingScore,
      }))
    : undefined;

  // Return the formatted session
  return {
    id: apiSession.id as string,
    title: (apiSession.title as string) || 'Untitled Session',
    description: (apiSession.description as string) || '',
    state,
    status,
    startTime: apiSession.startTime as string,
    endTime: apiSession.endTime as string,
    date: formattedDate || 'Date not specified',
    time: formattedTime || 'Time not specified',
    joiningCode: apiSession.joiningCode as string,
    code: (apiSession.joiningCode as string) || (apiSession.code as string),
    participants: participantsCount,
    participantsList,
    createdBy,
    invited,
    quizzes,
    hasQuiz,
    quizCompleted: apiSession.quizCompleted as boolean | undefined,
    score: apiSession.score as number | undefined,
    maxParticipants: apiSession.maxParticipants as number,
    allowGuests: apiSession.allowGuests as boolean,
    isActive: apiSession.isActive as boolean,
  };
};

export const joinSession = async (
  code: string
): Promise<JoinSessionResponse> => {
  try {
    // Validate the code format before sending to the backend
    if (!code || code.trim() === '') {
      throw new Error('Session code is required');
    }

    // Send the join request to the API
    // Using 'joiningCode' as the parameter name to match what the backend expects
    const response = await axiosInstance.post('/sessions/join', {
      joiningCode: code,
    });
    console.log('Join session response:', response.data);

    // Check if the response has the expected structure
    if (response.data && response.data.success) {
      // Extract session ID from the response
      const sessionId = response.data.data?.sessionId;

      if (!sessionId) {
        console.error('Session ID not found in API response:', response.data);
        throw new Error('Session ID not found in API response');
      }

      // Get the session data from the response if available
      let sessionData = response.data.data?.session;

      // If session data is not in the response, fetch it using the session ID
      if (!sessionData) {
        try {
          console.log('Fetching session details using ID:', sessionId);
          const sessionDetailsResponse = await axiosInstance.get(
            `/sessions/${sessionId}`
          );
          console.log('Session details response:', sessionDetailsResponse.data);

          if (
            sessionDetailsResponse.data &&
            sessionDetailsResponse.data.success
          ) {
            sessionData = sessionDetailsResponse.data.data?.session;
          }
        } catch (detailsError) {
          console.error(
            'Error fetching session details after join:',
            detailsError
          );
          // Continue with the join process even if details fetch fails
        }
      }

      // Format the session data if available
      let session: Session | undefined;
      if (sessionData) {
        session = formatSessionFromApi({
          ...sessionData,
          joiningCode: sessionData.joiningCode || code,
          id: sessionId, // Ensure the ID is set correctly
        });
      }

      // Show success message
      toast.success(response.data.message || 'Successfully joined session');

      // Return the response with session data if available
      return {
        success: true,
        message: response.data.message || 'Successfully joined session',
        data: {
          sessionId,
          session,
        },
      };
    } else if (response.data && response.data.message) {
      // If there's a message in the response, use it
      if (response.data.message.includes('Already a participant')) {
        // This is not an error, just information that user is already in the session
        toast.info(response.data.message);

        // Extract session ID from the response
        const sessionId = response.data.data?.sessionId;

        if (!sessionId) {
          console.error('Session ID not found in API response:', response.data);
          throw new Error('Session ID not found in API response');
        }

        // Get the session data from the response if available
        const sessionData = response.data.data?.session;

        // Return the response with session data if available
        return {
          success: true,
          message: response.data.message,
          data: {
            sessionId,
            session: sessionData
              ? formatSessionFromApi({
                  ...sessionData,
                  joiningCode: sessionData.joiningCode || code,
                  id: sessionId, // Ensure the ID is set correctly
                })
              : undefined,
          },
        };
      } else {
        throw new Error(response.data.message);
      }
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Error joining session:', error);

    // Show error toast
    toast.error(
      error instanceof Error
        ? error.message
        : 'Failed to join session. Please check the code and try again.'
    );

    // Rethrow the error to be handled by the caller
    throw error;
  }
};

export const leaveSession = async (sessionId: string): Promise<void> => {
  try {
    await axiosInstance.post(`/sessions/${sessionId}/leave`);
    toast.success('Successfully left the session');
  } catch (error) {
    console.error('Error leaving session:', error);
    toast.error('Failed to leave the session');
    throw error;
  }
};
