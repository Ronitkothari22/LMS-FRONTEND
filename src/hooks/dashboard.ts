import { useState, useEffect, useCallback } from 'react';
import {
  fetchDashboardData,
  SimplifiedDashboardData,
} from '@/lib/api/dashboard';
import { getCookie } from 'cookies-next';
import { useUser } from './auth';

interface UseDashboardResult {
  data: SimplifiedDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<SimplifiedDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: userData } = useUser();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for authentication token
      const token = getCookie('accessToken');
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
      }

      // Fetch dashboard data
      const dashboardData = await fetchDashboardData();

      // If we got data, set it
      if (dashboardData) {
        console.log('Dashboard data fetched successfully:', dashboardData);
        setData(dashboardData);
      } else {
        // If no data was returned, set an error
        setError('No dashboard data available');
      }
    } catch (err) {
      console.error('Error in useDashboard hook:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on initial load and when user data changes
  useEffect(() => {
    fetchData();
  }, [fetchData, userData?.id]);

  // Return the data, loading state, error, and refetch function
  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
