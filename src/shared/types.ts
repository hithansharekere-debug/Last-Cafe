import type { ContributionCategory } from './constants';

export interface User {
  id: string;
  username: string;
  joinedDate: number; // Unix timestamp
  tokenCount: number;
  contributionCount: number;
  lastClaimedTimestamp: number | null; // Unix timestamp for daily token claim tracking
}

export interface Contribution {
  id: string;
  userId: string;
  username: string;
  category: ContributionCategory;
  text: string;
  timestamp: number; // Unix timestamp
  targetDate?: number; // For Time Capsules
  isUnlocked: boolean; // For Time Capsules (always true for others)
}

export interface Room {
  id: string;
  name: string;
  threshold: number;
  isUnlocked: boolean;
}

export interface CafeProgress {
  totalContributions: number;
  unlockedRooms: string[]; // List of room ids (fireplace, bookshelf, garden, music_room)
  activeUsersCount: number;
}

export interface Puzzle {
  id: string;
  name: string;
  piecesCount: number;
  isDaily: boolean;
  dailyDate?: string; // YYYY-MM-DD
}

export interface LeaderboardEntry {
  username: string;
  timeMs: number;
  rank: number;
  date: string; // YYYY-MM-DD
}

export interface NavigationState {
  activeScreen: 'welcome' | 'cafe' | 'table' | 'discover' | 'puzzle' | 'profile';
}

// Client-Server Communication Payload Types
export interface ErrorResponse {
  status: 'error';
  message: string;
}

export interface InitResponse {
  type: 'init';
  postId: string;
  user: User | null;
  progress: CafeProgress;
  rooms: Room[];
}

export interface ClaimTokenResponse {
  success: boolean;
  tokenCount: number;
  lastClaimedTimestamp: number;
}

export interface SpendTokenResponse {
  success: boolean;
  tokenCount: number;
  contribution: Contribution;
  progress: CafeProgress;
}

export interface AddContributionResponse {
  success: boolean;
  contribution: Contribution;
  progress: CafeProgress;
}

export interface UnlockRoomResponse {
  success: boolean;
  roomId: string;
  progress: CafeProgress;
}

export interface PuzzleSubmitResponse {
  success: boolean;
  personalBestTimeMs: number;
  isNewPersonalBest: boolean;
  leaderboard: LeaderboardEntry[];
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}
