import type { ContributionCategory } from './constants';

// ─── User Profile ───────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  joinedAt: number;           // Unix timestamp
  lastVisit: number;          // Unix timestamp
  visitCount: number;
  currentCoffeeTokens: number;
  lastCoffeeClaim: number | null; // Unix timestamp, null if never claimed
  totalNotesWritten: number;
  totalWarmthContributed: number;
  unlockedRooms: string[];    // Room IDs the user has witnessed unlock
  puzzleHighScore: number | null; // Best puzzle time in ms, null if never played

  // Aliases kept for backwards compatibility with existing screens
  /** @deprecated Use joinedAt */
  joinedDate: number;
  /** @deprecated Use currentCoffeeTokens */
  tokenCount: number;
  /** @deprecated Use totalNotesWritten */
  contributionCount: number;
  /** @deprecated Use lastCoffeeClaim */
  lastClaimedTimestamp: number | null;
}

// ─── Contribution ───────────────────────────────────────────────────────
export interface Contribution {
  id: string;
  authorId: string;
  username: string;
  category: ContributionCategory;
  message: string;
  createdAt: number;          // Unix timestamp
  warmthGiven: number;        // How much warmth this note contributed (default 1)
  likes: number;

  // Time capsule fields
  targetDate?: number;        // Unix timestamp — only for Time Capsules
  isUnlocked: boolean;        // For Time Capsules; always true for others

  // Aliases kept for backwards compatibility with existing screens
  /** @deprecated Use authorId */
  userId: string;
  /** @deprecated Use message */
  text: string;
  /** @deprecated Use createdAt */
  timestamp: number;
}

// ─── Room ───────────────────────────────────────────────────────────────
export interface Room {
  id: string;
  name: string;
  threshold: number;          // Warmth required to unlock
  isUnlocked: boolean;
}

// ─── Global Cafe State ──────────────────────────────────────────────────
export interface CafeState {
  totalVisitors: number;
  totalNotes: number;
  totalWarmth: number;
  roomsUnlocked: string[];    // Room IDs that are currently unlocked
  lastUpdated: number;        // Unix timestamp
}

// ─── Legacy alias so existing screens keep compiling ────────────────────
export interface CafeProgress {
  totalContributions: number;
  unlockedRooms: string[];
  activeUsersCount: number;
}

// ─── Puzzle ─────────────────────────────────────────────────────────────
export interface Puzzle {
  id: string;
  name: string;
  piecesCount: number;
  isDaily: boolean;
  dailyDate?: string;         // YYYY-MM-DD
}

export interface LeaderboardEntry {
  username: string;
  timeMs: number;
  rank: number;
  date: string;               // YYYY-MM-DD
}

// ─── Navigation ─────────────────────────────────────────────────────────
export interface NavigationState {
  activeScreen: 'welcome' | 'cafe' | 'table' | 'discover' | 'puzzle' | 'profile';
}

// ─── API Response Types ─────────────────────────────────────────────────
export interface ErrorResponse {
  status: 'error';
  message: string;
}

export interface InitResponse {
  type: 'init';
  postId: string;
  user: User | null;
  cafe: CafeState;
  rooms: Room[];
  canClaimCoffee: boolean;

  // Legacy alias so existing screens keep compiling
  progress: CafeProgress;
}

export interface ClaimTokenResponse {
  success: boolean;
  user: User;
  cafe: CafeState;

  // Legacy aliases
  tokenCount: number;
  lastClaimedTimestamp: number;
}

export interface SpendTokenResponse {
  success: boolean;
  user: User;
  contribution: Contribution;
  cafe: CafeState;

  // Legacy aliases
  tokenCount: number;
  progress: CafeProgress;
}

export interface AddContributionResponse {
  success: boolean;
  contribution: Contribution;
  cafe: CafeState;

  // Legacy alias
  progress: CafeProgress;
}

export interface ContributionsListResponse {
  contributions: Contribution[];
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
