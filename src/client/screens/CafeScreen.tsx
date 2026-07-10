import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { CafeFloorPlan } from '../components/CafeFloorPlan';
import { ROOM_UNLOCK_THRESHOLDS } from '../../shared/constants';
import type { Room, User, CafeState, Contribution } from '../../shared/types';

interface CafeScreenProps {
  user: User | null;
  cafe: CafeState;
  rooms: Room[];
  contributions: Contribution[];
  canClaimCoffee: boolean;
  onClaimToken: () => Promise<boolean>;
  onOpenComposer: () => void;
}

const ROOM_ICONS: Record<string, string> = {
  foyer: '🚪',
  fireplace: '🔥',
  bookshelf: '📚',
  garden: '🌿',
  music_room: '🎵',
};

const ROOM_DESCRIPTIONS: Record<string, string> = {
  foyer: 'Where every visitor begins their journey. Warm, welcoming.',
  fireplace: 'A crackling hearth where stories are shared on cold evenings.',
  bookshelf: 'Floor-to-ceiling shelves of dog-eared wisdom and forgotten worlds.',
  garden: 'A secret courtyard where things grow quietly in the dark.',
  music_room: 'An old upright piano and scattered sheet music nobody owns.',
};

const getMsUntilMidnightUTC = () => {
  const now = new Date();
  const midnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return midnight.getTime() - now.getTime();
};

const formatCountdown = (ms: number) => {
  if (ms <= 0) return '00:00:00';
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');
};

export const CafeScreen = ({
  user,
  cafe,
  rooms,
  contributions,
  canClaimCoffee,
  onClaimToken,
  onOpenComposer,
}: CafeScreenProps) => {
  // Claim status states
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [msUntilMidnight, setMsUntilMidnight] = useState(getMsUntilMidnightUTC());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsUntilMidnight(getMsUntilMidnightUTC());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const nextRoom = rooms.find((r) => !r.isUnlocked);
  const nextThreshold = nextRoom?.threshold ?? ROOM_UNLOCK_THRESHOLDS.MUSIC_ROOM;
  const currentTokens = user?.currentCoffeeTokens ?? 0;
  const hasTokens = currentTokens > 0;

  const handleClaim = async () => {
    setIsClaiming(true);
    setErrorMessage(null);
    try {
      const success = await onClaimToken();
      if (success) {
        setClaimMessage("You brewed today's coffee.");
        setTimeout(() => setClaimMessage(null), 4000);
      } else {
        setErrorMessage('Failed to brew coffee. Come back tomorrow.');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch {
      setErrorMessage('Failed to brew coffee. Check your connection.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto bg-[#fdfaf2]">
      {/* Cafe Header & Hub Information */}
      <div
        className="flex flex-col px-4 pt-5 pb-4 border-b-2 border-[#2c160a]"
        style={{ backgroundColor: '#f7edd7' }}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="font-serif font-bold text-xl text-[#2c160a] leading-tight">
              ☕ The Last Cafe
            </h1>
            <p className="font-handwritten text-xs text-[#5e463a] italic mt-0.5">
              Pull up a chair. Stay a while.
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs bg-[#2c160a] text-[#fdfaf2] px-2.5 py-1 rounded shadow-[2px_2px_0px_#cf7929]">
              Tokens: {currentTokens}
            </span>
          </div>
        </div>

        {/* Global Progress toward unlocking rooms */}
        <div className="mt-4">
          <ProgressBar
            value={cafe.totalWarmth}
            max={nextThreshold}
            label={nextRoom ? `Progress to: ${nextRoom.name}` : 'All rooms unlocked!'}
            subLabel={
              nextRoom
                ? `${nextThreshold - cafe.totalWarmth} more warmth needed to open the ${nextRoom.name}`
                : 'The cafe is fully warm and alive.'
            }
          />
        </div>

        {/* Cooldown and Claims Loop */}
        <div className="mt-4 flex flex-col gap-2 p-3 rounded border border-[#2c160a] bg-[#eeded1]/40">
          <div className="flex justify-between items-center text-xs font-serif">
            <span className="text-[#2c160a] font-bold">Today's Brew:</span>
            {canClaimCoffee ? (
              <span className="text-[#4a7c59] font-bold">Claim Ready!</span>
            ) : (
              <span className="text-[#cf7929] font-bold">Claimed today</span>
            )}
          </div>

          {claimMessage && (
            <p className="text-xs text-[#4a7c59] font-serif italic text-center font-bold">
              {claimMessage}
            </p>
          )}

          {errorMessage && (
            <p className="text-xs text-[#cf7929] font-serif italic text-center font-bold">
              {errorMessage}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleClaim}
              disabled={!canClaimCoffee || isClaiming}
              className="flex-grow cursor-pointer"
            >
              {isClaiming ? 'Brewing...' : canClaimCoffee ? '☕ Claim Daily Coffee' : 'Brewed'}
            </Button>
            {!canClaimCoffee && (
              <span className="font-mono text-xs bg-[#fdfaf2] px-2 py-1.5 rounded border border-[#2c160a] text-[#5e463a] select-none">
                {formatCountdown(msUntilMidnight)}
              </span>
            )}
          </div>
        </div>

        {/* Contribution Trigger */}
        <div className="mt-4">
          {!hasTokens ? (
            <div className="p-3 bg-[#eeded1]/20 border border-dashed border-[#c8a285] rounded text-center">
              <p className="font-serif text-xs text-[#cf7929] italic">
                You've finished today's coffee. Come back tomorrow.
              </p>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenComposer}
              disabled={!hasTokens}
              fullWidth
              className="cursor-pointer"
            >
              ✍️ Leave a Note (Spend 1 Token)
            </Button>
          )}
        </div>
      </div>

      {/* Visual blueprint floor plan */}
      <div className="p-4 border-b border-[#2c160a] bg-[#eeded1]/10">
        <CafeFloorPlan user={user} rooms={rooms} totalWarmth={cafe.totalWarmth} />
      </div>

      {/* Today's Contributions Feed */}
      <div className="p-4 flex flex-col gap-3">
        <h2 className="font-serif font-bold text-sm text-[#2c160a] flex items-center gap-2">
          <span>📜</span> Today's Contributions
        </h2>

        {contributions.length === 0 ? (
          <div className="p-3 bg-[#eeded1]/20 border border-dashed border-[#c8a285] rounded text-center">
            <p className="font-serif text-xs text-[#5e463a] italic mb-2">
              The cafe is quiet today. Why not leave the first note?
            </p>
            {hasTokens && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenComposer}
                className="cursor-pointer"
              >
                ✍️ Leave First Note
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {contributions.slice(0, 3).map((contrib) => (
              <Card
                key={contrib.id}
                variant="parchment"
                elevation="low"
                className="p-3 border-2 border-[#2c160a] bg-[#fdfaf2]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest px-1 py-0.5 rounded bg-[#eeded1] text-[#2c160a] border border-[#2c160a] select-none">
                    {contrib.category}
                  </span>
                  <span className="font-serif text-[9px] text-[#5e463a]">
                    — {contrib.username}
                  </span>
                </div>
                <p className="font-handwritten text-xs text-[#26140b] leading-relaxed">
                  "{contrib.message || contrib.text}"
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
