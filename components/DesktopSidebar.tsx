import React, { useMemo } from 'react';
import { Icon } from './Icon';
import type { User, Circle } from '../types';
import type { View } from '../App';
import { CircleCard } from './CircleCard';

interface DesktopSidebarProps {
    currentUser: User;
    circles: Circle[];
    navigate: (view: View) => void;
    onJoinCircle: (circleId: string) => void;
    onLeaveCircle: (circleId: string) => void;
    onRequestToJoinCircle: (circleId: string) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = (props) => {
    const { currentUser, circles, navigate, onJoinCircle, onLeaveCircle, onRequestToJoinCircle } = props;

    const suggestedCircles = useMemo(() => {
        return circles
            .filter(c => !currentUser.memberships.includes(c.id))
            .sort((a, b) => b.members.length - a.members.length)
            .slice(0, 3); // Show top 3 suggestions
    }, [circles, currentUser.memberships]);

    return (
        <aside className="hidden lg:flex flex-col w-[350px] px-6 h-screen sticky top-0 py-2 gap-4">
            <div className="relative mt-1">
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-brand-surface border border-brand-border rounded-full px-4 py-3 pl-12 focus:outline-none focus:ring-1 focus:ring-brand-primary text-sm"
                    onFocus={() => navigate({ type: 'EXPLORE' })}
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon name="search" className="w-5 h-5 text-brand-text-secondary" />
                </div>
            </div>

            {suggestedCircles.length > 0 && (
                <div className="bg-brand-surface rounded-xl border border-brand-border">
                    <h2 className="text-xl font-bold p-4">You might like</h2>
                    <div className="flex flex-col">
                        {suggestedCircles.map(circle => (
                           <div key={circle.id} className="px-2 pb-2">
                             <CircleCard
                                circle={circle}
                                onSelect={() => navigate({ type: 'CIRCLE', id: circle.id })}
                                currentUser={currentUser}
                                onJoin={onJoinCircle}
                                onLeave={onLeaveCircle}
                                onRequestToJoin={onRequestToJoinCircle}
                            />
                           </div>
                        ))}
                    </div>
                     <button onClick={() => navigate({ type: 'EXPLORE' })} className="w-full text-left p-4 text-sm text-brand-primary hover:bg-brand-bg rounded-b-lg transition-colors">
                        Show more
                    </button>
                </div>
            )}
        </aside>
    );
};