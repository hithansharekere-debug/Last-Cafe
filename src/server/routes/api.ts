import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import { RedisService } from '../core/redis';
import { ROOM_UNLOCK_THRESHOLDS, CONTRIBUTION_CATEGORIES } from '../../shared/constants';
import type {
  InitResponse,
  ClaimTokenResponse,
  SpendTokenResponse,
  LeaderboardResponse,
  PuzzleSubmitResponse,
  User,
  Room,
  Contribution,
  CafeProgress,
} from '../../shared/types';

export const api = new Hono();

// Utility: get UTC date string (YYYY-MM-DD)
function getTodayDateString(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// Initialise app state
api.get('/init', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json({ status: 'error', message: 'postId not found in context' }, 400);
  }

  try {
    const rawUsername = await reddit.getCurrentUsername();
    const username = rawUsername ?? 'anonymous';
    
    // 1. Fetch or create user
    let user: User | null = null;
    if (rawUsername) {
      user = await RedisService.getUser(username);
      if (!user) {
        user = {
          id: username,
          username,
          joinedDate: Math.floor(Date.now() / 1000),
          tokenCount: 1, // Start with one free token
          contributionCount: 0,
          lastClaimedTimestamp: null,
        };
        await RedisService.saveUser(user);
      }
    }

    // 2. Fetch progress
    const progress = await RedisService.getProgress();

    // 3. Build rooms list based on global progress
    const rooms: Room[] = [
      { id: 'foyer', name: 'Foyer', threshold: 0, isUnlocked: true },
      { 
        id: 'fireplace', 
        name: 'Fireplace Room', 
        threshold: ROOM_UNLOCK_THRESHOLDS.FIREPLACE, 
        isUnlocked: progress.totalContributions >= ROOM_UNLOCK_THRESHOLDS.FIREPLACE 
      },
      { 
        id: 'bookshelf', 
        name: 'Library Bookshelf', 
        threshold: ROOM_UNLOCK_THRESHOLDS.BOOKSHELF, 
        isUnlocked: progress.totalContributions >= ROOM_UNLOCK_THRESHOLDS.BOOKSHELF 
      },
      { 
        id: 'garden', 
        name: 'Hidden Garden', 
        threshold: ROOM_UNLOCK_THRESHOLDS.GARDEN, 
        isUnlocked: progress.totalContributions >= ROOM_UNLOCK_THRESHOLDS.GARDEN 
      },
      { 
        id: 'music_room', 
        name: 'Music Conservatory', 
        threshold: ROOM_UNLOCK_THRESHOLDS.MUSIC_ROOM, 
        isUnlocked: progress.totalContributions >= ROOM_UNLOCK_THRESHOLDS.MUSIC_ROOM 
      },
    ];

    // Ensure unlocked rooms is in sync with progress
    const currentUnlocked = rooms.filter(r => r.isUnlocked).map(r => r.id);
    if (JSON.stringify(progress.unlockedRooms.sort()) !== JSON.stringify(currentUnlocked.sort())) {
      progress.unlockedRooms = currentUnlocked;
      await RedisService.saveProgress(progress);
    }

    return c.json<InitResponse>({
      type: 'init',
      postId,
      user,
      progress,
      rooms,
    });
  } catch (error) {
    console.error('Init error:', error);
    return c.json({ status: 'error', message: 'Failed to init app' }, 500);
  }
});

// Claim daily coffee token
api.post('/claim', async (c) => {
  try {
    const rawUsername = await reddit.getCurrentUsername();
    if (!rawUsername) {
      return c.json({ status: 'error', message: 'Not logged in' }, 401);
    }

    const username = rawUsername;
    const user = await RedisService.getUser(username);
    if (!user) {
      return c.json({ status: 'error', message: 'User not found' }, 404);
    }

    const todayStr = getTodayDateString();
    const alreadyClaimed = await RedisService.hasClaimedToday(username, todayStr);
    
    if (alreadyClaimed) {
      return c.json<ClaimTokenResponse>({
        success: false,
        tokenCount: user.tokenCount,
        lastClaimedTimestamp: user.lastClaimedTimestamp ?? 0,
      });
    }

    // Give 1 token
    const now = Math.floor(Date.now() / 1000);
    user.tokenCount += 1;
    user.lastClaimedTimestamp = now;
    
    await RedisService.saveUser(user);
    // Claim status expires at the end of the day. Approximate TTL to midnight UTC
    const secondsToMidnight = Math.floor((new Date().setUTCHours(24,0,0,0) - Date.now()) / 1000);
    await RedisService.setClaimedToday(username, todayStr, secondsToMidnight);

    return c.json<ClaimTokenResponse>({
      success: true,
      tokenCount: user.tokenCount,
      lastClaimedTimestamp: now,
    });
  } catch (error) {
    console.error('Claim error:', error);
    return c.json({ status: 'error', message: 'Claim failed' }, 500);
  }
});

// Spend coffee token to post a contribution
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

    const username = rawUsername;
    const user = await RedisService.getUser(username);
    if (!user || user.tokenCount < 1) {
      return c.json({ status: 'error', message: 'Insufficient coffee tokens' }, 403);
    }

    // Deduct token, increment user contributions
    user.tokenCount -= 1;
    user.contributionCount += 1;
    await RedisService.saveUser(user);

    // Save contribution
    const contributionId = `c_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);
    const category = body.category as any;
    
    const isTimeCapsule = category === CONTRIBUTION_CATEGORIES.TIME_CAPSULE;
    const isUnlocked = isTimeCapsule 
      ? (body.targetDate ? Math.floor(Date.now() / 1000) >= body.targetDate : true) 
      : true;

    const contribution: Contribution = {
      id: contributionId,
      userId: username,
      username,
      category,
      text: body.text,
      timestamp: now,
      isUnlocked,
    };
    if (isTimeCapsule && body.targetDate) {
      contribution.targetDate = body.targetDate;
    }

    await RedisService.saveContribution(contribution);

    // Update global progress
    const progress = await RedisService.getProgress();
    progress.totalContributions += 1;

    // Check newly unlocked rooms
    const activeRooms = [
      { id: 'fireplace', threshold: ROOM_UNLOCK_THRESHOLDS.FIREPLACE },
      { id: 'bookshelf', threshold: ROOM_UNLOCK_THRESHOLDS.BOOKSHELF },
      { id: 'garden', threshold: ROOM_UNLOCK_THRESHOLDS.GARDEN },
      { id: 'music_room', threshold: ROOM_UNLOCK_THRESHOLDS.MUSIC_ROOM },
    ];
    
    const unlocked: string[] = ['foyer'];
    activeRooms.forEach(r => {
      if (progress.totalContributions >= r.threshold) {
        unlocked.push(r.id);
      }
    });
    progress.unlockedRooms = unlocked;
    await RedisService.saveProgress(progress);

    return c.json<SpendTokenResponse>({
      success: true,
      tokenCount: user.tokenCount,
      contribution,
      progress,
    });
  } catch (error) {
    console.error('Spend error:', error);
    return c.json({ status: 'error', message: 'Failed to spend token' }, 500);
  }
});

// Fetch contributions (supports category filter)
api.get('/contributions', async (c) => {
  try {
    const categoryFilter = c.req.query('category');
    let list: Contribution[] = [];

    if (categoryFilter && categoryFilter !== 'All') {
      list = await RedisService.getContributionsByCategory(categoryFilter, 50);
    } else {
      list = await RedisService.getLatestContributions(50);
    }

    // Filter locked Time Capsules (only show unlocked ones in feed)
    const filteredList = list.filter(item => {
      if (item.category === CONTRIBUTION_CATEGORIES.TIME_CAPSULE) {
        const nowSec = Math.floor(Date.now() / 1000);
        return item.targetDate ? nowSec >= item.targetDate : true;
      }
      return true;
    });

    return c.json({ contributions: filteredList });
  } catch (error) {
    console.error('Fetch contributions error:', error);
    return c.json({ status: 'error', message: 'Failed to fetch contributions' }, 500);
  }
});

// Tangram Puzzle Score Submit
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

    const username = rawUsername;
    const todayStr = getTodayDateString();

    // 1. Submit score to daily leaderboard
    await RedisService.submitPuzzleScore(body.puzzleId, todayStr, username, body.timeMs);

    // 2. Manage personal best
    const existingPB = await RedisService.getPersonalBest(username, body.puzzleId);
    let isNewPersonalBest = false;
    let pbTime = body.timeMs;

    if (existingPB === null || body.timeMs < existingPB) {
      isNewPersonalBest = true;
      await RedisService.savePersonalBest(username, body.puzzleId, body.timeMs);
    } else {
      pbTime = existingPB;
    }

    // 3. Retrieve daily leaderboard
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

// Fetch puzzle leaderboard
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
