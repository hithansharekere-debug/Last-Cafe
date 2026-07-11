import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { CONTRIBUTION_CATEGORIES } from '../../shared/constants';
import type { ContributionCategory } from '../../shared/constants';

interface NoteComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTokens: number;
  onSpendToken: (category: string, text: string, targetDate?: number) => Promise<boolean>;
}

export const NoteComposerModal = ({
  isOpen,
  onClose,
  currentTokens,
  onSpendToken,
}: NoteComposerModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<ContributionCategory>(
    CONTRIBUTION_CATEGORIES.MEMORY
  );
  const [noteText, setNoteText] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
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
          onClose();
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
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
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
            <div className="flex flex-wrap gap-1.5 flex-row">
              {Object.values(CONTRIBUTION_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-serif rounded-md border-2 border-[#2c160a] transition-all cursor-pointer shadow-[1.5px_1.5px_0px_#2c160a] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none font-bold ${
                    selectedCategory === cat
                      ? 'bg-[#cf7929] text-[#fdfaf2]'
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

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              className="flex-1 cursor-pointer"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-grow cursor-pointer"
              disabled={!noteText.trim() || currentTokens <= 0 || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Placing note…' : `Leave note (1 token)`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
