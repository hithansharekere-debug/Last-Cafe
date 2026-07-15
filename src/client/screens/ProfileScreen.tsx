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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-6 bg-[#F4E8D5] gap-6 font-sans">
        <span className="text-4xl animate-float">📋</span>
        <p className="text-[14px] text-[#4B3528] italic text-center">
          Sign in to Reddit to view your Library Card.
        </p>
      </div>
    );
  }

  const reputation = user.reputation || 0;
  const rank = getRank(reputation);

  const displayJoinedDate = (() => {
    if (!user.joinedAt || isNaN(Number(user.joinedAt))) {
      return 'Recently';
    }
    const date = new Date(Number(user.joinedAt) * 1000);
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  })();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'goals':
        return (
          <div className="flex flex-col gap-[24px]">
            {/* Streaks Card */}
            <div className="library-card-cozy flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-dashed border-[#8D6846]/30 pb-2 mb-4">
                <span className="text-[18px] font-bold text-[#4B3528] flex items-center gap-3 select-none">
                  🔥 Visit Streak
                </span>
                <span className="font-mono text-[13px] bg-[#C6965A] text-[#FBF6EE] px-2.5 py-0.5 rounded-md font-bold">
                  {user.currentStreak || 1} Days
                </span>
              </div>
              <p className="text-[16px] text-[#4B3528] leading-relaxed">
                Visit the cafe daily to keep your streak alive! Longest streak: <strong className="text-[#3B271C]">{user.longestStreak || 1} days</strong>.
              </p>
            </div>

            {/* Daily Goals */}
            <div className="flex flex-col">
              <h3 className="text-[24px] font-bold text-[#4B3528] mb-4 select-none">
                🎯 Today's Cozy Goals
              </h3>
              {dailyObjectives.length === 0 ? (
                <p className="text-[14px] text-[#4B3528] italic text-center py-6 bg-[#FBF6EE]/40 border-2 border-dashed border-[#8D6846]/30 rounded-[18px]">
                  No active goals today.
                </p>
              ) : (
                <div className="flex flex-col gap-[14px]">
                  {dailyObjectives.map((obj) => {
                    const isDone = user.completedObjectivesToday?.includes(obj.id);
                    return (
                      <div
                        key={obj.id}
                        className={`flex items-center justify-between library-list-row-cozy ${
                          isDone ? 'opacity-85' : ''
                        }`}
                        style={{ boxShadow: '0 3.5px 0px #8D6846' }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '22px' }} className="select-none">
                            {isDone ? '✅' : '📝'}
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col md:flex-row md:items-center md:justify-between md:gap-4 pr-4">
                            <p
                              className={`text-[16px] font-bold text-[#4B3528] truncate ${
                                isDone ? 'line-through opacity-60' : ''
                              }`}
                            >
                              {obj.text}
                            </p>
                            <p className="font-mono text-[13px] text-[#C6965A]/85 uppercase tracking-wider font-bold mt-1 md:mt-0 flex-shrink-0 select-none">
                              Reward: +{obj.rewardValue} {obj.rewardType === 'token' ? 'Coffee Token ☕' : 'Warmth 🔥'}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right select-none">
                          {isDone ? (
                            <span className="font-mono text-[13px] uppercase tracking-widest text-[#98A27A] font-bold">
                              Done
                            </span>
                          ) : (
                            <span className="font-mono text-[13px] uppercase tracking-widest text-[#8D6846] font-bold">
                              Active
                            </span>
                          )}
                        </div>
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
          <div className="flex flex-col gap-[14px]">
            {achievementsKeys.map((key) => {
              const ach = ACHIEVEMENT_DEFINITIONS[key]!;
              const isUnlocked = user.achievements?.includes(key);
              return (
                <div
                  key={key}
                  className={`flex gap-4 items-start library-list-row-cozy ${
                    isUnlocked ? 'opacity-100' : 'opacity-70 border-dashed'
                  }`}
                >
                  {/* Emoji Container */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '22px',
                    }}
                    className="select-none"
                  >
                    {ach.icon}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[16px] font-bold text-[#4B3528]">{ach.title}</span>
                      <span
                        className={`font-mono text-[13px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider select-none ${
                          isUnlocked
                            ? 'bg-[#98A27A]/10 text-[#98A27A] border-[#98A27A]'
                            : 'bg-[#4B3528]/10 text-[#4B3528] border-[#4B3528] opacity-60'
                        }`}
                      >
                        {isUnlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                    <p className="text-[14px] text-[#8D6846] mt-1 leading-relaxed">{ach.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'activity':
        return (
          <div className="flex flex-col gap-[14px]">
            {!user.timeline || user.timeline.length === 0 ? (
              <EmptyState
                icon="🕒"
                title="Your journey is quiet"
                message="Solve puzzles or leave a note to start your story in the timeline."
              />
            ) : (
              <div className="flex flex-col gap-[14px]">
                {user.timeline.slice(0, 20).map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 items-start border-l-2 border-[#8D6846] pl-4.5 py-2 ml-2 hover:bg-[#FBF6EE]/30 rounded-r-md pr-2 transition-all duration-150"
                  >
                    {/* Fixed Emoji Container */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '20px',
                      }}
                      className="select-none"
                    >
                      {item.type === 'claim_coffee'
                        ? '☕'
                        : item.type === 'write_note'
                        ? '📝'
                        : item.type === 'achievement'
                        ? '🏆'
                        : item.type === 'streak'
                        ? '🔥'
                        : '❤️'}
                    </div>
                    <div className="flex-1">
                      <p className="text-[16px] text-[#4B3528] leading-relaxed">{item.title}</p>
                      <p className="font-mono text-[13px] text-[#8D6846] mt-1 font-bold">
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
          <div className="flex flex-col gap-[24px]">
            {/* Stats Cards grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Reputation', val: reputation, icon: '🏆' },
                { label: 'Puzzles Solved', val: user.solvedPuzzles?.length || 0, icon: '💡' },
                { label: 'Coffee Tokens', val: user.currentCoffeeTokens, icon: '☕' },
                { label: 'Mysteries Created', val: user.totalNotesWritten, icon: '✍️' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="library-card-cozy flex flex-col items-center text-center"
                >
                  <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', fontSize: '24px' }} className="select-none">
                    {s.icon}
                  </div>
                  <span className="text-[18px] font-bold text-[#4B3528] mb-1">
                    {s.val}
                  </span>
                  <span className="text-[13px] text-[#8D6846] uppercase tracking-wider font-bold">
                    {s.label}
                  </span>
                </div>
              ))}

              <div
                className="library-card-cozy flex flex-col items-center text-center col-span-2"
              >
                <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', fontSize: '24px' }} className="select-none">
                  🔥
                </div>
                <span className="text-[18px] font-bold text-[#4B3528] mb-1">
                  {user.totalWarmthContributed || 0}
                </span>
                <span className="text-[13px] text-[#8D6846] uppercase tracking-wider font-bold">
                  Warmth Contributed
                </span>
              </div>
            </div>

            {/* Rank progression */}
            <div className="library-card-cozy flex flex-col gap-3">
              <h3 className="text-[24px] font-bold text-[#4B3528] mb-4 select-none">
                📈 Reputation Rank Progression
              </h3>
              <ProgressBar value={reputation} max={1200} label="Reputation Level" subLabel={rank.next} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[#F4E8D5] animate-fade-in font-sans">
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', whiteSpace: 'nowrap', marginBottom: '16px' }}>
          <span style={{ fontSize: '32px', lineHeight: 1 }} className="select-none">📚</span>
          <span className="font-sans font-bold text-[44px] text-[#4B3528] leading-none">Library</span>
        </div>
        <p className="text-[14px] text-[#8D6846] italic leading-relaxed" style={{ margin: '0' }}>
          Your visitor credentials, streaks, badges, and cafe reading log.
        </p>
      </div>

      {/* Member Card / Visitor Card */}
      <div className="px-lg pt-lg flex-shrink-0 bg-[#F4E8D5] pb-2">
        <div className="wooden-profile-card">
          {/* Left Column: Visitor Info */}
          <div className="flex flex-col min-w-0 flex-1 justify-center" style={{ gap: '8px' }}>
            <span 
              className="font-sans font-bold text-[20px] text-[#FFF8EF] leading-tight select-none block truncate"
              title={user.username}
            >
              {user.username}
            </span>
            <span className="font-sans text-[15px] italic text-[#F3DFC6] leading-none select-none">
              {rank.icon} {rank.label}
            </span>
          </div>

          {/* Right Column: Account Info */}
          <div className="text-right flex flex-col flex-shrink-0 justify-center" style={{ gap: '8px' }}>
            <div className="flex flex-col items-end">
              <span className="font-mono text-[13px] uppercase tracking-widest text-[#DDBE97] block font-bold leading-none mb-1 select-none">
                MEMBER ID
              </span>
              <span 
                className="font-mono text-[14px] text-[#FFF8EF] block font-bold leading-none truncate max-w-[150px]"
                title={user.id}
              >
                #{user.id.length > 10 ? `${user.id.substring(0, 8).toUpperCase()}...` : user.id.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-[13px] uppercase tracking-widest text-[#DDBE97] block font-bold leading-none mb-1 select-none">
                JOINED
              </span>
              <span className="font-mono text-[14px] text-[#FFF8EF] block font-bold leading-none">
                {displayJoinedDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div 
        className="flex flex-wrap justify-center items-center select-none profile-tabs-header px-lg" 
        style={{ gap: '12px' }}
      >
        {(['goals', 'achievements', 'activity', 'stats'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const labelMap = {
            goals: '🎯 Goals',
            achievements: '🏆 Badges',
            activity: '🕒 Activity',
            stats: '📊 Stats',
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={isActive ? 'profile-tab-btn active' : 'profile-tab-btn inactive'}
            >
              {labelMap[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab Contents (24px top margin) */}
      <div className="flex-1 overflow-y-auto mt-[24px] p-lg bg-[#F4E8D5]">{renderTabContent()}</div>
    </div>
  );
};
export default ProfileScreen;
