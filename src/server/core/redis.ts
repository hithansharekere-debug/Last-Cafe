import { redis } from '@devvit/web/server';
import type { User, Contribution, CafeProgress, LeaderboardEntry } from '../../shared/types';

/**
 * Reusable Redis Service Layer for The Last Cafe on the Internet.
 * All Redis keys are generated centrally and accessed through helper functions.
 */

export const RedisKeys = {
  // User profile storage (hash)
  user: (userId: string) => `cafe:user:${userId}`,
  
  // Daily token claim status (string - with TTL)
  dailyClaim: (userId: string, dateStr: string) => `cafe:claim:${userId}:${dateStr}`,
  
  // Single contribution record (stringified JSON)
  contribution: (id: string) => `cafe:contrib:${id}`,
  
  // Global Cafe growth parameters (string/hash)
  progress: () => `cafe:progress`,
  
  // Sorted set of contributions by timestamp
  contributionsList: () => `cafe:contributions:list`,
  
  // Sorted set of contributions by category for filtering
  contributionsByCategory: (category: string) => `cafe:contributions:cat:${category}`,
  
  // Puzzle Tangram leaderboard (sorted set by timeMs)
  puzzleLeaderboard: (puzzleId: string, dateStr: string) => `cafe:puzzle:lead:${puzzleId}:${dateStr}`,
  
  // Personal best times for users (hash of puzzleId -> timeMs)
  personalBest: (userId: string) => `cafe:puzzle:pb:${userId}`,
  
  // Time Capsule storage list (sorted set by unlock timestamp)
  timeCapsules: () => `cafe:timecapsules:all`,
} as const;

export const RedisService = {
  // --- USER METHODS ---
  async getUser(userId: string): Promise<User | null> {
    const raw = await redis.get(RedisKeys.user(userId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async saveUser(user: User): Promise<void> {
    await redis.set(RedisKeys.user(user.id), JSON.stringify(user));
  },

  async hasClaimedToday(userId: string, dateStr: string): Promise<boolean> {
    const claimed = await redis.get(RedisKeys.dailyClaim(userId, dateStr));
    return claimed === 'true';
  },

  async setClaimedToday(userId: string, dateStr: string, ttlSeconds: number): Promise<void> {
    await redis.set(RedisKeys.dailyClaim(userId, dateStr), 'true', {
      expiration: new Date(Date.now() + ttlSeconds * 1000),
    });
  },

  // --- PROGRESS METHODS ---
  async getProgress(): Promise<CafeProgress> {
    const data = await redis.get(RedisKeys.progress());
    if (!data) {
      return {
        totalContributions: 0,
        unlockedRooms: [],
        activeUsersCount: 0,
      };
    }
    try {
      return JSON.parse(data) as CafeProgress;
    } catch {
      return {
        totalContributions: 0,
        unlockedRooms: [],
        activeUsersCount: 0,
      };
    }
  },

  async saveProgress(progress: CafeProgress): Promise<void> {
    await redis.set(RedisKeys.progress(), JSON.stringify(progress));
  },

  // --- CONTRIBUTION METHODS ---
  async getContribution(id: string): Promise<Contribution | null> {
    const raw = await redis.get(RedisKeys.contribution(id));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Contribution;
    } catch {
      return null;
    }
  },

  async saveContribution(contrib: Contribution): Promise<void> {
    // Save raw contribution
    await redis.set(RedisKeys.contribution(contrib.id), JSON.stringify(contrib));
    
    // Add to global sorted set (score = timestamp)
    await redis.zAdd(RedisKeys.contributionsList(), {
      member: contrib.id,
      score: contrib.timestamp,
    });
    
    // Add to category sorted set
    await redis.zAdd(RedisKeys.contributionsByCategory(contrib.category), {
      member: contrib.id,
      score: contrib.timestamp,
    });
  },

  async getLatestContributions(limit: number = 50): Promise<Contribution[]> {
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

  // --- PUZZLE LEADERBOARD METHODS ---
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
    // Get scores sorted ascending (fastest time is smallest score)
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
    const pbHash = await redis.get(RedisKeys.personalBest(userId));
    if (!pbHash) return null;
    try {
      const data = JSON.parse(pbHash) as Record<string, number>;
      return data[puzzleId] ?? null;
    } catch {
      return null;
    }
  },

  async savePersonalBest(userId: string, puzzleId: string, timeMs: number): Promise<void> {
    const pbHash = await redis.get(RedisKeys.personalBest(userId));
    let data: Record<string, number> = {};
    if (pbHash) {
      try {
        data = JSON.parse(pbHash) as Record<string, number>;
      } catch {
        data = {};
      }
    }
    data[puzzleId] = timeMs;
    await redis.set(RedisKeys.personalBest(userId), JSON.stringify(data));
  },
};
