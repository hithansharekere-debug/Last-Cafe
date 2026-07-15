import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { PageTitle } from '../components/Typography';
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
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', whiteSpace: 'nowrap', marginBottom: '8px' }}>
          <span style={{ fontSize: '26px', lineHeight: 1 }} className="select-none">🧩</span>
          <PageTitle>Puzzle Corner</PageTitle>
        </div>
        <p className="font-sans text-xs text-[var(--color-text-muted)] italic leading-relaxed" style={{ margin: '0 0 12px 0' }}>
          Daily handcrafted challenges. Solve to earn Coffee Tokens and reputation.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg pb-8">
        {/* Handcrafted Daily Puzzle Card */}
        <div>
          {dailyPuzzle ? (
            <Card variant="napkin" elevation="high" className="p-6 border-2 border-[#8D6846] relative">
              {/* Daily tag */}
              <div className="absolute top-3 right-3 bg-[#D9A441] text-[#FBF6EE] font-sans text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow-[0_2px_0px_#8D6846] select-none">
                Today's Daily
              </div>

              <div className="flex flex-col items-center gap-4 text-center">
                <span className="text-5xl animate-float select-none">☕</span>
                <h3 className="font-sans font-bold text-[34px] text-[#4B3528] leading-tight tracking-wider uppercase">
                  {dailyPuzzle.title}
                </h3>
                <div className="w-16 h-0.5 bg-[#8D6846]/20" />
                
                <p className="font-sans text-[18px] font-medium text-[#6B4A34] leading-relaxed max-w-xl whitespace-pre-wrap">
                  {dailyPuzzle.question}
                </p>

                {dailySolved ? (
                  <div 
                    className="w-full bg-[#AEB48D]/20 border-2 border-[#98A27A] rounded-xl text-center font-sans text-[14px] text-[#3B271C] font-bold"
                    style={{ marginTop: '12px', padding: '14px 14px 10px 14px' }}
                  >
                    ✅ Solved! You earned +1 Coffee Token & +20 Reputation.
                  </div>
                ) : (
                  <form onSubmit={handleSolveDailySubmit} className="w-full flex flex-col gap-4 mt-2">
                    {/* Hint */}
                    {dailyPuzzle.hint && (
                      <div className="w-full">
                        {showDailyHint ? (
                          <div className="p-3 bg-[#FBF6EE] border-2 border-dashed border-[#8D6846]/30 rounded-xl font-sans text-[15px] text-[#82634B] leading-normal max-w-sm mx-auto text-left">
                            💡 <strong>Hint:</strong> {dailyPuzzle.hint}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowDailyHint(true)}
                            className="font-sans text-[14px] text-[#D9A441] italic underline hover:text-[#4B3528] cursor-pointer"
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
                        placeholder="Enter answer..."
                        maxLength={50}
                        className="flex-grow rounded-xl border-2 border-[#8D6846] px-4 py-2 font-sans text-[14px] bg-[#FBF6EE] text-[#4B3528] focus:outline-none focus:border-[#D9A441]"
                      />
                      <button
                        type="submit"
                        disabled={!dailyAnswer.trim() || isSolvingDaily}
                        className="px-6 py-2 rounded-xl bg-[#6B4B35] text-[#FBF6EE] font-bold text-[14px] border-2 border-[#3E291E] hover:bg-[#4B3528] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isSolvingDaily ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>

                    {solveDailyError && (
                      <p className="text-[14px] text-[#C97464] font-sans italic font-bold">
                        {solveDailyError}
                      </p>
                    )}
                  </form>
                )}

                {solveDailySuccess && (
                  <p className="text-xs text-[#98A27A] font-sans italic font-bold">
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
        <div>
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
