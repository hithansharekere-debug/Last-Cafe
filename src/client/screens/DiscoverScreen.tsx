import { useEffect } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PuzzleCard } from '../components/PuzzleCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import type { CommunityPuzzle, User } from '../../shared/types';

interface DiscoverScreenProps {
  user: User | null;
  puzzles: CommunityPuzzle[];
  loading: boolean;
  onFetchPuzzles: (category: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onSolvePuzzle: (id: string, answer: string) => Promise<boolean>;
  onLikePuzzle?: (id: string) => void;
  onFavoritePuzzle?: (id: string) => void;
}

const FILTER_OPTIONS: { label: string; value: string; icon: string }[] = [
  { label: 'All', value: 'All', icon: '🗂' },
  { label: 'Easy', value: 'Easy', icon: '🟢' },
  { label: 'Medium', value: 'Medium', icon: '🟡' },
  { label: 'Hard', value: 'Hard', icon: '🔴' },
  { label: 'Riddles', value: 'Riddle', icon: '🧩' },
  { label: 'Hidden Word', value: 'Hidden Word', icon: '🔍' },
  { label: 'Ciphers', value: 'Cipher', icon: '🔑' },
  { label: 'Patterns', value: 'Number Pattern', icon: '🔢' },
  { label: 'Logic', value: 'Logic Puzzle', icon: '🧠' },
  { label: 'Detective', value: 'Detective Story', icon: '🕵️‍♂️' },
  { label: 'Fill Blanks', value: 'Fill in the Blank', icon: '📝' },
  { label: 'Favorites', value: 'Favorites', icon: '⭐' },
];

export const DiscoverScreen = ({
  user,
  puzzles,
  loading,
  onFetchPuzzles,
  activeFilter,
  onFilterChange,
  onSolvePuzzle,
  onLikePuzzle,
  onFavoritePuzzle,
}: DiscoverScreenProps) => {
  useEffect(() => {
    onFetchPuzzles(activeFilter);
  }, [onFetchPuzzles, activeFilter]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[var(--color-parchment)] animate-fade-in">
      {/* Header + filters */}
      <div
        className="flex flex-col px-5 pt-5 pb-4 border-b-2 border-[var(--color-border-dark)] flex-shrink-0"
        style={{
          backgroundColor: 'var(--color-cream)',
          backgroundImage: 'radial-gradient(var(--color-paper-shadow) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <h2 className="font-sans font-bold text-lg text-[var(--color-dark-walnut)] mb-1">🔍 Discover Feed</h2>
        <p className="font-sans text-xs text-[var(--color-text-muted)] italic mb-3">
          Explore templates-based puzzles posted by players around the world.
        </p>

        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {FILTER_OPTIONS.map(({ label, value, icon }) => {
            const isActive = activeFilter === value;
            return (
              <button
                key={value}
                onClick={() => onFilterChange(value)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-[var(--color-border-dark)] font-sans text-xs whitespace-nowrap flex-shrink-0 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-border-dark)] text-[var(--color-text-light)] shadow-[0_3px_0px_var(--color-caramel)] scale-[1.02]'
                    : 'bg-[var(--color-cream)] text-[var(--color-text-dark)] hover:bg-[var(--color-paper-shadow)] hover:scale-[1.01]'
                }`}
              >
                <span className="select-none text-sm">{icon}</span>
                <span className="font-bold">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-1">
            <SkeletonLoader type="feed" count={3} />
          </div>
        ) : puzzles.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={activeFilter === 'Favorites' ? '⭐' : '🔍'}
              title={activeFilter === 'Favorites' ? 'No Favorites Yet' : 'Quiet Shelves'}
              message={
                activeFilter === 'All'
                  ? 'No community puzzles found on the mystery wall today.'
                  : activeFilter === 'Favorites'
                  ? 'Tap the star icon on any mystery card to save it here.'
                  : `No entries found under the ${activeFilter.toLowerCase()} category.`
              }
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
export default DiscoverScreen;
