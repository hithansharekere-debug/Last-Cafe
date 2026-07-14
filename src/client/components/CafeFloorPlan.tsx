import React, { useState } from 'react';
import { DECORATION_DEFINITIONS } from '../../shared/constants';
import type { Room, User } from '../../shared/types';

interface CafeFloorPlanProps {
  user: User | null;
  rooms: Room[];
  totalWarmth: number;
}

const ROOM_THEMES: Record<string, { bg: string; border: string; accentText: string; symbol: string }> = {
  foyer: {
    bg: '#f7edd7', // paper warm beige
    border: '#c8a285',
    accentText: '#5e463a',
    symbol: '🚪',
  },
  fireplace: {
    bg: '#eeded1', // foam warm pinkish
    border: '#cf7929', // amber orange
    accentText: '#9b4618',
    symbol: '🔥',
  },
  bookshelf: {
    bg: '#f5ead2', // parchment
    border: '#d4af37', // gold
    accentText: '#8e5a36',
    symbol: '📚',
  },
  garden: {
    bg: '#e1ead4', // soft green
    border: '#4a7c59', // olive
    accentText: '#2e4d37',
    symbol: '🌿',
  },
  music_room: {
    bg: '#f1edf7', // light lavender
    border: '#9c27b0', // purple
    accentText: '#5e2d6b',
    symbol: '🎵',
  },
};

function isDecorUnlocked(decorId: string, user: User | null, globalWarmth: number): boolean {
  if (!user) return false;
  switch (decorId) {
    case 'fireplace_wood':
      return globalWarmth >= 70;
    case 'fireplace_candle':
      return globalWarmth >= 120;
    case 'fireplace_cat':
      return user.totalNotesWritten >= 5;
    case 'foyer_shelf':
      return (user.visitCount || 1) >= 3;
    case 'foyer_picture':
      return user.totalNotesWritten >= 2;
    case 'foyer_plant':
      return user.achievements?.includes('first_coffee') || false;
    case 'garden_vines':
      return globalWarmth >= 600;
    case 'library_books':
      return globalWarmth >= 300;
    case 'library_chair':
      return (user.achievements?.length || 0) >= 3;
    case 'music_piano':
      return globalWarmth >= 1100;
    default:
      return false;
  }
}

export const CafeFloorPlan = ({ user, rooms, totalWarmth }: CafeFloorPlanProps) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const getRoomThreshold = (roomId: string): number => {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.threshold : 0;
  };

  const isRoomUnlocked = (roomId: string): boolean => {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.isUnlocked : roomId === 'foyer';
  };

  const getRoomDescription = (roomId: string): string => {
    const desc: Record<string, string> = {
      foyer: 'Where every visitor begins their journey. Warm, welcoming entrance.',
      fireplace: 'A crackling hearth where stories are shared on cold evenings. Comfy armchairs arranged near the logs.',
      bookshelf: 'Floor-to-ceiling shelves of dog-eared wisdom and forgotten worlds. Writing desks with dim golden lighting.',
      garden: 'A secret courtyard where things grow quietly in the dark. Climbing ivy leaves and a stone water fountain.',
      music_room: 'An old upright piano, music stands, and sheet music. Soft purple conservatory melodies fill the air.',
    };
    return desc[roomId] || '';
  };

  const renderRoomCell = (roomId: string, columnStyle: string) => {
    const unlocked = isRoomUnlocked(roomId);
    const theme = ROOM_THEMES[roomId];
    if (!theme) return null;

    const isSelected = selectedRoomId === roomId;
    const roomDecorations = Object.values(DECORATION_DEFINITIONS).filter(
      (dec) => dec.roomId === roomId && isDecorUnlocked(dec.id, user, totalWarmth)
    );

    return (
      <div
        key={roomId}
        onClick={() => setSelectedRoomId(roomId)}
        className={`blueprint-room ${columnStyle} cursor-pointer ${unlocked ? 'unlocked' : 'locked'} ${
          isSelected ? 'ring-2 ring-[#cf7929]' : ''
        }`}
        title={
          unlocked
            ? `Unlocked! Click to see decorations.`
            : `Locked. Requires ${getRoomThreshold(roomId)} warmth to open. Click for info.`
        }
        style={{
          backgroundColor: unlocked ? theme.bg : '#685c53',
          borderColor: unlocked ? theme.border : '#2c160a',
          gridColumn: columnStyle.includes('col-span-2') ? 'span 2' : 'span 1',
        }}
      >
        {/* Mysterious floating dust inside locked rooms */}
        {!unlocked && (
          <div className="absolute inset-0 bg-[#2c160a]/20 pointer-events-none animate-dust" />
        )}

        <div className="flex justify-between items-start w-full relative z-10">
          <span
            className="font-serif font-bold text-[10px] tracking-wide"
            style={{ color: unlocked ? theme.accentText : '#2c160a' }}
          >
            {roomId.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-xs select-none">{unlocked ? theme.symbol : '🔒'}</span>
        </div>

        {/* Flickering flame overlay inside fireplace cell */}
        {roomId === 'fireplace' && unlocked && (
          <span className="absolute bottom-2 right-2 text-base animate-fireplace select-none z-10">🔥</span>
        )}

        <div className="mt-2.5 flex justify-between items-center w-full relative z-10">
          {unlocked ? (
            <div className="flex gap-1 overflow-hidden select-none">
              {roomDecorations.length === 0 ? (
                <span className="text-[9px] text-[#5e463a] italic">Empty</span>
              ) : (
                roomDecorations.map((dec) => (
                  <span
                    key={dec.id}
                    title={dec.name}
                    className="text-xs animate-float"
                    style={{ animationDelay: `${Math.random() * 2}s` }}
                  >
                    {dec.icon}
                  </span>
                ))
              )}
            </div>
          ) : (
            <span className="font-mono text-[9px] text-[#eeded1] bg-[#2c160a]/50 px-1.5 py-0.5 rounded select-none">
              {getRoomThreshold(roomId)} warmth
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full p-5 rounded-lg border-2 border-[var(--color-border-dark)] bg-[var(--color-cream)]/50 shadow-[0_4px_0px_var(--color-border-dark)]">
      <div className="flex justify-between items-center mb-5">
        <span className="font-sans font-bold text-xs uppercase tracking-wider text-[var(--color-dark-walnut)]">
          🏛️ Cafe Miniature Blueprint
        </span>
        <span className="font-sans text-[10px] text-[var(--color-dark-walnut)] bg-[var(--color-cream)] px-2.5 py-1 rounded border border-[var(--color-border-dark)] select-none font-bold shadow-[0_2px_0px_var(--color-border-dark)]">
          🔥 {totalWarmth} Warmth
        </span>
      </div>

      {/* Building Blueprint Map */}
      <div className="blueprint-grid">
        {/* Row 1: Music conservatory & Hidden Garden */}
        {renderRoomCell('music_room', 'col-span-1')}
        {renderRoomCell('garden', 'col-span-1')}

        {/* Row 2: Library & Fireplace Room */}
        {renderRoomCell('bookshelf', 'col-span-1')}
        {renderRoomCell('fireplace', 'col-span-1')}

        {/* Row 3: Foyer spans the whole base */}
        {renderRoomCell('foyer', 'col-span-2')}
      </div>

      {/* Selected Room Details Drawer */}
      <div className="mt-4 min-h-[60px] p-4 rounded-lg border-2 border-[var(--color-border-dark)] bg-[var(--color-cream)] shadow-[0_3px_0px_var(--color-border-dark)] font-sans text-xs transition-all duration-200">
        {selectedRoomId ? (
          <div>
            <div className="flex items-center gap-1.5 font-bold text-[var(--color-dark-walnut)] mb-2">
              <span className="select-none text-base">{ROOM_THEMES[selectedRoomId]?.symbol}</span>
              <span className="capitalize text-sm">{selectedRoomId.replace('_', ' ')}</span>
              {isRoomUnlocked(selectedRoomId) ? (
                <span className="text-[9px] bg-[var(--color-sage)] text-[var(--color-text-light)] px-1.5 py-0.5 rounded ml-1.5 font-sans font-bold select-none">
                  UNLOCKED
                </span>
              ) : (
                <span className="text-[9px] bg-[var(--color-caramel)] text-[var(--color-text-light)] px-1.5 py-0.5 rounded ml-1.5 font-sans font-bold select-none">
                  LOCKED
                </span>
              )}
            </div>
            <p className="text-[var(--color-espresso)] italic mb-3 leading-relaxed">
              {getRoomDescription(selectedRoomId)}
            </p>
            {isRoomUnlocked(selectedRoomId) && (
              <div className="flex flex-col gap-1.5 mt-3">
                <span className="font-bold text-[var(--color-dark-walnut)] text-[11px]">Room Decorations:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.values(DECORATION_DEFINITIONS)
                    .filter((dec) => dec.roomId === selectedRoomId)
                    .map((dec) => {
                      const unlockedDecor = isDecorUnlocked(dec.id, user, totalWarmth);
                      return (
                        <span
                          key={dec.id}
                          title={unlockedDecor ? dec.description : dec.unlockHint}
                          className={`px-2 py-0.5 rounded border-2 transition-all select-none flex items-center gap-1 text-[9px] ${
                            unlockedDecor
                              ? 'bg-[var(--color-cream)] border-[var(--color-border-dark)] text-[var(--color-dark-walnut)] font-bold shadow-[0_2px_0px_var(--color-border-dark)]'
                              : 'bg-[var(--color-cream)]/30 border-dashed border-[var(--color-text-muted)] text-[var(--color-text-muted)] opacity-60'
                          }`}
                        >
                          <span>{dec.icon}</span>
                          <span>{dec.name}</span>
                          {!unlockedDecor && <span title={dec.unlockHint}>🔒</span>}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center italic text-[var(--color-text-muted)] py-2.5 select-none font-bold">
            Click on any blueprint room above to inspect its cozy details.
          </p>
        )}
      </div>
    </div>
  );
};
export default CafeFloorPlan;
