import React from 'react';
import type { Circle } from '../types';
import { Icon } from './Icon';
import { StoryCard } from './StoryCard';

interface StoryBarProps {
    circles: Circle[];
    currentUserId: string;
    canCreateStory: boolean;
    onViewStory: (circleId: string) => void;
    onOpenCreateStory: () => void;
}

export const StoryBar: React.FC<StoryBarProps> = ({ circles, currentUserId, canCreateStory, onViewStory, onOpenCreateStory }) => {
    
    const AddStoryCard = () => (
        <button 
            onClick={onOpenCreateStory}
            className="flex-shrink-0 w-24 h-32 rounded-lg overflow-hidden relative group bg-brand-surface border-2 border-transparent hover:border-brand-primary transition-all duration-300 shadow-lg hover:scale-105"
        >
             <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-brand-text-secondary group-hover:text-brand-primary transition-colors">
                <div className="w-12 h-12 rounded-full bg-brand-bg border-2 border-dashed border-current flex items-center justify-center">
                    <Icon name="plus" className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold mt-2 text-center">
                    Add Story
                </p>
            </div>
        </button>
    );

    return (
        <div className="flex-shrink-0 border-b border-brand-border">
            <div className="flex gap-4 overflow-x-auto p-4">
                {canCreateStory && <AddStoryCard />}
                {circles.map(circle => {
                    const hasUnread = circle.stories.some(s => !s.viewedBy.includes(currentUserId));
                    return (
                        <StoryCard
                            key={circle.id}
                            circle={circle}
                            hasUnread={hasUnread}
                            onClick={() => onViewStory(circle.id)}
                        />
                    );
                })}
                 <div className="flex-shrink-0 w-1"></div>
            </div>
        </div>
    );
};
