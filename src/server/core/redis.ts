import { redis } from '@devvit/web/server';
import { ROOM_UNLOCK_THRESHOLDS } from '../../shared/constants';
import type { User, Contribution, CafeState, LeaderboardEntry } from '../../shared/types';

/**
 * Centralized Redis key generation.
 * All keys are namespaced under "cafe:" to prevent collisions.
 */
export const RedisKeys = {
  user: (userId: string) => `cafe:user:${userId}`,
  dailyClaim: (userId: string, dateStr: string) => `cafe:claim:${userId}:${dateStr}`,
  contribution: (id: string) => `cafe:contrib:${id}`,
  cafeState: () => `cafe:state`,
  contributionsList: () => `cafe:contributions:list`,
  contributionsByCategory: (category: string) => `cafe:contributions:cat:${category}`,
  puzzleLeaderboard: (puzzleId: string, dateStr: string) => `cafe:puzzle:lead:${puzzleId}:${dateStr}`,
  personalBest: (userId: string) => `cafe:puzzle:pb:${userId}`,
  timeCapsules: () => `cafe:timecapsules:all`,
  progress: () => `cafe:state`,
} as const;

// ─── Helper: build rooms list from warmth ────────────────────────────────
export function buildUnlockedRooms(totalWarmth: number): string[] {
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
  } catch (error) {
    console.error('JSON parsing failed. Raw data:', raw, error);
    return fallback;
  }
}

/**
 * Hardened Centralized Redis Service with try/catch handlers on every method
 * to prevent Redis network or node failures from crashing the Devvit application.
 */
export const RedisService = {
  // ═══════════════════════════════════════════════════════════════════════
  // USER METHODS
  // ═══════════════════════════════════════════════════════════════════════

  async getUser(userId: string): Promise<User | null> {
    try {
      const raw = await redis.get(RedisKeys.user(userId));
      if (!raw) return null;
      const user = safeParse<User | null>(raw, null);
      return user ? syncUserLegacy(user) : null;
    } catch (error) {
      console.error(`Redis failure in getUser for user "${userId}":`, error);
      return null;
    }
  },

  async getOrCreateUser(userId: string, username: string): Promise<User> {
    try {
      let user = await this.getUser(userId);
      if (!user) {
        user = createDefaultUser(userId, username);
        await this.saveUser(user);
        await this.incrementVisitors();
      } else {
        user.lastVisit = Math.floor(Date.now() / 1000);
        user.visitCount += 1;
        await this.saveUser(user);
      }
      return syncUserLegacy(user);
    } catch (error) {
      console.error(`Redis failure in getOrCreateUser for user "${userId}":`, error);
      return createDefaultUser(userId, username);
    }
  },

  async saveUser(user: User): Promise<void> {
    try {
      const synced = syncUserLegacy(user);
      await redis.set(RedisKeys.user(synced.id), JSON.stringify(synced));
    } catch (error) {
      console.error(`Redis failure in saveUser for user "${user.id}":`, error);
    }
  },

  async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'username'>>): Promise<User | null> {
    try {
      const user = await this.getUser(userId);
      if (!user) return null;
      Object.assign(user, updates);
      await this.saveUser(user);
      return syncUserLegacy(user);
    } catch (error) {
      console.error(`Redis failure in updateUser for user "${userId}":`, error);
      return null;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DAILY COFFEE TOKEN
  // ═══════════════════════════════════════════════════════════════════════

  async canClaimCoffee(userId: string, dateStr: string): Promise<boolean> {
    try {
      const claimed = await redis.get(RedisKeys.dailyClaim(userId, dateStr));
      return claimed !== 'true';
    } catch (error) {
      console.error(`Redis failure in canClaimCoffee for user "${userId}":`, error);
      return false; // Fallback to safe mode (prevent claim exploitation)
    }
  },

  async setClaimedToday(userId: string, dateStr: string): Promise<void> {
    try {
      const msToMidnight = new Date().setUTCHours(24, 0, 0, 0) - Date.now();
      const ttlSeconds = Math.max(Math.floor(msToMidnight / 1000), 60);
      await redis.set(RedisKeys.dailyClaim(userId, dateStr), 'true', {
        expiration: new Date(Date.now() + ttlSeconds * 1000),
      });
    } catch (error) {
      console.error(`Redis failure in setClaimedToday for user "${userId}":`, error);
    }
  },

  async claimDailyCoffee(userId: string, dateStr: string): Promise<{ success: boolean; user: User; cooldownSeconds: number }> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return { success: false, user: createDefaultUser(userId, userId), cooldownSeconds: 0 };
      }

      const canClaim = await this.canClaimCoffee(userId, dateStr);
      if (!canClaim) {
        const msToMidnight = new Date().setUTCHours(24, 0, 0, 0) - Date.now();
        return { success: false, user, cooldownSeconds: Math.max(Math.floor(msToMidnight / 1000), 0) };
      }

      const now = Math.floor(Date.now() / 1000);
      user.currentCoffeeTokens += 1;
      user.lastCoffeeClaim = now;
      await this.saveUser(user);
      await this.setClaimedToday(userId, dateStr);

      return { success: true, user: syncUserLegacy(user), cooldownSeconds: 0 };
    } catch (error) {
      console.error(`Redis failure in claimDailyCoffee for user "${userId}":`, error);
      return { success: false, user: createDefaultUser(userId, userId), cooldownSeconds: 0 };
    }
  },

  async hasClaimedToday(userId: string, dateStr: string): Promise<boolean> {
    return !(await this.canClaimCoffee(userId, dateStr));
  },

  // ═══════════════════════════════════════════════════════════════════════
  // GLOBAL CAFE STATE
  // ═══════════════════════════════════════════════════════════════════════

  async getCafeState(): Promise<CafeState> {
    try {
      const raw = await redis.get(RedisKeys.cafeState());
      return safeParse<CafeState>(raw, createDefaultCafeState());
    } catch (error) {
      console.error('Redis failure in getCafeState:', error);
      return createDefaultCafeState();
    }
  },

  async saveCafeState(state: CafeState): Promise<void> {
    try {
      state.lastUpdated = Math.floor(Date.now() / 1000);
      state.roomsUnlocked = buildUnlockedRooms(state.totalWarmth);
      await redis.set(RedisKeys.cafeState(), JSON.stringify(state));
    } catch (error) {
      console.error('Redis failure in saveCafeState:', error);
    }
  },

  async updateCafeWarmth(amount: number): Promise<CafeState> {
    try {
      const state = await this.getCafeState();
      state.totalWarmth = Math.max(state.totalWarmth + amount, 0);
      await this.saveCafeState(state);
      return state;
    } catch (error) {
      console.error('Redis failure in updateCafeWarmth:', error);
      return createDefaultCafeState();
    }
  },

  async incrementVisitors(): Promise<CafeState> {
    try {
      const state = await this.getCafeState();
      state.totalVisitors += 1;
      await this.saveCafeState(state);
      return state;
    } catch (error) {
      console.error('Redis failure in incrementVisitors:', error);
      return createDefaultCafeState();
    }
  },

  async incrementNotes(warmth: number = 1): Promise<CafeState> {
    try {
      const state = await this.getCafeState();
      state.totalNotes += 1;
      state.totalWarmth = Math.max(state.totalWarmth + warmth, 0);
      await this.saveCafeState(state);
      return state;
    } catch (error) {
      console.error('Redis failure in incrementNotes:', error);
      return createDefaultCafeState();
    }
  },

  async getProgress() {
    const state = await this.getCafeState();
    return {
      totalContributions: state.totalNotes,
      unlockedRooms: state.roomsUnlocked,
      activeUsersCount: state.totalVisitors,
    };
  },
  async saveProgress() {
    // Derived value, no-op
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CONTRIBUTION METHODS
  // ═══════════════════════════════════════════════════════════════════════

  async getContribution(id: string): Promise<Contribution | null> {
    try {
      const raw = await redis.get(RedisKeys.contribution(id));
      return safeParse<Contribution | null>(raw, null);
    } catch (error) {
      console.error(`Redis failure in getContribution for ID "${id}":`, error);
      return null;
    }
  },

  async saveContribution(contrib: Contribution): Promise<void> {
    try {
      await redis.set(RedisKeys.contribution(contrib.id), JSON.stringify(contrib));

      await redis.zAdd(RedisKeys.contributionsList(), {
        member: contrib.id,
        score: contrib.createdAt,
      });

      await redis.zAdd(RedisKeys.contributionsByCategory(contrib.category), {
        member: contrib.id,
        score: contrib.createdAt,
      });
    } catch (error) {
      console.error(`Redis failure in saveContribution for ID "${contrib.id}":`, error);
    }
  },

  async getRecentContributions(limit: number = 50): Promise<Contribution[]> {
    try {
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
    } catch (error) {
      console.error('Redis failure in getRecentContributions:', error);
      return [];
    }
  },

  async getContributionsByCategory(category: string, limit: number = 50): Promise<Contribution[]> {
    try {
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
    } catch (error) {
      console.error(`Redis failure in getContributionsByCategory for "${category}":`, error);
      return [];
    }
  },

  async getRandomContribution(): Promise<Contribution | null> {
    try {
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
    } catch (error) {
      console.error('Redis failure in getRandomContribution:', error);
      return null;
    }
  },

  async getContributionById(id: string): Promise<Contribution | null> {
    return this.getContribution(id);
  },

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
    try {
      await redis.zAdd(RedisKeys.puzzleLeaderboard(puzzleId, dateStr), {
        member: username,
        score: timeMs,
      });
    } catch (error) {
      console.error(`Redis failure in submitPuzzleScore for "${puzzleId}"/user "${username}":`, error);
    }
  },

  async getPuzzleLeaderboard(puzzleId: string, dateStr: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const range = await redis.zRange(RedisKeys.puzzleLeaderboard(puzzleId, dateStr), 0, limit - 1, {
        by: 'score',
      });

      return range.map((entry, idx) => ({
        username: entry.member,
        timeMs: entry.score,
        rank: idx + 1,
        date: dateStr,
      }));
    } catch (error) {
      console.error(`Redis failure in getPuzzleLeaderboard for "${puzzleId}" on "${dateStr}":`, error);
      return [];
    }
  },

  async getPersonalBest(userId: string, puzzleId: string): Promise<number | null> {
    try {
      const raw = await redis.get(RedisKeys.personalBest(userId));
      const data = safeParse<Record<string, number>>(raw, {});
      return data[puzzleId] ?? null;
    } catch (error) {
      console.error(`Redis failure in getPersonalBest for user "${userId}" on "${puzzleId}":`, error);
      return null;
    }
  },

  async savePersonalBest(userId: string, puzzleId: string, timeMs: number): Promise<void> {
    try {
      const raw = await redis.get(RedisKeys.personalBest(userId));
      const data = safeParse<Record<string, number>>(raw, {});
      data[puzzleId] = timeMs;
      await redis.set(RedisKeys.personalBest(userId), JSON.stringify(data));
    } catch (error) {
      console.error(`Redis failure in savePersonalBest for user "${userId}" on "${puzzleId}":`, error);
    }
  },
};
