import React from 'react';
import { Card } from './Card';
import type { Contribution } from '../../shared/types';

interface NoteCardProps {
  contribution: Contribution;
  isLiked?: boolean | undefined;
  isFavorited?: boolean | undefined;
  onLike?: (() => void) | undefined;
  onFavorite?: (() => void) | undefined;
  onRead?: (() => void) | undefined;
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

const CATEGORY_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Memory: { bg: '#fdfaf2', text: '#d4af37', border: '#d4af37' },
  Advice: { bg: '#e1ead4', text: '#4a7c59', border: '#4a7c59' },
  Gratitude: { bg: '#eeded1', text: '#9b4618', border: '#9b4618' },
  Recommendation: { bg: '#f5ead2', text: '#8e5a36', border: '#8e5a36' },
  Secret: { bg: '#2c160a', text: '#eeded1', border: '#2c160a' },
  'Time Capsule': { bg: '#f2ded0', text: '#cf7929', border: '#cf7929' },
  Dream: { bg: '#e5e0f9', text: '#5b4b9b', border: '#5b4b9b' },
  Question: { bg: '#e0f3f8', text: '#1b6e8a', border: '#1b6e8a' },
};

function formatRelativeTime(timestamp: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestamp;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const NoteCard = ({
  contribution,
  isLiked = false,
  isFavorited = false,
  onLike,
  onFavorite,
  onRead,
}: NoteCardProps) => {
  const [hasRead, setHasRead] = React.useState(false);
  const icon = CATEGORY_ICONS[contribution.category] ?? '📝';
  const palette = CATEGORY_BADGE_COLORS[contribution.category] ?? { bg: '#fdfaf2', text: '#2c160a', border: '#2c160a' };

  // Calculate if newly created (within last 10 seconds)
  const isNew = Math.floor(Date.now() / 1000) - (contribution.createdAt || contribution.timestamp) < 10;

  return (
    <div
      className={isNew ? 'newly-submitted-note rounded' : ''}
      onMouseEnter={() => {
        if (!hasRead && onRead) {
          setHasRead(true);
          onRead();
        }
      }}
    >
      <Card variant="napkin" elevation="low" className="border-2 border-[#2c160a]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base select-none">{icon}</span>
            <span
              className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border font-bold select-none"
              style={{ backgroundColor: palette.bg, color: palette.text, borderColor: palette.border }}
            >
              {contribution.category}
            </span>
          </div>
          <span className="font-mono text-[9px] text-[#5e463a] select-none">
            {formatRelativeTime(contribution.createdAt || contribution.timestamp)}
          </span>
        </div>

        <p className="font-handwritten text-sm text-[#26140b] leading-relaxed mb-3">
          "{contribution.message || contribution.text}"
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#c8a285] text-[10px] text-[#5e463a] font-serif">
          <span className="italic">— {contribution.username}</span>
          <div className="flex items-center gap-2.5 font-mono">
            <span className="select-none">🔥 {contribution.warmthGiven || 1}</span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onLike) onLike();
              }}
              disabled={isLiked || !onLike}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#2c160a] hover:bg-[#eeded1] transition-colors cursor-pointer select-none font-bold ${
                isLiked ? 'bg-[#eeded1] text-[#9b4618] opacity-75' : 'bg-transparent text-[#5e463a]'
              }`}
              style={{ display: 'inline-flex', alignItems: 'center' }}
              title={isLiked ? "You liked this note" : "Like note"}
            >
              <span>{isLiked ? '❤️' : '🤍'}</span>
              <span>{contribution.likes || 0}</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onFavorite) onFavorite();
              }}
              disabled={!onFavorite}
              className={`flex items-center justify-center rounded border border-[#2c160a] hover:bg-[#eeded1] transition-colors cursor-pointer select-none ${
                isFavorited ? 'bg-[#eeded1] text-[#cf7929]' : 'bg-transparent text-[#5e463a]'
              }`}
              style={{ display: 'inline-flex', width: '22px', height: '22px', padding: 0 }}
              title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
            >
              <span>{isFavorited ? '★' : '☆'}</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

