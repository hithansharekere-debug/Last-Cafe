import { useEffect } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { NoteCard } from '../components/NoteCard';
import type { Contribution } from '../../shared/types';

interface CommunityTableScreenProps {
  contributions: Contribution[];
  loading: boolean;
  onFetchContributions: () => void;
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
            message="The cafe is quiet today. Why not leave the first note?"
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
