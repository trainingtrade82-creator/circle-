import React, { useState, useMemo } from 'react';
import type { Circle, User, Member } from '../types';
import { Role } from '../types';
import { roleColors } from '../constants';
import { Icon } from './Icon';
import type { View } from '../App';


interface CirclesPageProps {
    currentUser: User;
    circles: Circle[];
    navigate: (view: View) => void;
    onLeaveCircle: (circleId: string) => void;
}

export const CirclesPage: React.FC<CirclesPageProps> = ({ currentUser, circles, navigate, onLeaveCircle }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const { createdCircles, joinedCircles } = useMemo(() => {
        const created: { circle: Circle; memberInfo: Member }[] = [];
        const joined: { circle: Circle; memberInfo: Member }[] = [];

        circles
            .filter(c => currentUser.memberships.includes(c.id))
            .forEach(circle => {
                const memberInfo = circle.members.find(m => m.id === currentUser.id);
                if (memberInfo) {
                    if (memberInfo.role === Role.Host) {
                        created.push({ circle, memberInfo });
                    } else {
                        joined.push({ circle, memberInfo });
                    }
                }
            });
        
        created.sort((a, b) => a.circle.name.localeCompare(b.circle.name));
        joined.sort((a, b) => a.circle.name.localeCompare(b.circle.name));

        return { createdCircles: created, joinedCircles: joined };
    }, [circles, currentUser]);

    const filteredJoinedCircles = useMemo(() => {
        if (!searchQuery) {
            return joinedCircles;
        }
        return joinedCircles.filter(({ circle }) =>
            circle.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [joinedCircles, searchQuery]);


    return (
        <div className="flex flex-col h-full">
            <header className="p-4 sticky top-0 bg-brand-surface/80 backdrop-blur-sm z-10 border-b border-brand-border">
                <h1 className="text-2xl font-bold text-center">My Circles</h1>
            </header>
            
            <div className="p-4 border-b border-brand-border">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search joined circles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="search" className="w-5 h-5 text-brand-text-secondary" />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
                 {createdCircles.length > 0 && (
                    <div className="p-4 border-b border-brand-border">
                        <h2 className="text-sm font-bold text-brand-text-secondary mb-3">CREATED BY YOU</h2>
                        <div className="flex gap-4 overflow-x-auto pb-2 -mb-2">
                            {createdCircles.map(({ circle }) => (
                                <div 
                                    key={circle.id} 
                                    onClick={() => navigate({ type: 'CIRCLE', id: circle.id })}
                                    className="flex-shrink-0 w-28 text-center cursor-pointer group"
                                >
                                    <img src={circle.logo} alt={circle.name} className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-brand-border group-hover:border-brand-primary transition-colors" />
                                    <p className="text-sm font-semibold mt-2 truncate">{circle.name}</p>
                                </div>
                            ))}
                             <div className="flex-shrink-0 w-1"></div>
                        </div>
                    </div>
                )}
                
                <div className="p-4 space-y-3">
                    {joinedCircles.length > 0 && <h2 className="text-sm font-bold text-brand-text-secondary -mb-1">CIRCLES I'VE JOINED</h2>}
                    {filteredJoinedCircles.length > 0 ? (
                        filteredJoinedCircles.map(({ circle, memberInfo }) => (
                            <div 
                                key={circle.id} 
                                className="bg-brand-surface border border-brand-border rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-brand-border/20 transition-colors duration-200" 
                                onClick={() => navigate({ type: 'CIRCLE', id: circle.id })}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <img src={circle.logo} alt={circle.name} className="w-10 h-10 rounded-full" />
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm truncate">{circle.name}</p>
                                        <p className="text-xs text-brand-text-secondary">{circle.members.length} members</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${roleColors[memberInfo.role]}`}>
                                        {memberInfo.role}
                                    </span>
                                    {memberInfo.role !== Role.Host && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Are you sure you want to leave "${circle.name}"?`)) {
                                                    onLeaveCircle(circle.id);
                                                }
                                            }}
                                            className="p-2 text-brand-text-secondary hover:text-brand-danger transition-colors"
                                            aria-label={`Leave ${circle.name}`}
                                        >
                                            <Icon name="logout" className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="text-center p-10 mt-10">
                            <Icon name="members" className="w-16 h-16 mx-auto text-brand-text-secondary/50" />
                            <h2 className="mt-4 text-xl font-bold">{searchQuery ? 'No Circles Found' : "You haven't joined any circles"}</h2>
                            <p className="text-brand-text-secondary mt-2">
                                {searchQuery ? `Your search for "${searchQuery}" did not match any circles you've joined.` : 'Circles you join will appear here.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};