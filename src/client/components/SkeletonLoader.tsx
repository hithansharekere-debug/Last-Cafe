import React from 'react';

interface SkeletonLoaderProps {
  type?: 'feed' | 'profile' | 'floorplan';
  count?: number;
}

export const SkeletonLoader = ({ type = 'feed', count = 3 }: SkeletonLoaderProps) => {
  const renderFeedSkeleton = () => (
    <div className="flex flex-col gap-4 p-4 w-full h-full overflow-hidden">
      {/* Header bar placeholder */}
      <div className="flex flex-col gap-2 w-full mb-2">
        <div className="h-6 w-32 rounded skeleton-pulse" />
        <div className="h-4 w-48 rounded skeleton-pulse" />
      </div>

      {/* Categories skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-7 w-20 rounded-full flex-shrink-0 skeleton-pulse" />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="p-4 rounded border-2 border-[#2c160a] bg-[#eeded1]/20 flex flex-col gap-3"
            style={{ boxShadow: '2px 2px 0px #2c160a' }}
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-16 rounded skeleton-pulse" />
              <div className="h-4 w-24 rounded skeleton-pulse" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-full rounded skeleton-pulse" />
              <div className="h-4 w-5/6 rounded skeleton-pulse" />
            </div>
            <div className="h-3 w-20 rounded skeleton-pulse mt-1" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfileSkeleton = () => (
    <div className="flex flex-col gap-5 p-4 w-full">
      {/* Avatar details */}
      <div className="flex items-center gap-4 py-2">
        <div className="w-16 h-16 rounded-full border-2 border-[#2c160a] skeleton-pulse" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-32 rounded skeleton-pulse" />
          <div className="h-3 w-40 rounded skeleton-pulse" />
        </div>
      </div>

      {/* Stats Cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 rounded border-2 border-[#2c160a] bg-[#fdfaf2] flex flex-col gap-2"
            style={{ boxShadow: '3px 3px 0px #2c160a' }}
          >
            <div className="h-3 w-16 rounded skeleton-pulse" />
            <div className="h-7 w-20 rounded skeleton-pulse" />
          </div>
        ))}
      </div>

      {/* Achievements card skeleton */}
      <div
        className="p-4 rounded border-2 border-[#2c160a] bg-[#eeded1]/30 flex flex-col gap-3"
        style={{ boxShadow: '3px 3px 0px #2c160a' }}
      >
        <div className="h-4 w-32 rounded skeleton-pulse" />
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="w-6 h-6 rounded skeleton-pulse flex-shrink-0" />
              <div className="h-4 w-2/3 rounded skeleton-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFloorPlanSkeleton = () => (
    <div className="flex flex-col gap-3 p-4 w-full">
      <div className="flex justify-between items-center">
        <div className="h-4 w-32 rounded skeleton-pulse" />
        <div className="h-5 w-16 rounded skeleton-pulse" />
      </div>
      <div
        className="h-32 w-full rounded border-2 border-[#2c160a] skeleton-pulse"
        style={{ boxShadow: '3px 3px 0px #2c160a' }}
      />
      <div className="h-10 w-full rounded border border-[#c8a285] skeleton-pulse" />
    </div>
  );

  switch (type) {
    case 'profile':
      return renderProfileSkeleton();
    case 'floorplan':
      return renderFloorPlanSkeleton();
    case 'feed':
    default:
      return renderFeedSkeleton();
  }
};
