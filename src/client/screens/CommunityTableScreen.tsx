import React, { useEffect } from 'react';
import { EmptyState } from '../components/EmptyState';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { PageTitle } from '../components/Typography';
import type { Contribution, User } from '../../shared/types';

interface CommunityTableScreenProps {
  user: User | null;
  contributions: Contribution[];
  loading: boolean;
  onFetchContributions: () => void;
  onOpenComposer: () => void;
  onLikeNote: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Memory: '💭',
  Advice: '🌿',
  Gratitude: '🙏',
  Recommendation: '📚',
  Secret: '🤫',
  'Time Capsule': '⏳',
  Dream: '🌌',
  Question: '❓',
};

function formatRelativeTime(timestamp: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestamp;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const CommunityTableScreen = ({
  user,
  contributions,
  loading,
  onFetchContributions,
  onOpenComposer,
  onLikeNote,
}: CommunityTableScreenProps) => {
  useEffect(() => {
    onFetchContributions();
  }, [onFetchContributions]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[var(--color-parchment)] animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', whiteSpace: 'nowrap', marginBottom: '8px' }}>
          <span style={{ fontSize: '26px', lineHeight: 1 }} className="select-none">🪑</span>
          <PageTitle>Community Table</PageTitle>
        </div>
        <p className="font-sans text-xs text-[var(--color-text-muted)] italic leading-relaxed" style={{ margin: '0 0 12px 0' }}>
          A cozy guestbook notes wall. Share warm thoughts, coffee recommendations, or secrets.
        </p>
      </div>

      {/* Feed Area */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-1">
            <SkeletonLoader type="feed" count={3} />
          </div>
        ) : contributions.length === 0 ? (
          <div className="p-lg">
            <EmptyState
              icon="☕"
              title="The café is quiet today."
              message="Be the first visitor to leave a warm thought."
              actionLabel="✍️ Leave a Note"
              onAction={onOpenComposer}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-5 p-lg max-w-[800px] mx-auto w-full">
            {contributions.map((note) => {
              const isLiked = !!note.likedBy?.includes(user?.id || '');
              return (
                <div
                  key={note.id}
                  className="p-5 rounded-[20px] border-2 border-[#8D6846]/40 bg-[#FBF6EE] shadow-md hover:translate-y-[-2px] transition-all duration-150 flex flex-col gap-4 text-left"
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-2 select-none">
                    <span className="text-lg">{CATEGORY_ICONS[note.category] || '📝'}</span>
                    <span className="font-sans font-bold text-[13px] text-[#8D6846] uppercase tracking-wider">
                      {note.category}
                    </span>
                  </div>

                  {/* Note text */}
                  <p className="font-handwritten text-[18px] text-[#4B3528] leading-relaxed my-1 select-text">
                    "{note.message || note.text}"
                  </p>

                  {/* Author and Metadata row */}
                  <div className="flex justify-between items-center border-t border-dashed border-[#8D6846]/20 pt-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-sans text-[14px] text-[#8D6846] font-medium truncate">
                        — {note.username}
                      </span>
                      <span className="font-sans text-[10px] bg-[#C6965A]/15 text-[#C6965A] border border-[#C6965A]/30 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider select-none">
                        Visitor
                      </span>
                    </div>
                    <span className="font-sans text-[12px] text-[#8D6846]/70 whitespace-nowrap">
                      {formatRelativeTime(note.createdAt || note.timestamp)}
                    </span>
                  </div>

                  {/* Actions / Warmth counter row */}
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-1 text-[#C97464] font-mono text-[14px] font-bold select-none">
                      <span>❤️</span>
                      <span>{note.likes || 0}</span>
                    </div>

                    <button
                      onClick={() => onLikeNote(note.id)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 font-bold text-[12px] font-sans transition-all duration-150 select-none cursor-pointer ${
                        isLiked
                          ? 'bg-[#C97464] border-[#9E5345] text-white shadow-sm'
                          : 'bg-transparent border-[#8D6846] text-[#8D6846] hover:bg-[#F4E8D5]'
                      }`}
                    >
                      <span>🔥</span>
                      <span>{isLiked ? 'Warmed' : 'Warm'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityTableScreen;
