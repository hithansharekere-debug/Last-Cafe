import React, { useState } from 'react';
import type { CommunityPuzzle } from '../../shared/types';

interface PuzzleCardProps {
  puzzle: CommunityPuzzle;
  isSolved: boolean;
  isLiked: boolean;
  isFavorited: boolean;
  onSolve: (id: string, answer: string) => Promise<boolean>;
  onLike?: (() => void) | undefined;
  onFavorite?: (() => void) | undefined;
  isOwner?: boolean;
  onEdit?: (() => void) | undefined;
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
  Easy: { bg: '#AEB48D', border: '#98A27A', text: '#3B271C' },
  Medium: { bg: '#F7E9D3', border: '#D9A441', text: '#3B271C' },
  Hard: { bg: '#EEDAD0', border: '#C97464', text: '#3B271C' },
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
  isOwner = false,
  onEdit,
}: PuzzleCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [solveError, setSolveError] = useState<string | null>(null);
  
  const diffStyle = DIFFICULTY_COLORS[puzzle.difficulty as keyof typeof DIFFICULTY_COLORS] || DIFFICULTY_COLORS.Easy;
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
    <div className="cozy-mystery-card-wrapper relative" style={{ zIndex: isExpanded ? 50 : 10 }}>
      <div className="cozy-mystery-card p-6 relative">
        {/* Corkboard pin */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-sm z-10 drop-shadow-sm select-none">
          📌
        </div>

        {/* Top details row */}
        <div className="flex items-center justify-between mb-4 select-none">
          {/* Left: Category Badge & Difficulty Pill */}
          <div className="flex items-center gap-3">
            {/* Category Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#8D6846]/30 bg-[#F7E9D3] text-[#4B3528]">
              <span className="text-sm select-none">{icon}</span>
              <span className="font-sans text-[12px] font-bold">{puzzle.category}</span>
            </div>

            {/* Difficulty Pill */}
            <span
              className="font-sans text-[12px] uppercase tracking-wider px-3.5 py-1.5 rounded-full border-2 font-bold leading-none"
              style={{
                backgroundColor: diffStyle.bg,
                borderColor: diffStyle.border,
                color: diffStyle.text,
              }}
            >
              {puzzle.difficulty}
            </span>
          </div>

          {/* Right: Created At time & Optional Edited badge */}
          <div className="text-right flex flex-col items-end select-none">
            <span className="font-mono text-[13px] text-[#8D6846] font-bold">
              {formatRelativeTime(puzzle.createdAt)}
            </span>
            {puzzle.editCount && puzzle.editCount > 0 ? (
              <span className="font-sans text-[10px] text-[#D9A441] italic font-bold mt-0.5" title="Last revised recently">
                ✏️ revised
              </span>
            ) : null}
          </div>
        </div>

        {/* Puzzle Title & Solved Checkmark */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-sans font-bold text-[22px] text-[#4B3528] leading-tight">
            {puzzle.title}
          </h3>
          {isSolved && (
            <span className="bg-[#AEB48D] text-[#3B271C] border-2 border-[#98A27A] font-sans text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm select-none">
              ✅ Solved
            </span>
          )}
        </div>

        {/* Metadata */}
        <p className="text-[15px] text-[#8D6846] mb-4">
          Pinned by <strong className="text-[#4B3528]">{puzzle.creatorName}</strong> · {puzzle.solveCount || 0} Solves
        </p>

        {/* Toggle Drawer / Solve Button & Edit Button */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="solve-mystery-btn"
            style={{ flex: isOwner ? '2' : '1' }}
          >
            {isExpanded ? 'Hide Mystery ↑' : isSolved ? 'Review Puzzle' : 'Solve Mystery 💡'}
          </button>

          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onEdit) onEdit();
              }}
              disabled={(puzzle.editCount || 0) >= 3}
              className="flex-1 h-11 rounded-xl border-2 border-[#8D6846] bg-[#FBF6EE] hover:bg-[#F4E8D5]/50 text-[#4B3528] font-sans font-bold text-[13px] flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title={(puzzle.editCount || 0) >= 3 ? "Mysteries can only be revised three times to preserve the integrity of community puzzles." : "Edit this mystery"}
            >
              <span>✏️</span>
              <span>Edit</span>
            </button>
          )}
        </div>

        {/* Expanded puzzle solve drawer */}
        {isExpanded && (
          <div className="border-t border-dashed border-[#8D6846]/30 pt-4 mt-2 animate-fade-in flex flex-col gap-4">
            {/* Setup Context */}
            {puzzle.description && (
              <p className="text-[18px] text-[#4B3528] italic leading-relaxed whitespace-pre-wrap">
                {puzzle.description}
              </p>
            )}

            {/* Puzzle clue box */}
            <div className="bg-[#eeded1]/40 border-2 border-[#8D6846] rounded-xl p-4 relative">
              <p className="font-sans text-[16px] text-[#4B3528] leading-relaxed select-text whitespace-pre-wrap">
                {puzzle.puzzleText}
              </p>
            </div>

            {/* Solve Form / Already Solved state */}
            {isSolved ? (
              <div className="p-4 bg-[#AEB48D]/20 border-2 border-[#98A27A] rounded-xl text-center text-[15px] text-[#3B271C] select-none font-bold">
                🎉 Mystery Solved! Correct answer was: <strong className="font-mono text-[#3B271C] uppercase">{puzzle.answer}</strong>
              </div>
            ) : (
              <form onSubmit={handleSolveSubmit} className="flex flex-col gap-4">
                {/* Hint accordion */}
                {puzzle.hint && (
                  <div>
                    {showHint ? (
                      <div className="p-3.5 bg-[#FBF6EE] border-2 border-dashed border-[#8D6846]/40 rounded-xl text-[14px] text-[#8D6846] leading-relaxed">
                        💡 <strong>Hint:</strong> {puzzle.hint}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowHint(true)}
                        className="text-[13px] text-[#D9A441] italic underline hover:text-[#4B3528] select-none cursor-pointer"
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
                    className="flex-grow rounded-xl border-2 border-[#8D6846] px-4 py-2 text-[14px] bg-[#FBF6EE] text-[#4B3528] focus:outline-none focus:border-[#D9A441]"
                  />
                  <button
                    type="submit"
                    disabled={!userAnswer.trim() || isSolving}
                    className="px-6 py-2 rounded-xl bg-[#6B4B35] text-[#FBF6EE] font-bold text-[14px] border-2 border-[#3E291E] hover:bg-[#4B3528] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSolving ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
                {solveError && (
                  <p className="text-[13px] text-[#C97464] italic text-center font-bold">
                    {solveError}
                  </p>
                )}
              </form>
            )}
          </div>
        )}

        {/* Footer controls row */}
        <div className="flex items-center justify-between pt-4 border-t border-dashed border-[#8D6846]/30 select-none mt-4">
          <span className="italic font-bold text-[13px] text-[#8D6846]">The Last Cafe</span>
          <div className="flex items-center gap-3">
            {onLike && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike();
                }}
                disabled={isLiked}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#8D6846] transition-all cursor-pointer font-sans font-bold text-[13px] ${
                  isLiked ? 'bg-[#AEB48D]/20 text-[#3B271C] border-[#98A27A]' : 'bg-[#FBF6EE] text-[#4B3528] hover:bg-[#F4E8D5]/50'
                }`}
                title={isLiked ? "Liked" : "Like puzzle"}
              >
                <span>{isLiked ? '❤️' : '🤍'}</span>
                <span>{puzzle.likes || 0} Likes</span>
              </button>
            )}

            {onFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#8D6846] transition-all cursor-pointer font-sans font-bold text-[13px] ${
                  isFavorited ? 'bg-[#AEB48D]/20 text-[#3B271C] border-[#98A27A]' : 'bg-[#FBF6EE] text-[#4B3528] hover:bg-[#F4E8D5]/50'
                }`}
                title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
              >
                <span className="text-xs">{isFavorited ? '★' : '☆'}</span>
                <span>{isFavorited ? 'Bookmarked' : 'Bookmark'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PuzzleCard;
