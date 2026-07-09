import { redis } from '@devvit/web/server';
import { ROOM_UNLOCK_THRESHOLDS } from '../../shared/constants';
import type { User, Contribution, CafeState, LeaderboardEntry } from '../../shared/types';

/**
 * Centralized Redis key generation.
 * All keys are namespaced under "cafe:" to prevent collisions.
 */
export const RedisKeys = {
  // User profile (JSON string)
  user: (userId: string) => `cafe:user:${userId}`,

  // Daily claim flag with TTL (string "true")
  dailyClaim: (userId: string, dateStr: string) => `cafe:claim:${userId}:${dateStr}`,

  // Single contribution record (JSON string)
  contribution: (id: string) => `cafe:contrib:${id}`,

  // Global cafe state (JSON string)
  cafeState: () => `cafe:state`,

  // Sorted set of all contribution IDs by timestamp
  contributionsList: () => `cafe:contributions:list`,

  // Sorted set of contribution IDs by category
  contributionsByCategory: (category: string) => `cafe:contributions:cat:${category}`,

  // Puzzle daily leaderboard (sorted set by timeMs)
  puzzleLeaderboard: (puzzleId: string, dateStr: string) => `cafe:puzzle:lead:${puzzleId}:${dateStr}`,

  // Personal best times (JSON map of puzzleId → timeMs)
  personalBest: (userId: string) => `cafe:puzzle:pb:${userId}`,

  // Time capsules sorted set (by unlock timestamp)
  timeCapsules: () => `cafe:timecapsules:all`,

  // Legacy alias
  progress: () => `cafe:state`,
} as const;

// ─── Helper: build rooms list from warmth ────────────────────────────────
function buildUnlockedRooms(totalWarmth: number): string[] {
  const rooms: string[] = ['foyer'];
  if (totalWarmth >= ROOM_UNLOCK_THRESHOLDS.FIREPLACE) rooms.push('fireplace');
  if (totalWarmth >= ROOM_UNLOCK_THRESHOLDS.BOOKSHELF) rooms.push('bookshelf');
  if (totalWarmth >= ROOM_UNLOCK_THRESHOLDS.GARDEN) rooms.push('garden');
  if (totalWarmth >= ROOM_UNLOCK_THRESHOLDS.MUSIC_ROOM) rooms.push('music_room');
  return rooms;
}

// ─── Helper: create a default User ──────────────────────────────────────
function createDefaultUser(userId: string, username: string): User {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: userId,
    username,
    joinedAt: now,
    lastVisit: now,
    visitCount: 1,
    currentCoffeeTokens: 1, // Start with one free token
    lastCoffeeClaim: null,
    totalNotesWritten: 0,
    totalWarmthContributed: 0,
    unlockedRooms: ['foyer'],
    puzzleHighScore: null,

    // Legacy aliases
    joinedDate: now,
    tokenCount: 1,
    contributionCount: 0,
    lastClaimedTimestamp: null,
  };
}

// ─── Helper: create a default CafeState ─────────────────────────────────
function createDefaultCafeState(): CafeState {
  return {
    totalVisitors: 0,
    totalNotes: 0,
    totalWarmth: 0,
    roomsUnlocked: ['foyer'],
    lastUpdated: Math.floor(Date.now() / 1000),
  };
}

// ─── Helper: sync legacy fields on a User object ────────────────────────
function syncUserLegacy(user: User): User {
  user.joinedDate = user.joinedAt;
  user.tokenCount = user.currentCoffeeTokens;
  user.contributionCount = user.totalNotesWritten;
  user.lastClaimedTimestamp = user.lastCoffeeClaim;
  return user;
}

// ─── Helper: safe JSON parse ────────────────────────────────────────────
function safeParse<T>(raw: string | undefined | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Centralized Redis Service.
 * All Redis access goes through this object.
 */
export const RedisService = {
  // ═══════════════════════════════════════════════════════════════════════
  // USER METHODS
  // ═══════════════════════════════════════════════════════════════════════

  /** Fetch a user by ID. Returns null if not found. */
  async getUser(userId: string): Promise<User | null> {
    const raw = await redis.get(RedisKeys.user(userId));
    if (!raw) return null;
    const user = safeParse<User | null>(raw, null);
    return user ? syncUserLegacy(user) : null;
  },

  /** Fetch an existing user or create a new one automatically. */
  async getOrCreateUser(userId: string, username: string): Promise<User> {
    let user = await this.getUser(userId);
    if (!user) {
      user = createDefaultUser(userId, username);
      await this.saveUser(user);

      // Increment global visitor count
      await this.incrementVisitors();
    } else {
      // Update visit tracking
      user.lastVisit = Math.floor(Date.now() / 1000);
      user.visitCount += 1;
      await this.saveUser(user);
    }
    return syncUserLegacy(user);
  },

  /** Persist a user to Redis. */
  async saveUser(user: User): Promise<void> {
    const synced = syncUserLegacy(user);
    await redis.set(RedisKeys.user(synced.id), JSON.stringify(synced));
  },

  /** Update specific fields on a user. */
  async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'username'>>): Promise<User | null> {
    const user = await this.getUser(userId);
    if (!user) return null;
    Object.assign(user, updates);
    await this.saveUser(user);
    return syncUserLegacy(user);
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DAILY COFFEE TOKEN
  // ═══════════════════════════════════════════════════════════════════════

  /** Check whether the user can claim today's coffee. */
  async canClaimCoffee(userId: string, dateStr: string): Promise<boolean> {
    const claimed = await redis.get(RedisKeys.dailyClaim(userId, dateStr));
    return claimed !== 'true';
  },

  /** Mark today's coffee as claimed (TTL to midnight UTC). */
  async setClaimedToday(userId: string, dateStr: string): Promise<void> {
    const msToMidnight = new Date().setUTCHours(24, 0, 0, 0) - Date.now();
    const ttlSeconds = Math.max(Math.floor(msToMidnight / 1000), 60);
    await redis.set(RedisKeys.dailyClaim(userId, dateStr), 'true', {
      expiration: new Date(Date.now() + ttlSeconds * 1000),
    });
  },

  /** Full claim flow: validate, give token, mark claimed, return updated user. */
  async claimDailyCoffee(userId: string, dateStr: string): Promise<{ success: boolean; user: User; cooldownSeconds: number }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, user: createDefaultUser(userId, userId), cooldownSeconds: 0 };
    }

    const canClaim = await this.canClaimCoffee(userId, dateStr);
    if (!canClaim) {
      const msToMidnight = new Date().setUTCHours(24, 0, 0, 0) - Date.now();
      return { success: false, user, cooldownSeconds: Math.floor(msToMidnight / 1000) };
    }

    const now = Math.floor(Date.now() / 1000);
    user.currentCoffeeTokens += 1;
    user.lastCoffeeClaim = now;
    await this.saveUser(user);
    await this.setClaimedToday(userId, dateStr);

    return { success: true, user: syncUserLegacy(user), cooldownSeconds: 0 };
  },

  // Backwards compat
  async hasClaimedToday(userId: string, dateStr: string): Promise<boolean> {
    return !(await this.canClaimCoffee(userId, dateStr));
  },

  // ═══════════════════════════════════════════════════════════════════════
  // GLOBAL CAFE STATE
  // ═══════════════════════════════════════════════════════════════════════

  /** Fetch the global cafe state. Creates default if missing. */
  async getCafeState(): Promise<CafeState> {
    const raw = await redis.get(RedisKeys.cafeState());
    return safeParse<CafeState>(raw, createDefaultCafeState());
  },

  /** Overwrite the entire cafe state. */
  async saveCafeState(state: CafeState): Promise<void> {
    state.lastUpdated = Math.floor(Date.now() / 1000);
    state.roomsUnlocked = buildUnlockedRooms(state.totalWarmth);
    await redis.set(RedisKeys.cafeState(), JSON.stringify(state));
  },

  /** Add warmth and return the new state with auto-unlocked rooms. */
  async updateCafeWarmth(amount: number): Promise<CafeState> {
    const state = await this.getCafeState();
    state.totalWarmth += amount;
    state.roomsUnlocked = buildUnlockedRooms(state.totalWarmth);
    await this.saveCafeState(state);
    return state;
  },

  /** Increment global visitor count. */
  async incrementVisitors(): Promise<CafeState> {
    const state = await this.getCafeState();
    state.totalVisitors += 1;
    await this.saveCafeState(state);
    return state;
  },

  /** Increment global note count and warmth. */
  async incrementNotes(warmth: number = 1): Promise<CafeState> {
    const state = await this.getCafeState();
    state.totalNotes += 1;
    state.totalWarmth += warmth;
    state.roomsUnlocked = buildUnlockedRooms(state.totalWarmth);
    await this.saveCafeState(state);
    return state;
  },

  // Legacy alias
  async getProgress() {
    const state = await this.getCafeState();
    return {
      totalContributions: state.totalNotes,
      unlockedRooms: state.roomsUnlocked,
      activeUsersCount: state.totalVisitors,
    };
  },
  async saveProgress() {
    // No-op — progress is derived from CafeState now
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CONTRIBUTION METHODS
  // ═══════════════════════════════════════════════════════════════════════

  /** Fetch a single contribution by ID. */
  async getContribution(id: string): Promise<Contribution | null> {
    const raw = await redis.get(RedisKeys.contribution(id));
    return safeParse<Contribution | null>(raw, null);
  },

  /** Save a contribution and index it. */
  async saveContribution(contrib: Contribution): Promise<void> {
    await redis.set(RedisKeys.contribution(contrib.id), JSON.stringify(contrib));

    // Index in global sorted set (score = createdAt)
    await redis.zAdd(RedisKeys.contributionsList(), {
      member: contrib.id,
      score: contrib.createdAt,
    });

    // Index by category
    await redis.zAdd(RedisKeys.contributionsByCategory(contrib.category), {
      member: contrib.id,
      score: contrib.createdAt,
    });
  },

  /** Get most recent contributions (newest first). */
  async getRecentContributions(limit: number = 50): Promise<Contribution[]> {
    const ids = await redis.zRange(RedisKeys.contributionsList(), 0, limit - 1, {
      by: 'score',
      reverse: true,
    });

    const contribs: Contribution[] = [];
    for (const entry of ids) {
      const c = await this.getContribution(entry.member);
      if (c) contribs.push(c);
    }
    return contribs;
  },

  /** Get contributions filtered by category (newest first). */
  async getContributionsByCategory(category: string, limit: number = 50): Promise<Contribution[]> {
    const ids = await redis.zRange(RedisKeys.contributionsByCategory(category), 0, limit - 1, {
      by: 'score',
      reverse: true,
    });

    const contribs: Contribution[] = [];
    for (const entry of ids) {
      const c = await this.getContribution(entry.member);
      if (c) contribs.push(c);
    }
    return contribs;
  },

  /** Get a single random contribution. */
  async getRandomContribution(): Promise<Contribution | null> {
    const totalRaw = await redis.zCard(RedisKeys.contributionsList());
    const total = totalRaw ?? 0;
    if (total === 0) return null;

    const randomIndex = Math.floor(Math.random() * total);
    const ids = await redis.zRange(RedisKeys.contributionsList(), randomIndex, randomIndex, {
      by: 'score',
    });

    if (ids.length === 0) return null;
    const entry = ids[0];
    if (!entry) return null;
    return this.getContribution(entry.member);
  },

  /** Fetch a contribution by ID (alias). */
  async getContributionById(id: string): Promise<Contribution | null> {
    return this.getContribution(id);
  },

  // Legacy aliases
  async getLatestContributions(limit: number = 50) {
    return this.getRecentContributions(limit);
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PUZZLE LEADERBOARD METHODS
  // ═══════════════════════════════════════════════════════════════════════

  async submitPuzzleScore(
    puzzleId: string,
    dateStr: string,
    username: string,
    timeMs: number
  ): Promise<void> {
    await redis.zAdd(RedisKeys.puzzleLeaderboard(puzzleId, dateStr), {
      member: username,
      score: timeMs,
    });
  },

  async getPuzzleLeaderboard(puzzleId: string, dateStr: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    const range = await redis.zRange(RedisKeys.puzzleLeaderboard(puzzleId, dateStr), 0, limit - 1, {
      by: 'score',
    });

    return range.map((entry, idx) => ({
      username: entry.member,
      timeMs: entry.score,
      rank: idx + 1,
      date: dateStr,
    }));
  },

  async getPersonalBest(userId: string, puzzleId: string): Promise<number | null> {
    const raw = await redis.get(RedisKeys.personalBest(userId));
    const data = safeParse<Record<string, number>>(raw, {});
    return data[puzzleId] ?? null;
  },

  async savePersonalBest(userId: string, puzzleId: string, timeMs: number): Promise<void> {
    const raw = await redis.get(RedisKeys.personalBest(userId));
    const data = safeParse<Record<string, number>>(raw, {});
    data[puzzleId] = timeMs;
    await redis.set(RedisKeys.personalBest(userId), JSON.stringify(data));
  },
};
