import { axiosInstance as axios } from '@/lib/axios';
import {
  Team,
  TeamsResponse,
  TeamLeaderboardResponse,
} from '@/types/teams';

// User endpoints (accessible to regular users)
export const getTeams = async (
  sessionId: string,
  includeInactive = false,
): Promise<TeamsResponse> => {
  const response = await axios.get(
    `/teams/${sessionId}/teams?includeInactive=${includeInactive}`,
  );
  return response.data.data;
};

export const getTeamById = async (
  sessionId: string,
  teamId: string,
): Promise<Team> => {
  const response = await axios.get(`/teams/${sessionId}/teams/${teamId}`);
  return response.data.data.team;
};

export const getTeamLeaderboard = async (
  sessionId: string,
  sortBy: string = 'totalXP',
  order: 'asc' | 'desc' = 'desc',
  includeInactive = false,
): Promise<TeamLeaderboardResponse> => {
  const response = await axios.get(
    `/teams/${sessionId}/teams/leaderboard?sortBy=${sortBy}&order=${order}&includeInactive=${includeInactive}`,
  );
  return response.data.data;
}; 