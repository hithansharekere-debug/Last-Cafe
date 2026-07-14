import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { CafeFloorPlan } from '../components/CafeFloorPlan';
import { PageContainer } from '../components/PageContainer';
import { PageTitle, SectionTitle, BodyText, Caption } from '../components/Typography';
import { ResponsiveListGrid } from '../components/Grid';
import { ROOM_UNLOCK_THRESHOLDS } from '../../shared/constants';
import type { Room, User, CafeState, Contribution } from '../../shared/types';

interface CafeScreenProps {
  user: User | null;
  cafe: CafeState;
  rooms: Room[];
  contributions: Contribution[];
  canClaimCoffee: boolean;
  onClaimToken: () => Promise<boolean>;
  onOpenComposer: () => void;
}

const getMsUntilMidnightUTC = () => {
  const now = new Date();
  const midnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return midnight.getTime() - now.getTime();
};

const formatCountdown = (ms: number) => {
  if (ms <= 0) return '00:00:00';
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');
};

export const CafeScreen = ({
  user,
  cafe,
  rooms,
  contributions,
  canClaimCoffee,
  onClaimToken,
  onOpenComposer,
}: CafeScreenProps) => {
  // Claim status states
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [msUntilMidnight, setMsUntilMidnight] = useState(getMsUntilMidnightUTC());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsUntilMidnight(getMsUntilMidnightUTC());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const nextRoom = rooms.find((r) => !r.isUnlocked);
  const nextThreshold = nextRoom?.threshold ?? ROOM_UNLOCK_THRESHOLDS.MUSIC_ROOM;
  const currentTokens = user?.currentCoffeeTokens ?? 0;
  const hasTokens = currentTokens > 0;

  const handleClaim = async () => {
    setIsClaiming(true);
    setErrorMessage(null);
    try {
      const success = await onClaimToken();
      if (success) {
        setClaimMessage("You brewed today's coffee.");
        setTimeout(() => setClaimMessage(null), 4000);
      } else {
        setErrorMessage('Failed to brew coffee. Come back tomorrow.');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch {
      setErrorMessage('Failed to brew coffee. Check your connection.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[var(--color-parchment)]">
      <PageContainer>
        {/* Cafe Header & Hub Information */}
        <div
          className="flex flex-col p-lg rounded-lg border-2 border-[var(--color-border-dark)] shadow-[4px_4px_0px_var(--color-border-dark)] shrink-0"
          style={{
            backgroundColor: 'var(--color-cream)',
            backgroundImage: 'radial-gradient(var(--color-paper-shadow) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          <div className="flex justify-between items-center gap-lg mb-3">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', whiteSpace: 'nowrap', marginBottom: '8px' }}>
                <span style={{ fontSize: '26px', lineHeight: 1 }} className="select-none">☕</span>
                <PageTitle>The Cozy Cafe</PageTitle>
              </div>
              <Caption className="italic block" style={{ margin: '0 0 12px 0' }}>Pull up a chair. Stay a while.</Caption>
            </div>
            <div className="text-right select-none shrink-0">
              <span className="font-sans text-xs bg-[var(--color-border-dark)] text-[var(--color-text-light)] px-3 py-1.5 rounded-lg border-2 border-[var(--color-border-dark)] shadow-[0_3px_0px_var(--color-caramel)] font-bold">
                Tokens: {currentTokens}
              </span>
            </div>
          </div>

          {/* Global Progress toward unlocking rooms */}
          <div className="mt-7">
            <ProgressBar
              value={cafe.totalWarmth}
              max={nextThreshold}
              label={nextRoom ? `Progress to: ${nextRoom.name}` : 'All rooms unlocked!'}
              subLabel={
                nextRoom
                  ? `${nextThreshold - cafe.totalWarmth} more warmth needed to open the ${nextRoom.name}`
                  : 'The cafe is fully warm and alive.'
              }
            />
          </div>
        </div>

        {/* Interaction Panels Grid */}
        <ResponsiveListGrid>
          {/* Today's Coffee Brew Box */}
          <Card variant="parchment" elevation="low" className="p-lg flex flex-col justify-between gap-md">
            <div>
              <div className="flex justify-between items-center text-xs font-sans border-b border-dashed border-[var(--color-bronze)] pb-2 mb-3">
                <span className="text-[var(--color-dark-walnut)] font-bold flex items-center gap-1.5">
                  <span>☕</span> Today's Coffee Cooldown
                </span>
                {canClaimCoffee ? (
                  <span className="text-[var(--color-sage)] font-bold bg-[var(--color-cream)] px-1.5 py-0.5 rounded border border-[var(--color-sage)] uppercase tracking-wider text-[9px]">Claim Ready!</span>
                ) : (
                  <span className="text-[var(--color-caramel)] font-bold bg-[var(--color-cream)] px-1.5 py-0.5 rounded border border-[var(--color-caramel)] uppercase tracking-wider text-[9px]">Claimed today</span>
                )}
              </div>

              {claimMessage && (
                <BodyText className="italic text-[var(--color-sage)] text-center font-bold mb-4">
                  {claimMessage}
                </BodyText>
              )}

              {errorMessage && (
                <BodyText className="italic text-[var(--color-warm-red)] text-center font-bold mb-4">
                  {errorMessage}
                </BodyText>
              )}
            </div>

            <div className="flex items-center gap-md">
              <Button
                variant="primary"
                size="md"
                onClick={handleClaim}
                disabled={!canClaimCoffee || isClaiming}
                className="flex-grow cursor-pointer"
              >
                {isClaiming ? 'Brewing...' : canClaimCoffee ? '☕ Brew Coffee' : 'Brewed'}
              </Button>
              {!canClaimCoffee && (
                <span className="font-mono text-xs bg-[var(--color-cream)] px-3 h-11 rounded-md border-2 border-[var(--color-border-dark)] text-[var(--color-text-muted)] select-none font-bold flex items-center justify-center shrink-0">
                  {formatCountdown(msUntilMidnight)}
                </span>
              )}
            </div>
          </Card>

          {/* Community Table Contribution Option */}
          <Card variant="napkin" elevation="low" className="p-lg flex flex-col justify-between gap-md">
            <div>
              <div className="flex items-center gap-1.5 border-b border-dashed border-[var(--color-bronze)] pb-2 mb-3">
                <span className="text-sm">✍️</span>
                <span className="text-[var(--color-dark-walnut)] text-xs font-bold font-sans uppercase tracking-wider">Leave a Message</span>
              </div>
              <BodyText className="text-xs mb-4">
                Share a community note, a mystery, or a warm thought with the other visitors of the cafe.
              </BodyText>
            </div>

            <div className="flex items-center w-full">
              {!hasTokens ? (
                <div className="h-11 px-3 bg-[var(--color-cream)]/30 border-2 border-dashed border-[var(--color-bronze)] rounded-md text-center select-none flex items-center justify-center w-full">
                  <Caption className="italic font-bold text-[var(--color-caramel)] leading-none select-none">
                    Finish today's coffee to earn more tokens.
                  </Caption>
                </div>
              ) : (
                <Button
                  variant="wood"
                  size="md"
                  onClick={onOpenComposer}
                  disabled={!hasTokens}
                  fullWidth
                  className="cursor-pointer"
                >
                  Write Note (Spend 1 Token)
                </Button>
              )}
            </div>
          </Card>
        </ResponsiveListGrid>

        {/* Blueprint Floor Plan area */}
        <div className="w-full">
          <CafeFloorPlan user={user} rooms={rooms} totalWarmth={cafe.totalWarmth} />
        </div>

        {/* Recent Contributions Section */}
        <div className="flex flex-col gap-md">
          <SectionTitle className="flex items-center gap-2 px-1">
            <span>📜</span> Recent Contributions
          </SectionTitle>

          {contributions.length === 0 ? (
            <div className="p-lg bg-[var(--color-cream)]/30 border-2 border-dashed border-[var(--color-bronze)] rounded-lg text-center">
              <BodyText className="italic mb-4 text-center">
                The cafe is quiet today. Why not leave the first note?
              </BodyText>
              {hasTokens && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onOpenComposer}
                  className="cursor-pointer"
                >
                  ✍️ Leave Note
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-md">
              {contributions.slice(0, 3).map((contrib) => (
                <Card
                  key={contrib.id}
                  variant="parchment"
                  elevation="low"
                  className="p-lg hover:scale-[1.005]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--color-cream)] text-[var(--color-dark-walnut)] border border-[var(--color-border-dark)] select-none font-bold">
                      {contrib.category}
                    </span>
                    <Caption className="italic">
                      — {contrib.username}
                    </Caption>
                  </div>
                  <BodyText className="font-handwritten text-[var(--color-espresso)]">
                    "{contrib.message || contrib.text}"
                  </BodyText>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
};
