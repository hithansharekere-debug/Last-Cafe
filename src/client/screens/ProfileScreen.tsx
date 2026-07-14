import React, { useState } from 'react';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { EmptyState } from '../components/EmptyState';
import { PageTitle } from '../components/Typography';
import { ACHIEVEMENT_DEFINITIONS } from '../../shared/constants';
import type { User, CafeState, DailyObjective } from '../../shared/types';

interface ProfileScreenProps {
  user: User | null;
  cafe: CafeState;
  dailyObjectives: DailyObjective[];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatRelativeTime(timestamp: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestamp;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getRank(reputation: number): { label: string; icon: string; next: string } {
  if (reputation >= 1200) return { label: 'Legendary Cafe', icon: '🌟', next: 'Max rank reached' };
  if (reputation >= 800) return { label: 'Beloved Cafe', icon: '❤️', next: `${1200 - reputation} reputation to Legendary Cafe` };
  if (reputation >= 500) return { label: 'Master Puzzle Maker', icon: '🧩', next: `${800 - reputation} reputation to Beloved Cafe` };
  if (reputation >= 300) return { label: 'Storyteller', icon: '📖', next: `${500 - reputation} reputation to Master Puzzle Maker` };
  if (reputation >= 150) return { label: 'Neighborhood Favorite', icon: '🪑', next: `${300 - reputation} reputation to Storyteller` };
  if (reputation >= 50) return { label: 'Regular', icon: '☕', next: `${150 - reputation} reputation to Neighborhood Favorite` };
  return { label: 'New Visitor', icon: '🚪', next: `${50 - reputation} reputation to Regular` };
}

export const ProfileScreen = ({ user, cafe, dailyObjectives }: ProfileScreenProps) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'achievements' | 'activity' | 'stats'>('goals');
  const [selectedAchievement, setSelectedAchievement] = useState<string>('first_coffee');

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-6 bg-[var(--color-parchment)] gap-4">
        <span className="text-4xl animate-float">📋</span>
        <p className="font-sans text-sm text-[var(--color-espresso)] italic text-center">
          Sign in to Reddit to view your Library Card.
        </p>
      </div>
    );
  }

  const reputation = user.reputation || 0;
  const rank = getRank(reputation);

  const formatPB = (pb: number | null | undefined) => {
    if (pb === null || pb === undefined || isNaN(pb)) {
      return 'No Personal Best Yet';
    }
    return `${(pb / 1000).toFixed(2)} seconds`;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'goals':
        return (
          <div className="flex flex-col gap-4">
            {/* Streaks Card */}
            <Card
              variant="parchment"
              elevation="low"
              className="p-4 border-2 border-[var(--color-border-dark)] bg-[var(--color-parchment)] flex flex-col gap-2 shadow-[0_3px_0px_var(--color-border-dark)]"
            >
              <div className="flex items-center justify-between border-b border-dashed border-[var(--color-bronze)] pb-2">
                <span className="font-sans font-bold text-sm text-[var(--color-dark-walnut)] flex items-center gap-1.5 select-none">
                  🔥 Visit Streak
                </span>
                <span className="font-mono text-xs bg-[var(--color-caramel)] text-[var(--color-text-light)] px-2.5 py-0.5 rounded font-bold">
                  {user.currentStreak || 1} Days
                </span>
              </div>
              <p className="font-sans text-xs text-[var(--color-espresso)] leading-relaxed">
                Visit the cafe daily to keep your streak alive! Longest streak: <strong className="text-[var(--color-dark-walnut)]">{user.longestStreak || 1} days</strong>.
              </p>
            </Card>

            {/* Daily Goals */}
            <div className="flex flex-col gap-2.5 mt-2">
              <h3 className="font-sans font-bold text-xs text-[var(--color-dark-walnut)] uppercase tracking-wider px-1">
                🎯 Today's Cozy Goals
              </h3>
              {dailyObjectives.length === 0 ? (
                <p className="font-sans text-xs text-[var(--color-espresso)] italic text-center py-4 bg-[var(--color-cream)]/30 border border-dashed border-[var(--color-bronze)] rounded-lg">
                  No active goals today.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {dailyObjectives.map((obj) => {
                    const isDone = user.completedObjectivesToday?.includes(obj.id);
                    return (
                      <div
                        key={obj.id}
                        className={`flex items-center justify-between p-3.5 rounded-lg border-2 border-[var(--color-border-dark)] transition-all ${
                          isDone ? 'bg-[var(--color-cream)] opacity-85' : 'bg-[var(--color-parchment)]'
                        }`}
                        style={{ boxShadow: '0 3px 0px var(--color-border-dark)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl select-none">{isDone ? '✅' : '📝'}</span>
                          <div>
                            <p
                              className={`font-sans text-xs font-bold text-[var(--color-dark-walnut)] ${
                                isDone ? 'line-through opacity-60' : ''
                              }`}
                            >
                              {obj.text}
                            </p>
                            <p className="font-mono text-[9px] text-[var(--color-caramel)] uppercase tracking-wider font-bold mt-0.5">
                              Reward: +{obj.rewardValue} {obj.rewardType === 'token' ? 'Coffee Token ☕' : 'Warmth 🔥'}
                            </p>
                          </div>
                        </div>
                        {isDone && (
                          <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-sage)] font-bold">
                            Done
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'achievements':
        const achievementsKeys = Object.keys(ACHIEVEMENT_DEFINITIONS);
        return (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              {achievementsKeys.map((key) => {
                const ach = ACHIEVEMENT_DEFINITIONS[key as keyof typeof ACHIEVEMENT_DEFINITIONS]!;
                const isUnlocked = user.achievements?.includes(key);
                const isSelected = selectedAchievement === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedAchievement(key)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 border-[var(--color-border-dark)] cursor-pointer transition-all duration-200 relative ${
                      isUnlocked
                        ? 'bg-[var(--color-cream)] badge-glow-unlocked shadow-[0_3px_0px_var(--color-border-dark)] hover:scale-[1.03]'
                        : 'bg-[var(--color-cream)]/30 opacity-40 scale-95 border-dashed hover:opacity-50'
                    } ${isSelected ? 'ring-2 ring-[var(--color-caramel)]' : ''}`}
                  >
                    <span className="text-3xl mb-1 select-none">{ach.icon}</span>
                    <span className="font-sans text-[9px] text-[var(--color-dark-walnut)] text-center leading-tight font-bold">
                      {ach.title}
                    </span>
                    {isUnlocked && (
                      <span className="absolute top-1.5 right-1.5 text-[10px]" title="Unlocked">
                        🏆
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedAchievement && ACHIEVEMENT_DEFINITIONS[selectedAchievement as keyof typeof ACHIEVEMENT_DEFINITIONS] && (() => {
              const selectedAch = ACHIEVEMENT_DEFINITIONS[selectedAchievement as keyof typeof ACHIEVEMENT_DEFINITIONS]!;
              const isUnlocked = user.achievements?.includes(selectedAchievement);
              return (
                <Card
                  variant="napkin"
                  elevation="low"
                  className="p-4 border-2 border-[var(--color-border-dark)] flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between border-b border-dashed border-[var(--color-bronze)] pb-2 mb-1">
                    <span className="font-sans font-bold text-xs text-[var(--color-dark-walnut)] flex items-center gap-1.5">
                      <span className="select-none text-base">{selectedAch.icon}</span>
                      <span>{selectedAch.title}</span>
                    </span>
                    <span
                      className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border-2 uppercase tracking-wider ${
                        isUnlocked
                          ? 'bg-[var(--color-cream)] text-[var(--color-sage)] border-[var(--color-sage)] shadow-[0_2px_0px_var(--color-sage)]'
                          : 'bg-[var(--color-cream)]/30 text-[var(--color-espresso)] border-[var(--color-border-dark)] border-dashed'
                      }`}
                    >
                      {isUnlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-[var(--color-espresso)] leading-relaxed">
                    {selectedAch.description}
                  </p>
                </Card>
              );
            })()}
          </div>
        );

      case 'activity':
        return (
          <div className="flex flex-col gap-3">
            {!user.timeline || user.timeline.length === 0 ? (
              <EmptyState
                icon="🕒"
                title="Your journey is quiet"
                message="Solve puzzles or leave a note to start your story in the timeline."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {user.timeline.slice(0, 20).map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 items-start border-l-2 border-[var(--color-bronze)] pl-3.5 py-1.5 ml-2 hover:bg-[var(--color-cream)]/20 rounded-r-md pr-2 transition-all duration-150"
                  >
                    <span className="text-lg select-none mt-0.5">
                      {item.type === 'claim_coffee'
                        ? '☕'
                        : item.type === 'write_note'
                        ? '📝'
                        : item.type === 'achievement'
                        ? '🏆'
                        : item.type === 'streak'
                        ? '🔥'
                        : '❤️'}
                    </span>
                    <div className="flex-1">
                      <p className="font-sans text-xs text-[var(--color-dark-walnut)] leading-relaxed">{item.title}</p>
                      <p className="font-mono text-[9px] text-[var(--color-espresso)] mt-1 font-bold">
                        {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'stats':
        return (
          <div className="flex flex-col gap-4">
            {/* Stats Cards grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <Card
                variant="parchment"
                elevation="low"
                className="flex flex-col items-center p-4 text-center border-2 border-[var(--color-border-dark)] bg-[var(--color-parchment)] hover:scale-[1.01]"
              >
                <span className="text-3xl mb-1.5 select-none">🏆</span>
                <span className="font-sans font-bold text-base text-[var(--color-dark-walnut)]">
                  {reputation}
                </span>
                <span className="font-sans text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold">
                  Reputation
                </span>
              </Card>

              <Card
                variant="parchment"
                elevation="low"
                className="flex flex-col items-center p-4 text-center border-2 border-[var(--color-border-dark)] bg-[var(--color-parchment)] hover:scale-[1.01]"
              >
                <span className="text-3xl mb-1.5 select-none">💡</span>
                <span className="font-sans font-bold text-base text-[var(--color-dark-walnut)]">
                  {user.solvedPuzzles?.length || 0}
                </span>
                <span className="font-sans text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold">
                  Puzzles Solved
                </span>
              </Card>

              <Card
                variant="parchment"
                elevation="low"
                className="flex flex-col items-center p-4 text-center border-2 border-[var(--color-border-dark)] bg-[var(--color-parchment)] hover:scale-[1.01]"
              >
                <span className="text-3xl mb-1.5 select-none">☕</span>
                <span className="font-sans font-bold text-base text-[var(--color-dark-walnut)]">
                  {user.currentCoffeeTokens}
                </span>
                <span className="font-sans text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold">
                  Coffee Tokens
                </span>
              </Card>

              <Card
                variant="parchment"
                elevation="low"
                className="flex flex-col items-center p-4 text-center border-2 border-[var(--color-border-dark)] bg-[var(--color-parchment)] hover:scale-[1.01]"
              >
                <span className="text-3xl mb-1.5 select-none">✍️</span>
                <span className="font-sans font-bold text-base text-[var(--color-dark-walnut)]">
                  {user.totalNotesWritten}
                </span>
                <span className="font-sans text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold">
                  Mysteries Created
                </span>
              </Card>

              <Card
                variant="parchment"
                elevation="low"
                className="flex flex-col items-center p-4 text-center border-2 border-[var(--color-border-dark)] bg-[var(--color-parchment)] col-span-2 hover:scale-[1.005]"
              >
                <span className="text-3xl mb-1.5 select-none">🔥</span>
                <span className="font-sans font-bold text-base text-[var(--color-dark-walnut)]">
                  {user.totalWarmthContributed || 0}
                </span>
                <span className="font-sans text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mt-1">
                  Warmth Contributed
                </span>
              </Card>
            </div>

            {/* Rank progression */}
            <Card variant="deck" elevation="low" className="border-2 border-[var(--color-border-dark)] p-4.5 flex flex-col gap-3">
              <h3 className="font-sans font-bold text-xs text-[var(--color-dark-walnut)] uppercase tracking-wider">
                📈 Reputation Rank Progression
              </h3>
              <ProgressBar value={reputation} max={1200} label="Reputation Level" subLabel={rank.next} />
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[var(--color-parchment)] animate-fade-in font-serif">
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', whiteSpace: 'nowrap', marginBottom: '8px' }}>
          <span style={{ fontSize: '26px', lineHeight: 1 }} className="select-none">📚</span>
          <PageTitle>Library</PageTitle>
        </div>
        <p className="font-sans text-xs text-[var(--color-text-muted)] italic leading-relaxed" style={{ margin: '0 0 12px 0' }}>
          Your visitor credentials, streaks, badges, and cafe reading log.
        </p>
      </div>

      {/* Member Card */}
      <div className="px-lg pt-lg flex-shrink-0 bg-[var(--color-parchment)]">
        <div
          className="rounded-lg border-2 border-[var(--color-border-dark)] overflow-hidden"
          style={{ boxShadow: '0 3.5px 0px var(--color-border-dark)' }}
        >
          <div className="wood-plank-bg flex items-center justify-between px-4.5 py-3.5">
            <div className="flex flex-col">
              <span className="font-sans font-bold text-base text-[var(--color-text-light)] leading-tight select-none">
                {user.username}
              </span>
              <span className="font-handwritten text-xs text-[var(--color-text-muted)]">
                {rank.icon} {rank.label}
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-[9px] text-[var(--color-text-muted)] block font-bold">
                MEMBER ID: #{user.id.substring(0, 8).toUpperCase()}
              </span>
              <span className="font-mono text-[9px] text-[var(--color-text-light)] block font-bold mt-0.5">
                Joined {formatDate(user.joinedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b-2 border-[var(--color-border-dark)] bg-[var(--color-cream)] flex-shrink-0 font-sans text-xs select-none mt-4">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 text-center py-3 font-bold cursor-pointer transition-all duration-150 ${
            activeTab === 'goals' ? 'bg-[var(--color-border-dark)] text-[var(--color-text-light)]' : 'text-[var(--color-dark-walnut)] hover:bg-[var(--color-cream)]'
          }`}
        >
          🎯 Goals
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 text-center py-3 font-bold cursor-pointer transition-all duration-150 ${
            activeTab === 'achievements' ? 'bg-[var(--color-border-dark)] text-[var(--color-text-light)]' : 'text-[var(--color-dark-walnut)] hover:bg-[var(--color-cream)]'
          }`}
        >
          🏆 Badges
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 text-center py-3 font-bold cursor-pointer transition-all duration-150 ${
            activeTab === 'activity' ? 'bg-[var(--color-border-dark)] text-[var(--color-text-light)]' : 'text-[var(--color-dark-walnut)] hover:bg-[var(--color-cream)]'
          }`}
        >
          🕒 Activity
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 text-center py-3 font-bold cursor-pointer transition-all duration-150 ${
            activeTab === 'stats' ? 'bg-[var(--color-border-dark)] text-[var(--color-text-light)]' : 'text-[var(--color-dark-walnut)] hover:bg-[var(--color-cream)]'
          }`}
        >
          📊 Stats
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-lg bg-[var(--color-parchment)]">{renderTabContent()}</div>
    </div>
  );
};
export default ProfileScreen;

