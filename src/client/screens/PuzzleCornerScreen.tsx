import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import type { LeaderboardEntry } from '../../shared/types';

interface PuzzleCornerScreenProps {
  pbTimeMs: number | null;
  leaderboard: LeaderboardEntry[];
  onFetchLeaderboard: (puzzleId?: string) => void;
}

export const PuzzleCornerScreen = ({
  pbTimeMs,
  leaderboard,
  onFetchLeaderboard,
}: PuzzleCornerScreenProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    onFetchLeaderboard('tangram_daily');
    setIsLoading(false);
  }, [onFetchLeaderboard]);

  if (isLoading) {
    return <LoadingState message="Setting up the puzzle corner…" />;
  }

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto bg-[#fdfaf2]">
      {/* Header */}
      <div
        className="flex flex-col px-4 py-4 border-b-2 border-[#2c160a]"
        style={{ backgroundColor: '#f7edd7' }}
      >
        <h2 className="font-serif font-bold text-base text-[#2c160a] mb-1">🧩 Puzzle Corner</h2>
        <p className="font-serif text-xs text-[#5e463a] italic leading-relaxed">
          A daily Tangram puzzle. Rearrange the wooden pieces, stay calm, find the shape.
          No rush — the tea is still warm.
        </p>
      </div>

      {/* Tangram board - Disabled cleanly */}
      <div className="p-4 pb-2">
        <Card variant="wood" elevation="low" className="p-6">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="text-5xl animate-float select-none">🧩</span>
            <h3 className="font-serif font-bold text-sm text-[#eeded1] tracking-wider">
              Puzzle gameplay coming soon
            </h3>
            <p className="font-serif text-xs text-[#c8a285] leading-relaxed max-w-xs">
              Check back in a future release to test your spatial reasoning with daily cozy tangram challenges.
            </p>
          </div>
        </Card>
      </div>

      {/* Leaderboard */}
      <div className="px-4 pb-6">
        <h3 className="font-serif font-bold text-sm text-[#2c160a] mb-2 flex items-center gap-2">
          <span>🏆</span> Today's Leaderboard
        </h3>
        {leaderboard.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="No Scores Yet"
            message="Be the first to complete today's puzzle and top the board."
          />
        ) : (
          <Card variant="parchment" elevation="low" className="p-0 overflow-hidden border-2 border-[#2c160a]">
            <table className="w-full">
              <thead>
                <tr
                  className="border-b-2 border-[#2c160a] font-serif text-[10px] uppercase tracking-widest text-[#5e463a]"
                  style={{ backgroundColor: '#eeded1' }}
                >
                  <th className="py-2 px-3 text-left font-bold select-none">#</th>
                  <th className="py-2 px-3 text-left font-bold select-none">Visitor</th>
                  <th className="py-2 px-3 text-right font-bold select-none">Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr
                    key={entry.username}
                    className={`border-b border-dashed border-[#c8a285] last:border-0 ${idx === 0 ? 'bg-[#d4af37]/10' : ''}`}
                  >
                    <td className="py-2 px-3 font-mono text-xs text-[#5e463a] select-none">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${entry.rank}.`}
                    </td>
                    <td className="py-2 px-3 font-serif text-sm text-[#2c160a] font-bold">{entry.username}</td>
                    <td className="py-2 px-3 font-mono text-xs text-[#cf7929] text-right font-bold select-none">
                      {Math.floor(entry.timeMs / 1000)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
};
