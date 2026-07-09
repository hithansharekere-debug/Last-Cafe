import { useState, useEffect, useCallback } from 'react';
import type {
  User,
  CafeState,
  CafeProgress,
  Room,
  Contribution,
  LeaderboardEntry,
  InitResponse,
  ClaimTokenResponse,
  SpendTokenResponse,
  AddContributionResponse,
  PuzzleSubmitResponse,
} from '../../shared/types';

export const useCafe = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cafe, setCafe] = useState<CafeState>({
    totalVisitors: 0,
    totalNotes: 0,
    totalWarmth: 0,
    roomsUnlocked: ['foyer'],
    lastUpdated: 0,
  });
  const [progress, setProgress] = useState<CafeProgress>({
    totalContributions: 0,
    unlockedRooms: ['foyer'],
    activeUsersCount: 0,
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [puzzleLeaderboard, setPuzzleLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pbTimeMs, setPbTimeMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [canClaimCoffee, setCanClaimCoffee] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════════
  // 1. Init / Refresh
  // ═══════════════════════════════════════════════════════════════════════
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/init');
      if (!res.ok) throw new Error(`Init failed with status ${res.status}`);
      const data: InitResponse = await res.json();

      setUser(data.user);
      setCafe(data.cafe);
      setProgress(data.progress);
      setRooms(data.rooms);
      setCanClaimCoffee(data.canClaimCoffee);
    } catch (err) {
      console.error('Failed to init cafe:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');

      // Fallback mocks for clean offline interface rendering
      setUser({
        id: 'visitor',
        username: 'Cozy Visitor',
        joinedAt: Math.floor(Date.now() / 1000),
        lastVisit: Math.floor(Date.now() / 1000),
        visitCount: 1,
        currentCoffeeTokens: 1,
        lastCoffeeClaim: null,
        totalNotesWritten: 0,
        totalWarmthContributed: 0,
        unlockedRooms: ['foyer'],
        puzzleHighScore: null,
        joinedDate: Math.floor(Date.now() / 1000),
        tokenCount: 1,
        contributionCount: 0,
        lastClaimedTimestamp: null,
      });
      setRooms([
        { id: 'foyer', name: 'Foyer', threshold: 0, isUnlocked: true },
        { id: 'fireplace', name: 'Fireplace Room', threshold: 50, isUnlocked: false },
        { id: 'bookshelf', name: 'Library Bookshelf', threshold: 200, isUnlocked: false },
        { id: 'garden', name: 'Hidden Garden', threshold: 500, isUnlocked: false },
        { id: 'music_room', name: 'Music Conservatory', threshold: 1000, isUnlocked: false },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run on mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Claim daily coffee token
  // ═══════════════════════════════════════════════════════════════════════
  const claimCoffee = async (): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch('/api/claim', { method: 'POST' });
      if (!res.ok) throw new Error(`Claim endpoint error ${res.status}`);
      const data: ClaimTokenResponse = await res.json();

      if (data.success) {
        setUser(data.user);
        setCafe(data.cafe);
        setCanClaimCoffee(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to claim daily token:', err);
      // Mock update for offline testing
      if (user) {
        const now = Math.floor(Date.now() / 1000);
        setUser({
          ...user,
          currentCoffeeTokens: user.currentCoffeeTokens + 1,
          lastCoffeeClaim: now,
          tokenCount: user.currentCoffeeTokens + 1,
          lastClaimedTimestamp: now,
        });
        setCanClaimCoffee(false);
        return true;
      }
      return false;
    }
  };

  // Legacy alias
  const claimDailyToken = claimCoffee;

  // ═══════════════════════════════════════════════════════════════════════
  // 3. Add contribution (new primary method)
  // ═══════════════════════════════════════════════════════════════════════
  const addContribution = async (category: string, message: string, targetDate?: number): Promise<boolean> => {
    if (!user || user.currentCoffeeTokens < 1) {
      setError('You need a coffee token to leave a note.');
      return false;
    }
    setError(null);
    try {
      const res = await fetch('/api/contribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message, targetDate }),
      });
      if (!res.ok) throw new Error(`Contribution error ${res.status}`);
      const data: AddContributionResponse = await res.json();

      if (data.success) {
        setCafe(data.cafe);
        setProgress(data.progress);
        setContributions((prev) => [data.contribution, ...prev]);

        // Refresh user to get updated token count
        await refresh();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to add contribution:', err);
      return false;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 4. Spend token (legacy — delegates to /api/spend)
  // ═══════════════════════════════════════════════════════════════════════
  const spendToken = async (category: string, text: string, targetDate?: number): Promise<boolean> => {
    if (!user || user.currentCoffeeTokens < 1) {
      setError('You need a coffee token to leave a note.');
      return false;
    }
    setError(null);
    try {
      const res = await fetch('/api/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, text, targetDate }),
      });
      if (!res.ok) throw new Error(`Spend token error ${res.status}`);
      const data: SpendTokenResponse = await res.json();

      if (data.success) {
        setUser(data.user);
        setCafe(data.cafe);
        setProgress(data.progress);

        // Update rooms locally
        setRooms((prevRooms) =>
          prevRooms.map((r) => ({
            ...r,
            isUnlocked: data.cafe.totalWarmth >= r.threshold,
          }))
        );

        setContributions((prev) => [data.contribution, ...prev]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to spend token:', err);
      // Offline fallback
      if (user) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                currentCoffeeTokens: prev.currentCoffeeTokens - 1,
                totalNotesWritten: prev.totalNotesWritten + 1,
                tokenCount: prev.currentCoffeeTokens - 1,
                contributionCount: prev.totalNotesWritten + 1,
              }
            : null
        );

        const mockContrib: Contribution = {
          id: `mock_${Math.random()}`,
          authorId: user.id,
          username: user.username,
          category: category as Contribution['category'],
          message: text,
          createdAt: Math.floor(Date.now() / 1000),
          warmthGiven: 1,
          likes: 0,
          isUnlocked: true,
          userId: user.id,
          text,
          timestamp: Math.floor(Date.now() / 1000),
        };
        setContributions((prev) => [mockContrib, ...prev]);
        return true;
      }
      return false;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 5. Fetch contributions
  // ═══════════════════════════════════════════════════════════════════════
  const fetchContributions = useCallback(async (category: string = 'All') => {
    setError(null);
    try {
      const url =
        category === 'All'
          ? '/api/contributions'
          : `/api/contributions?category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch contributions ${res.status}`);
      const data = await res.json() as { contributions: Contribution[] };
      setContributions(data.contributions || []);
    } catch (err) {
      console.error('Failed to fetch contributions:', err);
      // Mock data for offline testing
      const mockList: Contribution[] = [
        {
          id: 'm1',
          authorId: 'user1',
          username: 'EspressoLover',
          category: 'Memory',
          message: 'This place reminds me of a little basement library I visited in Paris. Smelled of rain and yellowed books.',
          createdAt: Math.floor(Date.now() / 1000) - 3600,
          warmthGiven: 1,
          likes: 3,
          isUnlocked: true,
          userId: 'user1',
          text: 'This place reminds me of a little basement library I visited in Paris. Smelled of rain and yellowed books.',
          timestamp: Math.floor(Date.now() / 1000) - 3600,
        },
        {
          id: 'm2',
          authorId: 'user2',
          username: 'OldSoul',
          category: 'Advice',
          message: 'Drink your coffee slow. The world moves too fast outside these wooden walls anyway.',
          createdAt: Math.floor(Date.now() / 1000) - 7200,
          warmthGiven: 1,
          likes: 5,
          isUnlocked: true,
          userId: 'user2',
          text: 'Drink your coffee slow. The world moves too fast outside these wooden walls anyway.',
          timestamp: Math.floor(Date.now() / 1000) - 7200,
        },
        {
          id: 'm3',
          authorId: 'user3',
          username: 'BookWorm',
          category: 'Recommendation',
          message: 'Read "The Shadow of the Wind" next time you are sitting by the fireplace.',
          createdAt: Math.floor(Date.now() / 1000) - 10800,
          warmthGiven: 1,
          likes: 2,
          isUnlocked: true,
          userId: 'user3',
          text: 'Read "The Shadow of the Wind" next time you are sitting by the fireplace.',
          timestamp: Math.floor(Date.now() / 1000) - 10800,
        },
      ];
      setContributions(category === 'All' ? mockList : mockList.filter((item) => item.category === category));
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // 6. Puzzle score submission
  // ═══════════════════════════════════════════════════════════════════════
  const submitPuzzleScore = async (puzzleId: string, timeMs: number): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch('/api/puzzle/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId, timeMs }),
      });
      if (!res.ok) throw new Error(`Submit score error ${res.status}`);
      const data: PuzzleSubmitResponse = await res.json();

      if (data.success) {
        setPbTimeMs(data.personalBestTimeMs);
        setPuzzleLeaderboard(data.leaderboard);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to submit puzzle score:', err);
      if (pbTimeMs === null || timeMs < pbTimeMs) {
        setPbTimeMs(timeMs);
      }
      const newEntry: LeaderboardEntry = {
        username: user?.username ?? 'Visitor',
        timeMs,
        rank: 1,
        date: new Date().toISOString().split('T')[0] ?? '',
      };
      setPuzzleLeaderboard((prev) => {
        const list = [...prev, newEntry].sort((a, b) => a.timeMs - b.timeMs);
        return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
      });
      return true;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 7. Fetch puzzle leaderboard
  // ═══════════════════════════════════════════════════════════════════════
  const fetchPuzzleLeaderboard = useCallback(async (puzzleId: string = 'tangram_daily') => {
    try {
      const res = await fetch(`/api/puzzle/leaderboard?puzzleId=${puzzleId}`);
      if (!res.ok) throw new Error(`Leaderboard fetch error ${res.status}`);
      const data = await res.json() as { leaderboard: LeaderboardEntry[] };
      setPuzzleLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setPuzzleLeaderboard([
        { username: 'BaconLatte', timeMs: 45200, rank: 1, date: '2026-07-08' },
        { username: 'BrewMaster', timeMs: 58900, rank: 2, date: '2026-07-08' },
        { username: 'CozyReader', timeMs: 74200, rank: 3, date: '2026-07-08' },
      ]);
    }
  }, []);

  return {
    // State
    user,
    cafe,
    progress,
    rooms,
    contributions,
    puzzleLeaderboard,
    pbTimeMs,
    loading,
    canClaimCoffee,
    error,

    // Actions
    refresh,
    claimCoffee,
    addContribution,
    fetchContributions,
    submitPuzzleScore,
    fetchPuzzleLeaderboard,

    // Legacy aliases (used by existing screens)
    refreshState: refresh,
    claimDailyToken,
    spendToken,
  };
};
