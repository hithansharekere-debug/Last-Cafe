import { redis } from '@devvit/web/server';
import { ROOM_UNLOCK_THRESHOLDS } from '../../shared/constants';
import type { User, Contribution, CafeState, LeaderboardEntry, TimelineEvent } from '../../shared/types';

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
  const d = new Date();
  const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
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

    // Phase 3C
    currentStreak: 1,
    longestStreak: 1,
    achievements: [],
    completedObjectivesToday: [],
    objectivesDate: dateStr,
    readNotesCountToday: 0,
    timeline: [
      {
        id: `t_${now}_init`,
        type: 'streak',
        title: '🌱 Stepped inside the cafe for the first time',
        timestamp: now,
      }
    ],
    favorites: [],
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

  // Phase 3C fallbacks
  if (user.currentStreak === undefined) user.currentStreak = 1;
  if (user.longestStreak === undefined) user.longestStreak = 1;
  if (!user.achievements) user.achievements = [];
  if (!user.completedObjectivesToday) user.completedObjectivesToday = [];
  if (!user.objectivesDate) user.objectivesDate = '';
  if (user.readNotesCountToday === undefined) user.readNotesCountToday = 0;
  if (!user.timeline) user.timeline = [];
  if (!user.favorites) user.favorites = [];
  return user;
}

// ─── Helper: sync legacy fields on a Contribution object ────────────────
function syncContributionLegacy(contrib: Contribution): Contribution {
  if (contrib.likes === undefined) contrib.likes = 0;
  if (!contrib.likedBy) contrib.likedBy = [];
  contrib.text = contrib.message;
  contrib.userId = contrib.authorId;
  contrib.timestamp = contrib.createdAt;
  return contrib;
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
      const now = Math.floor(Date.now() / 1000);
      if (!user) {
        user = createDefaultUser(userId, username);
        await this.saveUser(user);
        await this.incrementVisitors();
      } else {
        const lastVisitDate = new Date(user.lastVisit * 1000);
        const todayDate = new Date();
        
        const lastVisitStr = `${lastVisitDate.getUTCFullYear()}-${String(lastVisitDate.getUTCMonth() + 1).padStart(2, '0')}-${String(lastVisitDate.getUTCDate()).padStart(2, '0')}`;
        const todayStr = `${todayDate.getUTCFullYear()}-${String(todayDate.getUTCMonth() + 1).padStart(2, '0')}-${String(todayDate.getUTCDate()).padStart(2, '0')}`;
        
        if (lastVisitStr !== todayStr) {
          user.visitCount += 1;
          
          // Check if last visit was yesterday to increment streak
          const oneDayMs = 24 * 60 * 60 * 1000;
          const yesterdayDate = new Date(Date.now() - oneDayMs);
          const yesterdayStr = `${yesterdayDate.getUTCFullYear()}-${String(yesterdayDate.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getUTCDate()).padStart(2, '0')}`;
          
          if (lastVisitStr === yesterdayStr) {
            user.currentStreak += 1;
            user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
            
            // Milestone check
            const milestones = [3, 7, 14, 30];
            if (milestones.includes(user.currentStreak)) {
              let bonus = 1;
              if (user.currentStreak === 7) bonus = 2;
              if (user.currentStreak === 14) bonus = 3;
              if (user.currentStreak === 30) bonus = 5;
              user.currentCoffeeTokens += bonus;
              this.addTimelineEvent(user, 'streak', `🔥 Reached a ${user.currentStreak}-day visit streak! (+${bonus} Coffee Tokens)`);
            }
          } else {
            // Streak broken
            user.currentStreak = 1;
          }
        }
        
        user.lastVisit = now;
        
        // Trigger Regular Visitor achievement if visitCount >= 7
        if (user.visitCount >= 7) {
          await this.triggerAchievement(user, 'regular_visitor');
        }
        
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
      const parsed = safeParse<Contribution | null>(raw, null);
      return parsed ? syncContributionLegacy(parsed) : null;
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
        by: 'rank',
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
        by: 'rank',
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
        by: 'rank',
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
        by: 'rank',
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

  addTimelineEvent(user: User, type: TimelineEvent['type'], title: string): void {
    if (!user.timeline) user.timeline = [];
    const now = Math.floor(Date.now() / 1000);
    user.timeline.unshift({
      id: `t_${now}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      timestamp: now,
    });
    if (user.timeline.length > 20) {
      user.timeline = user.timeline.slice(0, 20);
    }
  },

  async triggerAchievement(user: User, id: string): Promise<boolean> {
    if (!user.achievements) user.achievements = [];
    if (!user.achievements.includes(id)) {
      user.achievements.push(id);
      const titles: Record<string, string> = {
        first_coffee: 'First Coffee ☕',
        first_note: 'First Note 📝',
        warm_soul: 'Warm Soul ❤️',
        regular_visitor: 'Regular Visitor 📚',
        community_helper: 'Community Helper 🌿',
        fireplace_open: 'Fireplace Open 🏡',
        library_keeper: 'Library Keeper 📖',
        garden_wanderer: 'Garden Wanderer 🌸',
        puzzle_solver: 'Puzzle Solver 🧩',
      };
      const title = titles[id] || id;
      this.addTimelineEvent(user, 'achievement', `🏆 Unlocked Achievement: ${title}`);
      return true;
    }
    return false;
  },

  async likeContribution(userId: string, noteId: string): Promise<{ success: boolean; likes: number; likedBy: string[]; unlockedAchievements: string[]; authorUser: User | null; globalWarmth: number }> {
    try {
      const contrib = await this.getContribution(noteId);
      if (!contrib) {
        return { success: false, likes: 0, likedBy: [], unlockedAchievements: [], authorUser: null, globalWarmth: 0 };
      }
      if (!contrib.likedBy) contrib.likedBy = [];
      if (contrib.likedBy.includes(userId)) {
        return { success: false, likes: contrib.likes, likedBy: contrib.likedBy, unlockedAchievements: [], authorUser: null, globalWarmth: 0 };
      }
      
      contrib.likedBy.push(userId);
      contrib.likes += 1;
      await this.saveContribution(contrib);
      
      // Increment global warmth
      const cafeState = await this.getCafeState();
      cafeState.totalWarmth += 1;
      await redis.set(RedisKeys.cafeState(), JSON.stringify(cafeState));
      
      // Award warmth to note author
      const author = await this.getUser(contrib.authorId);
      const unlockedAchievements: string[] = [];
      if (author) {
        author.totalWarmthContributed += 1;
        
        // Count likes received
        const authorNotes = await this.getRecentContributions(100);
        let totalLikes = 0;
        for (const note of authorNotes) {
          if (note.authorId === author.id) {
            totalLikes += note.likes;
          }
        }
        
        if (totalLikes >= 10) {
          const unlocked = await this.triggerAchievement(author, 'community_helper');
          if (unlocked) unlockedAchievements.push('community_helper');
        }
        if (author.totalWarmthContributed >= 10) {
          const unlocked = await this.triggerAchievement(author, 'warm_soul');
          if (unlocked) unlockedAchievements.push('warm_soul');
        }
        
        await this.saveUser(author);
      }
      
      return {
        success: true,
        likes: contrib.likes,
        likedBy: contrib.likedBy,
        unlockedAchievements,
        authorUser: author,
        globalWarmth: cafeState.totalWarmth,
      };
    } catch (error) {
      console.error(`Redis failure in likeContribution for user "${userId}" on note "${noteId}":`, error);
      return { success: false, likes: 0, likedBy: [], unlockedAchievements: [], authorUser: null, globalWarmth: 0 };
    }
  },

  async toggleFavorite(userId: string, noteId: string): Promise<{ success: boolean; favorites: string[] }> {
    try {
      const user = await this.getUser(userId);
      if (!user) return { success: false, favorites: [] };
      if (!user.favorites) user.favorites = [];
      const index = user.favorites.indexOf(noteId);
      if (index === -1) {
        user.favorites.push(noteId);
      } else {
        user.favorites.splice(index, 1);
      }
      await this.saveUser(user);
      return { success: true, favorites: user.favorites };
    } catch (error) {
      console.error(`Redis failure in toggleFavorite for user "${userId}" on note "${noteId}":`, error);
      return { success: false, favorites: [] };
    }
  },
};
