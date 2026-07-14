import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { SkeletonLoader } from '../components/SkeletonLoader';
import type { LeaderboardEntry } from '../../shared/types';

interface PuzzleCornerScreenProps {
  pbTimeMs: number | null;
  leaderboard: LeaderboardEntry[];
  onFetchLeaderboard: (puzzleId?: string) => void;
  onSolveDaily: (answer: string) => Promise<{ success: boolean; error?: string }>;
}

export const PuzzleCornerScreen = ({
  pbTimeMs,
  leaderboard,
  onFetchLeaderboard,
  onSolveDaily,
}: PuzzleCornerScreenProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dailyPuzzle, setDailyPuzzle] = useState<{ id: string; title: string; question: string; hint: string; difficulty: string } | null>(null);
  const [dailySolved, setDailySolved] = useState(false);
  const [dailyAnswer, setDailyAnswer] = useState('');
  const [showDailyHint, setShowDailyHint] = useState(false);
  
  const [isSolvingDaily, setIsSolvingDaily] = useState(false);
  const [solveDailyError, setSolveDailyError] = useState<string | null>(null);
  const [solveDailySuccess, setSolveDailySuccess] = useState<string | null>(null);

  // Fetch daily puzzle details
  useEffect(() => {
    let active = true;
    const fetchDaily = async () => {
      try {
        const res = await fetch('/api/puzzle/daily');
        const json = await res.json();
        if (json.success && active) {
          setDailyPuzzle(json.data.puzzle);
          setDailySolved(json.data.solved);
        }
      } catch (err) {
        console.error('Failed to load daily puzzle:', err);
      }
    };
    void fetchDaily();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    const run = async () => {
      await onFetchLeaderboard('tangram_daily');
      if (active) {
        setIsLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [onFetchLeaderboard]);

  const handleSolveDailySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyAnswer.trim() || isSolvingDaily) return;

    setIsSolvingDaily(true);
    setSolveDailyError(null);
    setSolveDailySuccess(null);
    try {
      const res = await onSolveDaily(dailyAnswer.trim());
      if (res.success) {
        setSolveDailySuccess("Correct! Today's daily coffee token has been rewarded. ☕");
        setDailySolved(true);
        setDailyAnswer('');
      } else {
        setSolveDailyError(res.error || 'Incorrect answer. Try again.');
      }
    } catch {
      setSolveDailyError('Failed to submit answer. Try again.');
    } finally {
      setIsSolvingDaily(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[var(--color-parchment)] animate-fade-in">
      {/* Header */}
      <div
        className="flex flex-col px-5 pt-5 pb-4 border-b-2 border-[var(--color-border-dark)] flex-shrink-0"
        style={{
          backgroundColor: 'var(--color-cream)',
          backgroundImage: 'radial-gradient(var(--color-paper-shadow) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <h2 className="font-sans font-bold text-lg text-[var(--color-dark-walnut)] mb-1">🧩 Puzzle Corner</h2>
        <p className="font-sans text-xs text-[var(--color-text-muted)] italic leading-relaxed">
          Daily handcrafted challenges. Solve to earn Coffee Tokens and reputation.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Handcrafted Daily Puzzle Card */}
        <div className="p-5">
          {dailyPuzzle ? (
            <Card variant="wood" elevation="high" className="p-6 border-2 border-[var(--color-border-dark)] relative">
              {/* Daily tag */}
              <div className="absolute top-3 right-3 bg-[var(--color-caramel)] text-[var(--color-text-light)] font-mono text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-[0_2px_0px_var(--color-border-dark)] select-none">
                Today's Daily
              </div>

              <div className="flex flex-col items-center gap-3.5 text-center">
                <span className="text-5xl animate-float select-none">☕</span>
                <h3 className="font-sans font-bold text-lg text-[var(--color-text-light)] tracking-wider uppercase">
                  {dailyPuzzle.title}
                </h3>
                <div className="w-16 h-0.5 bg-[#eeded1]/20" />
                
                <p className="font-handwritten text-sm text-[#eeded1] leading-relaxed max-w-sm whitespace-pre-wrap">
                  {dailyPuzzle.question}
                </p>

                {dailySolved ? (
                  <div className="w-full mt-2 p-4 bg-[var(--color-cream)] border-2 border-[var(--color-sage)] rounded-lg text-center font-sans text-xs text-[var(--color-sage)] font-bold shadow-[0_3px_0px_var(--color-border-dark)]">
                    ✅ Solved! You earned +1 Coffee Token & +20 Reputation.
                  </div>
                ) : (
                  <form onSubmit={handleSolveDailySubmit} className="w-full flex flex-col gap-3.5 mt-2">
                    {/* Hint */}
                    {dailyPuzzle.hint && (
                      <div>
                        {showDailyHint ? (
                          <div className="p-2.5 bg-[var(--color-border-dark)]/50 border-2 border-dashed border-[var(--color-bronze)]/30 rounded-md font-sans text-[11px] text-[#eeded1]/90 leading-normal max-w-sm mx-auto text-left">
                            💡 <strong>Hint:</strong> {dailyPuzzle.hint}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowDailyHint(true)}
                            className="font-sans text-[11px] text-[var(--color-caramel)] italic underline hover:text-[var(--color-text-light)] cursor-pointer"
                          >
                            Reveal Hint...
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 max-w-sm mx-auto w-full">
                      <input
                        type="text"
                        value={dailyAnswer}
                        onChange={(e) => {
                          setDailyAnswer(e.target.value);
                          if (solveDailyError) setSolveDailyError(null);
                        }}
                        placeholder="Type answer here..."
                        maxLength={50}
                        className="flex-grow rounded-md border-2 border-[var(--color-border-dark)] px-3 py-2 font-sans text-xs bg-[var(--color-cream)] text-[var(--color-text-dark)] placeholder:text-[var(--color-text-muted)]/70 focus:outline-none focus:border-[var(--color-caramel)]"
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        disabled={!dailyAnswer.trim() || isSolvingDaily}
                        className="cursor-pointer font-bold"
                      >
                        {isSolvingDaily ? 'Solving...' : 'Solve'}
                      </Button>
                    </div>

                    {solveDailyError && (
                      <p className="text-[10px] text-[var(--color-warm-red)] font-sans italic font-bold">
                        {solveDailyError}
                      </p>
                    )}
                  </form>
                )}

                {solveDailySuccess && (
                  <p className="text-xs text-[var(--color-text-light)] font-sans italic font-bold">
                    {solveDailySuccess}
                  </p>
                )}
              </div>
            </Card>
          ) : (
            <div className="p-1">
              <SkeletonLoader type="feed" count={1} />
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="px-5">
          <h3 className="font-sans font-bold text-sm text-[var(--color-dark-walnut)] mb-3 flex items-center gap-2 px-1">
            <span>🏆</span> Tangram Speed Leaderboard
          </h3>
          {isLoading ? (
            <div className="p-1">
              <SkeletonLoader type="feed" count={2} />
            </div>
          ) : leaderboard.length === 0 ? (
            <EmptyState
              icon="🏆"
              title="No Scores Yet"
              message="Tangram challenge leaderboard will populate soon."
            />
          ) : (
            <Card variant="parchment" elevation="low" className="p-0 overflow-hidden border-2 border-[var(--color-border-dark)] bg-[var(--color-parchment)]">
              <table className="w-full border-collapse">
                <thead>
                  <tr
                    className="border-b-2 border-[var(--color-border-dark)] font-sans text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]"
                    style={{ backgroundColor: 'var(--color-cream)' }}
                  >
                    <th className="py-2.5 px-4.5 text-left font-bold select-none">#</th>
                    <th className="py-2.5 px-4.5 text-left font-bold select-none">Visitor</th>
                    <th className="py-2.5 px-4.5 text-right font-bold select-none">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr
                      key={entry.username}
                      className={`border-b border-dashed border-[var(--color-bronze)]/55 last:border-0 ${idx === 0 ? 'bg-[var(--color-accent-gold)]/10' : ''}`}
                    >
                      <td className="py-2.5 px-4.5 font-mono text-xs text-[var(--color-text-muted)] select-none">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${entry.rank}.`}
                      </td>
                      <td className="py-2.5 px-4.5 font-sans text-xs text-[var(--color-text-dark)] font-bold">{entry.username}</td>
                      <td className="py-2.5 px-4.5 font-mono text-xs text-[var(--color-caramel)] text-right font-bold select-none">
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
    </div>
  );
};
export default PuzzleCornerScreen;
