import './styles/index.css';

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { useCafe } from './hooks/useCafe';

import { Header } from './components/Header';
import { LoadingState } from './components/LoadingState';

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
    progress,
    rooms,
    contributions,
    puzzleLeaderboard,
    pbTimeMs,
    loading,
    claimCoffee,
    addContribution,
    fetchContributions,
    submitPuzzleScore: _submitPuzzleScore,
    fetchPuzzleLeaderboard,
    canClaimCoffee,
  } = useCafe();

  // Check if token was already claimed today (based on lastClaimedTimestamp)
  const hasClaimedToday = !canClaimCoffee;

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
            progress={progress}
            rooms={rooms}
            contributions={contributions}
            canClaimCoffee={canClaimCoffee}
            onSpendToken={addContribution}
            onClaimToken={claimCoffee}
          />
        );
      case 'table':
        return (
          <CommunityTableScreen
            contributions={contributions}
            loading={false}
            onFetchContributions={() => { void fetchContributions('All'); }}
          />
        );
      case 'discover':
        return (
          <DiscoverScreen
            contributions={contributions}
            loading={false}
            onFetchContributions={(category) => { void fetchContributions(category); }}
          />
        );
      case 'puzzle':
        return (
          <PuzzleCornerScreen
            pbTimeMs={pbTimeMs}
            leaderboard={puzzleLeaderboard}
            onFetchLeaderboard={(puzzleId) => { void fetchPuzzleLeaderboard(puzzleId); }}
          />
        );
      case 'profile':
        return <ProfileScreen user={user} progress={progress} />;
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
      <main className="flex-1 overflow-hidden flex flex-col">
        {renderScreen()}
      </main>
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
