import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import { RedisService, buildUnlockedRooms } from '../core/redis';
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
  User,
  ErrorResponse,
} from '../../shared/types';

export const api = new Hono();

// ─── Shared Utilities ───────────────────────────────────────────────────

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
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

/**
 * Helper to identify the current Reddit user from Devvit context.
 * Gracefully falls back to a temporary anonymous user for local/offline testing.
 */
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
  // 1. Validate Category
  const validCategories = Object.values(CONTRIBUTION_CATEGORIES) as string[];
  if (!validCategories.includes(input.category)) {
    throw new ApiError(400, `Invalid note category: "${input.category}"`);
  }

  // 2. Validate Message Content
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

  // 3. Prevent Negative Token Count
  if (user.currentCoffeeTokens < 1) {
    throw new ApiError(403, 'Insufficient coffee tokens available to complete this action');
  }

  // Deduct token, increment user stats
  const warmth = 1;
  user.currentCoffeeTokens = Math.max(user.currentCoffeeTokens - 1, 0);
  user.totalNotesWritten += 1;
  user.totalWarmthContributed += warmth;

  // Build contribution
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
    isUnlocked,
    // Legacy aliases
    userId: input.userId,
    text: cleanMsg,
    timestamp: now,
  };

  if (isTimeCapsule && input.targetDate !== undefined) {
    contribution.targetDate = input.targetDate;
  }

  // Persist contribution
  await RedisService.saveContribution(contribution);

  // Update global cafe state (also auto-unlocks rooms)
  const cafeState = await RedisService.incrementNotes(warmth);

  // Sync user's unlocked rooms and save
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

    // Fetch or auto-create user
    const user = await RedisService.getOrCreateUser(userId, username);

    // Fetch cafe state
    const cafeState = await RedisService.getCafeState();

    // Build rooms list
    const rooms = buildRoomsList(cafeState);

    // Check if coffee can be claimed
    const todayStr = getTodayDateString();
    const canClaimCoffee = await RedisService.canClaimCoffee(user.id, todayStr);

    // Update user's unlocked rooms to reflect latest state
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

    return c.json<ClaimTokenResponse>({
      success: true,
      data: {
        user: result.user,
        cafe: cafeState,
        tokenCount: result.user.currentCoffeeTokens,
        lastClaimedTimestamp: result.user.lastCoffeeClaim ?? 0,
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

    // Body structure check
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

    return c.json<AddContributionResponse>({
      success: true,
      data: {
        contribution: result.contribution,
        cafe: result.cafeState,
        progress: cafeStateToProgress(result.cafeState),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json<ErrorResponse>({ success: false, error: error.message }, error.statusCode as any);
    }
    console.error('Contribution endpoint failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'An unexpected error occurred while placing note' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// POST /api/spend (legacy alias)
// ═════════════════════════════════════════════════════════════════════════
api.post('/spend', async (c) => {
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

    if (body.text === undefined || body.category === undefined) {
      return c.json<ErrorResponse>({ success: false, error: 'Missing required parameters: text and category' }, 400);
    }

    const result = await createContribution({
      userId,
      username,
      category: String(body.category),
      messageText: String(body.text),
      targetDate: body.targetDate !== undefined ? Number(body.targetDate) : undefined,
    });

    return c.json<SpendTokenResponse>({
      success: true,
      data: {
        user: result.user,
        contribution: result.contribution,
        cafe: result.cafeState,
        tokenCount: result.user.currentCoffeeTokens,
        progress: cafeStateToProgress(result.cafeState),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json<ErrorResponse>({ success: false, error: error.message }, error.statusCode as any);
    }
    console.error('Spend legacy endpoint failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'An unexpected error occurred while spending token' }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════════
// GET /api/contributions
// ═════════════════════════════════════════════════════════════════════════
api.get('/contributions', async (c) => {
  try {
    const categoryFilter = c.req.query('category');
    let list: Contribution[];

    if (categoryFilter && categoryFilter !== 'All') {
      const validCategories = Object.values(CONTRIBUTION_CATEGORIES) as string[];
      if (!validCategories.includes(categoryFilter)) {
        return c.json<ErrorResponse>({ success: false, error: `Invalid category filter: "${categoryFilter}"` }, 400);
      }
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
      await RedisService.updateUser(userId, { puzzleHighScore: Number(body.timeMs) });
    } else {
      pbTime = existingPB;
    }

    const leaderboard = await RedisService.getPuzzleLeaderboard(body.puzzleId, todayStr, 10);

    return c.json<PuzzleSubmitResponse>({
      success: true,
      data: {
        personalBestTimeMs: pbTime,
        isNewPersonalBest,
        leaderboard,
      },
    });
  } catch (error) {
    console.error('Puzzle submit endpoint failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to submit puzzle score' }, 500);
  }
});

api.get('/puzzle/leaderboard', async (c) => {
  try {
    const puzzleId = c.req.query('puzzleId') ?? 'tangram_daily';
    const dateStr = c.req.query('date') ?? getTodayDateString();

    const leaderboard = await RedisService.getPuzzleLeaderboard(puzzleId, dateStr, 10);
    return c.json<LeaderboardResponse>({
      success: true,
      data: {
        leaderboard,
      },
    });
  } catch (error) {
    console.error('Fetch leaderboard endpoint failure:', error);
    return c.json<ErrorResponse>({ success: false, error: 'Failed to fetch leaderboard data' }, 500);
  }
});
