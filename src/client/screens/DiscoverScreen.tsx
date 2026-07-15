import { useEffect } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PuzzleCard } from '../components/PuzzleCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { PageTitle } from '../components/Typography';
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
  onEditPuzzle?: (puzzle: CommunityPuzzle) => void;
  onDeletePuzzle: (id: string) => void;
  onOpenComposer: () => void;
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
  onEditPuzzle,
  onDeletePuzzle,
  onOpenComposer,
}: DiscoverScreenProps) => {
  useEffect(() => {
    onFetchPuzzles(activeFilter);
  }, [onFetchPuzzles, activeFilter]);

  // Derived creators statistics
  const myMysteries = puzzles.filter((p) => p.creatorId === user?.id && !p.isDeleted);
  const featuredPuzzle = puzzles.find((p) => !p.isDeleted && p.creatorId !== user?.id);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[var(--color-parchment)] animate-fade-in">
      {/* Header + filters */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', whiteSpace: 'nowrap', marginBottom: '8px' }}>
          <span style={{ fontSize: '26px', lineHeight: 1 }} className="select-none">🔎</span>
          <PageTitle>Discover</PageTitle>
        </div>
        <p className="font-sans text-xs text-[var(--color-text-muted)] italic leading-relaxed" style={{ margin: '0 0 12px 0' }}>
          Explore templates-based puzzles posted by players around the world.
        </p>

        <div className="flex gap-1.5 overflow-x-auto pb-1 mt-3.5" style={{ scrollbarWidth: 'none' }}>
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-6 pb-8">
        
        {/* Create Mystery Section */}
        <div className="px-lg pt-2 select-none">
          <button
            onClick={onOpenComposer}
            className="w-full py-3.5 rounded-xl border-2 border-dashed border-[#8D6846] bg-[#FBF6EE] hover:bg-[#F4E8D5] text-[#8D6846] font-sans font-bold text-[15px] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:translate-y-[-1px]"
          >
            <span>✏️</span> Create Mystery
          </button>
        </div>

        {/* Today's Featured Mystery */}
        {featuredPuzzle && (
          <div className="flex flex-col gap-3 px-lg select-none">
            <h3 className="font-sans font-bold text-xs text-[var(--color-dark-walnut)] uppercase tracking-wider px-1">
              🌟 Today's Featured Mystery
            </h3>
            <PuzzleCard
              puzzle={featuredPuzzle}
              isSolved={!!user?.solvedPuzzles?.includes(featuredPuzzle.id)}
              isLiked={!!featuredPuzzle.likedBy?.includes(user?.id || '')}
              isFavorited={!!user?.favorites?.includes(featuredPuzzle.id)}
              onSolve={onSolvePuzzle}
              onLike={onLikePuzzle ? () => onLikePuzzle(featuredPuzzle.id) : undefined}
              onFavorite={onFavoritePuzzle ? () => onFavoritePuzzle(featuredPuzzle.id) : undefined}
              isOwner={user?.id === featuredPuzzle.creatorId}
              onEdit={onEditPuzzle ? () => onEditPuzzle(featuredPuzzle) : undefined}
            />
          </div>
        )}

        {/* My Mysteries Summary Card & Section */}
        <div className="flex flex-col gap-4 px-lg">
          <h3 className="font-sans font-bold text-xs text-[var(--color-dark-walnut)] uppercase tracking-wider px-1">
            👤 My Mysteries
          </h3>

          {/* Summary Card */}
          <div className="p-5 rounded-2xl border-2 border-[#8D6846]/40 bg-[#FBF6EE] shadow-sm flex flex-col sm:flex-row justify-between gap-4 select-none">
            <div className="flex flex-col gap-1">
              <span className="font-sans text-xs text-[#8D6846] uppercase font-bold tracking-wider">
                Published
              </span>
              <span className="font-sans font-bold text-[22px] text-[#4B3528]">
                {myMysteries.length}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-sans text-xs text-[#8D6846] uppercase font-bold tracking-wider">
                Total Solves
              </span>
              <span className="font-sans font-bold text-[22px] text-[#4B3528]">
                {myMysteries.reduce((sum, p) => sum + (p.solveCount || 0), 0)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-sans text-xs text-[#8D6846] uppercase font-bold tracking-wider">
                Community Warmth
              </span>
              <span className="font-sans font-bold text-[22px] text-[#C97464] flex items-center gap-1">
                ❤️ {myMysteries.reduce((sum, p) => sum + (p.likes || 0), 0)}
              </span>
            </div>
          </div>

          {/* My Mysteries List */}
          {myMysteries.length === 0 ? (
            <p className="text-center italic text-[#8D6846]/60 text-xs py-3 select-none">
              You haven't written any mysteries yet. Click above to write your first!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {myMysteries.map((p) => {
                const editsRemaining = 3 - (p.editCount || 0);
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-[#8D6846]/30 bg-[#FBF6EE] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-sans font-bold text-[16px] text-[#4B3528] truncate block">
                          {p.title}
                        </span>
                        <span className="font-sans text-[10px] bg-[#AEB48D]/25 text-[#3B271C] border border-[#98A27A]/30 px-2 py-0.5 rounded-full select-none font-bold uppercase tracking-wider">
                          {p.difficulty}
                        </span>
                        <span className="font-sans text-[10px] bg-[#98A27A]/20 text-[#3B271C] border border-[#98A27A]/40 px-2 py-0.5 rounded-full select-none font-bold uppercase tracking-wider">
                          Published
                        </span>
                      </div>
                      <p className="font-sans text-[12px] text-[#8D6846] leading-relaxed">
                        Created: <span className="font-mono">{new Date(p.createdAt * 1000).toLocaleDateString()}</span> · {p.solveCount || 0} solves · ❤️ {p.likes || 0} warmth
                      </p>
                      <p className="font-sans text-[11px] text-[#8D6846]/70 italic mt-0.5 select-none">
                        Edits Remaining: {editsRemaining} / 3
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={onEditPuzzle ? () => onEditPuzzle(p) : undefined}
                        disabled={editsRemaining <= 0}
                        className="px-3.5 py-1.5 rounded-lg border-2 border-[#8D6846] text-[#8D6846] hover:bg-[#F4E8D5] text-[12px] font-sans font-bold transition-all select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${p.title}"?`)) {
                            onDeletePuzzle(p.id);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-lg border-2 border-[#C97464] text-[#C97464] hover:bg-[#EEDAD0] text-[12px] font-sans font-bold transition-all select-none cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Community Mysteries Feed Section */}
        <div className="flex flex-col gap-4 px-lg">
          <h3 className="font-sans font-bold text-xs text-[var(--color-dark-walnut)] uppercase tracking-wider px-1">
            🧩 Community Mysteries
          </h3>
          
          {loading ? (
            <div className="p-1">
              <SkeletonLoader type="feed" count={3} />
            </div>
          ) : puzzles.length === 0 ? (
            <div className="p-0">
              <EmptyState
                icon={activeFilter === 'Favorites' ? '⭐' : '🔍'}
                title={activeFilter === 'Favorites' ? 'No Favorites Yet' : 'Quiet Shelves'}
                message={
                  activeFilter === 'All'
                    ? 'No community puzzles found on the mystery wall today.'
                    : activeFilter === 'Favorites'
                    ? "Puzzles you mark as favorite will show up here."
                    : `No community puzzles matching "${activeFilter}" category yet.`
                }
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4.5">
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
                  isOwner={user?.id === puzzle.creatorId}
                  onEdit={onEditPuzzle ? () => onEditPuzzle(puzzle) : undefined}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DiscoverScreen;
