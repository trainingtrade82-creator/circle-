import React, { useMemo } from 'react';
import type { User } from '../types';
import { Icon } from './Icon';

interface BlockedUsersPageProps {
    currentUser: User;
    allUsers: User[];
    onUnblockUser: (userId: string) => void;
    onBack: () => void;
}
export const BlockedUsersPage: React.FC<BlockedUsersPageProps> = ({ currentUser, allUsers, onUnblockUser, onBack }) => {
    const blockedUsersList = useMemo(() => allUsers.filter(u => currentUser.blockedUsers.includes(u.id)), [allUsers, currentUser.blockedUsers]);
    
    return (
         <div className="flex flex-col h-full">
            <header className="p-4 flex items-center sticky top-0 bg-brand-surface/80 backdrop-blur-sm z-10 border-b border-brand-border h-16">
                <button onClick={onBack} className="p-1"><Icon name="back" /></button>
                <h1 className="text-xl font-bold text-center flex-1">Blocked Accounts</h1>
                <div className="w-8"></div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {blockedUsersList.length > 0 ? (
                    blockedUsersList.map(user => (
                        <div key={user.id} className="bg-brand-bg border border-brand-border/50 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={user.picture || `https://picsum.photos/seed/${user.id}/100`} alt={user.name} className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-sm text-brand-text-secondary">{user.username}</p>
                                </div>
                            </div>
                            <button onClick={() => onUnblockUser(user.id)} className="bg-brand-primary text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-brand-secondary transition-colors">Unblock</button>
                        </div>
                    ))
                ) : (
                     <div className="text-center p-10 mt-10">
                        <Icon name="user-block" className="w-16 h-16 mx-auto text-brand-text-secondary/50" />
                        <h2 className="mt-4 text-xl font-bold">No Blocked Accounts</h2>
                        <p className="text-brand-text-secondary mt-2">You haven't blocked anyone yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
