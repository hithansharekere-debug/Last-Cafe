export * from './types';

// ─── API Request Payloads ───────────────────────────────────────────────

/** POST /api/claim — no body needed (user from context) */
export type ClaimCoffeeRequest = Record<string, never>;

/** POST /api/contribution */
export interface AddContributionRequest {
  category: string;
  message: string;
  targetDate?: number;  // Optional timestamp for time capsules
}

/** POST /api/spend (legacy alias for AddContributionRequest) */
export interface SpendTokenRequest {
  category: string;
  text: string;
  targetDate?: number;
}

/** POST /api/puzzle/submit */
export interface PuzzleSubmitRequest {
  puzzleId: string;
  timeMs: number;
}
