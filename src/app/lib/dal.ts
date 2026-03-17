// Data Access Layer for authentication and session management
import { cookies } from 'next/headers';

/**
 * Verifies the current user session
 * @returns The user session if authenticated, null otherwise
 */
export async function verifySession() {
  try {
    // Get the token from cookies - using the server-side cookies API
    const cookiesList = await cookies();
    const token = cookiesList.get('accessToken')?.value;

    if (!token) {
      return null;
    }

    // Make API call to validate token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store', // Don't cache this request
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user || data.session || { isAuthenticated: true };
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

/**
 * Fetches user dashboard data
 * @returns Dashboard data including quiz scores, streak, etc.
 */
export async function fetchDashboardData() {
  try {
    // Get the token from cookies - using the server-side cookies API
    const cookiesList = await cookies();
    const token = cookiesList.get('accessToken')?.value;

    if (!token) {
      throw new Error('No authentication token found');
    }

    // Try to fetch from API
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store', // Don't cache this request
        }
      );

      if (response.ok) {
        return await response.json();
      }
    } catch (apiError) {
      console.error('API error:', apiError);
      // Fall through to return mock data
    }

    // Return mock data if API call fails
    console.log('Returning mock dashboard data');
    return {
      quizScores: [
        { quiz: 'Quiz 1', score: 252 },
        { quiz: 'Quiz 2', score: 270 },
        { quiz: 'Quiz 3', score: 266 },
        { quiz: 'Quiz 4', score: 290 },
        { quiz: 'Quiz 5', score: 292 },
        { quiz: 'Quiz 6', score: 291 },
        { quiz: 'Quiz 7', score: 298 },
      ],
      courseProgress: 64,
      dailyStreak: 12,
      highestQuizScore: 513,
      topPerformers: [
        {
          rank: 1,
          name: 'Olivia Martin',
          email: 'olivia.martin@email.com',
          score: 515,
        },
        {
          rank: 2,
          name: 'Jackson Lee',
          email: 'jackson.lee@email.com',
          score: 510,
        },
        {
          rank: 3,
          name: 'Isabella Nguyen',
          email: 'isabella.nguyen@email.com',
          score: 505,
        },
      ],
      upcomingSessions: [
        { title: 'Communication Skills', date: 'March 18, 2025' },
        { title: 'Leadership Workshop', date: 'March 19, 2025' },
      ],
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}
