export * from './types';

// API request payloads
export interface SpendTokenRequest {
  category: string;
  text: string;
  targetDate?: number; // Optional timestamp for time capsules
}

export interface PuzzleSubmitRequest {
  puzzleId: string;
  timeMs: number;
}
