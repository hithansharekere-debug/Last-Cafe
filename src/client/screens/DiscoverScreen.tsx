import { useEffect } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { NoteCard } from '../components/NoteCard';
import type { Contribution, User } from '../../shared/types';

interface DiscoverScreenProps {
  user: User | null;
  contributions: Contribution[];
  loading: boolean;
  onFetchContributions: (category: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onLikeNote?: (id: string) => void;
  onFavoriteNote?: (id: string) => void;
  onReadNote?: () => void;
}

const FILTER_OPTIONS: { label: string; value: string; icon: string }[] = [
  { label: 'All', value: 'All', icon: '🗂' },
  { label: 'Newest', value: 'Newest', icon: '🕒' },
  { label: 'Popular', value: 'Popular', icon: '🔥' },
  { label: 'Favorites', value: 'Favorites', icon: '⭐' },
  { label: 'Gratitude', value: 'Gratitude', icon: '🙏' },
  { label: 'Dreams', value: 'Dream', icon: '🌌' },
  { label: 'Advice', value: 'Advice', icon: '🌿' },
  { label: 'Memories', value: 'Memory', icon: '💭' },
  { label: 'Questions', value: 'Question', icon: '❓' },
  { label: 'Secrets', value: 'Secret', icon: '🤫' },
  { label: 'Recs', value: 'Recommendation', icon: '📚' },
  { label: 'Capsules', value: 'Time Capsule', icon: '⏳' },
];

export const DiscoverScreen = ({
  user,
  contributions,
  loading,
  onFetchContributions,
  activeFilter,
  onFilterChange,
  onLikeNote,
  onFavoriteNote,
  onReadNote,
}: DiscoverScreenProps) => {
  // Pull current active filter contributions on mount or when filter changes
  useEffect(() => {
    onFetchContributions(activeFilter);
  }, [onFetchContributions, activeFilter]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[#fdfaf2]">
      {/* Header + filters */}
      <div
        className="flex flex-col px-4 pt-4 pb-3 border-b-2 border-[#2c160a] flex-shrink-0"
        style={{ backgroundColor: '#f7edd7' }}
      >
        <h2 className="font-serif font-bold text-base text-[#2c160a] mb-1">🔍 Discover</h2>
        <p className="font-serif text-xs text-[#5e463a] italic mb-3">
          Browse what visitors have left behind.
        </p>

        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {FILTER_OPTIONS.map(({ label, value, icon }) => {
            const isActive = activeFilter === value;
            return (
              <button
                key={value}
                onClick={() => onFilterChange(value)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#2c160a] font-serif text-xs whitespace-nowrap flex-shrink-0 transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#2c160a] text-[#fdfaf2] shadow-[2px_2px_0px_rgba(44,22,10,0.5)]'
                    : 'bg-[#eeded1] text-[#2c160a] hover:bg-[#c8a285]'
                }`}
              >
                <span className="select-none">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingState message="Searching the shelves…" />
        ) : contributions.length === 0 ? (
          <EmptyState
            icon="🔍"
            title={activeFilter === 'Favorites' ? 'No Favorites Yet' : 'Nothing Found'}
            message={
              activeFilter === 'All'
                ? 'The cafe is waiting for its first visitor.'
                : activeFilter === 'Favorites'
                ? 'Star a note to save it here for easy reading.'
                : `No ${activeFilter.toLowerCase()} notes yet. Be the first to leave one.`
            }
          />
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {contributions.map((contrib) => (
              <NoteCard
                key={contrib.id}
                contribution={contrib}
                isLiked={!!contrib.likedBy?.includes(user?.id || '')}
                isFavorited={!!user?.favorites?.includes(contrib.id)}
                onLike={onLikeNote ? () => onLikeNote(contrib.id) : undefined}
                onFavorite={onFavoriteNote ? () => onFavoriteNote(contrib.id) : undefined}
                onRead={onReadNote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
