import React, { useMemo } from 'react';
import type { ChatConversation, Circle, User, UserConversation } from '../types';
import { ChatConversationType } from '../types';
import { Icon } from './Icon';
import type { View } from '../App';

type ActiveTab = 'Circles' | 'Friends' | 'Requests';

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.floor(minutes)}m`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.floor(hours)}h`;
    const days = hours / 24;
    return `${Math.floor(days)}d`;
};

interface ChatListPageProps {
    circleConversations: ChatConversation[];
    userConversations: UserConversation[];
    currentUser: User;
    allUsers: User[];
    circles: Circle[];
    navigate: (view: View) => void;
    onBack: () => void;
    activeTab: ActiveTab;
    onTabChange: (tab: ActiveTab) => void;
    unreadCircleCount: number;
    unreadFriendCount: number;
    unreadRequestCount: number;
    onMarkRequestsAsRead: () => void;
}

export const ChatListPage: React.FC<ChatListPageProps> = ({ circleConversations, userConversations, currentUser, allUsers, circles, navigate, onBack, activeTab, onTabChange, unreadCircleCount, unreadFriendCount, unreadRequestCount, onMarkRequestsAsRead }) => {
    
    const sortedCircleConvos = useMemo(() => {
        return circleConversations
            .filter(convo => convo.participants.some(p => currentUser.memberships.includes(p.circleId)))
            .map(convo => ({ ...convo, lastMessage: convo.messages[convo.messages.length - 1] }))
            .sort((a, b) => (b.lastMessage?.timestamp.getTime() || 0) - (a.lastMessage?.timestamp.getTime() || 0));
    }, [circleConversations, currentUser.memberships]);

    const friendConvos = useMemo(() => userConversations.filter(c => !c.isRequest && c.participants.includes(currentUser.id))
        .map(convo => ({ ...convo, lastMessage: convo.messages[convo.messages.length - 1] }))
        .sort((a, b) => (b.lastMessage?.timestamp.getTime() || 0) - (a.lastMessage?.timestamp.getTime() || 0)), [userConversations, currentUser.id]);

    const requestConvos = useMemo(() => userConversations.filter(c => c.isRequest && c.participants.includes(currentUser.id))
        .map(convo => ({ ...convo, lastMessage: convo.messages[convo.messages.length - 1] }))
        .sort((a, b) => (b.lastMessage?.timestamp.getTime() || 0) - (a.lastMessage?.timestamp.getTime() || 0)), [userConversations, currentUser.id]);

    const getCircleChatDisplayData = (convo: ChatConversation) => {
        if (convo.type === ChatConversationType.Group) return { name: convo.name || 'Group Chat', logo: 'https://picsum.photos/seed/group/100' };
        const otherP = convo.participants.find(p => !currentUser.memberships.includes(p.circleId)) || convo.participants[0];
        const otherC = circles.find(c => c.id === otherP.circleId);
        return { name: otherC?.name || 'Unknown', logo: otherC?.logo || '' };
    };

    const getUserChatDisplayData = (convo: UserConversation) => {
        const otherId = convo.participants.find(pId => pId !== currentUser.id)!;
        const otherUser = allUsers.find(u => u.id === otherId);
        return { name: otherUser?.name || 'Unknown User', picture: otherUser?.picture || `https://picsum.photos/seed/${otherId}/100` };
    };

    const handleTabChange = (tab: ActiveTab) => {
        if (tab === 'Requests') {
            onMarkRequestsAsRead();
        }
        onTabChange(tab);
    };
    
    const renderList = () => {
        if (activeTab === 'Circles') {
            if (sortedCircleConvos.length === 0) return <EmptyState type="Circles" />;
            return sortedCircleConvos.map(convo => {
                const display = getCircleChatDisplayData(convo);
                const lastMsg = convo.lastMessage;
                return <ChatItem key={convo.id} id={convo.id} logo={display.logo} name={display.name} lastMessage={lastMsg?.content} lastMessagePrefix={lastMsg?.senderMemberId === currentUser.id ? 'You: ' : ''} timestamp={lastMsg?.timestamp} navigate={navigate} />;
            });
        }
        if (activeTab === 'Friends') {
            if (friendConvos.length === 0) return <EmptyState type="Friends" />;
            return friendConvos.map(convo => {
                const display = getUserChatDisplayData(convo);
                const lastMsg = convo.lastMessage;
                return <ChatItem key={convo.id} id={convo.id} logo={display.picture} name={display.name} lastMessage={lastMsg?.content} lastMessagePrefix={lastMsg?.senderId === currentUser.id ? 'You: ' : ''} timestamp={lastMsg?.timestamp} navigate={navigate} />;
            });
        }
        if (activeTab === 'Requests') {
             if (requestConvos.length === 0) return <EmptyState type="Requests" />;
            return requestConvos.map(convo => {
                const display = getUserChatDisplayData(convo);
                const lastMsg = convo.lastMessage;
                return <ChatItem key={convo.id} id={convo.id} logo={display.picture} name={display.name} lastMessage={lastMsg?.content} timestamp={lastMsg?.timestamp} navigate={navigate} />;
            });
        }
    };

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 flex justify-between items-center sticky top-0 bg-brand-surface/80 backdrop-blur-sm z-10 border-b border-brand-border h-16">
                <button onClick={onBack} className="p-1"><Icon name="back" /></button>
                <h1 className="text-xl font-bold">Chats</h1>
                <div className="w-8"></div>
            </header>
            
            <div className="border-b border-brand-border px-2">
                <nav className="flex -mb-px">
                    {(['Circles', 'Friends', 'Requests'] as ActiveTab[]).map(tab => {
                        const getUnreadStatus = () => {
                            if (tab === 'Circles') return unreadCircleCount > 0;
                            if (tab === 'Friends') return unreadFriendCount > 0;
                            if (tab === 'Requests') return unreadRequestCount > 0;
                            return false;
                        };
                        const hasUnread = getUnreadStatus();
                        return (
                            <button key={tab} onClick={() => handleTabChange(tab)} className={`flex-1 group inline-flex items-center justify-center py-3 border-b-2 font-medium text-sm transition-all ${activeTab === tab ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'}`}>
                                {tab}
                                {hasUnread && <span className="ml-2 w-2 h-2 bg-brand-primary rounded-full animate-pulse"></span>}
                            </button>
                        )
                    })}
                </nav>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">{renderList()}</div>
        </div>
    );
};

const ChatItem = ({ id, logo, name, lastMessage, timestamp, navigate, lastMessagePrefix }: { id: string, logo: string, name: string, lastMessage?: string, timestamp?: Date, navigate: (v: View) => void, lastMessagePrefix?: string }) => (
    <div onClick={() => navigate({ type: 'CONVERSATION', id })} className="flex items-center gap-3 p-3 cursor-pointer bg-brand-surface rounded-lg hover:bg-brand-bg/50">
        <img src={logo} alt={name} className="w-14 h-14 rounded-full flex-shrink-0 object-cover" />
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
                <p className="font-semibold truncate">{name}</p>
                {timestamp && <p className="text-xs text-brand-text-secondary flex-shrink-0 ml-2">{timeAgo(timestamp)}</p>}
            </div>
            <p className="text-sm text-brand-text-secondary truncate">{lastMessage ? `${lastMessagePrefix || ''}${lastMessage}` : 'No messages yet'}</p>
        </div>
    </div>
);

const EmptyState = ({ type }: { type: ActiveTab }) => {
    const messages = {
        Circles: { title: "No Circle Chats", subtitle: "Chats from your circles will appear here." },
        Friends: { title: "No Messages", subtitle: "Start a conversation with your friends." },
        Requests: { title: "No Message Requests", subtitle: "Requests from new people will show up here." }
    };
    return (
        <div className="text-center p-10 mt-10">
            <Icon name="comment" className="w-16 h-16 mx-auto text-brand-text-secondary/50" />
            <h2 className="mt-4 text-xl font-bold">{messages[type].title}</h2>
            <p className="text-brand-text-secondary mt-2">{messages[type].subtitle}</p>
        </div>
    );
};