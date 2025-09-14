import React, { useState, useMemo } from 'react';
import type { Post, User, UserConversation, ChatConversation, Circle } from '../types';
import { Role, CircleType, ChatAccess } from '../types';
import { Icon } from './Icon';
import type { View } from '../App';

interface ShareModalProps {
    post: Post;
    currentUser: User;
    userConversations: UserConversation[];
    circleConversations: ChatConversation[];
    circles: Circle[];
    allUsers: User[];
    canCreateStory: boolean;
    onClose: () => void;
    onShareToChat: (postId: string, conversationId: string, conversationType: 'user' | 'circle') => void;
    onSharePostToStory: (post: Post) => void;
    onCopyLink: (postId: string) => void;
    onNativeShare: (postId: string) => void;
    navigate: (view: View) => void;
    onViewProfile: (userId: string) => void;
    shareFeedback: string | null;
}

type CombinedConvo = {
    id: string;
    type: 'user' | 'circle';
    name: string;
    logo: string;
    lastMessageTimestamp: number;
    targetId: string | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ post, currentUser, userConversations, circleConversations, circles, allUsers, canCreateStory, onClose, onShareToChat, onSharePostToStory, onCopyLink, onNativeShare, navigate, onViewProfile, shareFeedback }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sentTo, setSentTo] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'Friends' | 'Circles'>('Friends');
    const [shareError, setShareError] = useState<string | null>(null); // New state for error messages
    
    const postCircle = circles.find(c => c.id === post.circleId);

    const canShareThisPostToStory = canCreateStory && postCircle && (
        postCircle.type === CircleType.Public ||
        (postCircle.type === CircleType.Private && currentUser.friends.includes(post.authorMemberId))
    );

    const friendConvos = useMemo(() => {
        return userConversations
            .filter(c => !c.isRequest)
            .map(convo => {
                const otherId = convo.participants.find(pId => pId !== currentUser.id)!;
                const otherUser = allUsers.find(u => u.id === otherId);
                const lastMessage = convo.messages[convo.messages.length - 1];
                return {
                    id: convo.id,
                    type: 'user' as const,
                    name: otherUser?.name || 'Unknown User',
                    logo: otherUser?.picture || `https://picsum.photos/seed/${otherId}/100`,
                    lastMessageTimestamp: lastMessage ? new Date(lastMessage.timestamp).getTime() : 0,
                    targetId: otherId,
                };
            });
    }, [userConversations, currentUser.id, allUsers]);

    const circleDMs = useMemo(() => {
        return circleConversations
            .filter(convo => convo.participants.some(p => currentUser.memberships.includes(p.circleId)))
            .map(convo => {
                 const lastMessage = convo.messages[convo.messages.length - 1];
                 let name: string, logo: string;

                 if (convo.type === 'Group') {
                    name = convo.name || 'Group Chat';
                    logo = 'https://picsum.photos/seed/group/100';
                 } else {
                    const otherParticipant = convo.participants.find(p => !currentUser.memberships.includes(p.circleId)) || convo.participants[0];
                    const circle = circles.find(c => c.id === otherParticipant.circleId);
                    name = circle?.name || 'Unknown Circle';
                    logo = circle?.logo || '';
                 }

                return {
                    id: convo.id,
                    type: 'circle' as const,
                    name,
                    logo,
                    lastMessageTimestamp: lastMessage ? new Date(lastMessage.timestamp).getTime() : 0,
                    targetId: null,
                };
            });
    }, [circleConversations, currentUser.memberships, circles]);
    
    const combinedList = useMemo(() => {
        const list = activeTab === 'Friends' ? friendConvos : circleDMs;
        const sortedList = list.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
        
        if (!searchQuery) return sortedList;

        return sortedList.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [activeTab, friendConvos, circleDMs, searchQuery]);


    const handleSend = (id: string, type: 'user' | 'circle') => {
        if (type === 'circle') {
            const convo = circleConversations.find(c => c.id === id);
            if (convo) {
                const participantCircleIds = convo.participants.map(p => p.circleId);
                const senderCircleId = currentUser.memberships.find(cId => participantCircleIds.includes(cId));
                if (senderCircleId) {
                    const senderCircle = circles.find(c => c.id === senderCircleId);
                    const senderMember = senderCircle?.members.find(m => m.id === currentUser.id);
                    if (senderMember && senderMember.chatAccess !== ChatAccess.Full) {
                        setShareError("You don't have access to chat in this circle.");
                        window.setTimeout(() => setShareError(null), 3000);
                        return; // Prevent sharing
                    }
                }
            }
        }
        onShareToChat(post.id, id, type);
        setSentTo(prev => [...prev, id]);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end md:items-center justify-center z-50 p-0 md:p-4" onClick={onClose}>
            <div 
                onClick={e => e.stopPropagation()}
                className="bg-brand-surface rounded-t-2xl md:rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[80vh] relative"
            >
                <header className="flex-shrink-0 p-4 border-b border-brand-border text-center relative">
                    <h2 className="text-lg font-bold">Share Post</h2>
                    <button onClick={onClose} className="absolute top-1/2 right-4 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary text-2xl font-light">&times;</button>
                </header>
                
                <div className="flex-shrink-0 p-4 border-b border-brand-border">
                     <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icon name="search" className="w-5 h-5 text-brand-text-secondary" />
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 border-b border-brand-border px-2">
                    <nav className="flex -mb-px">
                        {(['Friends', 'Circles'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 group inline-flex items-center justify-center py-3 border-b-2 font-medium text-sm transition-all ${activeTab === tab ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'}`}>
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {combinedList.map(item => {
                        const isSent = sentTo.includes(item.id);
                        return (
                             <div key={item.id} className="flex items-center gap-3 px-4 py-2">
                                <img src={item.logo} alt={item.name} className="w-10 h-10 rounded-full" />
                                <p className="flex-1 font-semibold truncate">{item.name}</p>
                                <button onClick={() => handleSend(item.id, item.type)} disabled={isSent} className="text-sm font-semibold px-4 py-1.5 rounded-full border border-brand-primary transition-colors disabled:bg-brand-primary disabled:text-white disabled:border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white">
                                    {isSent ? 'Sent' : 'Send'}
                                </button>
                            </div>
                        );
                    })}
                </div>
                
                <footer className="flex-shrink-0 p-4 border-t border-brand-border grid grid-cols-3 gap-2 text-center">
                     <button
                        onClick={() => onSharePostToStory(post)}
                        disabled={!canShareThisPostToStory}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-brand-bg/50 transition-colors disabled:opacity-50"
                    >
                        <Icon name="story-add" className="w-6 h-6 text-brand-primary"/>
                        <span className="text-xs font-semibold">Add to Story</span>
                    </button>
                    <button
                        onClick={() => onCopyLink(post.id)}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-brand-bg/50 transition-colors"
                    >
                        <Icon name="share" className="w-6 h-6 text-brand-text-secondary"/>
                        <span className="text-xs font-semibold">Copy Link</span>
                    </button>
                     <button
                        onClick={() => onNativeShare(post.id)}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-brand-bg/50 transition-colors"
                    >
                        <Icon name="send-alt" className="w-6 h-6 text-brand-text-secondary"/>
                        <span className="text-xs font-semibold">Share via...</span>
                    </button>
                </footer>
                
                {shareFeedback && (
                    <div className="absolute bottom-24 left-1/2 bg-brand-accent text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-feedback-popup">
                        <Icon name="sparkles" className="w-5 h-5" />
                        <span>{shareFeedback}</span>
                    </div>
                )}

                {shareError && (
                    <div className="absolute bottom-24 left-1/2 bg-brand-danger text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-error-popup">
                        <Icon name="user-block" className="w-5 h-5" />
                        <span>{shareError}</span>
                    </div>
                )}
            </div>
        </div>
    );
};