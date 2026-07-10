import React, { useState } from 'react';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { EmptyState } from '../components/EmptyState';
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

function getRank(count: number): { label: string; icon: string; next: string } {
  if (count >= 20) return { label: 'Cafe Regular', icon: '🧑‍🍳', next: 'Max rank reached' };
  if (count >= 10) return { label: 'Loyal Visitor', icon: '🪑', next: `${20 - count} notes to Cafe Regular` };
  if (count >= 5) return { label: 'Familiar Face', icon: '☕', next: `${10 - count} notes to Loyal Visitor` };
  if (count >= 1) return { label: 'New Visitor', icon: '🚪', next: `${5 - count} notes to Familiar Face` };
  return { label: 'Stranger', icon: '👤', next: 'Leave your first note to become a New Visitor' };
}

export const ProfileScreen = ({ user, cafe, dailyObjectives }: ProfileScreenProps) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'achievements' | 'activity' | 'stats'>('goals');
  const [selectedAchievement, setSelectedAchievement] = useState<string>('first_coffee');

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-6 gap-4 bg-[#fdfaf2]">
        <span className="text-4xl animate-float">📋</span>
        <p className="font-serif text-sm text-[#5e463a] italic text-center">
          Sign in to Reddit to view your Library Card.
        </p>
      </div>
    );
  }

  const rank = getRank(user.totalNotesWritten);

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
              className="p-3 border-2 border-[#2c160a] bg-[#fdfaf2] flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-[#2c160a] flex items-center gap-1.5">
                  <span>🔥</span> Visit Streak
                </span>
                <span className="font-mono text-xs bg-[#cf7929] text-[#fdfaf2] px-2 py-0.5 rounded font-bold">
                  {user.currentStreak || 1} Days
                </span>
              </div>
              <p className="font-serif text-[11px] text-[#5e463a] italic leading-relaxed">
                Visit the cafe daily to keep your streak alive! Longest streak: {user.longestStreak || 1} days.
              </p>
            </Card>

            {/* Daily Goals */}
            <div className="flex flex-col gap-2">
              <h3 className="font-serif font-bold text-xs text-[#2c160a] uppercase tracking-wider">
                🎯 Today's Cozy Goals
              </h3>
              {dailyObjectives.length === 0 ? (
                <p className="font-serif text-xs text-[#5e463a] italic text-center py-3">
                  No active goals today.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {dailyObjectives.map((obj) => {
                    const isDone = user.completedObjectivesToday?.includes(obj.id);
                    return (
                      <div
                        key={obj.id}
                        className={`flex items-center justify-between p-3 rounded border-2 border-[#2c160a] transition-all ${
                          isDone ? 'bg-[#e1ead4] opacity-85' : 'bg-[#fdfaf2]'
                        }`}
                        style={{ boxShadow: '2px 2px 0px #2c160a' }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl select-none">{isDone ? '✅' : '⏳'}</span>
                          <div>
                            <p
                              className={`font-serif text-xs font-bold text-[#2c160a] ${
                                isDone ? 'line-through opacity-60' : ''
                              }`}
                            >
                              {obj.text}
                            </p>
                            <p className="font-mono text-[9px] text-[#cf7929] uppercase tracking-wider font-bold">
                              Reward: +{obj.rewardValue} {obj.rewardType === 'token' ? 'Coffee Token ☕' : 'Warmth 🔥'}
                            </p>
                          </div>
                        </div>
                        {isDone && (
                          <span className="font-mono text-[9px] uppercase tracking-widest text-[#4a7c59] font-bold">
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
            <div className="grid grid-cols-3 gap-2.5">
              {achievementsKeys.map((key) => {
                const ach = ACHIEVEMENT_DEFINITIONS[key as keyof typeof ACHIEVEMENT_DEFINITIONS]!;
                const isUnlocked = user.achievements?.includes(key);
                const isSelected = selectedAchievement === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedAchievement(key)}
                    className={`flex flex-col items-center justify-center p-3 rounded border-2 border-[#2c160a] cursor-pointer transition-all duration-150 relative ${
                      isUnlocked
                        ? 'bg-[#eeded1] scale-100 shadow-[2px_2px_0px_#2c160a]'
                        : 'bg-[#c8a285]/10 opacity-50 scale-95 border-dashed'
                    } ${isSelected ? 'border-dashed border-[#cf7929]' : ''}`}
                  >
                    <span className="text-3xl mb-1.5 select-none">{ach.icon}</span>
                    <span className="font-serif text-[9px] text-[#2c160a] text-center leading-tight font-bold">
                      {ach.title}
                    </span>
                    {isUnlocked && (
                      <span className="absolute top-1 right-1 text-[9px]" title="Unlocked">
                        🏆
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedAchievement && ACHIEVEMENT_DEFINITIONS[selectedAchievement as keyof typeof ACHIEVEMENT_DEFINITIONS] && (() => {
              const selectedAch = ACHIEVEMENT_DEFINITIONS[selectedAchievement as keyof typeof ACHIEVEMENT_DEFINITIONS]!;
              return (
                <Card
                  variant="napkin"
                  elevation="low"
                  className="p-3 border-2 border-[#2c160a] flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between border-b border-dashed border-[#c8a285] pb-1 mb-1">
                    <span className="font-serif font-bold text-xs text-[#2c160a] flex items-center gap-1.5">
                      <span className="select-none">{selectedAch.icon}</span>
                      <span>{selectedAch.title}</span>
                    </span>
                    <span
                      className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        user.achievements?.includes(selectedAchievement)
                          ? 'bg-[#e1ead4] text-[#4a7c59] border-[#4a7c59]'
                          : 'bg-[#c8a285]/10 text-[#5e463a] border-[#2c160a] border-dashed'
                      }`}
                    >
                      {user.achievements?.includes(selectedAchievement) ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <p className="font-serif text-[11px] text-[#5e463a] leading-relaxed">
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
                message="Brew some coffee or leave a note to start your story in the timeline."
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {user.timeline.slice(0, 20).map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 items-start border-l-2 border-[#c8a285] pl-3 py-1 ml-1.5"
                  >
                    <span className="text-base select-none mt-0.5">
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
                      <p className="font-serif text-xs text-[#2c160a] leading-normal">{item.title}</p>
                      <p className="font-mono text-[9px] text-[#5e463a] mt-0.5">
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
            <div className="grid grid-cols-2 gap-3">
              <Card
                variant="parchment"
                elevation="low"
                className="flex flex-col items-center p-3 text-center border-2 border-[#2c160a] bg-[#fdfaf2]"
              >
                <span className="text-2xl mb-1 select-none">☕</span>
                <span className="font-serif font-bold text-lg text-[#2c160a]">
                  {user.currentCoffeeTokens}
                </span>
                <span className="font-serif text-[9px] text-[#5e463a] uppercase tracking-wider font-bold">
                  Coffee Tokens
                </span>
              </Card>

              <Card
                variant="parchment"
                elevation="low"
                className="flex flex-col items-center p-3 text-center border-2 border-[#2c160a] bg-[#fdfaf2]"
              >
                <span className="text-2xl mb-1 select-none">✍️</span>
                <span className="font-serif font-bold text-lg text-[#2c160a]">
                  {user.totalNotesWritten}
                </span>
                <span className="font-serif text-[9px] text-[#5e463a] uppercase tracking-wider font-bold">
                  Notes Written
                </span>
              </Card>

              <Card
                variant="parchment"
                elevation="low"
                className="flex flex-col items-center p-3 text-center border-2 border-[#2c160a] bg-[#fdfaf2]"
              >
                <span className="text-2xl mb-1 select-none">🔥</span>
                <span className="font-serif font-bold text-lg text-[#2c160a]">
                  {user.totalWarmthContributed || 0}
                </span>
                <span className="font-serif text-[9px] text-[#5e463a] uppercase tracking-wider font-bold">
                  Warmth Contributed
                </span>
              </Card>

              <Card
                variant="parchment"
                elevation="low"
                className="flex flex-col items-center p-3 text-center border-2 border-[#2c160a] bg-[#fdfaf2]"
              >
                <span className="text-2xl mb-1 select-none">👤</span>
                <span className="font-serif font-bold text-lg text-[#2c160a]">
                  {user.visitCount || 1}
                </span>
                <span className="font-serif text-[9px] text-[#5e463a] uppercase tracking-wider font-bold">
                  Visit Count
                </span>
              </Card>

              <Card
                variant="parchment"
                elevation="low"
                className="flex flex-col items-center p-3 text-center border-2 border-[#2c160a] bg-[#fdfaf2] col-span-2"
              >
                <span className="text-2xl mb-1 select-none">🧩</span>
                <span className="font-serif font-bold text-sm text-[#2c160a]">
                  {formatPB(user.puzzleHighScore)}
                </span>
                <span className="font-serif text-[9px] text-[#5e463a] uppercase tracking-wider font-bold">
                  Puzzle Personal Best
                </span>
              </Card>
            </div>

            {/* Rank progression */}
            <Card variant="deck" elevation="low" className="border-2 border-[#2c160a] p-4 flex flex-col gap-3">
              <h3 className="font-serif font-bold text-xs text-[#2c160a] uppercase tracking-wider">
                📈 Level Progression
              </h3>
              <ProgressBar value={user.totalNotesWritten} max={20} label="Notes Written" subLabel={rank.next} />
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[#fdfaf2]">
      {/* Profile Card Header */}
      <div
        className="px-4 py-4 border-b-2 border-[#2c160a] flex-shrink-0"
        style={{ backgroundColor: '#f7edd7' }}
      >
        <div
          className="rounded border-2 border-[#2c160a] overflow-hidden"
          style={{ boxShadow: '3px 3px 0px #2c160a' }}
        >
          <div className="wood-plank-bg flex items-center justify-between px-4 py-3">
            <div className="flex flex-col">
              <span className="font-serif font-bold text-base text-[#fdfaf2] leading-tight">
                {user.username}
              </span>
              <span className="font-handwritten text-xs text-[#c8a285]">
                {rank.icon} {rank.label}
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-[9px] text-[#c8a285] block">
                MEMBER ID: #{user.id.substring(0, 8).toUpperCase()}
              </span>
              <span className="font-mono text-[9px] text-[#eeded1] block">
                Joined {formatDate(user.joinedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b-2 border-[#2c160a] bg-[#f7edd7] flex-shrink-0 font-serif text-xs">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 text-center py-2.5 font-bold cursor-pointer transition-all ${
            activeTab === 'goals' ? 'bg-[#2c160a] text-[#fdfaf2]' : 'text-[#2c160a] hover:bg-[#eeded1]'
          }`}
        >
          🎯 Goals
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 text-center py-2.5 font-bold cursor-pointer transition-all ${
            activeTab === 'achievements' ? 'bg-[#2c160a] text-[#fdfaf2]' : 'text-[#2c160a] hover:bg-[#eeded1]'
          }`}
        >
          🏆 Badges
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 text-center py-2.5 font-bold cursor-pointer transition-all ${
            activeTab === 'activity' ? 'bg-[#2c160a] text-[#fdfaf2]' : 'text-[#2c160a] hover:bg-[#eeded1]'
          }`}
        >
          🕒 Activity
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 text-center py-2.5 font-bold cursor-pointer transition-all ${
            activeTab === 'stats' ? 'bg-[#2c160a] text-[#fdfaf2]' : 'text-[#2c160a] hover:bg-[#eeded1]'
          }`}
        >
          📊 Stats
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#fdfaf2]">{renderTabContent()}</div>
    </div>
  );
};
