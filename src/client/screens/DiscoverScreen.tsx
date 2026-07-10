import { useEffect } from 'react';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { CONTRIBUTION_CATEGORIES } from '../../shared/constants';
import type { Contribution } from '../../shared/types';

interface DiscoverScreenProps {
  contributions: Contribution[];
  loading: boolean;
  onFetchContributions: (category: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const FILTER_OPTIONS: { label: string; value: string; icon: string }[] = [
  { label: 'All', value: 'All', icon: '🗂' },
  { label: 'Memories', value: 'Memory', icon: '💭' },
  { label: 'Advice', value: 'Advice', icon: '🌿' },
  { label: 'Gratitude', value: 'Gratitude', icon: '🙏' },
  { label: 'Recs', value: 'Recommendation', icon: '📚' },
  { label: 'Secrets', value: 'Secret', icon: '🤫' },
  { label: 'Capsules', value: 'Time Capsule', icon: '⏳' },
];

function formatRelativeTime(timestamp: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestamp;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const CATEGORY_PALETTE: Record<string, { bg: string; text: string; border: string }> = {
  Memory: { bg: '#d4af37', text: '#fdfaf2', border: '#2c160a' },
  Advice: { bg: '#4a7c59', text: '#fdfaf2', border: '#2c160a' },
  Gratitude: { bg: '#8e5a36', text: '#fdfaf2', border: '#2c160a' },
  Recommendation: { bg: '#5c371d', text: '#fdfaf2', border: '#2c160a' },
  Secret: { bg: '#2c160a', text: '#c8a285', border: '#c8a285' },
  'Time Capsule': { bg: '#9b4618', text: '#fdfaf2', border: '#2c160a' },
};

export const DiscoverScreen = ({
  contributions,
  loading,
  onFetchContributions,
  activeFilter,
  onFilterChange,
}: DiscoverScreenProps) => {
  // Pull current active filter contributions on mount
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
            title="Nothing Found"
            message={
              activeFilter === 'All'
                ? 'The cafe is waiting for its first visitor.'
                : `No ${activeFilter.toLowerCase()} notes yet. Be the first to leave one.`
            }
          />
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {contributions.map((contrib) => (
              <DiscoverCard key={contrib.id} contribution={contrib} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DiscoverCard = ({ contribution }: { contribution: Contribution }) => {
  const palette = CATEGORY_PALETTE[contribution.category] ?? {
    bg: '#5c371d',
    text: '#fdfaf2',
    border: '#2c160a',
  };

  return (
    <Card variant="parchment" elevation="low">
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: palette.bg }} />
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border font-bold select-none"
            style={{ backgroundColor: palette.bg, color: palette.text, borderColor: palette.border }}
          >
            {contribution.category}
          </span>
          <span className="font-mono text-[10px] text-[#5e463a] select-none">
            {formatRelativeTime(contribution.createdAt || contribution.timestamp)}
          </span>
        </div>

        <p className="font-handwritten text-sm text-[#26140b] leading-relaxed">
          "{contribution.message || contribution.text}"
        </p>

        {contribution.category === CONTRIBUTION_CATEGORIES.TIME_CAPSULE && contribution.targetDate !== undefined && (
          <p className="font-serif text-[10px] text-[#9b4618] italic select-none">
            ⏳ Opened on {new Date(contribution.targetDate * 1000).toLocaleDateString()}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#c8a285] text-[10px] text-[#5e463a] font-serif">
          <span className="italic">— {contribution.username}</span>
          <div className="flex items-center gap-2 font-mono select-none">
            <span>🔥 {contribution.warmthGiven || 1}</span>
            <span>❤️ {contribution.likes || 0}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
