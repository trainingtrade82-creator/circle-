import React, { useMemo } from 'react';
import type { User, Circle, Member } from '../types';
import { Role } from '../types';
import { Icon } from './Icon';
import type { View } from '../App';


interface UserProfilePageProps {
    targetUserId: string;
    currentUser: User;
    allUsers: User[];
    circles: Circle[];
    navigate: (view: View) => void;
    onBack: () => void;
    onSendFriendRequest: (receiverId: string) => void;
    onNavigateToChat: (otherUserId: string) => void;
}

const StatButton: React.FC<{ value: number; label: string; onClick: () => void; }> = ({ value, label, onClick }) => (
    <button onClick={onClick} className="text-center hover:bg-brand-bg/50 rounded-md p-2 transition-colors">
        <span className="font-bold text-lg block">{value}</span>
        <span className="text-sm text-brand-text-secondary">{label}</span>
    </button>
);

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ targetUserId, currentUser, allUsers, circles, navigate, onBack, onSendFriendRequest, onNavigateToChat }) => {
    
    const targetUser = useMemo(() => allUsers.find(u => u.id === targetUserId), [allUsers, targetUserId]);

    const relationship = useMemo(() => {
        if (!currentUser || !targetUser) return 'none';
        if (currentUser.id === targetUser.id) return 'self';
        if (currentUser.friends.includes(targetUser.id)) return 'friend';
        if (currentUser.friendRequestsSent.includes(targetUser.id)) return 'requested';
        return 'none';
    }, [currentUser, targetUser]);

    const canViewFullProfile = useMemo(() => {
        if (!targetUser) return false;
        return !targetUser.isPrivate || relationship === 'friend';
    }, [targetUser, relationship]);

    const { createdCount, joinedCount } = useMemo(() => {
        if (!targetUser) return { createdCount: 0, joinedCount: 0 };
        let created = 0;
        let joined = 0;
        circles
            .filter(c => targetUser.memberships.includes(c.id))
            .forEach(circle => {
                const memberInfo = circle.members.find(m => m.id === targetUser.id);
                if (memberInfo) {
                    if (memberInfo.role === Role.Host) created++;
                    else joined++;
                }
            });
        return { createdCount: created, joinedCount: joined };
    }, [circles, targetUser]);

    if (!targetUser) {
        return (
            <div className="flex flex-col h-full">
                <header className="p-4 flex-shrink-0 flex items-center justify-between">
                    <button onClick={onBack} className="p-1"><Icon name="back" /></button>
                </header>
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                     <Icon name="user" className="w-16 h-16 mx-auto text-brand-text-secondary/50" />
                    <h2 className="mt-4 text-xl font-bold">User Not Found</h2>
                    <p className="text-brand-text-secondary mt-2">This user may have been removed or does not exist.</p>
                </div>
            </div>
        );
    }
    
    const renderActionButton = () => {
        switch (relationship) {
            case 'friend':
                return (
                    <button onClick={() => onNavigateToChat(targetUser.id)} className="flex-1 text-sm bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-secondary transition-colors">
                        Message
                    </button>
                );
            case 'requested':
                return (
                    <button disabled className="flex-1 text-sm bg-brand-surface border border-brand-border text-brand-text-secondary font-semibold py-2 px-4 rounded-lg cursor-not-allowed">
                        Requested
                    </button>
                );
            case 'none':
                return (
                     <button onClick={() => onSendFriendRequest(targetUser.id)} className="flex-1 text-sm bg-brand-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-primary transition-colors">
                        Add Friend
                    </button>
                );
            default:
                return null;
        }
    };


    return (
        <div className="flex flex-col h-full">
            <header className="p-4 flex-shrink-0 flex items-center justify-between">
                <button onClick={onBack} className="p-1"><Icon name="back" /></button>
                <h1 className="text-xl font-bold text-center">{targetUser.username}</h1>
                <div className="w-8"></div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                 <div className="flex items-center justify-between">
                    <img src={targetUser.picture || `https://picsum.photos/seed/${targetUser.id}/100`} alt={targetUser.name} className="w-20 h-20 rounded-full object-cover" />
                    <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                       {canViewFullProfile ? (
                           <>
                                <StatButton value={joinedCount} label="Joined" onClick={() => navigate({ type: 'USER_CIRCLES', listOwnerId: targetUser.id, listType: 'joined' })} />
                                <StatButton value={createdCount} label="Created" onClick={() => navigate({ type: 'USER_CIRCLES', listOwnerId: targetUser.id, listType: 'created' })} />
                                <StatButton value={targetUser.friends.length} label="Friends" onClick={() => { /* No-op for other users for now */ }} />
                           </>
                       ) : (
                           <div className="col-span-3 text-brand-text-secondary text-sm">Stats are hidden</div>
                       )}
                    </div>
                </div>

                <div>
                    <h2 className="font-bold text-sm">{targetUser.name}</h2>
                    <p className="text-sm text-brand-text-secondary mt-1 whitespace-pre-wrap">{targetUser.bio}</p>
                </div>
                
                <div className="flex gap-3">
                    {renderActionButton()}
                </div>
                
                {!canViewFullProfile && (
                    <div className="text-center p-8 border-t border-brand-border mt-4">
                        <Icon name="lock" className="w-10 h-10 mx-auto text-brand-text-secondary/50" />
                        <h3 className="mt-4 font-bold">This Account is Private</h3>
                        <p className="text-sm text-brand-text-secondary mt-1">Add them as a friend to see their circles and friends.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
