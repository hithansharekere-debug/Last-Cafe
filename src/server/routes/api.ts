import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import { RedisService } from '../core/redis';
import { ROOM_UNLOCK_THRESHOLDS, CONTRIBUTION_CATEGORIES } from '../../shared/constants';
import type {
  InitResponse,
  ClaimTokenResponse,
  SpendTokenResponse,
  AddContributionResponse,
  ContributionsListResponse,
  LeaderboardResponse,
  PuzzleSubmitResponse,
  Room,
  Contribution,
  CafeState,
  CafeProgress,
} from '../../shared/types';

export const api = new Hono();

// ─── Utility ────────────────────────────────────────────────────────────

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function buildRoomsList(cafeState: CafeState): Room[] {
  return [
    { id: 'foyer', name: 'Foyer', threshold: 0, isUnlocked: true },
    {
      id: 'fireplace',
      name: 'Fireplace Room',
      threshold: ROOM_UNLOCK_THRESHOLDS.FIREPLACE,
      isUnlocked: cafeState.totalWarmth >= ROOM_UNLOCK_THRESHOLDS.FIREPLACE,
    },
    {
      id: 'bookshelf',
      name: 'Library Bookshelf',
      threshold: ROOM_UNLOCK_THRESHOLDS.BOOKSHELF,
      isUnlocked: cafeState.totalWarmth >= ROOM_UNLOCK_THRESHOLDS.BOOKSHELF,
    },
    {
      id: 'garden',
      name: 'Hidden Garden',
      threshold: ROOM_UNLOCK_THRESHOLDS.GARDEN,
      isUnlocked: cafeState.totalWarmth >= ROOM_UNLOCK_THRESHOLDS.GARDEN,
    },
    {
      id: 'music_room',
      name: 'Music Conservatory',
      threshold: ROOM_UNLOCK_THRESHOLDS.MUSIC_ROOM,
      isUnlocked: cafeState.totalWarmth >= ROOM_UNLOCK_THRESHOLDS.MUSIC_ROOM,
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
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

// ═════════════════════════════════════════════════════════════════════════
// GET /api/init
// Returns: user profile, cafe state, rooms, canClaimCoffee
// ═════════════════════════════════════════════════════════════════════════
api.get('/init', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json({ status: 'error', message: 'postId not found in context' }, 400);
  }

  try {
    const rawUsername = await reddit.getCurrentUsername();
    const username = rawUsername ?? 'anonymous';

    // Fetch or auto-create user
    const user = rawUsername
      ? await RedisService.getOrCreateUser(username, username)
      : null;

    // Fetch cafe state
    const cafeState = await RedisService.getCafeState();

    // Build rooms list from warmth
    const rooms = buildRoomsList(cafeState);

    // Check if coffee can be claimed
    const todayStr = getTodayDateString();
    const canClaimCoffee = user
      ? await RedisService.canClaimCoffee(user.id, todayStr)
      : false;

    // Update user's unlocked rooms to reflect latest state
    if (user) {
      user.unlockedRooms = cafeState.roomsUnlocked;
      await RedisService.saveUser(user);
    }

    return c.json<InitResponse>({
      type: 'init',
      postId,
      user,
      cafe: cafeState,
      rooms,
      canClaimCoffee,
      progress: cafeStateToProgress(cafeState),
    });
  } catch (error) {
    console.error('Init error:', error);
    return c.json({ status: 'error', message: 'Failed to init app' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// POST /api/claim
// Claims today's Coffee Token.
// ═════════════════════════════════════════════════════════════════════════
api.post('/claim', async (c) => {
  try {
    const rawUsername = await reddit.getCurrentUsername();
    if (!rawUsername) {
      return c.json({ status: 'error', message: 'Not logged in' }, 401);
    }

    const todayStr = getTodayDateString();
    const result = await RedisService.claimDailyCoffee(rawUsername, todayStr);
    const cafeState = await RedisService.getCafeState();

    return c.json<ClaimTokenResponse>({
      success: result.success,
      user: result.user,
      cafe: cafeState,
      tokenCount: result.user.currentCoffeeTokens,
      lastClaimedTimestamp: result.user.lastCoffeeClaim ?? 0,
    });
  } catch (error) {
    console.error('Claim error:', error);
    return c.json({ status: 'error', message: 'Claim failed' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// POST /api/contribution
// Stores a new contribution (costs 1 coffee token).
// ═════════════════════════════════════════════════════════════════════════
api.post('/contribution', async (c) => {
  try {
    const rawUsername = await reddit.getCurrentUsername();
    if (!rawUsername) {
      return c.json({ status: 'error', message: 'Not logged in' }, 401);
    }

    const body = await c.req.json<{ category: string; message: string; targetDate?: number }>();
    if (!body.message || !body.category) {
      return c.json({ status: 'error', message: 'Missing message or category' }, 400);
    }

    const user = await RedisService.getUser(rawUsername);
    if (!user || user.currentCoffeeTokens < 1) {
      return c.json({ status: 'error', message: 'Insufficient coffee tokens' }, 403);
    }

    // Deduct token, increment user stats
    const warmth = 1;
    user.currentCoffeeTokens -= 1;
    user.totalNotesWritten += 1;
    user.totalWarmthContributed += warmth;
    await RedisService.saveUser(user);

    // Build contribution
    const now = Math.floor(Date.now() / 1000);
    const category = body.category as Contribution['category'];
    const isTimeCapsule = category === CONTRIBUTION_CATEGORIES.TIME_CAPSULE;
    const isUnlocked = isTimeCapsule
      ? (body.targetDate ? now >= body.targetDate : true)
      : true;

    const contribution: Contribution = {
      id: generateContributionId(),
      authorId: rawUsername,
      username: rawUsername,
      category,
      message: body.message,
      createdAt: now,
      warmthGiven: warmth,
      likes: 0,
      isUnlocked,
      // Legacy aliases
      userId: rawUsername,
      text: body.message,
      timestamp: now,
    };

    if (isTimeCapsule && body.targetDate !== undefined) {
      contribution.targetDate = body.targetDate;
    }

    await RedisService.saveContribution(contribution);

    // Update global cafe state
    const cafeState = await RedisService.incrementNotes(warmth);

    // Update user's unlocked rooms
    user.unlockedRooms = cafeState.roomsUnlocked;
    await RedisService.saveUser(user);

    return c.json<AddContributionResponse>({
      success: true,
      contribution,
      cafe: cafeState,
      progress: cafeStateToProgress(cafeState),
    });
  } catch (error) {
    console.error('Contribution error:', error);
    return c.json({ status: 'error', message: 'Failed to save contribution' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// POST /api/spend (legacy alias for /api/contribution)
// ═════════════════════════════════════════════════════════════════════════
api.post('/spend', async (c) => {
  try {
    const rawUsername = await reddit.getCurrentUsername();
    if (!rawUsername) {
      return c.json({ status: 'error', message: 'Not logged in' }, 401);
    }

    const body = await c.req.json<{ category: string; text: string; targetDate?: number }>();
    if (!body.text || !body.category) {
      return c.json({ status: 'error', message: 'Missing text or category' }, 400);
    }

    const user = await RedisService.getUser(rawUsername);
    if (!user || user.currentCoffeeTokens < 1) {
      return c.json({ status: 'error', message: 'Insufficient coffee tokens' }, 403);
    }

    // Deduct token, increment user stats
    const warmth = 1;
    user.currentCoffeeTokens -= 1;
    user.totalNotesWritten += 1;
    user.totalWarmthContributed += warmth;
    await RedisService.saveUser(user);

    // Build contribution
    const now = Math.floor(Date.now() / 1000);
    const category = body.category as Contribution['category'];
    const isTimeCapsule = category === CONTRIBUTION_CATEGORIES.TIME_CAPSULE;
    const isUnlocked = isTimeCapsule
      ? (body.targetDate ? now >= body.targetDate : true)
      : true;

    const contribution: Contribution = {
      id: generateContributionId(),
      authorId: rawUsername,
      username: rawUsername,
      category,
      message: body.text,
      createdAt: now,
      warmthGiven: warmth,
      likes: 0,
      isUnlocked,
      // Legacy aliases
      userId: rawUsername,
      text: body.text,
      timestamp: now,
    };

    if (isTimeCapsule && body.targetDate !== undefined) {
      contribution.targetDate = body.targetDate;
    }

    await RedisService.saveContribution(contribution);

    // Update global cafe state
    const cafeState = await RedisService.incrementNotes(warmth);

    return c.json<SpendTokenResponse>({
      success: true,
      user,
      contribution,
      cafe: cafeState,
      tokenCount: user.currentCoffeeTokens,
      progress: cafeStateToProgress(cafeState),
    });
  } catch (error) {
    console.error('Spend error:', error);
    return c.json({ status: 'error', message: 'Failed to spend token' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// GET /api/contributions
// Returns recent contributions (supports ?category= filter).
// ═════════════════════════════════════════════════════════════════════════
api.get('/contributions', async (c) => {
  try {
    const categoryFilter = c.req.query('category');
    let list: Contribution[];

    if (categoryFilter && categoryFilter !== 'All') {
      list = await RedisService.getContributionsByCategory(categoryFilter, 50);
    } else {
      list = await RedisService.getRecentContributions(50);
    }

    // Filter locked Time Capsules
    const now = Math.floor(Date.now() / 1000);
    const filtered = list.filter((item) => {
      if (item.category === CONTRIBUTION_CATEGORIES.TIME_CAPSULE) {
        return item.targetDate ? now >= item.targetDate : true;
      }
      return true;
    });

    return c.json<ContributionsListResponse>({ contributions: filtered });
  } catch (error) {
    console.error('Fetch contributions error:', error);
    return c.json({ status: 'error', message: 'Failed to fetch contributions' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// GET /api/contribution/random
// Returns one random contribution.
// ═════════════════════════════════════════════════════════════════════════
api.get('/contribution/random', async (c) => {
  try {
    const contrib = await RedisService.getRandomContribution();
    if (!contrib) {
      return c.json({ status: 'error', message: 'No contributions found' }, 404);
    }
    return c.json({ contribution: contrib });
  } catch (error) {
    console.error('Random contribution error:', error);
    return c.json({ status: 'error', message: 'Failed to fetch random contribution' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// Puzzle endpoints (unchanged logic, kept for completeness)
// ═════════════════════════════════════════════════════════════════════════

api.post('/puzzle/submit', async (c) => {
  try {
    const rawUsername = await reddit.getCurrentUsername();
    if (!rawUsername) {
      return c.json({ status: 'error', message: 'Not logged in' }, 401);
    }

    const body = await c.req.json<{ puzzleId: string; timeMs: number }>();
    if (!body.puzzleId || !body.timeMs) {
      return c.json({ status: 'error', message: 'Missing puzzleId or timeMs' }, 400);
    }

    const todayStr = getTodayDateString();

    await RedisService.submitPuzzleScore(body.puzzleId, todayStr, rawUsername, body.timeMs);

    const existingPB = await RedisService.getPersonalBest(rawUsername, body.puzzleId);
    let isNewPersonalBest = false;
    let pbTime = body.timeMs;

    if (existingPB === null || body.timeMs < existingPB) {
      isNewPersonalBest = true;
      await RedisService.savePersonalBest(rawUsername, body.puzzleId, body.timeMs);

      // Also update user's puzzleHighScore
      await RedisService.updateUser(rawUsername, { puzzleHighScore: body.timeMs });
    } else {
      pbTime = existingPB;
    }

    const leaderboard = await RedisService.getPuzzleLeaderboard(body.puzzleId, todayStr, 10);

    return c.json<PuzzleSubmitResponse>({
      success: true,
      personalBestTimeMs: pbTime,
      isNewPersonalBest,
      leaderboard,
    });
  } catch (error) {
    console.error('Puzzle submit error:', error);
    return c.json({ status: 'error', message: 'Failed to submit puzzle score' }, 500);
  }
});

api.get('/puzzle/leaderboard', async (c) => {
  try {
    const puzzleId = c.req.query('puzzleId') ?? 'tangram_daily';
    const dateStr = c.req.query('date') ?? getTodayDateString();

    const leaderboard = await RedisService.getPuzzleLeaderboard(puzzleId, dateStr, 10);
    return c.json<LeaderboardResponse>({ leaderboard });
  } catch (error) {
    console.error('Fetch leaderboard error:', error);
    return c.json({ status: 'error', message: 'Failed to fetch leaderboard' }, 500);
  }
});
