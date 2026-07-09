import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { Modal } from '../components/Modal';
import { ROOM_UNLOCK_THRESHOLDS, CONTRIBUTION_CATEGORIES } from '../../shared/constants';
import type { ContributionCategory } from '../../shared/constants';
import type { Room, CafeProgress, User } from '../../shared/types';

interface CafeScreenProps {
  user: User | null;
  progress: CafeProgress;
  rooms: Room[];
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

export const CafeScreen = ({ user, progress, rooms, onSpendToken, onClaimToken }: CafeScreenProps) => {
  const [isLeaveNoteOpen, setIsLeaveNoteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ContributionCategory>(CONTRIBUTION_CATEGORIES.MEMORY);
  const [noteText, setNoteText] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const nextRoom = rooms.find((r) => !r.isUnlocked);
  const nextThreshold = nextRoom?.threshold ?? ROOM_UNLOCK_THRESHOLDS.MUSIC_ROOM;
  const hasTokens = (user?.tokenCount ?? 0) > 0;

  const handleSubmitNote = async () => {
    if (!noteText.trim()) return;
    setIsSubmitting(true);

    const parsedDate =
      selectedCategory === CONTRIBUTION_CATEGORIES.TIME_CAPSULE && targetDate
        ? Math.floor(new Date(targetDate).getTime() / 1000)
        : undefined;

    const success = await onSpendToken(selectedCategory, noteText.trim(), parsedDate);

    if (success) {
      setSuccessMessage(`Your ${selectedCategory.toLowerCase()} has been left in the cafe.`);
      setNoteText('');
      setTargetDate('');
      setSelectedCategory(CONTRIBUTION_CATEGORIES.MEMORY);
      setTimeout(() => {
        setIsLeaveNoteOpen(false);
        setSuccessMessage(null);
      }, 1800);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto bg-[#fdfaf2]">
      {/* Progress section */}
      <div
        className="flex flex-col px-4 pt-5 pb-4 border-b-2 border-[#2c160a]"
        style={{ backgroundColor: '#f7edd7' }}
      >
        <p className="font-handwritten text-xs text-[#5e463a] italic mb-1">Community Progress</p>
        <ProgressBar
          value={progress.totalContributions}
          max={nextThreshold}
          label={nextRoom ? `Unlock: ${nextRoom.name}` : 'All rooms unlocked!'}
          subLabel={
            nextRoom
              ? `${nextThreshold - progress.totalContributions} more contributions to open the ${nextRoom.name}`
              : 'The cafe is fully alive.'
          }
        />

        <div className="mt-4 flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsLeaveNoteOpen(true)}
            disabled={!hasTokens}
            fullWidth
          >
            ✍️ Leave a Note ({user?.tokenCount ?? 0} token{(user?.tokenCount ?? 0) !== 1 ? 's' : ''})
          </Button>
          <Button variant="secondary" size="md" onClick={onClaimToken}>
            ☕ Claim
          </Button>
        </div>
        {!hasTokens && (
          <p className="font-serif text-xs text-[#cf7929] italic mt-2 text-center">
            Come back tomorrow for your daily coffee token.
          </p>
        )}
      </div>

      {/* Rooms list */}
      <div className="p-4 flex flex-col gap-3">
        <h2 className="font-serif font-bold text-sm text-[#2c160a] flex items-center gap-2">
          <span>🗺</span> The Cafe Rooms
        </h2>

        {rooms.map((room) => (
          <Card
            key={room.id}
            variant={room.isUnlocked ? 'parchment' : 'deck'}
            elevation={room.isUnlocked ? 'low' : 'none'}
            className={room.isUnlocked ? '' : 'opacity-60'}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">
                {room.isUnlocked ? (ROOM_ICONS[room.id] ?? '🚪') : '🔒'}
              </span>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="font-serif font-bold text-sm text-[#26140b]">{room.name}</span>
                <span className="font-serif text-xs text-[#5e463a] leading-snug">
                  {room.isUnlocked
                    ? (ROOM_DESCRIPTIONS[room.id] ?? '')
                    : `Unlocks at ${room.threshold} community contributions`}
                </span>
              </div>
              {room.isUnlocked && (
                <span className="font-mono text-[10px] text-[#cf7929] font-bold flex-shrink-0">OPEN</span>
              )}
              {!room.isUnlocked && room.threshold > 0 && (
                <span className="font-mono text-[10px] text-[#5e463a] flex-shrink-0">{room.threshold}</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Leave note modal */}
      <Modal
        isOpen={isLeaveNoteOpen}
        onClose={() => { if (!isSubmitting) setIsLeaveNoteOpen(false); }}
        title="Leave a Note for the Cafe"
      >
        {successMessage ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="text-4xl">📝</span>
            <p className="font-serif text-sm text-[#2c160a] leading-relaxed">{successMessage}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Category pills */}
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

            {/* Text area */}
            <div className="flex flex-col gap-1.5">
              <label className="font-serif text-xs font-bold text-[#2c160a]">Your Note</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write something worth leaving behind…"
                maxLength={280}
                rows={4}
                className="w-full rounded border-2 border-[#2c160a] p-2.5 font-serif text-sm text-[#26140b] resize-none bg-[#f7edd7] placeholder:italic placeholder:text-[#c8a285] focus:outline-none focus:border-[#cf7929]"
              />
              <span className="font-mono text-[10px] text-[#5e463a] text-right">{noteText.length}/280</span>
            </div>

            {/* Time capsule date */}
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

            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={!noteText.trim() || isSubmitting}
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
