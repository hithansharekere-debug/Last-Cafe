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
  success: false;
  error: string;
}

export interface InitResponse {
  success: true;
  data: {
    postId: string;
    user: User | null;
    cafe: CafeState;
    rooms: Room[];
    canClaimCoffee: boolean;
    progress: CafeProgress;
  };
}

export interface ClaimTokenResponse {
  success: boolean;
  data?: {
    user: User;
    cafe: CafeState;
    tokenCount: number;
    lastClaimedTimestamp: number;
  };
  error?: string;
}

export interface SpendTokenResponse {
  success: boolean;
  data?: {
    user: User;
    contribution: Contribution;
    cafe: CafeState;
    tokenCount: number;
    progress: CafeProgress;
  };
  error?: string;
}

export interface AddContributionResponse {
  success: boolean;
  data?: {
    contribution: Contribution;
    cafe: CafeState;
    progress: CafeProgress;
  };
  error?: string;
}

export interface ContributionsListResponse {
  success: boolean;
  data?: {
    contributions: Contribution[];
  };
  error?: string;
}

export interface UnlockRoomResponse {
  success: boolean;
  data?: {
    roomId: string;
    progress: CafeProgress;
  };
  error?: string;
}

export interface PuzzleSubmitResponse {
  success: boolean;
  data?: {
    personalBestTimeMs: number;
    isNewPersonalBest: boolean;
    leaderboard: LeaderboardEntry[];
  };
  error?: string;
}

export interface LeaderboardResponse {
  success: boolean;
  data?: {
    leaderboard: LeaderboardEntry[];
  };
  error?: string;
}
