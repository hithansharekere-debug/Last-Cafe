import './styles/index.css';

import React, { StrictMode, useCallback, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { useCafe } from './hooks/useCafe';

import { Header } from './components/Header';
import { PuzzleCreatorModal } from './components/PuzzleCreatorModal';
import { NoteComposerModal } from './components/NoteComposerModal';
import { LoadingState } from './components/LoadingState';
import { Button } from './components/Button';

import { WelcomeScreen } from './screens/WelcomeScreen';
import { CafeScreen } from './screens/CafeScreen';
import { ResponsiveFrame } from './components/ResponsiveFrame';
import { CommunityTableScreen } from './screens/CommunityTableScreen';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { PuzzleCornerScreen } from './screens/PuzzleCornerScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { CozyToast } from './components/CozyToast';
import { ACHIEVEMENT_DEFINITIONS } from '../shared/constants';

const AppContent = () => {
  const { currentScreen } = useNavigation();
  const {
    user,
    cafe,
    rooms,
    contributions,
    puzzleLeaderboard,
    pbTimeMs,
    loading,
    claimCoffee,
    addContribution,
    fetchContributions,
    fetchPuzzleLeaderboard,
    canClaimCoffee,
    refresh,
    likeNote,
    toggleFavorite,
    reportObjectiveProgress,
    discoverLoading,
    dailyObjectives,
    
    // Phase 5 Puzzles bindings
    puzzles,
    fetchPuzzles,
    publishPuzzle,
    editPuzzle,
    deletePuzzle,
    solvePuzzle,
    likePuzzle,
    favoritePuzzle,
    solveDaily,
  } = useCafe();

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isNoteComposerOpen, setIsNoteComposerOpen] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState<any | null>(null);
  const [discoverFilter, setDiscoverFilter] = useState('All');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  // Achievements States & Popup
  const [lastAchievements, setLastAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);

  // Objectives States
  const [lastObjectives, setLastObjectives] = useState<string[]>([]);

  // Milestone Celebration States
  const [prevUnlockedRooms, setPrevUnlockedRooms] = useState<string[]>([]);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

  // Check if token was already claimed today (based on lastClaimedTimestamp)
  const hasClaimedToday = !canClaimCoffee;

  // Trigger initialization when moving away from welcome screen
  useEffect(() => {
    if (currentScreen !== 'welcome' && !user && !loading) {
      void refresh();
    }
  }, [currentScreen, user, loading, refresh]);

  // Track user achievements to trigger modal overlays
  useEffect(() => {
    if (user?.achievements) {
      if (lastAchievements.length > 0) {
        const newlyUnlocked = user.achievements.filter((a) => !lastAchievements.includes(a));
        if (newlyUnlocked.length > 0) {
          setNewAchievement(newlyUnlocked[0] ?? null);
        }
      }
      setLastAchievements(user.achievements);
    }
  }, [user?.achievements, lastAchievements]);

  // Track completed objectives to trigger cozy toasts
  useEffect(() => {
    if (user?.completedObjectivesToday) {
      if (lastObjectives.length > 0) {
        const newlyCompleted = user.completedObjectivesToday.filter((o) => !lastObjectives.includes(o));
        if (newlyCompleted.length > 0) {
          showToast('Daily Goal Completed! 🎯', 'success');
        }
      }
      setLastObjectives(user.completedObjectivesToday);
    }
  }, [user?.completedObjectivesToday, lastObjectives, showToast]);

  // Auto-report visit discover objective
  useEffect(() => {
    if (currentScreen === 'discover') {
      void reportObjectiveProgress('visit_discover');
    }
  }, [currentScreen, reportObjectiveProgress]);

  // Track room unlock milestones
  useEffect(() => {
    if (rooms && rooms.length > 0) {
      const unlockedIds = rooms.filter((r) => r.isUnlocked).map((r) => r.id);
      if (prevUnlockedRooms.length > 0) {
        const newlyUnlocked = unlockedIds.filter((id) => !prevUnlockedRooms.includes(id));
        if (newlyUnlocked.length > 0) {
          const roomNames: Record<string, string> = {
            fireplace: '🔥 Fireplace Room',
            bookshelf: '📚 Library Bookshelf',
            garden: '🌿 Hidden Garden',
            music_room: '🎵 Music Conservatory',
          };
          const names = newlyUnlocked.map((id) => roomNames[id] || id).join(', ');
          setCelebrationMessage(`✨ The ${names} has opened!`);
        }
      }
      setPrevUnlockedRooms(unlockedIds);
    }
  }, [rooms]);

  // Puzzles handlers (Phase 5)
  const handleFetchAllPuzzles = useCallback(() => {
    void fetchPuzzles('All');
  }, [fetchPuzzles]);

  const handleFetchCategoryPuzzles = useCallback((category: string) => {
    void fetchPuzzles(category);
  }, [fetchPuzzles]);

  const handleFetchPuzzleLeaderboard = useCallback((puzzleId?: string) => {
    void fetchPuzzleLeaderboard(puzzleId);
  }, [fetchPuzzleLeaderboard]);

  const handleOpenComposer = useCallback(() => {
    setIsComposerOpen(true);
  }, []);

  const handleOpenNoteComposer = useCallback(() => {
    setIsNoteComposerOpen(true);
  }, []);

  const handleFilterChange = useCallback((filter: string) => {
    setDiscoverFilter(filter);
    void fetchPuzzles(filter);
  }, [fetchPuzzles]);

  const handleClaimCoffee = useCallback(async () => {
    const success = await claimCoffee();
    if (success) {
      showToast("You brewed today's coffee! ☕", 'success');
    }
    return success;
  }, [claimCoffee, showToast]);

  const handlePublishPuzzle = useCallback(async (puzzleData: any) => {
    const success = await publishPuzzle(puzzleData);
    if (success) {
      showToast('Mystery published to board! 🧩', 'success');
      if (currentScreen === 'discover') {
        void fetchPuzzles(discoverFilter);
      } else {
        void fetchPuzzles('All');
      }
    }
    return success;
  }, [publishPuzzle, currentScreen, discoverFilter, fetchPuzzles, showToast]);

  const handleEditPuzzle = useCallback(async (id: string, puzzleData: any) => {
    const success = await editPuzzle(id, puzzleData);
    if (success) {
      showToast('Mystery revised successfully! ✏️', 'success');
      if (currentScreen === 'discover') {
        void fetchPuzzles(discoverFilter);
      } else {
        void fetchPuzzles('All');
      }
    }
    return success;
  }, [editPuzzle, currentScreen, discoverFilter, fetchPuzzles, showToast]);

  const handleSolvePuzzle = useCallback(async (id: string, answer: string) => {
    const success = await solvePuzzle(id, answer);
    if (success) {
      showToast('Correct! Mystery solved. 🎉', 'success');
    }
    return success;
  }, [solvePuzzle, showToast]);

  const handleLikePuzzle = useCallback(async (id: string) => {
    const success = await likePuzzle(id);
    if (success) {
      showToast('Puzzle liked! ❤️', 'success');
    }
  }, [likePuzzle, showToast]);

  const handleFavoritePuzzle = useCallback(async (id: string) => {
    const success = await favoritePuzzle(id);
    if (success) {
      showToast('Toggled favorite! ⭐', 'success');
    }
  }, [favoritePuzzle, showToast]);

  const handleDeletePuzzle = useCallback(async (id: string) => {
    const success = await deletePuzzle(id);
    if (success) {
      showToast('Mystery deleted successfully. 🗑️', 'success');
      if (currentScreen === 'discover') {
        void fetchPuzzles(discoverFilter);
      } else {
        void fetchPuzzles('All');
      }
    }
  }, [deletePuzzle, currentScreen, discoverFilter, fetchPuzzles, showToast]);

  const handleSolveDaily = useCallback(async (answer: string) => {
    const res = await solveDaily(answer);
    if (res.success) {
      showToast("Daily puzzle solved! +1 Token. ☕", 'success');
    }
    return res;
  }, [solveDaily, showToast]);

  if (loading && currentScreen !== 'welcome') {
    return (
      <div className="app-frame">
        <LoadingState message="Warming up the cafe..." />
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'cafe':
        return (
          <CafeScreen
            user={user}
            cafe={cafe}
            rooms={rooms}
            contributions={contributions}
            canClaimCoffee={canClaimCoffee}
            onClaimToken={handleClaimCoffee}
            onOpenComposer={handleOpenNoteComposer}
          />
        );
      case 'table':
        return (
          <CommunityTableScreen
            user={user}
            contributions={contributions}
            loading={loading}
            onFetchContributions={fetchContributions}
            onOpenComposer={handleOpenNoteComposer}
            onLikeNote={(id) => {
              void likeNote(id).then((res) => {
                if (res.success && res.unlockedAchievements && res.unlockedAchievements.length > 0) {
                  const names = res.unlockedAchievements.join(', ');
                  showToast(`🏆 Achievement unlocked: ${names}!`);
                }
              });
            }}
          />
        );
      case 'discover':
        return (
          <DiscoverScreen
            user={user}
            puzzles={puzzles}
            loading={discoverLoading}
            onFetchPuzzles={handleFetchCategoryPuzzles}
            activeFilter={discoverFilter}
            onFilterChange={handleFilterChange}
            onSolvePuzzle={handleSolvePuzzle}
            onLikePuzzle={handleLikePuzzle}
            onFavoritePuzzle={handleFavoritePuzzle}
            onEditPuzzle={(puzzle) => setEditingPuzzle(puzzle)}
            onDeletePuzzle={handleDeletePuzzle}
            onOpenComposer={handleOpenComposer}
          />
        );
      case 'puzzle':
        return (
          <PuzzleCornerScreen
            pbTimeMs={pbTimeMs}
            leaderboard={puzzleLeaderboard}
            onFetchLeaderboard={handleFetchPuzzleLeaderboard}
            onSolveDaily={handleSolveDaily}
          />
        );
      case 'profile':
        return <ProfileScreen user={user} cafe={cafe} dailyObjectives={dailyObjectives} />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <>
      <ResponsiveFrame>
        <div className="app-frame animate-fade-in">
          <Header
            tokenCount={user?.currentCoffeeTokens ?? 0}
            onClaimToken={handleClaimCoffee}
            hasClaimedToday={hasClaimedToday}
          />
          <main className="flex-1 overflow-hidden flex flex-col font-serif">
            {renderScreen()}
          </main>

          <PuzzleCreatorModal
            isOpen={isComposerOpen || !!editingPuzzle}
            onClose={() => {
              setIsComposerOpen(false);
              setEditingPuzzle(null);
            }}
            currentTokens={user?.currentCoffeeTokens ?? 0}
            onPublishPuzzle={handlePublishPuzzle}
            editPuzzleData={editingPuzzle}
            onEditPuzzle={handleEditPuzzle}
          />

          <NoteComposerModal
            isOpen={isNoteComposerOpen}
            onClose={() => setIsNoteComposerOpen(false)}
            currentTokens={user?.currentCoffeeTokens ?? 0}
            onSpendToken={async (category, text, targetDate) => {
              const success = await addContribution(category, text, targetDate);
              if (success) {
                showToast('Note pinned to the community board! 📝', 'success');
                void refresh();
              }
              return success;
            }}
          />
        </div>
      </ResponsiveFrame>

      {/* Milestone celebration overlay */}
      {celebrationMessage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(38,20,11,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="animate-celebrate p-6 text-center rounded border-2 border-[#2c160a]"
            style={{
              backgroundColor: '#fdfaf2',
              boxShadow: '6px 6px 0px #2c160a',
              maxWidth: '320px',
              width: '100%',
            }}
          >
            <span className="text-5xl block mb-3 animate-bounce select-none">🎉</span>
            <h2 className="font-serif font-bold text-base text-[#2c160a] mb-2 select-none">Room Unlocked!</h2>
            <p className="font-serif text-sm text-[#5e463a] leading-relaxed mb-4">
              {celebrationMessage}
            </p>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              className="cursor-pointer"
              onClick={() => setCelebrationMessage(null)}
            >
              Step Inside →
            </Button>
          </div>
        </div>
      )}

      {/* Achievement Unlock Popup */}
      {newAchievement && ACHIEVEMENT_DEFINITIONS[newAchievement] && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(38,20,11,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="animate-celebrate p-6 text-center rounded border-2 border-[#2c160a]"
            style={{
              backgroundColor: '#fdfaf2',
              boxShadow: '6px 6px 0px #2c160a',
              maxWidth: '320px',
              width: '100%',
            }}
          >
            <span className="text-6xl block mb-3 animate-bounce select-none">
              {ACHIEVEMENT_DEFINITIONS[newAchievement].icon}
            </span>
            <h2 className="font-serif font-bold text-lg text-[#2c160a] mb-1 select-none">
              Achievement Unlocked!
            </h2>
            <h3 className="font-serif font-bold text-[#cf7929] text-base mb-2 select-none">
              {ACHIEVEMENT_DEFINITIONS[newAchievement].title}
            </h3>
            <p className="font-serif text-sm text-[#5e463a] leading-relaxed mb-4 select-none">
              {ACHIEVEMENT_DEFINITIONS[newAchievement].description}
            </p>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              className="cursor-pointer"
              onClick={() => setNewAchievement(null)}
            >
              Cozy!
            </Button>
          </div>
        </div>
      )}

      {toast && (
        <CozyToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

const App = () => (
  <NavigationProvider initialScreen="welcome">
    <AppContent />
  </NavigationProvider>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
