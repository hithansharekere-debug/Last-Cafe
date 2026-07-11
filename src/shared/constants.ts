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

// ─── Phase 5: Puzzles Categories & Handcrafted Daily Puzzles ────────────
export const PUZZLE_CATEGORIES = {
  RIDDLE: 'Riddle',
  HIDDEN_WORD: 'Hidden Word',
  CIPHER: 'Cipher',
  NUMBER_PATTERN: 'Number Pattern',
  LOGIC_PUZZLE: 'Logic Puzzle',
  DETECTIVE_STORY: 'Detective Story',
  FILL_IN_THE_BLANK: 'Fill in the Blank',
} as const;

export type PuzzleCategory = typeof PUZZLE_CATEGORIES[keyof typeof PUZZLE_CATEGORIES];

export interface DailyPuzzleDef {
  id: string;
  title: string;
  question: string;
  hint: string;
  answer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const DAILY_PUZZLES: DailyPuzzleDef[] = [
  {
    id: 'daily_1',
    title: "The Barista's Clock",
    question: "I have hands but cannot clap. I never run, but I go forward. At the cafe, I tick but do not talk. What am I?",
    hint: "Look up at the wall near the foyer.",
    answer: "clock",
    difficulty: "Easy"
  },
  {
    id: 'daily_2',
    title: "The Steam Riddle",
    question: "I rise from the cup, warm and gray. I disappear into the air, but I am not smoke. What am I?",
    hint: "It keeps your hands warm on a rainy day.",
    answer: "steam",
    difficulty: "Easy"
  },
  {
    id: 'daily_3',
    title: "The Secret Ingredient",
    question: "I am sweet, brown, and melt in your mouth. Baristas use me to decorate your latte foam. What am I?",
    hint: "Usually sprinkled as powder.",
    answer: "chocolate",
    difficulty: "Easy"
  },
  {
    id: 'daily_4',
    title: "The Library Key",
    question: "I have keys but no locks. I have space but no room. You can enter, but you cannot go outside. What am I?",
    hint: "Baristas type notes on me.",
    answer: "keyboard",
    difficulty: "Medium"
  },
  {
    id: 'daily_5',
    title: "The Fireplace Shadow",
    question: "The more of them you take, the more you leave behind. What are they?",
    hint: "You make them when you walk through the cafe door.",
    answer: "footsteps",
    difficulty: "Medium"
  },
  {
    id: 'daily_6',
    title: "The Bookworm's Query",
    question: "What has many words but never speaks, has a spine but no bones, and lives on bookshelves?",
    hint: "You are visiting the Library Corner to find me.",
    answer: "book",
    difficulty: "Easy"
  },
  {
    id: 'daily_7',
    title: "The Cozy Lantern",
    question: "I shine bright in the dark, but I am not the sun. Baristas refill me with oil. What am I?",
    hint: "Hang me near the fireplace.",
    answer: "lantern",
    difficulty: "Medium"
  }
];

export function getDailyPuzzleForDate(dateStr: string): DailyPuzzleDef {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed += dateStr.charCodeAt(i);
  }
  const index = seed % DAILY_PUZZLES.length;
  return DAILY_PUZZLES[index]!;
}

