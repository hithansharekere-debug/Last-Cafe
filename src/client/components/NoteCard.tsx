import { Card } from './Card';
import type { Contribution } from '../../shared/types';

interface NoteCardProps {
  contribution: Contribution;
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

export const NoteCard = ({ contribution }: NoteCardProps) => {
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
          {formatRelativeTime(contribution.createdAt || contribution.timestamp)}
        </span>
      </div>

      <p className="font-handwritten text-sm text-[#26140b] leading-relaxed mb-3">
        "{contribution.message || contribution.text}"
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#c8a285] text-[10px] text-[#5e463a] font-serif">
        <span className="italic">— {contribution.username}</span>
        <div className="flex items-center gap-2 font-mono">
          <span>🔥 {contribution.warmthGiven || 1} Warmth</span>
          <span>❤️ {contribution.likes || 0} Likes</span>
        </div>
      </div>
    </Card>
  );
};
