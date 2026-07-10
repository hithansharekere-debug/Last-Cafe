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
        <span className="text-4xl">📋</span>
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
    { icon: '⏳', label: 'Time Capsule', earned: false },
    { icon: '🧩', label: 'Puzzle Solver', earned: false },
  ];

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto bg-[#fdfaf2]">
      {/* Library card */}
      <div
        className="flex flex-col border-b-2 border-[#2c160a] p-5"
        style={{ backgroundColor: '#f7edd7' }}
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#5e463a] mb-3">
          Library Member Card
        </p>

        <div
          className="rounded border-2 border-[#2c160a] overflow-hidden"
          style={{ boxShadow: '4px 4px 0px #2c160a' }}
        >
          {/* Card header */}
          <div className="wood-plank-bg flex items-center justify-between px-4 py-3">
            <div className="flex flex-col">
              <span className="font-serif font-bold text-base text-[#fdfaf2] leading-tight">
                {user.username}
              </span>
              <span className="font-handwritten text-xs text-[#c8a285]">
                {rank.icon} {rank.label}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-mono text-xs text-[#eeded1]">
                ☕ {user.currentCoffeeTokens} {user.currentCoffeeTokens === 1 ? 'token' : 'tokens'}
              </span>
              <span className="font-mono text-[10px] text-[#c8a285]">
                Since {formatDate(user.joinedAt)}
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="bg-[#fdfaf2] p-4 grid grid-cols-3 gap-2 border-t border-dashed border-[#c8a285]">
            <div className="flex flex-col items-center gap-1">
              <span className="font-serif font-bold text-xl text-[#2c160a]">{user.totalNotesWritten}</span>
              <span className="font-serif text-[10px] text-[#5e463a] text-center">Notes Left</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-serif font-bold text-xl text-[#2c160a]">{user.currentCoffeeTokens}</span>
              <span className="font-serif text-[10px] text-[#5e463a] text-center">Tokens</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-serif font-bold text-xl text-[#2c160a]">{cafe.roomsUnlocked.length}</span>
              <span className="font-serif text-[10px] text-[#5e463a] text-center">Rooms Open</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="px-4 pt-4 pb-2">
        <Card variant="deck" elevation="low">
          <p className="font-serif text-xs font-bold text-[#2c160a] mb-2">📈 Your Progress</p>
          <ProgressBar value={user.totalNotesWritten} max={20} label="Notes Written" subLabel={rank.next} />
          <div className="mt-3">
            <ProgressBar
              value={cafe.totalWarmth}
              max={nextRoomThreshold}
              label="Community Progress"
              subLabel={`${nextRoomThreshold - cafe.totalWarmth} more warmth to next room`}
            />
          </div>
        </Card>
      </div>

      {/* Badges */}
      <div className="px-4 pb-6">
        <h3 className="font-serif font-bold text-sm text-[#2c160a] mb-2 flex items-center gap-2">
          <span>🎖</span> Stamps & Achievements
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {badges.map((badge) => (
            <div
              key={badge.label}
              title={badge.label}
              className={`flex flex-col items-center gap-1 p-2 rounded border border-[#2c160a] transition-opacity ${badge.earned ? 'opacity-100' : 'opacity-30'}`}
              style={{ backgroundColor: badge.earned ? '#eeded1' : '#c8a285' }}
            >
              <span className="text-xl">{badge.icon}</span>
              <span className="font-serif text-[8px] text-[#2c160a] text-center leading-tight">{badge.label}</span>
            </div>
          ))}
        </div>
        <p className="font-serif text-[10px] text-[#5e463a] italic mt-2 text-center">
          Dimmed badges are still waiting to be earned.
        </p>
      </div>
    </div>
  );
};
