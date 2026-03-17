import { axiosInstance } from '@/lib/axios';
import { toast } from 'sonner';

// Types based on the API documentation
export interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    belt: string;
    xpPoints: number;
  };
  quizScores: Array<{
    quizId: string;
    quizTitle: string;
    score: number;
    totalMarks: number;
    completedAt: string;
  }>;
  courseProgress: {
    percentage: number;
    completedSessions: number;
    totalSessions: number;
  };
  dailyStreak: number;
  highestQuizScore: {
    score: number;
    quizTitle: string;
  } | null;
  topPerformers: Array<{
    userId: string;
    name: string;
    score: number;
    belt: string;
  }>;
  upcomingSessions: Array<{
    id: string;
    title: string;
    description: string | null;
    startTime: string | null;
    endTime: string | null;
    joiningCode: string | null;
  }>;
}

// Simplified dashboard data for the frontend
export interface SimplifiedDashboardData {
  quizScores: { quiz: string; score: number }[];
  courseProgress: number;
  dailyStreak: number;
  highestQuizScore: number;
  topPerformers: {
    rank: number;
    name: string;
    email: string;
    score: number;
  }[];
  upcomingSessions: {
    title: string;
    date: string;
  }[];
  userName?: string;
  userXp?: number;
}

// Function to fetch dashboard data from the API
export const fetchDashboardData =
  async (): Promise<SimplifiedDashboardData | null> => {
    try {
      // Attempt to fetch data from the API
      console.log('Fetching dashboard data from API');
      const response = await axiosInstance.get('/dashboard');
      console.log('Dashboard API response:', response.data);

      // If successful, transform the API data to the simplified format
      if (response.data && response.data.success) {
        const apiData = response.data.data as DashboardData;
        console.log('Dashboard API data:', apiData);

        // Transform API data to the simplified format expected by the frontend
        return {
          quizScores: Array.isArray(apiData.quizScores) 
            ? apiData.quizScores.map((score) => ({
                quiz: score.quizTitle || 'Quiz',
                score: Math.round(score.score) || 0, // Score is already in correct format
              }))
            : [],
          courseProgress: apiData.courseProgress?.percentage || 0,
          dailyStreak: apiData.dailyStreak || 0,
          highestQuizScore: apiData.highestQuizScore?.score 
            ? Math.round(apiData.highestQuizScore.score) // Score is already in correct format
            : 0,
          topPerformers: Array.isArray(apiData.topPerformers)
            ? apiData.topPerformers.map((performer, index) => ({
                rank: index + 1,
                name: performer.name || 'Unknown',
                email: performer.userId || '', // Using userId as email since the API doesn't provide email
                score: performer.score || 0,
              }))
            : [],
          upcomingSessions: Array.isArray(apiData.upcomingSessions)
            ? apiData.upcomingSessions.map((session) => ({
                title: session.title || 'Upcoming Session',
                date: session.startTime
                  ? new Date(session.startTime).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Date TBD',
              }))
            : [],
          userName: apiData.user?.name || 'User',
          userXp: apiData.user?.xpPoints || 0,
        };
      } else if (response.data) {
        // If we got a response but it's not in the expected format
        console.warn(
          'Unexpected dashboard API response format:',
          response.data
        );
        toast.error('Unexpected data format from server');
        return null;
      }

      // If the response format is unexpected, throw an error
      throw new Error('Invalid response format from dashboard API');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);

      // Log detailed error information for debugging
      if (error.response) {
        console.error('API Error Response:', {
          status: error.response.status,
          data: error.response.data,
        });
      }

      // Show a toast notification for user feedback
      toast.error('Could not load dashboard data. Please try again later.');

      // Return null instead of mock data
      return null;
    }
  };
