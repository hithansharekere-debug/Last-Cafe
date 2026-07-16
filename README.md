# The Last Cafe on the Internet

*A cozy digital café where strangers leave something meaningful behind.*

---

## Overview

The Last Cafe on the Internet is a community-driven social experience built on Reddit's Devvit Interactive Posts platform.

Inspired by old cafés, library guestbooks, community notice boards, and handwritten letters, the project transforms a Reddit post into a living digital café where every visitor contributes to a growing world.

Instead of endless scrolling, visitors slow down.

Instead of likes, they leave memories.

Instead of feeds, they discover people.

Every contribution becomes part of the café forever.

---

## Demo

Demo Video:
https://youtu.be/rc3RmQxL-oA?si=i8qly7sYt4FJcju_

Live Reddit App:
https://www.reddit.com/r/the_last_cafe/s/dfz0Za1XSU


---

## Inspiration

Modern social media rewards speed.

People scroll.
React.
Forget.

The Last Cafe was built around the opposite philosophy.

We wanted to create a place where strangers leave something real behind.

The idea came from old coffee shops where people leave notes on bulletin boards, libraries with visitor books, cafés with handwritten messages, and small communities that slowly grow over time.

Rather than building another game, we wanted to build a digital place people would actually enjoy returning to every day.

---

## Core Idea

Every visitor receives one Coffee Token each day.

That token can be spent to leave something behind:

- Memories
- Advice
- Recommendations
- Gratitude
- Dreams
- Questions
- Time Capsules
- Community Mysteries
- Riddles
- Puzzle Games

As more people contribute, the café itself grows.

Rooms unlock.

Stories appear.

Community knowledge expands.

The café becomes a living archive built entirely by its visitors.

---

## Features

### Daily Coffee

Every player receives a Coffee Token every day.

Coffee Tokens are the main currency used to contribute to the café.

---

### Community Notes

Visitors can leave notes under different categories including:

- Memory
- Advice
- Gratitude
- Recommendation
- Secret
- Dream
- Time Capsule
- Question

Every note becomes part of the café for future visitors to discover.

---

### Community Table

A shared board where visitors post community-created mysteries.

Players solve them to earn:

- Coffee Tokens
- Reputation

Authors can edit their own mystery up to three times after publishing.

---

### Discover

Browse all community-created content including:

- Riddles
- Mysteries
- Puzzle Games

Filter by:

- Difficulty
- Type
- Popularity

---

### Puzzle Corner

A rotating collection of handcrafted daily puzzles.

Completing them rewards:

- Coffee Tokens
- Reputation
- Warmth

Leaderboards encourage friendly competition.

---

### Library

The player's personal profile.

Tracks:

- Visitor Level
- Daily Streak
- Coffee Tokens
- Warmth
- Reputation
- Badges
- Goals
- Reading Log
- Activity History

---

### Café Blueprint

<img width="2752" height="1536" alt="Gemini_Generated_Image_fc8h3ofc8h3ofc8h" src="https://github.com/user-attachments/assets/b1539892-6ac6-4fbc-9570-3348d8074668" />

The café evolves with the community.

Players collectively unlock new locations such as:

- Fireplace
- Bookshelf
- Garden
- Music Room
- Library

Each unlock expands the world and introduces new interactions.

---

### Progression System

<img width="2760" height="1504" alt="Gemini_Generated_Image_anz1xqanz1xqanz1" src="https://github.com/user-attachments/assets/7f500899-d33c-48e9-a5b4-6d63a46b4cd8" />


Players earn:

- Coffee Tokens
- Warmth
- Reputation
- Badges

Progress is persistent across visits.

---

### Daily Goals

Small objectives encourage players to return.

Examples include:

- Claim today's coffee
- Write a note
- Read community notes
- Solve a mystery
- Complete today's puzzle

---

### Badges

Achievement system rewarding exploration and contribution.

Examples include:

- First Coffee
- First Note
- Puzzle Solver
- Community Helper
- Library Keeper
- Garden Wanderer

---

## Gameplay Loop

<img width="2816" height="1536" alt="Gemini_Generated_Image_2t1ulv2t1ulv2t1u" src="https://github.com/user-attachments/assets/65413e42-b8eb-4729-a280-820d931e3643" />


1. Visit the café.
2. Claim today's Coffee Token.
3. Read what others left behind.
4. Spend your token to contribute.
5. Solve puzzles and mysteries.
6. Earn rewards.
7. Unlock new areas.
8. Return tomorrow to discover what's changed.

---

## Tech Stack

| Layer | Technology |
|--------|------------|
| Platform | Reddit Devvit |
| Language | TypeScript |
| UI | React |
| Styling | CSS |
| Storage | Devvit Redis |
| Runtime | Interactive Posts |
| Version Control | Git |
| Deployment | Reddit Developer Platform |

---

## Architecture

<img width="2816" height="1536" alt="Gemini_Generated_Image_gn14zkgn14zkgn14" src="https://github.com/user-attachments/assets/20d5c4b5-b0be-40c5-9465-d33ec511a1a1" />

---

### Folder Structure

```text
the-last-cafe/
│
├── src/
│   │
│   ├── app/
│   │   ├── App.tsx
│   │   ├── Router.tsx
│   │   └── Theme.ts
│   │
│   ├── components/
│   │   ├── cafe/
│   │   ├── table/
│   │   ├── discover/
│   │   ├── puzzle/
│   │   ├── library/
│   │   ├── navigation/
│   │   ├── dialogs/
│   │   ├── cards/
│   │   └── common/
│   │
│   ├── pages/
│   │   ├── Cafe.tsx
│   │   ├── CommunityTable.tsx
│   │   ├── Discover.tsx
│   │   ├── PuzzleCorner.tsx
│   │   └── Library.tsx
│   │
│   ├── game/
│   │   ├── tokenSystem.ts
│   │   ├── warmthSystem.ts
│   │   ├── reputationSystem.ts
│   │   ├── progression.ts
│   │   ├── achievements.ts
│   │   └── leaderboard.ts
│   │
│   ├── features/
│   │   ├── notes/
│   │   ├── mysteries/
│   │   ├── puzzles/
│   │   ├── library/
│   │   ├── badges/
│   │   └── blueprints/
│   │
│   ├── services/
│   │   ├── devvit.ts
│   │   ├── redis.ts
│   │   ├── storage.ts
│   │   ├── api.ts
│   │   └── user.ts
│   │
│   ├── hooks/
│   │   ├── useUser.ts
│   │   ├── useTokens.ts
│   │   ├── useWarmth.ts
│   │   └── useDailyRewards.ts
│   │
│   ├── utils/
│   │   ├── helpers.ts
│   │   ├── constants.ts
│   │   ├── validators.ts
│   │   └── formatters.ts
│   │
│   ├── assets/
│   │   ├── icons/
│   │   ├── fonts/
│   │   ├── images/
│   │   └── pixel-art/
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   ├── theme.css
│   │   └── animations.css
│   │
│   └── types/
│       ├── user.ts
│       ├── mystery.ts
│       ├── note.ts
│       └── puzzle.ts
│
├── devvit/
│   ├── server.ts
│   ├── redis.ts
│   ├── triggers.ts
│   ├── scheduler.ts
│   └── permissions.ts
│
├── public/
│   ├── favicon.ico
│   ├── logo.png
│   └── screenshots/
│
├── docs/
│   ├── architecture/
│   ├── workflows/
│   ├── screenshots/
│   └── diagrams/
│
├── scripts/
│   ├── setup.sh
│   ├── deploy.sh
│   └── cleanup.sh
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── ui/
│
├── .github/
│   └── workflows/
│       ├── build.yml
│       └── deploy.yml
│
├── package.json
├── tsconfig.json
├── devvit.json
├── README.md
├── LICENSE
└── .gitignore
```
--- 
### Installation

Clone the repository.

git clone https://github.com/hithansharekere-debug/the-last-cafe.git

Install dependencies.

npm install

Run locally.

npm run dev

Deploy using Devvit.

devvit upload

---

### Challenges

Some of the biggest challenges included:

Designing a UI that worked seamlessly across mobile, desktop, and fullscreen layouts.
Creating meaningful progression without encouraging unhealthy engagement.
Building a community-first experience instead of a competitive game.
Managing persistent player data using Devvit storage.
Designing an interface that felt warm, cozy, and readable while remaining responsive.
What We Learned

This project reinforced an important lesson:
People don't always return because of rewards.
Sometimes they return simply because they're curious.
Did someone reply to my note?
Has a new mystery appeared?
Did the community unlock another room?
That curiosity creates genuine community, and that's exactly what The Last Cafe aims to capture.

---

### Future Roadmap

Planned additions include:

Collaborative puzzle creation
Seasonal café events
Community voting
Visitor friendships
Hidden room discoveries
Global warmth milestones
Café radio
Achievement expansion
Moderator tools
Community-curated featured notes
Cooperative puzzle modes
License

MIT License

Hithansh Arekere

GitHub:
https://github.com/hithansharekere-debug

Acknowledgements

Built during the Reddit Devvit Hackathon.

Special thanks to the Reddit Developer Community for the documentation, discussions, and support that made this project possible.

