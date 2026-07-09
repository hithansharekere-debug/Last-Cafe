import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { Modal } from '../components/Modal';
import { NoteCard } from '../components/NoteCard';
import { EmptyState } from '../components/EmptyState';
import { ROOM_UNLOCK_THRESHOLDS, CONTRIBUTION_CATEGORIES } from '../../shared/constants';
import type { ContributionCategory } from '../../shared/constants';
import type { Room, CafeProgress, User, CafeState, Contribution } from '../../shared/types';

interface CafeScreenProps {
  user: User | null;
  cafe: CafeState;
  progress: CafeProgress;
  rooms: Room[];
  contributions: Contribution[];
  canClaimCoffee: boolean;
  onSpendToken: (category: string, text: string, targetDate?: number) => Promise<boolean>;
  onClaimToken: () => Promise<boolean>;
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
  onSpendToken,
  onClaimToken,
}: CafeScreenProps) => {
  const [isLeaveNoteOpen, setIsLeaveNoteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ContributionCategory>(
    CONTRIBUTION_CATEGORIES.MEMORY
  );
  const [noteText, setNoteText] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleSubmitNote = async () => {
    if (!noteText.trim() || currentTokens <= 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const parsedDate =
      selectedCategory === CONTRIBUTION_CATEGORIES.TIME_CAPSULE && targetDate
        ? Math.floor(new Date(targetDate).getTime() / 1000)
        : undefined;

    try {
      const success = await onSpendToken(selectedCategory, noteText.trim(), parsedDate);

      if (success) {
        setSuccessMessage('Noisy typewriter → Note pinned.');
        setNoteText('');
        setTargetDate('');
        setSelectedCategory(CONTRIBUTION_CATEGORIES.MEMORY);
        setTimeout(() => {
          setIsLeaveNoteOpen(false);
          setSuccessMessage(null);
        }, 2200);
      } else {
        setErrorMessage('Failed to leave your note. Try again.');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch {
      setErrorMessage('Failed to connect to the cafe board.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
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
              className="flex-grow"
            >
              {isClaiming ? 'Brewing...' : canClaimCoffee ? '☕ Claim Daily Coffee' : 'Brewed'}
            </Button>
            {!canClaimCoffee && (
              <span className="font-mono text-xs bg-[#fdfaf2] px-2 py-1.5 rounded border border-[#2c160a] text-[#5e463a]">
                {formatCountdown(msUntilMidnight)}
              </span>
            )}
          </div>
        </div>

        {/* Contribution Trigger */}
        <div className="mt-4">
          {currentTokens === 0 ? (
            <div className="p-3 bg-[#eeded1]/20 border border-dashed border-[#c8a285] rounded text-center">
              <p className="font-serif text-xs text-[#cf7929] italic">
                You've finished today's coffee. Come back tomorrow.
              </p>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsLeaveNoteOpen(true)}
              disabled={currentTokens <= 0}
              fullWidth
            >
              ✍️ Leave a Note (Spend 1 Token)
            </Button>
          )}
        </div>
      </div>

      {/* Unlocked Room Grid Overview */}
      <div className="p-4 border-b border-[#2c160a] bg-[#eeded1]/10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-serif font-bold text-xs text-[#2c160a] uppercase tracking-wider">
            🗺 Unlocked Areas ({cafe.roomsUnlocked.length} / 5)
          </h2>
          <span className="font-mono text-[10px] text-[#5e463a]">
            👤 {cafe.totalVisitors} recent visitors
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`flex items-center justify-between p-2.5 rounded border text-xs font-serif transition-all ${
                room.isUnlocked
                  ? 'bg-[#fdfaf2] border-[#2c160a] text-[#2c160a]'
                  : 'bg-[#eeded1]/20 border-[#c8a285]/30 text-[#5e463a]/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{room.isUnlocked ? ROOM_ICONS[room.id] : '🔒'}</span>
                <div>
                  <p className="font-bold">{room.name}</p>
                  <p className="text-[10px] text-[#5e463a]/80 font-normal">
                    {room.isUnlocked ? ROOM_DESCRIPTIONS[room.id] : `Requires ${room.threshold} warmth`}
                  </p>
                </div>
              </div>
              {room.isUnlocked ? (
                <span className="font-mono text-[9px] bg-[#4a7c59] text-[#fdfaf2] px-1.5 py-0.5 rounded font-bold">
                  OPEN
                </span>
              ) : (
                <span className="font-mono text-[9px] bg-[#c8a285]/20 text-[#5e463a] px-1.5 py-0.5 rounded">
                  {room.threshold}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Today's Contributions Feed */}
      <div className="p-4 flex flex-col gap-3">
        <h2 className="font-serif font-bold text-sm text-[#2c160a] flex items-center gap-2">
          <span>📜</span> Today's Contributions
        </h2>

        {contributions.length === 0 ? (
          <EmptyState
            icon="📭"
            title="The Cafe is Quiet"
            message="The cafe is quiet today. Why not leave the first note?"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {contributions.slice(0, 3).map((contrib) => (
              <NoteCard key={contrib.id} contribution={contrib} />
            ))}
          </div>
        )}
      </div>

      {/* Leave a note modal */}
      <Modal
        isOpen={isLeaveNoteOpen}
        onClose={() => {
          if (!isSubmitting) setIsLeaveNoteOpen(false);
        }}
        title="Leave a Note for the Cafe"
      >
        {successMessage ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="text-4xl animate-bounce">📝</span>
            <p className="font-serif text-sm text-[#2c160a] leading-relaxed font-bold">
              {successMessage}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Category selection */}
            <div className="flex flex-col gap-1.5">
              <label className="font-serif text-xs font-bold text-[#2c160a]">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(CONTRIBUTION_CATEGORIES).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs font-serif rounded border border-[#2c160a] transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#cf7929] text-[#fdfaf2] shadow-[2px_2px_0px_#2c160a]'
                        : 'bg-[#eeded1] text-[#2c160a] hover:bg-[#c8a285]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Note text */}
            <div className="flex flex-col gap-1.5">
              <label className="font-serif text-xs font-bold text-[#2c160a]">Your Note</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write something worth leaving behind…"
                maxLength={250}
                rows={4}
                className="w-full rounded border-2 border-[#2c160a] p-2.5 font-serif text-sm text-[#26140b] resize-none bg-[#f7edd7] placeholder:italic placeholder:text-[#c8a285] focus:outline-none focus:border-[#cf7929]"
              />
              <span className="font-mono text-[10px] text-[#5e463a] text-right">
                {noteText.length}/250
              </span>
            </div>

            {/* Time Capsule date */}
            {selectedCategory === CONTRIBUTION_CATEGORIES.TIME_CAPSULE && (
              <div className="flex flex-col gap-1.5">
                <label className="font-serif text-xs font-bold text-[#2c160a]">Unlock Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded border-2 border-[#2c160a] p-2 font-serif text-sm bg-[#f7edd7] text-[#26140b] focus:outline-none focus:border-[#cf7929]"
                />
                <p className="font-serif text-[10px] text-[#5e463a] italic">
                  Your note will only appear after this date.
                </p>
              </div>
            )}

            {errorMessage && (
              <p className="text-xs text-[#cf7929] font-serif italic text-center font-bold">
                {errorMessage}
              </p>
            )}

            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={!noteText.trim() || currentTokens <= 0 || isSubmitting}
              onClick={handleSubmitNote}
            >
              {isSubmitting ? 'Placing note…' : `Leave this ${selectedCategory} (1 token)`}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
