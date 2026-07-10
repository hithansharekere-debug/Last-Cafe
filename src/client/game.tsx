import './styles/index.css';

import React, { StrictMode, useCallback, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { useCafe } from './hooks/useCafe';

import { Header } from './components/Header';
import { NoteComposerModal } from './components/NoteComposerModal';
import { LoadingState } from './components/LoadingState';
import { Button } from './components/Button';

import { WelcomeScreen } from './screens/WelcomeScreen';
import { CafeScreen } from './screens/CafeScreen';
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
  } = useCafe();

  const [isComposerOpen, setIsComposerOpen] = useState(false);
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

  // Stable callback wraps to prevent inline re-creation on every render cycle
  const handleFetchAllContributions = useCallback(() => {
    void fetchContributions('All');
  }, [fetchContributions]);

  const handleFetchCategoryContributions = useCallback((category: string) => {
    void fetchContributions(category);
  }, [fetchContributions]);

  const handleFetchPuzzleLeaderboard = useCallback((puzzleId?: string) => {
    void fetchPuzzleLeaderboard(puzzleId);
  }, [fetchPuzzleLeaderboard]);

  const handleOpenComposer = useCallback(() => {
    setIsComposerOpen(true);
  }, []);

  const handleFilterChange = useCallback((filter: string) => {
    setDiscoverFilter(filter);
    void fetchContributions(filter);
  }, [fetchContributions]);

  const handleClaimCoffee = useCallback(async () => {
    const success = await claimCoffee();
    if (success) {
      showToast("You brewed today's coffee! ☕", 'success');
    }
    return success;
  }, [claimCoffee, showToast]);

  const handleSpendToken = useCallback(async (category: string, text: string, targetDate?: number) => {
    const success = await addContribution(category, text, targetDate);
    if (success) {
      showToast('Noisy typewriter → Note pinned. 📝', 'success');
      // Re-fetch categories on success
      if (currentScreen === 'discover') {
        void fetchContributions(discoverFilter);
      } else {
        void fetchContributions('All');
      }
    }
    return success;
  }, [addContribution, currentScreen, discoverFilter, fetchContributions, showToast]);

  const handleLikeNote = useCallback(async (noteId: string) => {
    const res = await likeNote(noteId);
    if (res.success) {
      showToast('Note liked! ❤️', 'success');
    }
  }, [likeNote, showToast]);

  const handleFavoriteNote = useCallback(async (noteId: string) => {
    const success = await toggleFavorite(noteId);
    if (success) {
      // Find if it was added or removed
      const isFav = user?.favorites?.includes(noteId);
      if (isFav) {
        showToast('Removed from favorites. ⭐', 'info');
      } else {
        showToast('Saved to favorites! ⭐', 'success');
      }
      
      // Re-fetch contributions if on discover with Favorites active
      if (currentScreen === 'discover' && discoverFilter === 'Favorites') {
        void fetchContributions('Favorites');
      }
    }
  }, [toggleFavorite, user, currentScreen, discoverFilter, fetchContributions, showToast]);

  const handleReadNote = useCallback(() => {
    void reportObjectiveProgress('read_note');
  }, [reportObjectiveProgress]);

  if (loading) {
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
            onOpenComposer={handleOpenComposer}
          />
        );
      case 'table':
        return (
          <CommunityTableScreen
            user={user}
            contributions={contributions}
            loading={false}
            onFetchContributions={handleFetchAllContributions}
            onOpenComposer={handleOpenComposer}
            onLikeNote={handleLikeNote}
            onFavoriteNote={handleFavoriteNote}
            onReadNote={handleReadNote}
          />
        );
      case 'discover':
        return (
          <DiscoverScreen
            user={user}
            contributions={contributions}
            loading={discoverLoading}
            onFetchContributions={handleFetchCategoryContributions}
            activeFilter={discoverFilter}
            onFilterChange={handleFilterChange}
            onLikeNote={handleLikeNote}
            onFavoriteNote={handleFavoriteNote}
            onReadNote={handleReadNote}
          />
        );
      case 'puzzle':
        return (
          <PuzzleCornerScreen
            pbTimeMs={pbTimeMs}
            leaderboard={puzzleLeaderboard}
            onFetchLeaderboard={handleFetchPuzzleLeaderboard}
          />
        );
      case 'profile':
        return <ProfileScreen user={user} cafe={cafe} dailyObjectives={dailyObjectives} />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="app-frame animate-fade-in">
      <Header
        tokenCount={user?.currentCoffeeTokens ?? 0}
        onClaimToken={handleClaimCoffee}
        hasClaimedToday={hasClaimedToday}
      />
      <main className="flex-1 overflow-hidden flex flex-col font-serif">
        {renderScreen()}
      </main>

      <NoteComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        currentTokens={user?.currentCoffeeTokens ?? 0}
        onSpendToken={handleSpendToken}
      />

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
    </div>
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
