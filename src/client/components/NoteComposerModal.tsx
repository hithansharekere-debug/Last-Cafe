import React, { useState } from 'react';
import { Modal, ModalBody, ModalFooter } from './Modal';
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
        <ModalBody className="flex flex-col items-center gap-3 py-16 text-center animate-fade-in">
          <span className="text-4xl animate-bounce">📝</span>
          <p className="font-sans text-sm text-[var(--color-dark-walnut)] leading-relaxed font-bold">
            {successMessage}
          </p>
        </ModalBody>
      ) : (
        <>
          <ModalBody className="flex flex-col gap-md">
            {/* Category selection */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-bold text-[var(--color-dark-walnut)] uppercase tracking-wider mb-2 select-none">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(CONTRIBUTION_CATEGORIES).map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-sans rounded-md border-2 border-[var(--color-border-dark)] transition-all cursor-pointer shadow-[0_2.5px_0px_var(--color-border-dark)] active:translate-y-[1px] active:shadow-none font-bold ${
                        isActive
                          ? 'bg-[var(--color-caramel)] text-[var(--color-text-light)]'
                          : 'bg-[var(--color-cream)] text-[var(--color-dark-walnut)] hover:bg-[var(--color-paper-shadow)]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note text */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center mb-1">
                <label className="font-sans text-xs font-bold text-[var(--color-dark-walnut)] uppercase tracking-wider select-none">
                  Your Note
                </label>
                <span className="font-mono text-[10px] text-[var(--color-text-muted)] select-none">
                  {noteText.length}/250
                </span>
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write something worth leaving behind…"
                maxLength={250}
                rows={4}
                className="w-full rounded border-2 border-[var(--color-border-dark)] p-2.5 font-sans text-sm text-[var(--color-espresso)] resize-none bg-[var(--color-cream)] placeholder:italic placeholder:text-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-caramel)]"
              />
            </div>

            {/* Time Capsule date */}
            {selectedCategory === CONTRIBUTION_CATEGORIES.TIME_CAPSULE && (
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-bold text-[var(--color-dark-walnut)] uppercase tracking-wider select-none">
                  Unlock Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded border-2 border-[var(--color-border-dark)] p-2 font-sans text-sm bg-[var(--color-cream)] text-[var(--color-espresso)] focus:outline-none focus:border-[var(--color-caramel)]"
                />
                <p className="font-sans text-[10px] text-[var(--color-text-muted)] italic select-none">
                  Your note will only appear after this date.
                </p>
              </div>
            )}

            {errorMessage && (
              <p className="text-xs text-[var(--color-warm-red)] font-sans italic text-center font-bold">
                {errorMessage}
              </p>
            )}
          </ModalBody>

          <ModalFooter className="flex-col sm:flex-row gap-md">
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
          </ModalFooter>
        </>
      )}
    </Modal>
  );
};
