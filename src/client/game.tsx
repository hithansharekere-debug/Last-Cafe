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
  } = useCafe();

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [discoverFilter, setDiscoverFilter] = useState('All');

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

  const handleSpendToken = useCallback(async (category: string, text: string, targetDate?: number) => {
    const success = await addContribution(category, text, targetDate);
    if (success) {
      // Re-fetch categories on success
      if (currentScreen === 'discover') {
        void fetchContributions(discoverFilter);
      } else {
        void fetchContributions('All');
      }
    }
    return success;
  }, [addContribution, currentScreen, discoverFilter, fetchContributions]);

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
            onClaimToken={claimCoffee}
            onOpenComposer={handleOpenComposer}
          />
        );
      case 'table':
        return (
          <CommunityTableScreen
            contributions={contributions}
            loading={false}
            onFetchContributions={handleFetchAllContributions}
            onOpenComposer={handleOpenComposer}
          />
        );
      case 'discover':
        return (
          <DiscoverScreen
            contributions={contributions}
            loading={false}
            onFetchContributions={handleFetchCategoryContributions}
            activeFilter={discoverFilter}
            onFilterChange={handleFilterChange}
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
        return <ProfileScreen user={user} cafe={cafe} />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="app-frame animate-fade-in">
      <Header
        tokenCount={user?.currentCoffeeTokens ?? 0}
        onClaimToken={claimCoffee}
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
