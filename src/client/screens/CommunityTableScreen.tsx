import React, { useEffect } from 'react';
import { EmptyState } from '../components/EmptyState';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { PuzzleCard } from '../components/PuzzleCard';
import { PageTitle } from '../components/Typography';
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
    <div className="flex flex-col w-full h-full overflow-hidden bg-[var(--color-parchment)] animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', whiteSpace: 'nowrap', marginBottom: '8px' }}>
          <span style={{ fontSize: '26px', lineHeight: 1 }} className="select-none">🪑</span>
          <PageTitle>Community Table</PageTitle>
        </div>
        <p className="font-sans text-xs text-[var(--color-text-muted)] italic leading-relaxed" style={{ margin: '0 0 12px 0' }}>
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
          <div className="p-lg">
            <EmptyState
              icon="📭"
              title="No mysteries pinned"
              message="The board is currently clear. Why not write the first cozy puzzle?"
              actionLabel="✍️ Write a Mystery"
              onAction={onOpenComposer}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4.5 p-lg">
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
