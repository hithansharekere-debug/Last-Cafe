import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  User,
  Contribution,
  CafeState,
  CafeProgress,
  Room,
  LeaderboardEntry,
  InitResponse,
  ClaimTokenResponse,
  AddContributionResponse,
  ContributionsListResponse,
  LeaderboardResponse,
  PuzzleSubmitResponse,
  LikeResponse,
  FavoriteResponse,
  DailyObjective,
  CommunityPuzzle,
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
  const [loading, setLoading] = useState(false);
  const [canClaimCoffee, setCanClaimCoffee] = useState(false);
  const [dailyObjectives, setDailyObjectives] = useState<DailyObjective[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const currentQueryRef = useRef<string>('All');
  const [error, setError] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════════
  // 1. Init / Refresh
  // ═══════════════════════════════════════════════════════════════════════
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/init');
      if (!res.ok) throw new Error(`Initial load error ${res.status}`);
      const resData: InitResponse = await res.json();

      if (resData.success && resData.data) {
        setUser(resData.data.user);
        setCafe(resData.data.cafe);
        setProgress(resData.data.progress);
        setRooms(resData.data.rooms);
        setCanClaimCoffee(resData.data.canClaimCoffee);
        setDailyObjectives(resData.data.dailyObjectives || []);
      } else {
        throw new Error('Server initialized state successfully but returned no data');
      }

      // Fetch latest contributions to sync state
      const contribsRes = await fetch('/api/contributions');
      if (contribsRes.ok) {
        const contribsData: ContributionsListResponse = await contribsRes.json();
        if (contribsData.success && contribsData.data) {
          setContributions(contribsData.data.contributions || []);
        }
      }
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
        currentStreak: 1,
        longestStreak: 1,
        achievements: [],
        completedObjectivesToday: [],
        objectivesDate: '',
        readNotesCountToday: 0,
        timeline: [],
        favorites: [],
        reputation: 0,
        solvedPuzzles: [],
        dailySolvedDates: [],
      });
      setRooms([
        { id: 'foyer', name: 'Foyer', threshold: 0, isUnlocked: true },
        { id: 'fireplace', name: 'Fireplace Room', threshold: 50, isUnlocked: false },
        { id: 'bookshelf', name: 'Library Bookshelf', threshold: 200, isUnlocked: false },
        { id: 'garden', name: 'Hidden Garden', threshold: 500, isUnlocked: false },
        { id: 'music_room', name: 'Music Conservatory', threshold: 1000, isUnlocked: false },
      ]);
      setContributions([
        {
          id: 'm1',
          authorId: 'user1',
          username: 'EspressoLover',
          category: 'Memory',
          message: 'This place reminds me of a little basement library I visited in Paris. Smelled of rain and yellowed books.',
          createdAt: Math.floor(Date.now() / 1000) - 3600,
          warmthGiven: 1,
          likes: 3,
          likedBy: [],
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
          likedBy: [],
          isUnlocked: true,
          userId: 'user2',
          text: 'Drink your coffee slow. The world moves too fast outside these wooden walls anyway.',
          timestamp: Math.floor(Date.now() / 1000) - 7200,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Claim daily coffee token
  // ═══════════════════════════════════════════════════════════════════════
  const claimCoffee = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch('/api/claim', { method: 'POST' });
      if (!res.ok) throw new Error(`Claim endpoint error ${res.status}`);
      const resData: ClaimTokenResponse = await res.json();

      if (resData.success && resData.data) {
        setUser(resData.data.user);
        setCafe(resData.data.cafe);
        setCanClaimCoffee(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to claim daily token:', err);
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
  }, [user]);

  // Legacy alias
  const claimDailyToken = claimCoffee;

  // ═══════════════════════════════════════════════════════════════════════
  // 3. Add contribution
  // ═══════════════════════════════════════════════════════════════════════
  const addContribution = useCallback(async (category: string, message: string, targetDate?: number): Promise<boolean> => {
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
      const resData: AddContributionResponse = await res.json();

      if (resData.success && resData.data) {
        setCafe(resData.data.cafe);
        setProgress(resData.data.progress);
        setContributions((prev) => [resData.data!.contribution, ...prev]);
        setUser(resData.data.user); // Sync user stats immediately (Notes Written, Warmth)

        // Sync local room states
        setRooms((prevRooms) =>
          prevRooms.map((r) => ({
            ...r,
            isUnlocked: resData.data!.cafe.totalWarmth >= r.threshold,
          }))
        );

        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to add contribution:', err);
      return false;
    }
  }, [user]);

  // ═══════════════════════════════════════════════════════════════════════
  // 4. Spend tokens (Legacy trigger)
  // ═══════════════════════════════════════════════════════════════════════
  const spendToken = useCallback(async (category: string, text: string): Promise<boolean> => {
    return await addContribution(category, text);
  }, [addContribution]);

  // ═══════════════════════════════════════════════════════════════════════
  // 5. Fetch contributions list by filter
  // ═══════════════════════════════════════════════════════════════════════
  const fetchContributions = useCallback(async (category: string = 'All') => {
    currentQueryRef.current = category;
    setDiscoverLoading(true);
    try {
      const url = `/api/contributions?filter=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch contributions ${res.status}`);
      const resData: ContributionsListResponse = await res.json();
      if (resData.success && resData.data && currentQueryRef.current === category) {
        setContributions(resData.data.contributions || []);
      }
    } catch (err) {
      console.error('Failed to fetch contributions:', err);
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
          likedBy: [],
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
          likedBy: [],
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
          likedBy: [],
          isUnlocked: true,
          userId: 'user3',
          text: 'Read "The Shadow of the Wind" next time you are sitting by the fireplace.',
          timestamp: Math.floor(Date.now() / 1000) - 10800,
        },
      ];
      if (currentQueryRef.current === category) {
        setContributions(category === 'All' ? mockList : mockList.filter((item) => item.category === category));
      }
    } finally {
      if (currentQueryRef.current === category) {
        setDiscoverLoading(false);
      }
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // 6. Puzzle score submission
  // ═══════════════════════════════════════════════════════════════════════
  const submitPuzzleScore = useCallback(async (puzzleId: string, timeMs: number): Promise<{ success: boolean; unlockedAchievements: string[] }> => {
    try {
      const res = await fetch('/api/puzzle/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId, timeMs }),
      });
      if (!res.ok) throw new Error(`Submit score error ${res.status}`);
      const resData: PuzzleSubmitResponse = await res.json();
      if (resData.success && resData.data) {
        setPbTimeMs(resData.data.personalBestTimeMs);
        setUser(resData.data.user);
        setPuzzleLeaderboard(resData.data.leaderboard || []);
        return { success: true, unlockedAchievements: resData.data.unlockedAchievements || [] };
      }
      return { success: false, unlockedAchievements: [] };
    } catch (err) {
      console.error('Failed to submit puzzle score:', err);
      // Offline mock personal best update
      setPbTimeMs((prev) => {
        if (prev === null || timeMs < prev) {
          return timeMs;
        }
        return prev;
      });
      setPuzzleLeaderboard((prev) => {
        const list = [...prev, { username: user?.username || 'Cozy Stranger', timeMs, rank: 99, date: 'today' }];
        list.sort((a, b) => a.timeMs - b.timeMs);
        return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
      });
      return { success: true, unlockedAchievements: [] };
    }
  }, [user]);

  // ═══════════════════════════════════════════════════════════════════════
  // 7. Fetch puzzle leaderboard
  // ═══════════════════════════════════════════════════════════════════════
  const fetchPuzzleLeaderboard = useCallback(async (puzzleId: string = 'daily_tangram') => {
    try {
      const res = await fetch(`/api/puzzle/leaderboard?puzzleId=${puzzleId}`);
      if (!res.ok) throw new Error(`Leaderboard fetch error ${res.status}`);
      const resData: LeaderboardResponse = await res.json();
      if (resData.success && resData.data) {
        setPuzzleLeaderboard(resData.data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setPuzzleLeaderboard([
        { username: 'BaconLatte', timeMs: 45200, rank: 1, date: '2026-07-08' },
        { username: 'BrewMaster', timeMs: 58900, rank: 2, date: '2026-07-08' },
        { username: 'CozyReader', timeMs: 74200, rank: 3, date: '2026-07-08' },
      ]);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // 8. Like note
  // ═══════════════════════════════════════════════════════════════════════
  const likeNote = useCallback(async (noteId: string): Promise<{ success: boolean; unlockedAchievements: string[] }> => {
    try {
      const res = await fetch(`/api/notes/${noteId}/like`, { method: 'POST' });
      if (!res.ok) throw new Error(`Like fetch failed: ${res.status}`);
      const resData: LikeResponse = await res.json();
      if (resData.success && resData.data) {
        setUser(resData.data.user);
        setCafe(resData.data.cafe);
        setContributions((prev) =>
          prev.map((c) =>
            c.id === noteId
              ? { ...c, likes: resData.data!.likes, likedBy: resData.data!.likedBy }
              : c
          )
        );
        return { success: true, unlockedAchievements: resData.data.unlockedAchievements || [] };
      }
      return { success: false, unlockedAchievements: [] };
    } catch (err) {
      console.error('Failed to like note:', err);
      return { success: false, unlockedAchievements: [] };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // 9. Toggle favorite note
  // ═══════════════════════════════════════════════════════════════════════
  const toggleFavorite = useCallback(async (noteId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/notes/${noteId}/favorite`, { method: 'POST' });
      if (!res.ok) throw new Error(`Favorite fetch failed: ${res.status}`);
      const resData: FavoriteResponse = await res.json();
      if (resData.success && resData.data) {
        setUser(resData.data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      return false;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // 10. Report objective progress
  // ═══════════════════════════════════════════════════════════════════════
  const reportObjectiveProgress = useCallback(async (action: 'visit_discover' | 'read_note'): Promise<void> => {
    try {
      const res = await fetch('/api/objectives/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.success && resData.data?.user) {
          setUser(resData.data.user);
        }
      }
    } catch (err) {
      console.error('Failed to report objective progress:', err);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // 11. Puzzles States & Methods (Phase 5)
  // ═══════════════════════════════════════════════════════════════════════
  const [puzzles, setPuzzles] = useState<CommunityPuzzle[]>([]);

  const fetchPuzzles = useCallback(async (category: string = 'All') => {
    currentQueryRef.current = category;
    setDiscoverLoading(true);
    try {
      const url = `/api/puzzles?filter=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch puzzles ${res.status}`);
      const resData = await res.json();
      if (resData.success && resData.data && currentQueryRef.current === category) {
        setPuzzles(resData.data.puzzles || []);
      }
    } catch (err) {
      console.error('Failed to fetch puzzles:', err);
    } finally {
      if (currentQueryRef.current === category) {
        setDiscoverLoading(false);
      }
    }
  }, []);

  const publishPuzzle = useCallback(async (puzzleData: any): Promise<boolean> => {
    if (!user || user.currentCoffeeTokens < 1) {
      setError('You need a coffee token to leave a puzzle.');
      return false;
    }
    setError(null);
    try {
      const res = await fetch('/api/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(puzzleData),
      });
      if (!res.ok) throw new Error(`Create puzzle error ${res.status}`);
      const resData = await res.json();
      if (resData.success && resData.data) {
        setPuzzles((prev) => [resData.data.puzzle, ...prev]);
        setUser(resData.data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to create puzzle:', err);
      return false;
    }
  }, [user]);

  const editPuzzle = useCallback(async (id: string, puzzleData: any): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`/api/puzzles/${id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(puzzleData),
      });
      if (!res.ok) throw new Error(`Edit puzzle error ${res.status}`);
      const resData = await res.json();
      if (resData.success && resData.data) {
        setPuzzles((prev) => prev.map((p) => p.id === id ? resData.data.puzzle : p));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to edit puzzle:', err);
      return false;
    }
  }, []);

  const deletePuzzle = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/puzzles/${id}/delete`, {
        method: 'POST',
      });
      if (res.ok) {
        setPuzzles((prev) => prev.filter((p) => p.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete puzzle:', err);
      return false;
    }
  }, []);

  const solvePuzzle = useCallback(async (id: string, answer: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`/api/puzzles/${id}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      if (!res.ok) throw new Error(`Solve puzzle error ${res.status}`);
      const resData = await res.json();
      if (resData.success && resData.data) {
        setUser(resData.data.user);
        setPuzzles((prev) =>
          prev.map((p) => (p.id === id ? resData.data.puzzle : p))
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to solve puzzle:', err);
      return false;
    }
  }, []);

  const likePuzzle = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/puzzles/${id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error(`Like puzzle error ${res.status}`);
      const resData = await res.json();
      if (resData.success && resData.data) {
        setUser(resData.data.user);
        setPuzzles((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, likes: resData.data.likes, likedBy: resData.data.likedBy }
              : p
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to like puzzle:', err);
      return false;
    }
  }, []);

  const favoritePuzzle = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/puzzles/${id}/favorite`, { method: 'POST' });
      if (!res.ok) throw new Error(`Favorite puzzle error ${res.status}`);
      const resData = await res.json();
      if (resData.success && resData.data) {
        setUser(resData.data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to toggle favorite puzzle:', err);
      return false;
    }
  }, []);

  const solveDaily = useCallback(async (answer: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/puzzle/daily/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setUser(resData.data.user);
        return { success: true };
      }
      return { success: false, error: resData.error || 'Incorrect answer. Try again.' };
    } catch (err) {
      console.error('Failed to solve daily puzzle:', err);
      return { success: false, error: 'Failed to connect to the server.' };
    }
  }, []);

  return {
    user,
    cafe,
    progress,
    rooms,
    contributions,
    puzzleLeaderboard,
    pbTimeMs,
    loading,
    canClaimCoffee,
    dailyObjectives,
    discoverLoading,
    error,
    refresh,
    claimCoffee,
    addContribution,
    fetchContributions,
    submitPuzzleScore,
    fetchPuzzleLeaderboard,
    likeNote,
    toggleFavorite,
    reportObjectiveProgress,
    refreshState: refresh,
    claimDailyToken,
    spendToken,
    
    // Phase 5 exports
    puzzles,
    fetchPuzzles,
    publishPuzzle,
    editPuzzle,
    deletePuzzle,
    solvePuzzle,
    likePuzzle,
    favoritePuzzle,
    solveDaily,
  };
};
