export interface Team {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  maxMembers?: number;
  isActive: boolean;
  memberCount: number;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    profilePhoto?: string | null;
    companyPosition?: string;
    department?: string;
    xpPoints?: number;
  };
  role: TeamRole;
  joinedAt: string;
}

export type TeamRole = 'LEADER' | 'MEMBER';

export interface QuizMetrics {
  totalQuizScore: number;
  averageQuizScore: number;
  totalQuizzesCompleted: number;
  participationRate: number;
  topContributor: string | null;
  topContribution: number;
}

export interface QuizContribution {
  totalQuizScore: number;
  averageQuizScore: number;
  quizzesCompleted: number;
  participationRate: number;
}

export interface PointAwards {
  manualPointsAwarded: number;
  totalAwardsCount: number;
  recentAwards: unknown[];
}

export interface IndividualPoints {
  totalPoints: number;
  totalAwards: number;
}

export interface IndividualPointAwards {
  totalIndividualPoints: number;
  totalIndividualAwards: number;
  topIndividualContributor: {
    userId: string;
    userName: string;
    totalIndividualPoints: number;
    totalIndividualAwards: number;
  };
}

export interface TeamLeaderboardMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    profilePhoto: string | null;
    xpPoints: number;
  };
  role: TeamRole;
  joinedAt: string;
  quizContribution: QuizContribution;
  individualPoints: IndividualPoints;
}

export interface TeamLeaderboard {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  memberCount: number;
  maxMembers: number;
  members: TeamLeaderboardMember[];
  quizMetrics: QuizMetrics;
  pointAwards: PointAwards;
  individualPointAwards: IndividualPointAwards;
  totalScore: number;
  createdAt: string;
  updatedAt: string;
  rank: number;
}

export interface TeamLeaderboardResponse {
  session: {
    id: string;
    title: string;
    state: string;
  };
  leaderboard: TeamLeaderboard[];
  summary: {
    totalTeams: number;
    activeTeams: number;
    totalParticipants: number;
    totalQuizzes: number;
    highestTeamScore: number;
    totalQuizPoints: number;
    totalManualPoints: number;
    sortedBy: string;
    sortOrder: string;
  };
}

export interface TeamsResponse {
  session: {
    id: string;
    title: string;
  };
  teams: Team[];
  totalTeams: number;
  activeTeams: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  statusCode?: number;
} 