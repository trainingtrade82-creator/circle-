import React, { useState, useMemo } from 'react';
import type { User } from '../types';
import { Icon } from './Icon';
import type { View } from '../App';


interface FriendsPageProps {
    currentUser: User;
    allUsers: User[];
    navigate: (view: View) => void;
    onBack: () => void;
    onSendFriendRequest: (receiverId: string) => void;
    onAcceptFriendRequest: (senderId: string) => void;
    onDeclineFriendRequest: (senderId: string) => void;
    onViewProfile: (userId: string) => void;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({ currentUser, allUsers, navigate, onBack, onSendFriendRequest, onAcceptFriendRequest, onDeclineFriendRequest, onViewProfile }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const friends = useMemo(() => allUsers.filter(u => currentUser.friends.includes(u.id)), [allUsers, currentUser.friends]);
    const friendRequesters = useMemo(() => allUsers.filter(u => currentUser.friendRequestsReceived.includes(u.id)), [allUsers, currentUser.friendRequestsReceived]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const lowerCaseQuery = searchQuery.toLowerCase();
        return allUsers.filter(u => {
            const isSelf = u.id === currentUser.id;
            const isFriend = currentUser.friends.includes(u.id);
            const hasSentRequest = currentUser.friendRequestsSent.includes(u.id);
            const hasReceivedRequest = currentUser.friendRequestsReceived.includes(u.id);
            const isBlocked = currentUser.blockedUsers.includes(u.id) || u.blockedUsers.includes(currentUser.id);
            const matchesQuery = u.name.toLowerCase().includes(lowerCaseQuery) || u.username.toLowerCase().includes(lowerCaseQuery);

            return !isSelf && !isFriend && !hasSentRequest && !hasReceivedRequest && !isBlocked && matchesQuery;
        });
    }, [searchQuery, allUsers, currentUser]);

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 flex items-center sticky top-0 bg-brand-surface/80 backdrop-blur-sm z-10 border-b border-brand-border h-16">
                <button onClick={onBack} className="p-1"><Icon name="back" /></button>
                <h1 className="text-xl font-bold text-center flex-1">Friends</h1>
                <div className="w-8"></div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Friend Requests */}
                {friendRequesters.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-bold text-brand-text-secondary">Friend Requests</h3>
                        {friendRequesters.map(user => (
                            <div key={user.id} className="bg-brand-bg border border-brand-border/50 rounded-lg p-3 flex items-center justify-between">
                                <button onClick={() => onViewProfile(user.id)} className="font-semibold hover:underline">{user.name}</button>
                                <div className="flex gap-2">
                                    <button onClick={() => onAcceptFriendRequest(user.id)} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-md hover:bg-green-500/40">Accept</button>
                                    <button onClick={() => onDeclineFriendRequest(user.id)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-md hover:bg-red-500/40">Decline</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Find Friends */}
                 <div className="space-y-3">
                    <h3 className="font-bold text-brand-text-secondary">Find Friends</h3>
                    <div className="relative">
                         <input type="text" placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                    </div>
                    {searchResults.map(user => (
                         <div key={user.id} className="bg-brand-bg border border-brand-border/50 rounded-lg p-3 flex items-center justify-between">
                            <button onClick={() => onViewProfile(user.id)} className="font-semibold hover:underline">{user.name}</button>
                            <button onClick={() => onSendFriendRequest(user.id)} className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md hover:bg-blue-500/40 flex items-center gap-1">
                                <Icon name="user-add" className="w-3 h-3"/> Add
                            </button>
                        </div>
                    ))}
                </div>

                {/* Friends List */}
                <div className="space-y-3">
                     <h3 className="font-bold text-brand-text-secondary">Friends ({friends.length})</h3>
                     {friends.length > 0 ? friends.map(friend => (
                          <button key={friend.id} onClick={() => onViewProfile(friend.id)} className="w-full text-left bg-brand-bg border border-brand-border/50 rounded-lg p-3 flex items-center hover:bg-gray-800/50">
                            <img src={friend.picture || `https://picsum.photos/seed/${friend.id}/100`} alt={friend.name} className="w-10 h-10 rounded-full object-cover" />
                            <div className="ml-3">
                                <p className="font-semibold">{friend.name}</p>
                                <p className="text-sm text-brand-text-secondary">{friend.username}</p>
                            </div>
                        </button>
                     )) : <p className="text-sm text-brand-text-secondary text-center py-4">You haven't added any friends yet.</p>}
                </div>
            </div>
        </div>
    );
};
