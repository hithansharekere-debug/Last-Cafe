import { useEffect } from 'react';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import type { Contribution, User } from '../../shared/types';

interface CommunityTableScreenProps {
  user: User | null;
  contributions: Contribution[];
  loading: boolean;
  onFetchContributions: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Memory: '💭',
  Advice: '🌿',
  Gratitude: '🙏',
  Recommendation: '📚',
  Secret: '🤫',
  'Time Capsule': '⏳',
};

function formatRelativeTime(timestamp: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestamp;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const CommunityTableScreen = ({
  contributions,
  loading,
  onFetchContributions,
}: CommunityTableScreenProps) => {
  useEffect(() => {
    onFetchContributions();
  }, [onFetchContributions]);

  if (loading) {
    return <LoadingState message="Setting the table…" />;
  }

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto bg-[#fdfaf2]">
      {/* Header */}
      <div
        className="flex flex-col px-4 py-4 border-b-2 border-[#2c160a]"
        style={{ backgroundColor: '#f7edd7' }}
      >
        <h2 className="font-serif font-bold text-base text-[#2c160a]">🪑 The Community Table</h2>
        <p className="font-serif text-xs text-[#5e463a] italic mt-1 leading-relaxed">
          Notes left by visitors before you. Each one cost a cup of coffee.
        </p>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-3 p-4">
        {contributions.length === 0 ? (
          <EmptyState
            icon="📭"
            title="The Table is Empty"
            message="No one has left anything yet. Be the first to leave a note for the next visitor."
          />
        ) : (
          contributions.map((contrib) => (
            <NoteCard key={contrib.id} contribution={contrib} />
          ))
        )}
      </div>
    </div>
  );
};

const NoteCard = ({ contribution }: { contribution: Contribution }) => {
  const icon = CATEGORY_ICONS[contribution.category] ?? '📝';

  return (
    <Card variant="napkin" elevation="low">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{icon}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-[#2c160a] bg-[#fdfaf2] text-[#2c160a]">
            {contribution.category}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#5e463a]">
          {formatRelativeTime(contribution.timestamp)}
        </span>
      </div>

      <p className="font-handwritten text-sm text-[#26140b] leading-relaxed mb-3">
        "{contribution.text}"
      </p>

      <div className="flex items-center gap-1.5 pt-2 border-t border-dashed border-[#c8a285]">
        <span className="font-serif text-[10px] text-[#5e463a] italic">— {contribution.username}</span>
      </div>
    </Card>
  );
};
