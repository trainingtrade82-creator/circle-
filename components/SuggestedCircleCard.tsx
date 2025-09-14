import React from 'react';
import type { Circle } from '../types';
import { Icon } from './Icon';

interface SuggestedCircleCardProps {
  circle: Circle;
  onSelect: () => void;
}

export const SuggestedCircleCard: React.FC<SuggestedCircleCardProps> = ({ circle, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className="flex-shrink-0 w-36 cursor-pointer group"
    >
      <div className="relative">
        <img
          src={circle.logo}
          alt={circle.name}
          className="w-36 h-36 rounded-lg object-cover mb-2 transition-transform group-hover:scale-105 border border-brand-border"
        />
      </div>
      <h4 className="font-bold text-sm truncate text-brand-text-primary">{circle.name}</h4>
      <p className="text-xs text-brand-text-secondary flex items-center gap-1">
        <Icon name="members" className="w-3 h-3" />
        {circle.members.length} members
      </p>
    </div>
  );
};
