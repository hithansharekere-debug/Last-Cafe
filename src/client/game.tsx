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
    progress,
    rooms,
    contributions,
    puzzleLeaderboard,
    pbTimeMs,
    loading,
    claimDailyToken,
    spendToken,
    fetchContributions,
    submitPuzzleScore: _submitPuzzleScore,
    fetchPuzzleLeaderboard,
  } = useCafe();

  // Check if token was already claimed today (based on lastClaimedTimestamp)
  const hasClaimedToday = (() => {
    if (!user?.lastClaimedTimestamp) return false;
    const today = new Date().toISOString().split('T')[0] ?? '';
    const claimedDate = new Date(user.lastClaimedTimestamp * 1000).toISOString().split('T')[0] ?? '';
    return today === claimedDate;
  })();

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
            progress={progress}
            rooms={rooms}
            onSpendToken={spendToken}
            onClaimToken={claimDailyToken}
          />
        );
      case 'table':
        return (
          <CommunityTableScreen
            user={user}
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
        tokenCount={user?.tokenCount ?? 0}
        onClaimToken={claimDailyToken}
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
