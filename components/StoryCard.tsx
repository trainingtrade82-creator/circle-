import React from 'react';
import type { Circle } from '../types';

interface StoryCardProps {
  circle: Circle;
  hasUnread: boolean;
  onClick: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ circle, hasUnread, onClick }) => {
  // Use the latest story's image for the background, fallback to circle logo
  const latestStory = circle.stories.length > 0 ? circle.stories[circle.stories.length - 1] : null;
  const backgroundUrl = latestStory?.mediaType === 'image' ? latestStory.mediaUrl : circle.logo;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-24 h-32 rounded-lg overflow-hidden relative group shadow-lg transition-transform hover:scale-105"
    >
      {/* Background Image */}
      <img
        src={backgroundUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover filter blur-md scale-110"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
        <img
          src={circle.logo}
          alt={circle.name}
          className={`w-12 h-12 rounded-full object-cover border-2 ${hasUnread ? 'border-brand-primary' : 'border-white/50'} transition-colors`}
        />
        <p className="w-full text-white text-xs font-bold mt-2 truncate" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.9)' }}>
          {circle.name}
        </p>
      </div>
    </button>
  );
};
