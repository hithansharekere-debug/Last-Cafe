import './styles/index.css';

import React, { StrictMode, useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { useCafe } from './hooks/useCafe';

import { Header } from './components/Header';
import { LoadingState } from './components/LoadingState';
import { NoteComposerModal } from './components/NoteComposerModal';

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
  } = useCafe();

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [discoverFilter, setDiscoverFilter] = useState('All');

  // Check if token was already claimed today (based on lastClaimedTimestamp)
  const hasClaimedToday = !canClaimCoffee;

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
        <LoadingState message="The cafe is warming up…" />
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
