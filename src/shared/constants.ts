export const CONTRIBUTION_CATEGORIES = {
  MEMORY: 'Memory',
  ADVICE: 'Advice',
  GRATITUDE: 'Gratitude',
  RECOMMENDATION: 'Recommendation',
  SECRET: 'Secret',
  TIME_CAPSULE: 'Time Capsule',
  DREAM: 'Dream',
  QUESTION: 'Question',
} as const;

export type ContributionCategory = typeof CONTRIBUTION_CATEGORIES[keyof typeof CONTRIBUTION_CATEGORIES];

export const ROOM_UNLOCK_THRESHOLDS = {
  FIREPLACE: 50,
  BOOKSHELF: 200,
  GARDEN: 500,
  MUSIC_ROOM: 1000,
} as const;

export type RoomUnlockThresholds = typeof ROOM_UNLOCK_THRESHOLDS;

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENT_DEFINITIONS: Record<string, AchievementDef> = {
  first_coffee: { id: 'first_coffee', title: 'First Coffee', description: 'Claim today\'s coffee.', icon: '☕' },
  first_note: { id: 'first_note', title: 'First Note', description: 'Write your first note.', icon: '📝' },
  warm_soul: { id: 'warm_soul', title: 'Warm Soul', description: 'Contribute 10 warmth.', icon: '❤️' },
  regular_visitor: { id: 'regular_visitor', title: 'Regular Visitor', description: 'Visit the cafe 7 times.', icon: '📚' },
  community_helper: { id: 'community_helper', title: 'Community Helper', description: 'Receive 10 total likes on your notes.', icon: '🌿' },
  fireplace_open: { id: 'fireplace_open', title: 'Fireplace Open', description: 'Unlock the Fireplace Room.', icon: '🏡' },
  library_keeper: { id: 'library_keeper', title: 'Library Keeper', description: 'Unlock the Library Room.', icon: '📖' },
  garden_wanderer: { id: 'garden_wanderer', title: 'Garden Wanderer', description: 'Unlock the Hidden Garden.', icon: '🌸' },
  puzzle_solver: { id: 'puzzle_solver', title: 'Puzzle Solver', description: 'Complete a puzzle and record a time.', icon: '🧩' },
};

export interface DecorDef {
  id: string;
  roomId: string;
  name: string;
  icon: string;
  description: string;
  unlockHint: string;
}

export const DECORATION_DEFINITIONS: Record<string, DecorDef> = {
  fireplace_wood: {
    id: 'fireplace_wood',
    roomId: 'fireplace',
    name: 'Firewood Stack',
    icon: '🪵',
    description: 'A neat stack of dried birch logs ready for the hearth.',
    unlockHint: 'Unlocked when global warmth reaches 70.',
  },
  fireplace_candle: {
    id: 'fireplace_candle',
    roomId: 'fireplace',
    name: 'Aroma Candle',
    icon: '🕯️',
    description: 'A slow-burning candle fills the room with notes of cinnamon and pine.',
    unlockHint: 'Unlocked when global warmth reaches 120.',
  },
  fireplace_cat: {
    id: 'fireplace_cat',
    roomId: 'fireplace',
    name: 'Snoozing Tabby Cat',
    icon: '🐈',
    description: 'A cozy orange tabby cat sleeping soundly by the fire.',
    unlockHint: 'Unlocked when you write 5 notes.',
  },
  foyer_shelf: {
    id: 'foyer_shelf',
    roomId: 'foyer',
    name: 'Polished Tea Shelf',
    icon: '🧉',
    description: 'Displays jars of chamomile, earl grey, and herbal tea blends.',
    unlockHint: 'Unlocked when you visit the cafe 3 times.',
  },
  foyer_picture: {
    id: 'foyer_picture',
    roomId: 'foyer',
    name: 'Framed Cafe Sketch',
    icon: '🖼️',
    description: 'A delicate pen-and-ink drawing of the cafe storefront.',
    unlockHint: 'Unlocked when you write 2 notes.',
  },
  foyer_plant: {
    id: 'foyer_plant',
    roomId: 'foyer',
    name: 'Potted Boston Fern',
    icon: '🪴',
    description: 'Lush green leaves cascading from a hanging clay pot.',
    unlockHint: 'Unlocked when you claim 2 daily coffees.',
  },
  garden_vines: {
    id: 'garden_vines',
    roomId: 'garden',
    name: 'Climbing Ivy Vines',
    icon: '🌿',
    description: 'Vines covering the brick walls of the garden patio.',
    unlockHint: 'Unlocked when global warmth reaches 600.',
  },
  library_books: {
    id: 'library_books',
    roomId: 'bookshelf',
    name: 'Antique Book Stack',
    icon: '📚',
    description: 'Leather-bound classics and rare manuscripts stacked high.',
    unlockHint: 'Unlocked when global warmth reaches 300.',
  },
  library_chair: {
    id: 'library_chair',
    roomId: 'bookshelf',
    name: 'Plush Velvet Armchair',
    icon: '🪑',
    description: 'A comfortable deep red armchair perfect for late-night reading.',
    unlockHint: 'Unlocked when you unlock 3 achievements.',
  },
  music_piano: {
    id: 'music_piano',
    roomId: 'music_room',
    name: 'Mahogany Grand Piano',
    icon: '🎹',
    description: 'A pristine grand piano echoing faint melodies of forgotten songs.',
    unlockHint: 'Unlocked when global warmth reaches 1100.',
  },
};

