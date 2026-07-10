import React, { useState } from 'react';
import type { Room } from '../../shared/types';

interface CafeFloorPlanProps {
  rooms: Room[];
  totalWarmth: number;
}

const ROOM_THEMES: Record<string, { bg: string; border: string; accentText: string; symbol: string; items: string[] }> = {
  foyer: {
    bg: '#f7edd7', // paper warm beige
    border: '#c8a285',
    accentText: '#5e463a',
    symbol: '🚪',
    items: ['Coat Rack 🧥', 'Welcome Mat 🧹', 'Key Hook 🔑'],
  },
  fireplace: {
    bg: '#eeded1', // foam warm pinkish
    border: '#cf7929', // amber orange
    accentText: '#9b4618',
    symbol: '🔥',
    items: ['Armchairs 🛋️', 'Wood Logs 🪵', 'Teapot 🫖'],
  },
  bookshelf: {
    bg: '#f5ead2', // parchment
    border: '#d4af37', // gold
    accentText: '#8e5a36',
    symbol: '📚',
    items: ['Comfy Rug 🧶', 'Lamps 💡', 'Writing Desk ✍️'],
  },
  garden: {
    bg: '#e1ead4', // soft green
    border: '#4a7c59', // olive
    accentText: '#2e4d37',
    symbol: '🌿',
    items: ['Ivy Vines 🍃', 'Fountain ⛲', 'Benches 🪑'],
  },
  music_room: {
    bg: '#f1edf7', // light lavender
    border: '#9c27b0', // purple
    accentText: '#5e2d6b',
    symbol: '🎵',
    items: ['Grand Piano 🎹', 'Violin Stand 🎻', 'Music Sheets 🎼'],
  },
};

export const CafeFloorPlan = ({ rooms, totalWarmth }: CafeFloorPlanProps) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  return (
    <div className="flex flex-col w-full p-4 rounded border-2 border-[#2c160a] bg-[#f7edd7]/50 shadow-[3px_3px_0px_#2c160a] mb-4">
      <div className="flex justify-between items-center mb-3">
        <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#2c160a]">
          🏛️ Cafe Miniature Map
        </span>
        <span className="font-mono text-[10px] text-[#5e463a] bg-[#eeded1] px-2 py-0.5 rounded border border-[#2c160a] select-none">
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
      <div className="mt-3 min-h-[50px] p-2.5 rounded border border-[#2c160a] bg-[#fdfaf2] font-serif text-xs transition-all duration-200">
        {selectedRoomId ? (
          <div>
            <div className="flex items-center gap-1.5 font-bold text-[#2c160a] mb-1">
              <span>{ROOM_THEMES[selectedRoomId]?.symbol}</span>
              <span className="capitalize">{selectedRoomId.replace('_', ' ')}</span>
              {isUnlocked(selectedRoomId) ? (
                <span className="text-[9px] bg-[#4a7c59] text-white px-1 rounded ml-1 font-mono font-normal">UNLOCKED</span>
              ) : (
                <span className="text-[9px] bg-[#cf7929] text-white px-1 rounded ml-1 font-mono font-normal">LOCKED</span>
              )}
            </div>
            <p className="text-[#5e463a] italic mb-1.5">
              {getRoomDescription(selectedRoomId)}
            </p>
            {isUnlocked(selectedRoomId) && (
              <div className="flex flex-wrap gap-1 mt-1 text-[9px] text-[#2c160a] font-mono">
                <span className="font-bold mr-1">Decorations:</span>
                {ROOM_THEMES[selectedRoomId]?.items.map((item) => (
                  <span key={item} className="bg-[#eeded1] px-1.5 py-0.5 rounded border border-[#c8a285]/40 select-none">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-center italic text-[#c8a285] py-2">
            Click on any blueprint room above to inspect its cozy details.
          </p>
        )}
      </div>
    </div>
  );

  function isUnlocked(roomId: string): boolean {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.isUnlocked : roomId === 'foyer';
  }

  function getRoomThreshold(roomId: string): number {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.threshold : 0;
  }

  function getRoomDescription(roomId: string): string {
    const desc: Record<string, string> = {
      foyer: 'Where every visitor begins their journey. Warm, welcoming entrance.',
      fireplace: 'A crackling hearth where stories are shared on cold evenings. Comfy armchairs arranged near the logs.',
      bookshelf: 'Floor-to-ceiling shelves of dog-eared wisdom and forgotten worlds. Writing desks with dim golden lighting.',
      garden: 'A secret courtyard where things grow quietly in the dark. Climbing ivy leaves and a stone water fountain.',
      music_room: 'An old upright piano, music stands, and sheet music. Soft purple conservatory melodies fill the air.',
    };
    return desc[roomId] || '';
  }

  function renderRoomCell(roomId: string, columnStyle: string) {
    const unlocked = isUnlocked(roomId);
    const theme = ROOM_THEMES[roomId];
    if (!theme) return null;

    const isSelected = selectedRoomId === roomId;

    return (
      <div
        key={roomId}
        onClick={() => setSelectedRoomId(roomId)}
        className={`blueprint-room ${columnStyle} cursor-pointer ${unlocked ? 'unlocked' : 'locked'} ${
          isSelected ? 'ring-2 ring-[#cf7929]' : ''
        }`}
        style={{
          backgroundColor: unlocked ? theme.bg : '#8e8076',
          borderColor: unlocked ? theme.border : '#2c160a',
          gridColumn: columnStyle.includes('col-span-2') ? 'span 2' : 'span 1',
        }}
      >
        <div className="flex justify-between items-start w-full">
          <span className="font-serif font-bold text-[10px]" style={{ color: unlocked ? theme.accentText : '#2c160a' }}>
            {roomId.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-xs select-none">
            {unlocked ? theme.symbol : '🔒'}
          </span>
        </div>

        <div className="mt-2.5 flex justify-between items-center w-full">
          {unlocked ? (
            <div className="flex gap-1 overflow-hidden select-none">
              {theme.items.slice(0, 2).map((item) => (
                <span key={item} className="text-xs animate-float" style={{ animationDelay: `${Math.random() * 2}s` }}>
                  {item.split(' ').pop()}
                </span>
              ))}
            </div>
          ) : (
            <span className="font-mono text-[9px] text-[#2c160a] bg-[#eeded1]/40 px-1 rounded select-none">
              {getRoomThreshold(roomId)} warmth
            </span>
          )}
        </div>
      </div>
    );
  }
};
