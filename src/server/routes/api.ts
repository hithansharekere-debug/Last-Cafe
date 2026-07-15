import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import { RedisService, buildUnlockedRooms } from '../core/redis';
import { ROOM_UNLOCK_THRESHOLDS, CONTRIBUTION_CATEGORIES, getDailyPuzzleForDate } from '../../shared/constants';
import type {
  InitResponse,
  ClaimTokenResponse,
  AddContributionResponse,
  ContributionsListResponse,
  LeaderboardResponse,
  PuzzleSubmitResponse,
  Room,
  Contribution,
  CafeState,
  CafeProgress,
  User,
  ErrorResponse,
  DailyObjective,
  LikeResponse,
  FavoriteResponse,
  CommunityPuzzle,
  PuzzlesListResponse,
  PuzzleSolveResponse,
} from '../../shared/types';

export const api = new Hono();

// ─── Shared Utilities ───────────────────────────────────────────────────

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function normalizeAnswer(text: string): string {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getDailyObjectivesForDate(dateStr: string): DailyObjective[] {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed += dateStr.charCodeAt(i);
  }
  
  const pool: DailyObjective[] = [
    { id: 'claim_coffee', text: '☕ Claim today\'s coffee', rewardType: 'token', rewardValue: 1 },
    { id: 'write_gratitude', text: '📝 Write one Gratitude note', rewardType: 'warmth', rewardValue: 5 },
    { id: 'write_note', text: '✍️ Write any note', rewardType: 'token', rewardValue: 1 },
    { id: 'visit_discover', text: '🔍 Visit the Discover screen', rewardType: 'warmth', rewardValue: 5 },
    { id: 'read_notes', text: '📖 Read 3 community notes', rewardType: 'warmth', rewardValue: 5 },
  ];
  
  const obj1 = pool[0] as DailyObjective;
  const idx2 = (seed % (pool.length - 1)) + 1;
  const obj2 = pool[idx2] as DailyObjective;
  
  let idx3 = ((seed + 2) % (pool.length - 1)) + 1;
  if (idx3 === idx2) {
    idx3 = (idx3 % (pool.length - 1)) + 1;
  }
  const obj3 = pool[idx3] as DailyObjective;
  
  return [obj1, obj2, obj3];
}

async function checkAndCompleteObjective(user: User, objectiveId: string): Promise<boolean> {
  const todayStr = getTodayDateString();
  
  if (user.objectivesDate !== todayStr) {
    user.completedObjectivesToday = [];
    user.readNotesCountToday = 0;
    user.objectivesDate = todayStr;
  }
  
  if (user.completedObjectivesToday.includes(objectiveId)) {
    return false;
  }
  
  const todayObjectives = getDailyObjectivesForDate(todayStr);
  const targetObj = todayObjectives.find((o) => o.id === objectiveId);
  if (!targetObj) return false;
  
  user.completedObjectivesToday.push(objectiveId);
  
  if (targetObj.rewardType === 'token') {
    user.currentCoffeeTokens += targetObj.rewardValue;
  } else if (targetObj.rewardType === 'warmth') {
    user.totalWarmthContributed += targetObj.rewardValue;
    try {
      const cafeState = await RedisService.getCafeState();
      cafeState.totalWarmth += targetObj.rewardValue;
      await RedisService.saveUser(user);
      await RedisService.incrementNotes(targetObj.rewardValue);
    } catch (err) {
      console.error('Failed to update global warmth in objective reward:', err);
    }
  }
  
  RedisService.addTimelineEvent(user, 'streak', `🎯 Completed Goal: ${targetObj.text}`);
  return true;
}

function buildRoomsList(cafeState: CafeState): Room[] {
  const unlocked = buildUnlockedRooms(cafeState.totalWarmth);
  return [
    { id: 'foyer', name: 'Foyer', threshold: 0, isUnlocked: true },
    {
      id: 'fireplace',
      name: 'Fireplace Room',
      threshold: ROOM_UNLOCK_THRESHOLDS.FIREPLACE,
      isUnlocked: unlocked.includes('fireplace'),
    },
    {
      id: 'bookshelf',
      name: 'Library Bookshelf',
      threshold: ROOM_UNLOCK_THRESHOLDS.BOOKSHELF,
      isUnlocked: unlocked.includes('bookshelf'),
    },
    {
      id: 'garden',
      name: 'Hidden Garden',
      threshold: ROOM_UNLOCK_THRESHOLDS.GARDEN,
      isUnlocked: unlocked.includes('garden'),
    },
    {
      id: 'music_room',
      name: 'Music Conservatory',
      threshold: ROOM_UNLOCK_THRESHOLDS.MUSIC_ROOM,
      isUnlocked: unlocked.includes('music_room'),
    },
  ];
}

function cafeStateToProgress(cafeState: CafeState): CafeProgress {
  return {
    totalContributions: cafeState.totalNotes,
    unlockedRooms: cafeState.roomsUnlocked,
    activeUsersCount: cafeState.totalVisitors,
  };
}

function generateContributionId(): string {
  try {
    return `c_${crypto.randomUUID()}`;
  } catch (error) {
    console.error('Failed to generate UUID via crypto. Using fallback generator.', error);
    return `c_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

async function getCurrentUser(): Promise<{ userId: string; username: string }> {
  try {
    const rawUsername = await reddit.getCurrentUsername();
    if (rawUsername) {
      return { userId: rawUsername, username: rawUsername };
    }
  } catch (error) {
    console.warn('Devvit request context username fetch failed:', error);
  }
  return { userId: 'local-anon', username: 'Cozy Stranger' };
}

// ─── Shared Contribution Logic ──────────────────────────────────────────

interface CreateContributionInput {
  userId: string;
  username: string;
  category: string;
  messageText: string;
  targetDate?: number;
}

async function createContribution(
  input: CreateContributionInput
): Promise<{ user: User; contribution: Contribution; cafeState: CafeState }> {
  const validCategories = Object.values(CONTRIBUTION_CATEGORIES) as string[];
  if (!validCategories.includes(input.category)) {
    throw new ApiError(400, `Invalid note category: "${input.category}"`);
  }

  const cleanMsg = input.messageText.trim();
  if (!cleanMsg) {
    throw new ApiError(400, 'Note message cannot be empty or whitespace only');
  }
  if (cleanMsg.length > 250) {
    throw new ApiError(400, `Note message exceeds maximum limit of 250 characters (got ${cleanMsg.length})`);
  }

  const user = await RedisService.getUser(input.userId);
  if (!user) {
    throw new ApiError(404, `User profile not found for ID "${input.userId}"`);
  }

  if (user.currentCoffeeTokens < 1) {
    throw new ApiError(403, 'Insufficient coffee tokens available to complete this action');
  }

  const warmth = 1;
  user.currentCoffeeTokens = Math.max(user.currentCoffeeTokens - 1, 0);
  user.totalNotesWritten += 1;
  user.totalWarmthContributed += warmth;

  const now = Math.floor(Date.now() / 1000);
  const category = input.category as Contribution['category'];
  const isTimeCapsule = category === CONTRIBUTION_CATEGORIES.TIME_CAPSULE;
  const isUnlocked = isTimeCapsule
    ? (input.targetDate ? now >= input.targetDate : true)
    : true;

  const contribution: Contribution = {
    id: generateContributionId(),
    authorId: input.userId,
    username: input.username,
    category,
    message: cleanMsg,
    createdAt: now,
    warmthGiven: warmth,
    likes: 0,
    likedBy: [],
    targetDate: input.targetDate,
    isUnlocked,
    userId: input.userId,
    text: cleanMsg,
    timestamp: now,
  };

  await RedisService.saveContribution(contribution);
  const cafeState = await RedisService.incrementNotes(warmth);

  user.unlockedRooms = cafeState.roomsUnlocked;
  await RedisService.saveUser(user);

  return { user, contribution, cafeState };
}

class ApiError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

// ═════════════════════════════════════════════════════════════════════════
// GET /api/init
// ═════════════════════════════════════════════════════════════════════════
api.get('/init', async (c) => {
  const { postId } = context;
  if (!postId) {
    console.error('Init failure: postId missing in context');
    return c.json<ErrorResponse>({ success: false, error: 'postId not found in context' }, 400);
  }

  try {
    const { userId, username } = await getCurrentUser();
    const user = await RedisService.getOrCreateUser(userId, username);

    const cafeState = await RedisService.getCafeState();
    const rooms = buildRoomsList(cafeState);

    const todayStr = getTodayDateString();
    const canClaimCoffee = await RedisService.canClaimCoffee(user.id, todayStr);

    if (user.objectivesDate !== todayStr) {
      user.completedObjectivesToday = [];
      user.readNotesCountToday = 0;
      user.objectivesDate = todayStr;
      
      if (cafeState.totalWarmth >= ROOM_UNLOCK_THRESHOLDS.FIREPLACE) {
        await RedisService.triggerAchievement(user, 'fireplace_open');
      }
      if (cafeState.totalWarmth >= ROOM_UNLOCK_THRESHOLDS.BOOKSHELF) {
        await RedisService.triggerAchievement(user, 'library_keeper');
      }
      if (cafeState.totalWarmth >= ROOM_UNLOCK_THRESHOLDS.GARDEN) {
        await RedisService.triggerAchievement(user, 'garden_wanderer');
      }
      
      await RedisService.saveUser(user);
    }

    user.unlockedRooms = cafeState.roomsUnlocked;
    await RedisService.saveUser(user);

    return c.json<InitResponse>({
      success: true,
      data: {
        postId,
        user,
        cafe: cafeState,
        rooms,
        canClaimCoffee,
        progress: cafeStateToProgress(cafeState),
        dailyObjectives: getDailyObjectivesForDate(todayStr),
      },
    });
  } catch (error) {
    console.error('Init server route failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to initialize application' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// POST /api/claim
// ═════════════════════════════════════════════════════════════════════════
api.post('/claim', async (c) => {
  try {
    const { userId } = await getCurrentUser();
    const todayStr = getTodayDateString();
    const result = await RedisService.claimDailyCoffee(userId, todayStr);
    const cafeState = await RedisService.getCafeState();

    if (!result.success) {
      return c.json<ClaimTokenResponse>({
        success: false,
        error: 'You have already brewed your daily coffee today. Please wait for the cooldown.',
      }, 400);
    }

    const unlockedAchievements: string[] = [];
    const firstCoffee = await RedisService.triggerAchievement(result.user, 'first_coffee');
    if (firstCoffee) unlockedAchievements.push('first_coffee');

    RedisService.addTimelineEvent(result.user, 'claim_coffee', '☕ Claimed daily coffee token');
    await checkAndCompleteObjective(result.user, 'claim_coffee');
    await RedisService.saveUser(result.user);

    return c.json<ClaimTokenResponse>({
      success: true,
      data: {
        user: result.user,
        cafe: cafeState,
        tokenCount: result.user.currentCoffeeTokens,
        lastClaimedTimestamp: result.user.lastCoffeeClaim ?? 0,
        unlockedAchievements,
      },
    });
  } catch (error) {
    console.error('Claim server route failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to claim daily coffee token' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// POST /api/contribution
// ═════════════════════════════════════════════════════════════════════════
api.post('/contribution', async (c) => {
  try {
    const { userId, username } = await getCurrentUser();

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json<ErrorResponse>({ success: false, error: 'Malformed JSON request body' }, 400);
    }

    if (!body || typeof body !== 'object') {
      return c.json<ErrorResponse>({ success: false, error: 'Request body must be a valid JSON object' }, 400);
    }

    if (body.message === undefined || body.category === undefined) {
      return c.json<ErrorResponse>({ success: false, error: 'Missing required parameters: message and category' }, 400);
    }

    const result = await createContribution({
      userId,
      username,
      category: String(body.category),
      messageText: String(body.message),
      targetDate: body.targetDate !== undefined ? Number(body.targetDate) : undefined,
    });

    const unlockedAchievements: string[] = [];
    const firstNote = await RedisService.triggerAchievement(result.user, 'first_note');
    if (firstNote) unlockedAchievements.push('first_note');

    if (result.user.totalWarmthContributed >= 10) {
      const warmSoul = await RedisService.triggerAchievement(result.user, 'warm_soul');
      if (warmSoul) unlockedAchievements.push('warm_soul');
    }

    if (result.cafeState.totalWarmth >= ROOM_UNLOCK_THRESHOLDS.FIREPLACE) {
      const unlockFireplace = await RedisService.triggerAchievement(result.user, 'fireplace_open');
      if (unlockFireplace) unlockedAchievements.push('fireplace_open');
    }
    if (result.cafeState.totalWarmth >= ROOM_UNLOCK_THRESHOLDS.BOOKSHELF) {
      const unlockLibrary = await RedisService.triggerAchievement(result.user, 'library_keeper');
      if (unlockLibrary) unlockedAchievements.push('library_keeper');
    }
    if (result.cafeState.totalWarmth >= ROOM_UNLOCK_THRESHOLDS.GARDEN) {
      const unlockGarden = await RedisService.triggerAchievement(result.user, 'garden_wanderer');
      if (unlockGarden) unlockedAchievements.push('garden_wanderer');
    }

    RedisService.addTimelineEvent(result.user, 'write_note', `📝 Left a note in the ${result.contribution.category} wall`);
    await checkAndCompleteObjective(result.user, 'write_note');
    if (result.contribution.category === CONTRIBUTION_CATEGORIES.GRATITUDE) {
      await checkAndCompleteObjective(result.user, 'write_gratitude');
    }

    await RedisService.saveUser(result.user);

    return c.json<AddContributionResponse>({
      success: true,
      data: {
        contribution: result.contribution,
        cafe: result.cafeState,
        progress: cafeStateToProgress(result.cafeState),
        user: result.user,
        unlockedAchievements,
      },
    });
  } catch (error) {
    console.error('Contribution server route failure:', error);
    const code = error instanceof ApiError ? error.statusCode : 500;
    return c.json<ErrorResponse>({ success: false, error: error instanceof Error ? error.message : 'Internal Server Error' }, code as any);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// GET /api/contributions
// ═════════════════════════════════════════════════════════════════════════
api.get('/contributions', async (c) => {
  try {
    const filter = c.req.query('filter') || 'All';
    let list: Contribution[] = [];

    const { userId } = await getCurrentUser();
    const userProfile = await RedisService.getUser(userId);

    if (filter === 'All' || filter === 'Newest') {
      list = await RedisService.getRecentContributions(100);
    } else if (filter === 'Popular') {
      list = await RedisService.getRecentContributions(100);
      list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (filter === 'Favorites') {
      const favorites = userProfile?.favorites || [];
      const favList: Contribution[] = [];
      for (const fid of favorites) {
        const item = await RedisService.getContributionById(fid);
        if (item) favList.push(item);
      }
      favList.sort((a, b) => b.createdAt - a.createdAt);
      list = favList;
    } else {
      list = await RedisService.getContributionsByCategory(filter, 100);
    }

    const now = Math.floor(Date.now() / 1000);
    const filtered = list.filter((item) => {
      if (item.category === CONTRIBUTION_CATEGORIES.TIME_CAPSULE) {
        return item.targetDate ? now >= item.targetDate : true;
      }
      return true;
    });

    return c.json<ContributionsListResponse>({
      success: true,
      data: {
        contributions: filtered,
      },
    });
  } catch (error) {
    console.error('Fetch contributions endpoint failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to fetch contributions' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// GET /api/contribution/random
// ═════════════════════════════════════════════════════════════════════════
api.get('/contribution/random', async (c) => {
  try {
    const contrib = await RedisService.getRandomContribution();
    if (!contrib) {
      return c.json<ErrorResponse>({ success: false, error: 'No contributions found in the cafe yet' }, 404);
    }
    return c.json({
      success: true,
      data: {
        contribution: contrib,
      },
    });
  } catch (error) {
    console.error('Random contribution endpoint failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to fetch random contribution' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// POST /api/notes/:id/like
// ═════════════════════════════════════════════════════════════════════════
api.post('/notes/:id/like', async (c) => {
  try {
    const noteId = c.req.param('id');
    const { userId } = await getCurrentUser();
    const result = await RedisService.likeContribution(userId, noteId);

    if (!result.success) {
      return c.json<ErrorResponse>({ success: false, error: 'Could not like note' }, 400);
    }

    const likerUser = await RedisService.getUser(userId);
    if (likerUser) {
      RedisService.addTimelineEvent(likerUser, 'like', `❤️ Liked a note`);
      await RedisService.saveUser(likerUser);
    }

    return c.json<LikeResponse>({
      success: true,
      data: {
        noteId,
        likes: result.likes,
        likedBy: result.likedBy,
        cafe: await RedisService.getCafeState(),
        user: likerUser!,
        unlockedAchievements: result.unlockedAchievements,
      },
    });
  } catch (error) {
    console.error('Like note failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to process like request' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// POST /api/notes/:id/favorite
// ═════════════════════════════════════════════════════════════════════════
api.post('/notes/:id/favorite', async (c) => {
  try {
    const noteId = c.req.param('id');
    const { userId } = await getCurrentUser();
    const result = await RedisService.toggleFavorite(userId, noteId);

    if (!result.success) {
      return c.json<ErrorResponse>({ success: false, error: 'Could not update favorites' }, 400);
    }

    const user = await RedisService.getUser(userId);
    return c.json<FavoriteResponse>({
      success: true,
      data: {
        noteId,
        favorites: result.favorites,
        user: user!,
      },
    });
  } catch (error) {
    console.error('Favorite note failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to process favorite request' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// POST /api/objectives/progress
// ═════════════════════════════════════════════════════════════════════════
api.post('/objectives/progress', async (c) => {
  try {
    const { userId } = await getCurrentUser();
    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json<ErrorResponse>({ success: false, error: 'Malformed JSON' }, 400);
    }

    const action = body?.action;
    if (!action) {
      return c.json<ErrorResponse>({ success: false, error: 'Missing action parameter' }, 400);
    }

    const user = await RedisService.getUser(userId);
    if (!user) {
      return c.json<ErrorResponse>({ success: false, error: 'User not found' }, 404);
    }

    let updated = false;
    if (action === 'visit_discover') {
      updated = await checkAndCompleteObjective(user, 'visit_discover');
    } else if (action === 'read_note') {
      const todayStr = getTodayDateString();
      if (user.objectivesDate !== todayStr) {
        user.completedObjectivesToday = [];
        user.readNotesCountToday = 0;
        user.objectivesDate = todayStr;
      }
      
      if (!user.completedObjectivesToday.includes('read_notes')) {
        user.readNotesCountToday += 1;
        if (user.readNotesCountToday >= 3) {
          updated = await checkAndCompleteObjective(user, 'read_notes');
        } else {
          updated = true;
        }
      }
    }

    if (updated) {
      await RedisService.saveUser(user);
    }

    return c.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Objective progress failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to update objectives progress' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// Puzzle endpoints
// ═════════════════════════════════════════════════════════════════════════
api.post('/puzzle/submit', async (c) => {
  try {
    const { userId, username } = await getCurrentUser();

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json<ErrorResponse>({ success: false, error: 'Malformed JSON request body' }, 400);
    }

    if (!body || typeof body !== 'object') {
      return c.json<ErrorResponse>({ success: false, error: 'Request body must be a valid JSON object' }, 400);
    }

    if (body.puzzleId === undefined || body.timeMs === undefined) {
      return c.json<ErrorResponse>({ success: false, error: 'Missing required parameters: puzzleId and timeMs' }, 400);
    }

    const todayStr = getTodayDateString();
    await RedisService.submitPuzzleScore(body.puzzleId, todayStr, username, Number(body.timeMs));

    const existingPB = await RedisService.getPersonalBest(userId, body.puzzleId);
    let isNewPersonalBest = false;
    let pbTime = Number(body.timeMs);

    if (existingPB === null || Number(body.timeMs) < existingPB) {
      isNewPersonalBest = true;
      await RedisService.savePersonalBest(userId, body.puzzleId, Number(body.timeMs));
      pbTime = Number(body.timeMs);
    } else {
      pbTime = existingPB;
    }

    const user = await RedisService.getUser(userId);
    const unlockedAchievements: string[] = [];
    if (user) {
      user.puzzleHighScore = pbTime;
      const unlockedPuzzle = await RedisService.triggerAchievement(user, 'puzzle_solver');
      if (unlockedPuzzle) unlockedAchievements.push('puzzle_solver');
      await RedisService.saveUser(user);
    }

    const lead = await RedisService.getPuzzleLeaderboard(body.puzzleId, todayStr, 10);

    return c.json<PuzzleSubmitResponse>({
      success: true,
      data: {
        personalBestTimeMs: pbTime,
        isNewPersonalBest,
        leaderboard: lead,
        user: user!,
        unlockedAchievements,
      },
    });
  } catch (error) {
    console.error('Puzzle submit score server route failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to submit puzzle score' }, 500);
  }
});

api.get('/puzzle/leaderboard', async (c) => {
  try {
    const puzzleId = c.req.query('puzzleId') || 'daily_tangram';
    const dateStr = getTodayDateString();
    const lead = await RedisService.getPuzzleLeaderboard(puzzleId, dateStr, 10);

    return c.json<LeaderboardResponse>({
      success: true,
      data: {
        leaderboard: lead,
      },
    });
  } catch (error) {
    console.error('Fetch puzzle leaderboard route failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to fetch puzzle leaderboard' }, 500);
  }
});

// ─── Phase 5: Puzzles Endpoints ─────────────────────────────────────────

api.get('/puzzles', async (c) => {
  try {
    const filter = c.req.query('filter') || 'All';
    let list: CommunityPuzzle[] = [];
    const { userId } = await getCurrentUser();
    const userProfile = await RedisService.getUser(userId);

    if (filter === 'All') {
      list = await RedisService.getRecentPuzzles(100);
    } else if (filter === 'Favorites') {
      const favorites = userProfile?.favorites || [];
      const favList: CommunityPuzzle[] = [];
      for (const fid of favorites) {
        const p = await RedisService.getPuzzle(fid);
        if (p) favList.push(p);
      }
      favList.sort((a, b) => b.createdAt - a.createdAt);
      list = favList;
    } else if (['Easy', 'Medium', 'Hard'].includes(filter)) {
      const all = await RedisService.getRecentPuzzles(100);
      list = all.filter(p => p.difficulty === filter);
    } else {
      list = await RedisService.getPuzzlesByCategory(filter, 100);
    }
    return c.json<PuzzlesListResponse>({ success: true, data: { puzzles: list.filter(p => !p.isDeleted) } });
  } catch (error) {
    console.error('Fetch puzzles server route failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to fetch community mysteries' }, 500);
  }
});

api.post('/puzzles', async (c) => {
  try {
    const { userId, username } = await getCurrentUser();
    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json<ErrorResponse>({ success: false, error: 'Malformed JSON payload' }, 400);
    }

    const { title, description, puzzleText, hint, answer, difficulty, category } = body;
    if (!title || !puzzleText || !answer || !difficulty || !category) {
      return c.json<ErrorResponse>({ success: false, error: 'Missing required parameters to publish puzzle' }, 400);
    }

    const normalizedAns = normalizeAnswer(answer);
    if (!normalizedAns) {
      return c.json<ErrorResponse>({ success: false, error: 'Answer cannot be empty or blank spaces.' }, 400);
    }

    const user = await RedisService.getUser(userId);
    if (!user) return c.json<ErrorResponse>({ success: false, error: 'User profile not found' }, 404);
    if (user.currentCoffeeTokens < 1) {
      return c.json<ErrorResponse>({ success: false, error: 'Insufficient coffee tokens. Claim daily coffee first.' }, 403);
    }

    user.currentCoffeeTokens = Math.max(user.currentCoffeeTokens - 1, 0);
    user.totalNotesWritten += 1; // Increment note/creation counts for achievements
    user.reputation += 10;       // Creator reputation reward!

    const puzzleId = `puzzle_${Math.floor(Date.now() / 1000)}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Math.floor(Date.now() / 1000);
    const puzzle: CommunityPuzzle = {
      id: puzzleId,
      creatorId: userId,
      creatorName: username,
      title: String(title).trim().substring(0, 50),
      description: String(description || '').trim().substring(0, 200),
      puzzleText: String(puzzleText).trim().substring(0, 500),
      hint: String(hint || '').trim().substring(0, 150),
      answer: normalizedAns,
      difficulty: difficulty as any,
      category: category as any,
      createdAt: now,
      solveCount: 0,
      likes: 0,
      likedBy: [],
      favorites: 0,
      favoritedBy: [],
    };

    await RedisService.savePuzzle(puzzle);
    
    // Increment Cafe State warmth by 1 for new puzzle contributions
    const cafeState = await RedisService.getCafeState();
    cafeState.totalWarmth += 1;
    await RedisService.saveCafeState(cafeState);

    user.unlockedRooms = cafeState.roomsUnlocked;
    
    // Achievements & Timeline log
    const unlockedAchievements: string[] = [];
    const firstNote = await RedisService.triggerAchievement(user, 'first_note');
    if (firstNote) unlockedAchievements.push('first_note');
    
    RedisService.addTimelineEvent(user, 'write_note', `🧩 Created Community Puzzle: ${puzzle.title}`);
    await checkAndCompleteObjective(user, 'write_note');
    await RedisService.saveUser(user);

    return c.json({
      success: true,
      data: {
        puzzle,
        user,
        unlockedAchievements,
      }
    });
  } catch (error) {
    console.error('Create puzzle server route failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to publish puzzle' }, 500);
  }
});

api.post('/puzzles/:id/edit', async (c) => {
  try {
    const id = c.req.param('id');
    const { userId } = await getCurrentUser();
    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json<ErrorResponse>({ success: false, error: 'Malformed JSON payload' }, 400);
    }

    const puzzle = await RedisService.getPuzzle(id);
    if (!puzzle) {
      return c.json<ErrorResponse>({ success: false, error: 'Mystery not found' }, 404);
    }

    if (puzzle.creatorId !== userId) {
      return c.json<ErrorResponse>({ success: false, error: 'You are not authorized to edit this mystery.' }, 403);
    }

    const editCount = puzzle.editCount || 0;
    if (editCount >= 3) {
      return c.json<ErrorResponse>({ success: false, error: 'This mystery has already been edited the maximum number of times.' }, 400);
    }

    const { title, description, puzzleText, hint, answer, difficulty } = body;
    if (!title || !puzzleText || !answer || !difficulty) {
      return c.json<ErrorResponse>({ success: false, error: 'Missing required fields' }, 400);
    }

    const normalizedAns = normalizeAnswer(answer);
    if (!normalizedAns) {
      return c.json<ErrorResponse>({ success: false, error: 'Answer cannot be empty or blank spaces.' }, 400);
    }

    // Update puzzle fields
    puzzle.title = String(title).trim().substring(0, 50);
    puzzle.description = String(description || '').trim().substring(0, 200);
    puzzle.puzzleText = String(puzzleText).trim().substring(0, 500);
    puzzle.hint = String(hint || '').trim().substring(0, 150);
    puzzle.answer = normalizedAns;
    puzzle.difficulty = difficulty as any;
    
    // Increment edit count and record edit timestamp
    puzzle.editCount = editCount + 1;
    puzzle.lastEditedAt = Math.floor(Date.now() / 1000);

    await RedisService.savePuzzle(puzzle);

    return c.json({
      success: true,
      data: {
        puzzle,
      }
    });
  } catch (error) {
    console.error('Edit puzzle server route failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to save mystery edits' }, 500);
  }
});

api.post('/puzzles/:id/delete', async (c) => {
  try {
    const id = c.req.param('id');
    const { userId } = await getCurrentUser();

    const puzzle = await RedisService.getPuzzle(id);
    if (!puzzle) {
      return c.json<ErrorResponse>({ success: false, error: 'Mystery not found' }, 404);
    }

    if (puzzle.creatorId !== userId) {
      return c.json<ErrorResponse>({ success: false, error: 'You are not authorized to delete this mystery.' }, 403);
    }

    // Perform soft delete
    puzzle.isDeleted = true;
    await RedisService.savePuzzle(puzzle);

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete puzzle server route failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to delete mystery' }, 500);
  }
});

api.post('/puzzles/:id/solve', async (c) => {
  try {
    const puzzleId = c.req.param('id');
    const { userId } = await getCurrentUser();
    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json<ErrorResponse>({ success: false, error: 'Malformed JSON payload' }, 400);
    }

    const submitted = normalizeAnswer(body.answer);
    const puzzle = await RedisService.getPuzzle(puzzleId);
    if (!puzzle) return c.json<ErrorResponse>({ success: false, error: 'Puzzle not found' }, 404);

    if (puzzle.creatorId === userId) {
      return c.json<ErrorResponse>({ success: false, error: 'You cannot solve your own puzzle.' }, 400);
    }

    const user = await RedisService.getUser(userId);
    if (!user) return c.json<ErrorResponse>({ success: false, error: 'User profile not found' }, 404);

    if (!user.solvedPuzzles) user.solvedPuzzles = [];
    if (user.solvedPuzzles.includes(puzzleId)) {
      return c.json<ErrorResponse>({ success: false, error: 'You have already solved this mystery.' }, 400);
    }

    const correct = normalizeAnswer(puzzle.answer);

    if (correct !== submitted) {
      return c.json<ErrorResponse>({ success: false, error: 'Incorrect answer. The mystery remains unsolved...' }, 400);
    }

    // Solve successful!
    user.solvedPuzzles.push(puzzleId);
    user.reputation += 5; // Solver reputation reward!
    
    puzzle.solveCount += 1;
    await RedisService.savePuzzle(puzzle);

    // Creator reputation reward!
    const creator = await RedisService.getUser(puzzle.creatorId);
    if (creator) {
      creator.reputation += 10;
      RedisService.addTimelineEvent(creator, 'like', `💡 Your puzzle "${puzzle.title}" was solved! (+10 reputation)`);
      await RedisService.saveUser(creator);
    }

    // Add warmth to Cafe State
    const cafeState = await RedisService.getCafeState();
    cafeState.totalWarmth += 5;
    await RedisService.saveCafeState(cafeState);

    user.unlockedRooms = cafeState.roomsUnlocked;
    
    // Achievements & Goals completion checks
    const unlockedAchievements: string[] = [];
    const unlockedPuzzle = await RedisService.triggerAchievement(user, 'puzzle_solver');
    if (unlockedPuzzle) unlockedAchievements.push('puzzle_solver');

    RedisService.addTimelineEvent(user, 'like', `💡 Solved Puzzle: ${puzzle.title} (+5 reputation)`);
    await checkAndCompleteObjective(user, 'read_notes'); // Solving a community puzzle counts toward reading/exploring notes!
    await RedisService.saveUser(user);

    return c.json<PuzzleSolveResponse>({
      success: true,
      data: {
        puzzle,
        user,
        unlockedAchievements,
      }
    });
  } catch (error) {
    console.error('Solve puzzle server route failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to validate puzzle answer' }, 500);
  }
});

api.post('/puzzles/:id/like', async (c) => {
  try {
    const puzzleId = c.req.param('id');
    const { userId } = await getCurrentUser();
    const result = await RedisService.likePuzzle(userId, puzzleId);
    if (!result.success) {
      return c.json<ErrorResponse>({ success: false, error: 'Failed to like puzzle. You might have liked it already.' }, 400);
    }
    return c.json({
      success: true,
      data: {
        puzzleId,
        likes: result.likes,
        likedBy: result.likedBy,
        user: (await RedisService.getUser(userId))!,
      }
    });
  } catch (error) {
    return c.json<ErrorResponse>({ success: false, error: 'Failed to like puzzle' }, 500);
  }
});

api.post('/puzzles/:id/favorite', async (c) => {
  try {
    const puzzleId = c.req.param('id');
    const { userId } = await getCurrentUser();
    const result = await RedisService.toggleFavoritePuzzle(userId, puzzleId);
    if (!result.success) return c.json<ErrorResponse>({ success: false, error: 'Failed to toggle favorite' }, 400);
    return c.json({
      success: true,
      data: {
        puzzleId,
        favorites: result.favorites,
        user: (await RedisService.getUser(userId))!,
      }
    });
  } catch (error) {
    return c.json<ErrorResponse>({ success: false, error: 'Failed to toggle favorite' }, 500);
  }
});

api.get('/puzzle/daily', async (c) => {
  try {
    const { userId } = await getCurrentUser();
    const todayStr = getTodayDateString();
    const puzzle = getDailyPuzzleForDate(todayStr);
    const solved = await RedisService.hasSolvedDaily(userId, todayStr);
    return c.json({
      success: true,
      data: {
        puzzle: {
          id: puzzle.id,
          title: puzzle.title,
          question: puzzle.question,
          hint: puzzle.hint,
          difficulty: puzzle.difficulty,
        },
        solved,
      }
    });
  } catch (error) {
    return c.json<ErrorResponse>({ success: false, error: 'Failed to fetch daily puzzle' }, 500);
  }
});

api.post('/puzzle/daily/solve', async (c) => {
  try {
    const { userId } = await getCurrentUser();
    const todayStr = getTodayDateString();
    
    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json<ErrorResponse>({ success: false, error: 'Malformed JSON payload' }, 400);
    }
    const submitted = normalizeAnswer(body.answer);

    const solved = await RedisService.hasSolvedDaily(userId, todayStr);
    if (solved) return c.json<ErrorResponse>({ success: false, error: 'You have already solved today\'s daily puzzle.' }, 400);

    const puzzle = getDailyPuzzleForDate(todayStr);
    const correct = normalizeAnswer(puzzle.answer);
    if (correct !== submitted) {
      return c.json<ErrorResponse>({ success: false, error: 'Incorrect answer. Try again.' }, 400);
    }

    // Solve daily puzzle successfully!
    const user = await RedisService.getUser(userId);
    if (!user) return c.json<ErrorResponse>({ success: false, error: 'User profile not found' }, 404);

    await RedisService.setSolvedDaily(userId, todayStr);
    
    // Track solved dates on user profile
    if (!user.dailySolvedDates) user.dailySolvedDates = [];
    if (!user.dailySolvedDates.includes(todayStr)) {
      user.dailySolvedDates.push(todayStr);
    }

    // Rewards
    user.currentCoffeeTokens += 1; // +1 Coffee Token!
    user.reputation += 20;         // +20 Reputation!
    
    const cafeState = await RedisService.getCafeState();
    cafeState.totalWarmth += 10;   // +10 Warmth!
    await RedisService.saveCafeState(cafeState);

    user.unlockedRooms = cafeState.roomsUnlocked;

    const unlockedAchievements: string[] = [];
    const unlockedPuzzle = await RedisService.triggerAchievement(user, 'puzzle_solver');
    if (unlockedPuzzle) unlockedAchievements.push('puzzle_solver');

    RedisService.addTimelineEvent(user, 'achievement', `🧩 Solved Daily Puzzle: ${puzzle.title} (+1 Token, +20 Rep)`);
    await checkAndCompleteObjective(user, 'claim_coffee'); // Daily puzzle completion completes daily objectives
    await RedisService.saveUser(user);

    return c.json<PuzzleSolveResponse>({
      success: true,
      data: {
        user,
        unlockedAchievements,
      }
    });
  } catch (error) {
    console.error('Solve daily puzzle server route failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to solve daily puzzle' }, 500);
  }
});
