import React, { useState } from 'react';
import { Button } from './Button';
import { Modal, ModalBody, ModalFooter } from './Modal';
import { Label, Input, Textarea, Select } from './Form';
import { PUZZLE_CATEGORIES } from '../../shared/constants';
import type { PuzzleCategory } from '../../shared/constants';

interface PuzzleCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTokens: number;
  onPublishPuzzle: (puzzleData: {
    title: string;
    description: string;
    puzzleText: string;
    hint: string;
    answer: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: PuzzleCategory;
  }) => Promise<boolean>;
}

const CATEGORY_DETAILS = [
  { value: 'Riddle', label: 'Riddle', icon: '🧩' },
  { value: 'Cipher', label: 'Cipher', icon: '🔐' },
  { value: 'Hidden Word', label: 'Hidden Word', icon: '🔍' },
  { value: 'Number Pattern', label: 'Number Pattern', icon: '🔢' },
  { value: 'Logic Puzzle', label: 'Logic Puzzle', icon: '🧠' },
  { value: 'Detective Story', label: 'Detective Story', icon: '🕵️‍♂️' },
  { value: 'Fill in the Blank', label: 'Fill in the Blank', icon: '📖' },
];

export const PuzzleCreatorModal = ({
  isOpen,
  onClose,
  currentTokens,
  onPublishPuzzle,
}: PuzzleCreatorModalProps) => {
  const [category, setCategory] = useState<PuzzleCategory>(PUZZLE_CATEGORIES.RIDDLE);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [puzzleText, setPuzzleText] = useState('');
  const [hint, setHint] = useState('');
  const [answer, setAnswer] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPuzzleText('');
    setHint('');
    setAnswer('');
    setCategory(PUZZLE_CATEGORIES.RIDDLE);
    setDifficulty('Easy');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !puzzleText.trim() || !answer.trim() || currentTokens <= 0) {
      setErrorMessage('Please fill in all required fields (Title, Clue, and Answer).');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const success = await onPublishPuzzle({
        title: title.trim(),
        description: description.trim(),
        puzzleText: puzzleText.trim(),
        hint: hint.trim(),
        answer: answer.trim().toLowerCase(),
        difficulty,
        category,
      });

      if (success) {
        setSuccessMessage('Noisy typewriter → Puzzle published on board.');
        resetForm();
        setTimeout(() => {
          onClose();
          setSuccessMessage(null);
        }, 2200);
      } else {
        setErrorMessage('Failed to publish your mystery. Try again.');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch {
      setErrorMessage('Failed to connect to the cafe board.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTemplatePlaceholder = () => {
    switch (category) {
      case PUZZLE_CATEGORIES.RIDDLE:
        return "I speak without a mouth and hear without ears. What am I?";
      case PUZZLE_CATEGORIES.CIPHER:
        return "Decrypt this code: 'Wkh Odvw Fdih' (Shift key is 3)";
      case PUZZLE_CATEGORIES.NUMBER_PATTERN:
        return "What number comes next: 2, 4, 8, 16, 32, ...?";
      case PUZZLE_CATEGORIES.LOGIC_PUZZLE:
        return "Alice has red tea, Bob has green. Bob trades half. Who has more green?";
      case PUZZLE_CATEGORIES.DETECTIVE_STORY:
        return "A barista was found asleep. A cup lay broken. The door was locked from inside...";
      case PUZZLE_CATEGORIES.FILL_IN_THE_BLANK:
        return "The Last ___ on the Internet (hint: coffee shop)";
      case PUZZLE_CATEGORIES.HIDDEN_WORD:
      default:
        return "Find the hidden name: 'Behind the old COUNTER lives a cat named...'";
    }
  };

  const isFormValid = title.trim().length > 0 && puzzleText.trim().length > 0 && answer.trim().length > 0 && currentTokens > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="✏️ Create a Community Mystery"
      size="lg"
    >
      {successMessage ? (
        <ModalBody className="flex flex-col items-center justify-center gap-md py-16 text-center animate-fade-in">
          <span className="text-6xl animate-bounce select-none">🧩</span>
          <p className="font-serif text-sm font-bold text-[#2c160a] leading-relaxed">
            {successMessage}
          </p>
        </ModalBody>
      ) : (
        <>
          <ModalBody className="flex flex-col gap-md">
            <p className="text-xs text-[#5e463a] italic leading-relaxed select-none">
              Leave tomorrow's visitors a cozy puzzle to solve. Fill in the fields below.
            </p>

            <div className="flex flex-col gap-md">
              {/* 1. Puzzle Type */}
              <div className="flex flex-col">
                <Label htmlFor="puzzle-type-select">Puzzle Type</Label>
                <Select
                  id="puzzle-type-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  {CATEGORY_DETAILS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* 2. Puzzle Title */}
              <div className="flex flex-col">
                <Label htmlFor="puzzle-title-input">
                  Puzzle Title <span className="text-[#cf7929] font-bold">*</span>
                </Label>
                <Input
                  id="puzzle-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Name your mystery (e.g. The Foyer Clock)..."
                  maxLength={50}
                />
              </div>

              {/* 3. Description */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="puzzle-desc-input" style={{ marginBottom: 0 }}>
                    Cozy Setup Narrative <span className="text-[10px] text-[#5e463a] italic lowercase font-normal">(Optional)</span>
                  </Label>
                  <span className="font-mono text-[10px] text-[#5e463a]/60 font-bold select-none">
                    {description.length}/200
                  </span>
                </div>
                <Textarea
                  id="puzzle-desc-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Set the scene... e.g. You sit near the fireplace. A dust-covered letter reads..."
                  maxLength={200}
                  className="min-h-[100px]"
                />
              </div>

              {/* 4. Clue Text */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="puzzle-text-input" style={{ marginBottom: 0 }}>
                    Puzzle Clue / Clutter text <span className="text-[#cf7929] font-bold">*</span>
                  </Label>
                  <span className="font-mono text-[10px] text-[#5e463a]/60 font-bold select-none">
                    {puzzleText.length}/500
                  </span>
                </div>
                <Textarea
                  id="puzzle-text-input"
                  value={puzzleText}
                  onChange={(e) => setPuzzleText(e.target.value)}
                  placeholder={getTemplatePlaceholder()}
                  maxLength={500}
                />
              </div>

              {/* 5. Hint */}
              <div className="flex flex-col">
                <Label htmlFor="puzzle-hint-input">Optional Hint</Label>
                <Input
                  id="puzzle-hint-input"
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Give solvers a gentle nudge..."
                  maxLength={150}
                />
              </div>

              {/* 6. Correct Answer */}
              <div className="flex flex-col">
                <Label htmlFor="puzzle-answer-input">
                  Correct Answer <span className="text-[#cf7929] font-bold">*</span>
                </Label>
                <Input
                  id="puzzle-answer-input"
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Case-insensitive word/number..."
                  maxLength={50}
                />
              </div>

              {/* 7. Difficulty Selector */}
              <div className="flex flex-col">
                <Label>Select Difficulty</Label>
                <div className="difficulty-buttons flex gap-md w-full">
                  {(['Easy', 'Medium', 'Hard'] as const).map((diff) => {
                    const active = difficulty === diff;
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`flex-1 h-11 rounded-md border-2 border-[#2c160a] font-serif text-xs font-bold text-center cursor-pointer transition-all duration-150 shadow-[2px_2px_0px_#2c160a] active:translate-y-0.5 active:shadow-none ${
                          active
                            ? 'bg-[#cf7929] text-[#fdfaf2] translate-y-0.5 shadow-none'
                            : 'bg-[#eeded1] text-[#2c160a]'
                        }`}
                      >
                        {diff === 'Easy' ? '🟢 Easy' : diff === 'Medium' ? '🟡 Medium' : '🔴 Hard'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </ModalBody>

          {/* FIXED FOOTER */}
          <ModalFooter className="flex-col gap-md">
            {/* Coffee cost card */}
            <div className="w-full py-2 px-md bg-[#eeded1] border-2 border-[#c8a285] rounded-md flex flex-wrap items-center justify-center gap-sm font-serif text-xs text-[#2c160a] font-bold text-center">
              <span>☕</span>
              <span>Publishing this mystery costs 1 Coffee Token.</span>
              <span className="font-mono text-[10px] bg-[#cf7929] text-[#fdfaf2] px-2 py-0.5 rounded-md font-bold ml-1">
                Holdings: {currentTokens}
              </span>
            </div>

            {errorMessage && (
              <p className="text-xs text-[#cf7929] font-serif italic text-center font-bold">
                {errorMessage}
              </p>
            )}

            <div className="modal-footer-buttons flex gap-md w-full">
              <Button
                variant="outline"
                size="md"
                className="flex-1 font-bold"
                disabled={isSubmitting}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-[2] font-bold"
                disabled={!isFormValid || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Publishing...' : 'Publish Mystery'}
              </Button>
            </div>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
};

export default PuzzleCreatorModal;
