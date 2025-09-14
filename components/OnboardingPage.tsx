
import React, { useState, useMemo } from 'react';
import type { Circle, User } from '../types';
import { Icon } from './Icon';

interface OnboardingPageProps {
    currentUser: User;
    circles: Circle[]; 
    onJoinCircle: (circleId: string) => void;
    onLeaveCircle: (circleId: string) => void;
    onFinish: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ currentUser, circles, onJoinCircle, onLeaveCircle, onFinish }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCircles = useMemo(() => {
        if (!searchQuery) return circles;
        return circles.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [circles, searchQuery]);

    const joinedCount = currentUser.memberships.length;
    const canContinue = joinedCount > 0;

    return (
        <div className="bg-brand-bg min-h-screen font-sans text-brand-text-primary flex justify-center items-center p-2 md:p-4">
            <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-brand-surface rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-brand-border">
                <header className="p-4 border-b border-brand-border text-center flex-shrink-0">
                    <h1 className="text-2xl font-bold">Welcome, {currentUser.name}!</h1>
                    <p className="text-brand-text-secondary mt-1">Join a few circles to build your feed.</p>
                </header>

                <div className="p-4 flex-shrink-0">
                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Search for circles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icon name="search" className="w-5 h-5 text-brand-text-secondary" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                    {filteredCircles.length > 0 ? filteredCircles.map(circle => {
                        const isJoined = currentUser.memberships.includes(circle.id);
                        return (
                             <div key={circle.id} className="bg-brand-bg border border-brand-border/50 rounded-lg p-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <img src={circle.logo} alt={circle.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm truncate">{circle.name}</p>
                                        <p className="text-xs text-brand-text-secondary">{circle.members.length} members</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => isJoined ? onLeaveCircle(circle.id) : onJoinCircle(circle.id)} 
                                    className={`px-4 py-1.5 rounded-full font-semibold text-sm transition-colors flex-shrink-0 ${
                                        isJoined 
                                            ? 'bg-brand-surface border border-brand-border text-brand-text-primary hover:bg-brand-danger/20 hover:text-brand-danger hover:border-brand-danger/50' 
                                            : 'bg-brand-primary text-white hover:bg-brand-secondary'
                                    }`}
                                >
                                    {isJoined ? 'Joined' : 'Join'}
                                </button>
                            </div>
                        )
                    }) : (
                        <p className="text-center text-brand-text-secondary py-8">No circles found.</p>
                    )}
                </div>
                
                <footer className="p-4 border-t border-brand-border flex-shrink-0">
                     <button 
                        onClick={onFinish}
                        disabled={!canContinue}
                        className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continue ({joinedCount} joined)
                    </button>
                </footer>
            </div>
        </div>
    );
};
