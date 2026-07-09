export const CONTRIBUTION_CATEGORIES = {
  MEMORY: 'Memory',
  ADVICE: 'Advice',
  GRATITUDE: 'Gratitude',
  RECOMMENDATION: 'Recommendation',
  SECRET: 'Secret',
  TIME_CAPSULE: 'Time Capsule',
} as const;

export type ContributionCategory = typeof CONTRIBUTION_CATEGORIES[keyof typeof CONTRIBUTION_CATEGORIES];

export const ROOM_UNLOCK_THRESHOLDS = {
  FIREPLACE: 50,
  BOOKSHELF: 200,
  GARDEN: 500,
  MUSIC_ROOM: 1000,
} as const;

export type RoomUnlockThresholds = typeof ROOM_UNLOCK_THRESHOLDS;
