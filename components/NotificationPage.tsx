

import React, { useState, useMemo, useEffect } from 'react';
import type { Notification, User, Circle, Post } from '../types';
import { NotificationType, ChatAccess } from '../types';
import { Icon } from './Icon';
import type { View } from '../App';

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `now`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.floor(minutes)}m`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.floor(hours)}h`;
    const days = hours / 24;
    return `${Math.floor(days)}d`;
};

interface NotificationPageProps {
    currentUser: User;
    notifications: Notification[];
    allUsers: User[];
    circles: Circle[];
    allPosts: Post[];
    navigate: (view: View) => void;
    onBack: () => void;
    onAcceptFriendRequest: (senderId: string) => void;
    onDeclineFriendRequest: (senderId: string) => void;
    onApproveCircleRequest: (circleId: string, userId: string) => void;
    onDenyCircleRequest: (circleId: string, userId: string) => void;
    onApprovePromotion: (circleId: string, userId: string) => void;
    onDenyPromotion: (circleId: string, userId: string) => void;
    onApproveChatAccess: (circleId: string, userId: string, accessLevel: ChatAccess) => void;
    onDenyChatAccess: (circleId: string, userId: string) => void;
    onViewProfile: (userId: string) => void;
    onCreateStoryFromSuggestion: (circleId: string, postId: string) => void;
    onDismissStorySuggestion: (circleId: string, postId: string) => void;
    onHandleNotificationAction: (notificationId: string, result: 'handled' | 'denied') => void;
    unreadRequestCount: number;
    unreadActivityCount: number;
    onMarkAsRead: (category: 'requests' | 'activity' | 'all') => void;
}

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
};

type ActiveTab = 'All' | 'Requests' | 'Activity';

const groupNotifications = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {};
    const today = new Date();

    notifications.forEach(notification => {
        const date = new Date(notification.timestamp);
        let key: string;

        if (isSameDay(date, today)) {
            key = 'Today';
        } else if (isYesterday(date)) {
            key = 'Yesterday';
        } else {
            key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        }

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(notification);
    });
    return groups;
};

const NotificationItem: React.FC<Omit<NotificationPageProps, 'notifications' | 'onBack' | 'unreadRequestCount' | 'unreadActivityCount' | 'onMarkAsRead'> & { notification: Notification }> = (props) => {
    const { notification, allUsers, circles, allPosts, onViewProfile, onAcceptFriendRequest, onDeclineFriendRequest, onApproveCircleRequest, onDenyCircleRequest, onHandleNotificationAction, onApprovePromotion, onDenyPromotion, onApproveChatAccess, onDenyChatAccess, onCreateStoryFromSuggestion, onDismissStorySuggestion } = props;
    
    const actor = useMemo(() => allUsers.find(u => u.id === notification.actorUserId), [allUsers, notification.actorUserId]);
    
    if (!actor) return null;

    let content = null;
    switch (notification.type) {
        case NotificationType.FRIEND_REQUEST:
            content = <Request notification={notification} actor={actor} onAccept={() => onAcceptFriendRequest(actor.id)} onDecline={() => onDeclineFriendRequest(actor.id)} onAction={onHandleNotificationAction} message="sent you a friend request." />;
            break;
        case NotificationType.CIRCLE_JOIN_REQUEST:
            const circleForJoin = circles.find(c => c.id === notification.entityId);
            if (!circleForJoin) break;
            content = <Request notification={notification} actor={actor} onAccept={() => onApproveCircleRequest(circleForJoin.id, actor.id)} onDecline={() => onDenyCircleRequest(circleForJoin.id, actor.id)} onAction={onHandleNotificationAction} message={`wants to join ${circleForJoin.name}.`} />;
            break;
        case NotificationType.CIRCLE_PROMOTION_REQUEST:
             const circleForPromo = circles.find(c => c.id === notification.entityId);
             if (!circleForPromo) break;
             content = <Request notification={notification} actor={actor} onAccept={() => onApprovePromotion(circleForPromo.id, actor.id)} onDecline={() => onDenyPromotion(circleForPromo.id, actor.id)} onAction={onHandleNotificationAction} message={`wants to be a Contributor in ${circleForPromo.name}.`} />;
            break;
        case NotificationType.CIRCLE_CHAT_ACCESS_REQUEST:
            const circleForChat = circles.find(c => c.id === notification.entityId);
            if (!circleForChat) break;
            content = <ChatAccessRequest notification={notification} actor={actor} onApprove={(access) => onApproveChatAccess(circleForChat.id, actor.id, access)} onDecline={() => onDenyChatAccess(circleForChat.id, actor.id)} onAction={onHandleNotificationAction} message={`requests chat access in ${circleForChat.name}.`} />;
            break;
        case NotificationType.STORY_SUGGESTION:
            const circleForStory = circles.find(c => c.id === notification.entityId);
            const postForStory = allPosts.find(p => p.id === notification.message);
            if (!circleForStory || !postForStory) break;
            content = <StorySuggestionRequest notification={notification} actor={actor} circle={circleForStory} post={postForStory} onCreate={() => onCreateStoryFromSuggestion(circleForStory.id, postForStory.id)} onDismiss={() => onDismissStorySuggestion(circleForStory.id, postForStory.id)} onAction={onHandleNotificationAction} />;
            break;
        default:
             content = <Message notification={notification} actor={actor} circles={circles} allPosts={allPosts} />;
            break;
    }

    if (!content) return null;

    return (
        <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-lg min-h-[64px]">
            <button onClick={() => onViewProfile(actor.id)} className="flex-shrink-0 self-start">
                <img src={actor.picture || `https://picsum.photos/seed/${actor.id}/100`} alt={actor.name} className="w-10 h-10 rounded-full object-cover" />
            </button>
            <div className="flex-1 min-w-0">
                {content}
            </div>
        </div>
    );
};

const Message: React.FC<{ notification: Notification, actor: User, circles: Circle[], allPosts: Post[] }> = ({ notification, actor, circles, allPosts }) => {
    let messageText = "did something.";
    let postPreview: Post | null = null;
    
    const getEntityName = (type: NotificationType, entityId: string): string => {
        if (type === NotificationType.POST_LIKE || type === NotificationType.POST_COMMENT) {
            const post = allPosts.find(p => p.id === entityId);
            postPreview = post || null;
            const circle = circles.find(c => c.id === post?.circleId);
            return circle ? `in ${circle.name}` : '';
        }
        const circle = circles.find(c => c.id === entityId);
        return circle ? `in ${circle.name}`: '';
    }

    switch (notification.type) {
        case NotificationType.POST_LIKE:
            messageText = `liked your post ${getEntityName(notification.type, notification.entityId)}.`;
            break;
        case NotificationType.POST_COMMENT:
            messageText = `commented on your post ${getEntityName(notification.type, notification.entityId)}: "${notification.message}"`;
            break;
        case NotificationType.FRIEND_ACCEPT:
            messageText = "accepted your friend request.";
            break;
        case NotificationType.CIRCLE_REQUEST_APPROVED:
            messageText = `approved your request to join ${circles.find(c=>c.id === notification.entityId)?.name || 'a circle'}.`;
            break;
        case NotificationType.PROMOTION_APPROVED:
             messageText = `promoted you to Contributor in ${circles.find(c=>c.id === notification.entityId)?.name || 'a circle'}.`;
            break;
        case NotificationType.CHAT_ACCESS_GRANTED:
            messageText = `granted you chat access in ${circles.find(c=>c.id === notification.entityId)?.name || 'a circle'}.`;
            break;
        case NotificationType.STORY_REACTION:
            messageText = `reacted ${notification.message} to your story.`;
            break;
        case NotificationType.POST_SHARED_TO_STORY:
             messageText = `shared your post to their story.`;
             postPreview = allPosts.find(p => p.id === notification.entityId) || null;
            break;
    }

    return (
        <div>
            <p className="text-sm text-brand-text-primary">
                <span className="font-bold">{actor.name}</span> {messageText}
            </p>
            {postPreview && postPreview.imageUrl && (
                <img src={postPreview.imageUrl} alt="Post preview" className="mt-2 w-16 h-16 rounded object-cover" />
            )}
            <p className="text-xs text-brand-text-secondary mt-0.5">{timeAgo(notification.timestamp)}</p>
        </div>
    );
};

const Request: React.FC<{ notification: Notification, actor: User, message: string, onAccept: () => void, onDecline: () => void, onAction: (id: string, result: 'handled' | 'denied') => void }> = ({ notification, actor, message, onAccept, onDecline, onAction }) => {
    
    const handleAccept = () => {
        onAccept();
        onAction(notification.id, 'handled');
    };

    const handleDecline = () => {
        onDecline();
        onAction(notification.id, 'denied');
    };

    return (
        <div>
            <p className="text-sm text-brand-text-primary mb-2">
                <span className="font-bold">{actor.name}</span> {message}
            </p>
            {notification.actionState ? (
                <p className="text-xs font-semibold text-brand-text-secondary">{notification.actionState === 'handled' ? 'Accepted' : 'Declined'}</p>
            ) : (
                <div className="flex gap-2">
                    <button onClick={handleAccept} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-md hover:bg-green-500/40">Accept</button>
                    <button onClick={handleDecline} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-md hover:bg-red-500/40">Decline</button>
                </div>
            )}
        </div>
    );
};

const ChatAccessRequest: React.FC<{ notification: Notification, actor: User, message: string, onApprove: (access: ChatAccess) => void, onDecline: () => void, onAction: (id: string, result: 'handled' | 'denied') => void }> = ({ notification, actor, message, onApprove, onDecline, onAction }) => {
    
    const handleApprove = (access: ChatAccess) => {
        onApprove(access);
        onAction(notification.id, 'handled');
    };

    const handleDecline = () => {
        onDecline();
        onAction(notification.id, 'denied');
    };

    return (
        <div>
            <p className="text-sm text-brand-text-primary mb-2">
                <span className="font-bold">{actor.name}</span> {message}
            </p>
            {notification.actionState ? (
                <p className="text-xs font-semibold text-brand-text-secondary">{notification.actionState === 'handled' ? 'Handled' : 'Declined'}</p>
            ) : (
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleApprove(ChatAccess.Full)} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-md hover:bg-green-500/40">Approve (Full)</button>
                    <button onClick={() => handleApprove(ChatAccess.ReadOnly)} className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md hover:bg-blue-500/40">Approve (Read-Only)</button>
                    <button onClick={handleDecline} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-md hover:bg-red-500/40">Decline</button>
                </div>
            )}
        </div>
    );
};

const StorySuggestionRequest: React.FC<{ notification: Notification, actor: User, circle: Circle, post: Post, onCreate: () => void, onDismiss: () => void, onAction: (id: string, result: 'handled' | 'denied') => void }> = (props) => {
    const { notification, actor, circle, post, onCreate, onDismiss, onAction } = props;

    const handleCreate = () => {
        onCreate();
        onAction(notification.id, 'handled');
    };
    const handleDismiss = () => {
        onDismiss();
        onAction(notification.id, 'denied');
    };

     return (
        <div>
            <p className="text-sm text-brand-text-primary mb-2">
                <span className="font-bold">{actor.name}</span> suggested a post for {circle.name}'s story.
            </p>
            <div className="flex gap-3 mb-2">
                <img src={post.imageUrl} alt="Post preview" className="w-16 h-16 rounded object-cover" />
                <p className="text-xs text-brand-text-secondary line-clamp-4">{post.content}</p>
            </div>
            {notification.actionState ? (
                <p className="text-xs font-semibold text-brand-text-secondary">{notification.actionState === 'handled' ? 'Added to Story' : 'Dismissed'}</p>
            ) : (
                 <div className="flex gap-2">
                    <button onClick={handleCreate} className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md hover:bg-blue-500/40">Create Story</button>
                    <button onClick={handleDismiss} className="text-xs bg-gray-500/20 text-gray-400 px-3 py-1 rounded-md hover:bg-gray-500/40">Dismiss</button>
                </div>
            )}
        </div>
    );
}

export const NotificationPage: React.FC<NotificationPageProps> = (props) => {
    const { notifications, onBack, unreadRequestCount, unreadActivityCount, onMarkAsRead } = props;
    const [activeTab, setActiveTab] = useState<ActiveTab>('All');

    useEffect(() => {
        if (activeTab === 'All') {
            onMarkAsRead('all');
        } else if (activeTab === 'Requests') {
            onMarkAsRead('requests');
        } else if (activeTab === 'Activity') {
            onMarkAsRead('activity');
        }
    }, [activeTab, onMarkAsRead]);

    const { requestNotifications, activityNotifications } = useMemo(() => {
        const requests: Notification[] = [];
        const activity: Notification[] = [];
        const requestTypes = [
            NotificationType.FRIEND_REQUEST,
            NotificationType.CIRCLE_JOIN_REQUEST,
            NotificationType.CIRCLE_PROMOTION_REQUEST,
            NotificationType.CIRCLE_CHAT_ACCESS_REQUEST,
            NotificationType.STORY_SUGGESTION
        ];
        notifications.forEach(n => {
            if (requestTypes.includes(n.type)) {
                requests.push(n);
            } else {
                activity.push(n);
            }
        });
        return { 
            requestNotifications: requests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), 
            activityNotifications: activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        };
    }, [notifications]);

    const notificationsToDisplay = useMemo(() => {
        if (activeTab === 'Requests') return requestNotifications;
        if (activeTab === 'Activity') return activityNotifications;
        return [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [activeTab, requestNotifications, activityNotifications, notifications]);
    
    const groupedNotifications = useMemo(() => groupNotifications(notificationsToDisplay), [notificationsToDisplay]);
    const groupOrder = ['Today', 'Yesterday', ...Object.keys(groupedNotifications).filter(k => k !== 'Today' && k !== 'Yesterday').sort((a,b) => new Date(b).getTime() - new Date(a).getTime())];

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 flex items-center sticky top-0 bg-brand-surface/80 backdrop-blur-sm z-10 border-b border-brand-border h-16">
                <button onClick={onBack} className="p-1"><Icon name="back" /></button>
                <h1 className="text-xl font-bold text-center flex-1">Notifications</h1>
                <div className="w-8"></div>
            </header>

            <div className="border-b border-brand-border px-2 flex-shrink-0">
                <nav className="flex -mb-px">
                    {(['All', 'Requests', 'Activity'] as ActiveTab[]).map(tab => {
                         const getUnreadStatus = () => {
                            if (tab === 'All') return unreadRequestCount > 0 || unreadActivityCount > 0;
                            if (tab === 'Requests') return unreadRequestCount > 0;
                            if (tab === 'Activity') return unreadActivityCount > 0;
                            return false;
                        };
                        const hasUnread = getUnreadStatus();
                        return (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 group inline-flex items-center justify-center py-3 border-b-2 font-medium text-sm transition-all ${activeTab === tab ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'}`}>
                                {tab}
                                {hasUnread && <span className="ml-2 w-2 h-2 bg-brand-primary rounded-full animate-pulse"></span>}
                            </button>
                        )
                    })}
                </nav>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {notificationsToDisplay.length === 0 ? (
                    <div className="text-center p-10 mt-10">
                        <Icon name="bell" className="w-16 h-16 mx-auto text-brand-text-secondary/50" />
                        <h2 className="mt-4 text-xl font-bold">No Notifications Yet</h2>
                        <p className="text-brand-text-secondary mt-2">When you get notifications, they'll show up here.</p>
                    </div>
                ) : (
                    groupOrder.map(groupName => {
                        const group = groupedNotifications[groupName];
                        if (!group || group.length === 0) return null;
                        return (
                            <div key={groupName}>
                                <h3 className="font-bold text-lg p-4 pb-2 text-brand-text-primary">{groupName}</h3>
                                <div className="space-y-2 px-2 pb-2">
                                    {group.map(notification => (
                                        <NotificationItem key={notification.id} notification={notification} {...props} />
                                    ))}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};
