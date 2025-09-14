import React, { useMemo } from 'react';
import type { User, Circle, Member } from '../types';
import { Role } from '../types';
import { Icon } from './Icon';
import type { View } from '../App';

interface AccountPageProps {
    currentUser: User;
    circles: Circle[];
    onLogout: () => void;
    onEditProfile: () => void;
    navigate: (view: View) => void;
}

const StatButton: React.FC<{ value: number; label: string; onClick: () => void; }> = ({ value, label, onClick }) => (
    <button onClick={onClick} className="text-center hover:bg-brand-bg/50 rounded-md p-2 transition-colors">
        <span className="font-bold text-lg block">{value}</span>
        <span className="text-sm text-brand-text-secondary">{label}</span>
    </button>
);

export const AccountPage: React.FC<AccountPageProps> = ({ currentUser, circles, onLogout, onEditProfile, navigate }) => {

    const { createdCount, joinedCount } = useMemo(() => {
        let created = 0;
        let joined = 0;

        circles
            .filter(c => currentUser.memberships.includes(c.id))
            .forEach(circle => {
                const memberInfo = circle.members.find(m => m.id === currentUser.id);
                if (memberInfo) {
                    if (memberInfo.role === Role.Host) {
                        created++;
                    } else {
                        joined++;
                    }
                }
            });
        
        return { createdCount: created, joinedCount: joined };
    }, [circles, currentUser]);

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 flex-shrink-0 flex items-center justify-between">
                <div className="w-8"></div>
                <h1 className="text-xl font-bold text-center">{currentUser.username}</h1>
                <button onClick={() => navigate({ type: 'SETTINGS' })} className="p-1 text-brand-text-primary hover:text-brand-primary transition-colors">
                    <Icon name="settings" className="w-6 h-6" />
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20 md:pb-4">
                 <div className="flex items-center justify-between">
                    <img src={currentUser.picture || `https://picsum.photos/seed/${currentUser.id}/100`} alt={currentUser.name} className="w-20 h-20 rounded-full object-cover" />
                    <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                        <StatButton value={joinedCount} label="Joined" onClick={() => navigate({ type: 'USER_CIRCLES', listOwnerId: currentUser.id, listType: 'joined' })} />
                        <StatButton value={createdCount} label="Created" onClick={() => navigate({ type: 'USER_CIRCLES', listOwnerId: currentUser.id, listType: 'created' })} />
                        <StatButton value={currentUser.friends.length} label="Friends" onClick={() => navigate({ type: 'FRIENDS' })}/>
                    </div>
                </div>

                <div>
                    <h2 className="font-bold text-sm">{currentUser.name}</h2>
                    <p className="text-sm text-brand-text-secondary mt-1 whitespace-pre-wrap">{currentUser.bio}</p>
                </div>
                
                <div className="flex gap-3">
                     <button onClick={onEditProfile} className="flex-1 text-sm bg-brand-surface border border-brand-border font-semibold py-2 px-4 rounded-lg hover:bg-brand-border/20 transition-colors">
                        Edit Profile
                    </button>
                </div>

            </div>
        </div>
    );
};