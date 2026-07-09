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

interface TangramPiece {
  id: string;
  label: string;
  color: string;
  svgPoints: string;
  viewBox: string;
}

const TANGRAM_PIECES: TangramPiece[] = [
  { id: 'large_tri_1', label: 'Large Triangle 1', color: '#8e5a36', svgPoints: '0,60 60,60 0,0', viewBox: '0 0 60 60' },
  { id: 'large_tri_2', label: 'Large Triangle 2', color: '#5c371d', svgPoints: '0,0 60,0 60,60', viewBox: '0 0 60 60' },
  { id: 'medium_tri', label: 'Medium Triangle', color: '#cf7929', svgPoints: '0,60 60,60 30,0', viewBox: '0 0 60 60' },
  { id: 'small_tri_1', label: 'Small Triangle 1', color: '#d4af37', svgPoints: '0,30 30,30 0,0', viewBox: '0 0 30 30' },
  { id: 'small_tri_2', label: 'Small Triangle 2', color: '#9b4618', svgPoints: '0,0 30,0 30,30', viewBox: '0 0 30 30' },
  { id: 'square', label: 'Square', color: '#4a7c59', svgPoints: '0,0 40,0 40,40 0,40', viewBox: '0 0 40 40' },
  { id: 'parallelogram', label: 'Parallelogram', color: '#2c160a', svgPoints: '20,0 60,0 40,40 0,40', viewBox: '0 0 60 40' },
];

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${seconds}s`;
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

      {/* Stats */}
      <div className="flex gap-3 p-4 pb-2">
        <Card variant="deck" elevation="low" className="flex-1">
          <p className="font-serif text-[10px] text-[#5e463a] uppercase tracking-widest mb-1">Your Best</p>
          <p className="font-serif font-bold text-lg text-[#2c160a]">
            {pbTimeMs !== null ? formatTime(pbTimeMs) : '—'}
          </p>
        </Card>
        <Card variant="deck" elevation="low" className="flex-1">
          <p className="font-serif text-[10px] text-[#5e463a] uppercase tracking-widest mb-1">Today's Puzzle</p>
          <p className="font-serif font-bold text-lg text-[#cf7929]">Daily</p>
        </Card>
      </div>

      {/* Tangram board */}
      <div className="px-4 pb-3">
        <Card variant="wood" elevation="low">
          <div className="flex flex-col items-center gap-4">
            <p className="font-serif text-xs text-[#c8a285] italic text-center">
              Arrange the 7 pieces to form the silhouette.
              <br />Game logic coming in Phase 2.
            </p>

            {/* Silhouette placeholder */}
            <div
              className="w-36 h-36 border-2 border-dashed border-[#c8a285] rounded flex items-center justify-center"
              style={{ backgroundColor: 'rgba(200,162,133,0.05)' }}
            >
              <span className="font-serif text-xs text-[#c8a285] italic text-center px-2">
                Silhouette<br />Target
              </span>
            </div>

            {/* Pieces tray */}
            <div className="w-full">
              <p className="font-serif text-[10px] text-[#c8a285] uppercase tracking-widest mb-2">Pieces Tray</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {TANGRAM_PIECES.map((piece) => {
                  const [,, w, h] = piece.viewBox.split(' ');
                  return (
                    <div
                      key={piece.id}
                      className="flex items-center justify-center cursor-grab active:cursor-grabbing"
                      title={piece.label}
                    >
                      <svg
                        viewBox={piece.viewBox}
                        width={w}
                        height={h}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon
                          points={piece.svgPoints}
                          fill={piece.color}
                          stroke="#fdfaf2"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              disabled
              className="w-full py-2 rounded border-2 border-[#c8a285] text-[#c8a285] font-serif text-sm opacity-60 cursor-not-allowed"
            >
              ▶ Start Puzzle (Coming Soon)
            </button>
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
          <Card variant="parchment" elevation="low" className="p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr
                  className="border-b-2 border-[#2c160a] font-serif text-[10px] uppercase tracking-widest text-[#5e463a]"
                  style={{ backgroundColor: '#eeded1' }}
                >
                  <th className="py-2 px-3 text-left font-bold">#</th>
                  <th className="py-2 px-3 text-left font-bold">Visitor</th>
                  <th className="py-2 px-3 text-right font-bold">Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr
                    key={entry.username}
                    className={`border-b border-dashed border-[#c8a285] last:border-0 ${idx === 0 ? 'bg-[#d4af37]/10' : ''}`}
                  >
                    <td className="py-2 px-3 font-mono text-xs text-[#5e463a]">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${entry.rank}.`}
                    </td>
                    <td className="py-2 px-3 font-serif text-sm text-[#2c160a] font-bold">{entry.username}</td>
                    <td className="py-2 px-3 font-mono text-xs text-[#cf7929] text-right font-bold">
                      {formatTime(entry.timeMs)}
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
