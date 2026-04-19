import React from 'react';
import { getRankTier } from '@/contexts/DuelContext';

const sizeMap = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-3 py-1  gap-1.5',
  lg: 'text-base px-4 py-2 gap-2',
};

const RankBadge = ({ rating = 1000, size = 'md', showRating = true }) => {
  const tier = getRankTier(rating);
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold
        ${tier.bg} ${tier.color} ${tier.border} ${sizeMap[size]}`}
    >
      <span>{tier.icon}</span>
      <span>{tier.name}</span>
      {showRating && <span className="opacity-60">({rating})</span>}
    </span>
  );
};

export default RankBadge;
