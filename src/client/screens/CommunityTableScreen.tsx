import React, { useEffect } from 'react';
import { EmptyState } from '../components/EmptyState';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { PuzzleCard } from '../components/PuzzleCard';
import type { CommunityPuzzle, User } from '../../shared/types';

interface CommunityTableScreenProps {
  user: User | null;
  puzzles: CommunityPuzzle[];
  loading: boolean;
  onFetchPuzzles: () => void;
  onOpenComposer: () => void;
  onSolvePuzzle: (id: string, answer: string) => Promise<boolean>;
  onLikePuzzle?: (id: string) => void;
  onFavoritePuzzle?: (id: string) => void;
}

export const CommunityTableScreen = ({
  user,
  puzzles,
  loading,
  onFetchPuzzles,
  onOpenComposer,
  onSolvePuzzle,
  onLikePuzzle,
  onFavoritePuzzle,
}: CommunityTableScreenProps) => {
  useEffect(() => {
    onFetchPuzzles();
  }, [onFetchPuzzles]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[#fdfaf2] animate-fade-in">
      {/* Header */}
      <div
        className="flex flex-col px-5 pt-5 pb-4 border-b-2 border-[#2c160a] flex-shrink-0"
        style={{
          backgroundColor: '#f7edd7',
          backgroundImage: 'radial-gradient(var(--color-paper-shadow) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <h2 className="font-serif font-bold text-base text-[#2c160a] leading-tight">🪑 The Community Table</h2>
        <p className="font-serif text-xs text-[#5e463a] italic mt-1 leading-relaxed">
          Cozy mysteries left behind by other visitors. Solve them to gain reputation.
        </p>
      </div>

      {/* Feed Area */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-1">
            <SkeletonLoader type="feed" count={3} />
          </div>
        ) : puzzles.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="📭"
              title="No mysteries pinned"
              message="The board is currently clear. Why not write the first cozy puzzle?"
              actionLabel="✍️ Write a Mystery"
              onAction={onOpenComposer}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4.5 p-5">
            {puzzles.map((puzzle) => (
              <PuzzleCard
                key={puzzle.id}
                puzzle={puzzle}
                isSolved={!!user?.solvedPuzzles?.includes(puzzle.id)}
                isLiked={!!puzzle.likedBy?.includes(user?.id || '')}
                isFavorited={!!user?.favorites?.includes(puzzle.id)}
                onSolve={onSolvePuzzle}
                onLike={onLikePuzzle ? () => onLikePuzzle(puzzle.id) : undefined}
                onFavorite={onFavoritePuzzle ? () => onFavoritePuzzle(puzzle.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default CommunityTableScreen;
