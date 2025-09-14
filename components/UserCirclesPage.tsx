import React, { useMemo } from 'react';
import type { User, Circle, Member } from '../types';
import { Role } from '../types';
import { Icon } from './Icon';
import type { View } from '../App';

interface UserCirclesPageProps {
    listOwner: User;
    currentUser: User;
    circles: Circle[];
    listType: 'joined' | 'created';
    navigate: (view: View) => void;
    onBack: () => void;
}

export const UserCirclesPage: React.FC<UserCirclesPageProps> = ({ listOwner, currentUser, circles, listType, navigate, onBack }) => {
    
    const isCurrentUser = listOwner.id === currentUser.id;

    const { circleList, title } = useMemo(() => {
        const myCircleMemberships = circles
            .filter(c => listOwner.memberships.includes(c.id))
            .map(circle => {
                const memberInfo = circle.members.find(m => m.id === listOwner.id);
                return { circle, memberInfo };
            })
            .filter(item => item.memberInfo) as { circle: Circle, memberInfo: Member }[];

        if (listType === 'created') {
            return {
                title: isCurrentUser ? 'Circles You Created' : `${listOwner.name}'s Circles`,
                circleList: myCircleMemberships.filter(item => item.memberInfo.role === Role.Host)
            };
        } else {
             return {
                title: isCurrentUser ? 'Circles You Joined' : `${listOwner.name}'s Circles`,
                circleList: myCircleMemberships.filter(item => item.memberInfo.role !== Role.Host)
            };
        }
    }, [circles, listOwner, listType, isCurrentUser]);

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 flex items-center sticky top-0 bg-brand-surface/80 backdrop-blur-sm z-10 border-b border-brand-border h-16">
                <button onClick={onBack} className="p-1"><Icon name="back" /></button>
                <h1 className="text-xl font-bold text-center flex-1">{title}</h1>
                <div className="w-8"></div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {circleList.length > 0 ? (
                    circleList.map(({ circle }) => (
                         <div 
                            key={circle.id} 
                            onClick={() => navigate({ type: 'CIRCLE', id: circle.id })}
                            className="bg-brand-surface border border-brand-border rounded-lg p-3 flex items-center space-x-4 cursor-pointer hover:bg-gray-800/50 transition-colors duration-200"
                        >
                            <img src={circle.logo} alt={`${circle.name} logo`} className="w-12 h-12 rounded-full flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{circle.name}</p>
                                <p className="text-sm text-brand-text-secondary truncate">{circle.members.length} members</p>
                            </div>
                        </div>
                    ))
                ) : (
                     <div className="text-center p-10 mt-10">
                        <Icon name="members" className="w-16 h-16 mx-auto text-brand-text-secondary/50" />
                        <h2 className="mt-4 text-xl font-bold">No Circles Here</h2>
                        <p className="text-brand-text-secondary mt-2">
                           {listType === 'created' ? "This user hasn't created any circles." : "This user hasn't joined any circles."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
