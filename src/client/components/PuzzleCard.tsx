import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import type { CommunityPuzzle } from '../../shared/types';

interface PuzzleCardProps {
  puzzle: CommunityPuzzle;
  isSolved: boolean;
  isLiked: boolean;
  isFavorited: boolean;
  onSolve: (id: string, answer: string) => Promise<boolean>;
  onLike?: (() => void) | undefined;
  onFavorite?: (() => void) | undefined;
}

const TEMPLATE_ICONS: Record<string, string> = {
  Riddle: '🧩',
  'Hidden Word': '🔍',
  Cipher: '🔑',
  'Number Pattern': '🔢',
  'Logic Puzzle': '🧠',
  'Detective Story': '🕵️‍♂️',
  'Fill in the Blank': '📝',
};

const DIFFICULTY_COLORS = {
  Easy: { bg: '#e1ead4', text: '#4a7c59', border: '#4a7c59' },
  Medium: { bg: '#fdfaf2', text: '#d4af37', border: '#d4af37' },
  Hard: { bg: '#eeded1', text: '#9b4618', border: '#9b4618' },
};

function formatRelativeTime(timestamp: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestamp;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const PuzzleCard = ({
  puzzle,
  isSolved,
  isLiked,
  isFavorited,
  onSolve,
  onLike,
  onFavorite,
}: PuzzleCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [solveError, setSolveError] = useState<string | null>(null);
  
  const [tiltAngle] = useState(() => (Math.random() * 2 - 1).toFixed(2));
  const diffStyle = DIFFICULTY_COLORS[puzzle.difficulty] || DIFFICULTY_COLORS.Easy;
  const icon = TEMPLATE_ICONS[puzzle.category] || '🧩';

  const handleSolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || isSolving) return;
    
    setIsSolving(true);
    setSolveError(null);
    try {
      const success = await onSolve(puzzle.id, userAnswer.trim());
      if (!success) {
        setSolveError('Incorrect answer. The mystery remains unsolved...');
      } else {
        setUserAnswer('');
      }
    } catch {
      setSolveError('Failed to submit answer. Try again.');
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div
      className="transition-all duration-300 relative"
      style={{
        transform: isExpanded ? 'rotate(0deg) scale(1.01)' : `rotate(${tiltAngle}deg)`,
        zIndex: isExpanded ? 50 : 10,
      }}
      onMouseEnter={(e) => {
        if (!isExpanded) {
          e.currentTarget.style.transform = 'rotate(0deg) scale(1.015)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isExpanded) {
          e.currentTarget.style.transform = `rotate(${tiltAngle}deg)`;
        }
      }}
    >
      <Card variant="napkin" elevation="high" className="border-2 border-[#2c160a] pt-7 pb-4 px-5">
        {/* Corkboard pin */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-sm z-10 drop-shadow-sm select-none">
          📌
        </div>

        {/* Top details row */}
        <div className="flex items-center justify-between mb-2 select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{icon}</span>
            <span className="font-serif text-[10px] font-bold text-[#2c160a]">{puzzle.category}</span>
            <span
              className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border-2 font-bold"
              style={{ backgroundColor: diffStyle.bg, color: diffStyle.text, borderColor: diffStyle.border }}
            >
              {puzzle.difficulty}
            </span>
          </div>
          <span className="font-mono text-[9px] text-[#5e463a] font-bold">
            {formatRelativeTime(puzzle.createdAt)}
          </span>
        </div>

        {/* Puzzle Title */}
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-serif font-bold text-sm text-[#2c160a]">
            {puzzle.title}
          </h3>
          {isSolved && (
            <span className="bg-[#e1ead4] text-[#4a7c59] border border-[#4a7c59] font-mono text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm select-none">
              ✅ Solved
            </span>
          )}
        </div>

        <p className="font-serif text-[10px] text-[#5e463a] mb-3">
          Pinned by <strong className="text-[#2c160a]">{puzzle.creatorName}</strong> · {puzzle.solveCount || 0} Solves
        </p>

        {/* Toggle drawer button */}
        <div className="mb-3">
          <Button
            variant={isSolved ? 'outline' : 'secondary'}
            size="sm"
            fullWidth
            onClick={() => setIsExpanded(!isExpanded)}
            className="cursor-pointer font-bold"
          >
            {isExpanded ? 'Hide Mystery ↑' : isSolved ? 'Review Puzzle' : 'Solve Mystery 💡'}
          </Button>
        </div>

        {/* Expanded puzzle solve drawer */}
        {isExpanded && (
          <div className="border-t border-dashed border-[#c8a285] pt-3 mt-1.5 animate-fade-in flex flex-col gap-3">
            {/* Setup Context */}
            {puzzle.description && (
              <p className="font-serif text-[11px] text-[#5e463a] italic leading-relaxed">
                {puzzle.description}
              </p>
            )}

            {/* Puzzle clue box */}
            <div className="bg-[#eeded1]/40 border-2 border-[#2c160a] rounded-lg p-3.5 relative">
              <p className="font-handwritten text-sm text-[#26140b] leading-relaxed select-text whitespace-pre-wrap">
                {puzzle.puzzleText}
              </p>
            </div>

            {/* Solve Form / Already Solved state */}
            {isSolved ? (
              <div className="p-3 bg-[#e1ead4] border-2 border-[#4a7c59] rounded-lg text-center font-serif text-xs text-[#2e4d37] select-none font-bold">
                🎉 Mystery Solved! Correct answer was: <strong className="font-mono text-[#4a7c59] uppercase">{puzzle.answer}</strong>
              </div>
            ) : (
              <form onSubmit={handleSolveSubmit} className="flex flex-col gap-3.5">
                {/* Hint accordion */}
                {puzzle.hint && (
                  <div>
                    {showHint ? (
                      <div className="p-2.5 bg-[#fdfaf2] border-2 border-dashed border-[#c8a285] rounded-md font-serif text-[10px] text-[#5e463a] leading-normal">
                        💡 <strong>Hint:</strong> {puzzle.hint}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowHint(true)}
                        className="font-serif text-[10px] text-[#cf7929] italic underline hover:text-[#2c160a] select-none cursor-pointer"
                      >
                        Reveal Hint...
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => {
                      setUserAnswer(e.target.value);
                      if (solveError) setSolveError(null);
                    }}
                    placeholder="Enter answer..."
                    maxLength={50}
                    className="flex-grow rounded-md border-2 border-[#2c160a] px-3 py-2 font-serif text-xs bg-[#fdfaf2] text-[#26140b] focus:outline-none focus:border-[#cf7929]"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!userAnswer.trim() || isSolving}
                    className="cursor-pointer font-bold"
                  >
                    {isSolving ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
                {solveError && (
                  <p className="text-[10px] text-[#cf7929] font-serif italic text-center font-bold">
                    {solveError}
                  </p>
                )}
              </form>
            )}
          </div>
        )}

        {/* Footer controls row */}
        <div className="flex items-center justify-between pt-2.5 border-t border-dashed border-[#c8a285] text-[10px] text-[#5e463a] font-serif select-none mt-1">
          <span className="italic font-bold">The Last Cafe</span>
          <div className="flex items-center gap-2 font-mono">
            {onLike && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike();
                }}
                disabled={isLiked}
                className={`flex items-center gap-1 px-2 py-1 rounded-md border-2 border-[#2c160a] hover:bg-[#eeded1] transition-colors cursor-pointer select-none font-bold shadow-[1.5px_1.5px_0px_#2c160a] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none ${
                  isLiked ? 'bg-[#eeded1] text-[#9b4618] opacity-75 shadow-none' : 'bg-transparent text-[#5e463a]'
                }`}
                title={isLiked ? "Liked" : "Like puzzle"}
              >
                <span>{isLiked ? '❤️' : '🤍'}</span>
                <span>{puzzle.likes || 0}</span>
              </button>
            )}

            {onFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite();
                }}
                className={`flex items-center justify-center rounded-md border-2 border-[#2c160a] hover:bg-[#eeded1] transition-colors cursor-pointer select-none shadow-[1.5px_1.5px_0px_#2c160a] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none ${
                  isFavorited ? 'bg-[#eeded1] text-[#cf7929]' : 'bg-transparent text-[#5e463a]'
                }`}
                style={{ width: '26px', height: '26px', padding: 0 }}
                title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
              >
                <span className="text-xs">{isFavorited ? '★' : '☆'}</span>
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
export default PuzzleCard;
