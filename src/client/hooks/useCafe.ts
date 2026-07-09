import { useState, useEffect, useCallback } from 'react';
import type {
  User,
  CafeProgress,
  Room,
  Contribution,
  LeaderboardEntry,
  InitResponse,
  ClaimTokenResponse,
  SpendTokenResponse,
  PuzzleSubmitResponse,
} from '../../shared/types';

export const useCafe = () => {
  const [user, setUser] = useState<User | null>(null);
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
  const [error, setError] = useState<string | null>(null);

  // 1. Initialise State
  const initCafe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/init');
      if (!res.ok) throw new Error(`Init failed with status ${res.status}`);
      const data: InitResponse = await res.json();
      
      setUser(data.user);
      setProgress(data.progress);
      setRooms(data.rooms);
    } catch (err) {
      console.error('Failed to init cafe:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Fallback mocks for clean offline interface rendering
      setUser({
        id: 'visitor',
        username: 'Cozy Visitor',
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
    void initCafe();
  }, [initCafe]);

  // 2. Claim daily token
  const claimDailyToken = async (): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch('/api/claim', { method: 'POST' });
      if (!res.ok) throw new Error(`Claim endpoint error ${res.status}`);
      const data: ClaimTokenResponse = await res.json();
      
      if (data.success && user) {
        setUser({
          ...user,
          tokenCount: data.tokenCount,
          lastClaimedTimestamp: data.lastClaimedTimestamp,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to claim daily token:', err);
      // Mock update to allow UI testing
      if (user) {
        setUser({
          ...user,
          tokenCount: user.tokenCount + 1,
          lastClaimedTimestamp: Math.floor(Date.now() / 1000),
        });
        return true;
      }
      return false;
    }
  };

  // 3. Spend token
  const spendToken = async (category: string, text: string, targetDate?: number): Promise<boolean> => {
    if (!user || user.tokenCount < 1) {
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
        setUser((prev) => prev ? { ...prev, tokenCount: data.tokenCount, contributionCount: prev.contributionCount + 1 } : null);
        setProgress(data.progress);
        
        // Update room unlock parameters locally
        setRooms((prevRooms) =>
          prevRooms.map((r) => ({
            ...r,
            isUnlocked: data.progress.totalContributions >= r.threshold,
          }))
        );

        // Prepend contribution to local list if they match active category
        setContributions((prev) => [data.contribution, ...prev]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to spend token:', err);
      // Offline fallback state update
      setUser((prev) => prev ? { ...prev, tokenCount: prev.tokenCount - 1, contributionCount: prev.contributionCount + 1 } : null);
      setProgress((prev) => {
        const nextTotal = prev.totalContributions + 1;
        return {
          ...prev,
          totalContributions: nextTotal,
          unlockedRooms: nextTotal >= 50 ? ['foyer', 'fireplace'] : ['foyer'],
        };
      });
      setRooms((prevRooms) =>
        prevRooms.map((r) => {
          const nextTotal = progress.totalContributions + 1;
          return {
            ...r,
            isUnlocked: nextTotal >= r.threshold,
          };
        })
      );
      
      const mockContrib: Contribution = {
        id: `mock_${Math.random()}`,
        userId: user?.id ?? 'visitor',
        username: user?.username ?? 'Visitor',
        category: category as any,
        text,
        timestamp: Math.floor(Date.now() / 1000),
        isUnlocked: true,
      };
      setContributions((prev) => [mockContrib, ...prev]);
      return true;
    }
  };

  // 4. Fetch contributions with filters
  const fetchContributions = useCallback(async (category: string = 'All') => {
    setError(null);
    try {
      const url = category === 'All' ? '/api/contributions' : `/api/contributions?category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch contributions ${res.status}`);
      const data = await res.json();
      setContributions(data.contributions || []);
    } catch (err) {
      console.error('Failed to fetch contributions:', err);
      // Mock contributions representing cozy coffee shop notes
      const mockList: Contribution[] = [
        {
          id: 'm1',
          userId: 'user1',
          username: 'EspressoLover',
          category: 'Memory',
          text: 'This place reminds me of a little basement library I visited in Paris. Smelled of rain and yellowed books.',
          timestamp: Math.floor(Date.now() / 1000) - 3600,
          isUnlocked: true,
        },
        {
          id: 'm2',
          userId: 'user2',
          username: 'OldSoul',
          category: 'Advice',
          text: 'Drink your coffee slow. The world moves too fast outside these wooden walls anyway.',
          timestamp: Math.floor(Date.now() / 1000) - 7200,
          isUnlocked: true,
        },
        {
          id: 'm3',
          userId: 'user3',
          username: 'BookWorm',
          category: 'Recommendation',
          text: 'Read "The Shadow of the Wind" next time you are sitting by the fireplace. It matches this cozy room perfectly.',
          timestamp: Math.floor(Date.now() / 1000) - 10800,
          isUnlocked: true,
        },
      ];
      setContributions(category === 'All' ? mockList : mockList.filter(item => item.category === category));
    }
  }, []);

  // 5. Submit Puzzle Time
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
      
      // Offline fallback state update
      if (pbTimeMs === null || timeMs < pbTimeMs) {
        setPbTimeMs(timeMs);
      }
      
      // Insert score into mock leaderboard
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

  // 6. Fetch puzzle leaderboard
  const fetchPuzzleLeaderboard = useCallback(async (puzzleId: string = 'tangram_daily') => {
    try {
      const res = await fetch(`/api/puzzle/leaderboard?puzzleId=${puzzleId}`);
      if (!res.ok) throw new Error(`Leaderboard fetch error ${res.status}`);
      const data = await res.json();
      setPuzzleLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      const mockLeaderboard: LeaderboardEntry[] = [
        { username: 'BaconLatte', timeMs: 45200, rank: 1, date: '2026-07-08' },
        { username: 'BrewMaster', timeMs: 58900, rank: 2, date: '2026-07-08' },
        { username: 'CozyReader', timeMs: 74200, rank: 3, date: '2026-07-08' },
      ];
      setPuzzleLeaderboard(mockLeaderboard);
    }
  }, []);

  return {
    user,
    progress,
    rooms,
    contributions,
    puzzleLeaderboard,
    pbTimeMs,
    loading,
    error,
    refreshState: initCafe,
    claimDailyToken,
    spendToken,
    fetchContributions,
    submitPuzzleScore,
    fetchPuzzleLeaderboard,
  };
};
