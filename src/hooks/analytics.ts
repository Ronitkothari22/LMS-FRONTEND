import { useState, useEffect } from 'react';

// Define interfaces for analytics data
interface AnalyticsData {
  totalUsers: number;
  activeSessions: number;
  completedQuizzes: number;
  averageScore: number;
  dailyActivity: Array<{
    date: string;
    users: number;
    sessions: number;
  }>;
}

interface UseAnalyticsResult {
  data: AnalyticsData | null;
  liveMetrics: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  connected: boolean;
}

// Hook for analytics data - disabled for now since API endpoints don't exist
export function useAnalytics(): UseAnalyticsResult {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  // Fetch initial analytics data - disabled since API doesn't exist
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Disabled API call since endpoint doesn't exist
      // const response = await fetch('/api/analytics');
      // if (!response.ok) throw new Error('Failed to fetch analytics');
      // const analyticsData = await response.json();
      // setData(analyticsData);
      
      // Return empty data instead
      setData(null);
      setConnected(false);
    } catch {
      console.log('Analytics API not available');
      setError(null); // Don't show error since this is expected
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const refetch = async () => {
    await fetchAnalytics();
  };

  return {
    data,
    liveMetrics: null,
    loading,
    error,
    refetch,
    connected,
  };
}

// Hook for live session monitoring - disabled since WebSocket doesn't exist
export function useLiveSessionMonitor() {
  const [liveSessions, setLiveSessions] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Disabled since WebSocket endpoint doesn't exist
    console.log('Live session monitoring disabled - WebSocket endpoint not available');
    setLiveSessions([]);
    setLoading(false);
  }, []);

  return { liveSessions, loading };
}

// Hook for performance metrics - disabled since API doesn't exist
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Disabled since API endpoint doesn't exist
    console.log('Performance metrics disabled - API endpoint not available');
    setMetrics(null);
    setLoading(false);
  }, []);

  return { metrics, loading };
} 