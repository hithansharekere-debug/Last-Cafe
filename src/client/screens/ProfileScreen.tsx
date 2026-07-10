import React from 'react';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { ROOM_UNLOCK_THRESHOLDS } from '../../shared/constants';
import type { User, CafeState } from '../../shared/types';

interface ProfileScreenProps {
  user: User | null;
  cafe: CafeState;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getRank(count: number): { label: string; icon: string; next: string } {
  if (count >= 20) return { label: 'Cafe Regular', icon: '🧑‍🍳', next: 'Max rank reached' };
  if (count >= 10) return { label: 'Loyal Visitor', icon: '🪑', next: `${20 - count} notes to Cafe Regular` };
  if (count >= 5) return { label: 'Familiar Face', icon: '☕', next: `${10 - count} notes to Loyal Visitor` };
  if (count >= 1) return { label: 'New Visitor', icon: '🚪', next: `${5 - count} notes to Familiar Face` };
  return { label: 'Stranger', icon: '👤', next: 'Leave your first note to become a New Visitor' };
}

export const ProfileScreen = ({ user, cafe }: ProfileScreenProps) => {
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-6 gap-4">
        <span className="text-4xl animate-float">📋</span>
        <p className="font-serif text-sm text-[#5e463a] italic text-center">
          Sign in to Reddit to view your Library Card.
        </p>
      </div>
    );
  }

  const rank = getRank(user.totalNotesWritten);
  const thresholds = Object.values(ROOM_UNLOCK_THRESHOLDS) as number[];
  const nextRoomThreshold = thresholds.find((t) => t > cafe.totalWarmth) ?? ROOM_UNLOCK_THRESHOLDS.MUSIC_ROOM;

  const badges: { icon: string; label: string; earned: boolean }[] = [
    { icon: '🚪', label: 'First Visit', earned: true },
    { icon: '☕', label: 'First Note', earned: user.totalNotesWritten >= 1 },
    { icon: '🔥', label: 'Fireplace', earned: cafe.roomsUnlocked.includes('fireplace') },
    { icon: '📚', label: 'Bookshelf', earned: cafe.roomsUnlocked.includes('bookshelf') },
    { icon: '🌿', label: 'Garden', earned: cafe.roomsUnlocked.includes('garden') },
    { icon: '🎵', label: 'Music Room', earned: cafe.roomsUnlocked.includes('music_room') },
    { icon: '⏳', label: 'Time Capsule', earned: false }, // Time capsules earned logic can be future
    { icon: '🧩', label: 'Puzzle Solver', earned: user.puzzleHighScore !== null },
  ];

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto bg-[#fdfaf2] p-4 gap-4">
      {/* Profile Card Header */}
      <div
        className="rounded-lg border-2 border-[#2c160a] overflow-hidden"
        style={{ boxShadow: '4px 4px 0px #2c160a' }}
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

      {/* Stats Cards grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="parchment" elevation="low" className="flex flex-col items-center p-3 text-center border-2 border-[#2c160a] bg-[#fdfaf2]">
          <span className="text-2xl mb-1 select-none">☕</span>
          <span className="font-serif font-bold text-lg text-[#2c160a]">{user.currentCoffeeTokens}</span>
          <span className="font-serif text-[9px] text-[#5e463a] uppercase tracking-wider font-bold">Coffee Tokens</span>
        </Card>

        <Card variant="parchment" elevation="low" className="flex flex-col items-center p-3 text-center border-2 border-[#2c160a] bg-[#fdfaf2]">
          <span className="text-2xl mb-1 select-none">✍️</span>
          <span className="font-serif font-bold text-lg text-[#2c160a]">{user.totalNotesWritten}</span>
          <span className="font-serif text-[9px] text-[#5e463a] uppercase tracking-wider font-bold">Notes Written</span>
        </Card>

        <Card variant="parchment" elevation="low" className="flex flex-col items-center p-3 text-center border-2 border-[#2c160a] bg-[#fdfaf2]">
          <span className="text-2xl mb-1 select-none">🔥</span>
          <span className="font-serif font-bold text-lg text-[#2c160a]">{user.totalWarmthContributed || 0}</span>
          <span className="font-serif text-[9px] text-[#5e463a] uppercase tracking-wider font-bold">Warmth Contributed</span>
        </Card>

        <Card variant="parchment" elevation="low" className="flex flex-col items-center p-3 text-center border-2 border-[#2c160a] bg-[#fdfaf2]">
          <span className="text-2xl mb-1 select-none">👤</span>
          <span className="font-serif font-bold text-lg text-[#2c160a]">{user.visitCount || 1}</span>
          <span className="font-serif text-[9px] text-[#5e463a] uppercase tracking-wider font-bold">Visit Count</span>
        </Card>

        <Card variant="parchment" elevation="low" className="flex flex-col items-center p-3 text-center border-2 border-[#2c160a] bg-[#fdfaf2] col-span-2">
          <span className="text-2xl mb-1 select-none">🧩</span>
          <span className="font-serif font-bold text-sm text-[#2c160a]">
            {user.puzzleHighScore !== null ? `${Math.floor(user.puzzleHighScore / 1000)} seconds` : '—'}
          </span>
          <span className="font-serif text-[9px] text-[#5e463a] uppercase tracking-wider font-bold">Puzzle Personal Best</span>
        </Card>
      </div>

      {/* Progress Cards */}
      <Card variant="deck" elevation="low" className="border-2 border-[#2c160a] p-4 flex flex-col gap-3">
        <h3 className="font-serif font-bold text-xs text-[#2c160a] uppercase tracking-wider">
          📈 Level Progression
        </h3>
        <ProgressBar value={user.totalNotesWritten} max={20} label="Notes Written" subLabel={rank.next} />
        <ProgressBar
          value={cafe.totalWarmth}
          max={nextRoomThreshold}
          label="Community Progress"
          subLabel={`${nextRoomThreshold - cafe.totalWarmth} warmth to next unlock`}
        />
      </Card>

      {/* Stamps & Achievements */}
      <div className="flex flex-col gap-2.5 pb-2">
        <h3 className="font-serif font-bold text-sm text-[#2c160a] flex items-center gap-2">
          <span>🎖</span> Stamps & Achievements
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {badges.map((badge) => (
            <div
              key={badge.label}
              title={badge.label}
              className={`flex flex-col items-center gap-1 p-2 rounded border-2 border-[#2c160a] transition-all duration-150 ${
                badge.earned
                  ? 'opacity-100 bg-[#eeded1] scale-100'
                  : 'opacity-40 bg-[#c8a285]/20 scale-95'
              }`}
            >
              <span className="text-xl select-none">{badge.icon}</span>
              <span className="font-serif text-[8px] text-[#2c160a] text-center leading-tight font-bold">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
        <p className="font-serif text-[10px] text-[#5e463a] italic text-center select-none">
          Dimmed achievements can be earned through contributions.
        </p>
      </div>
    </div>
  );
};
