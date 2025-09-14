import React, { useState, useRef, useEffect } from 'react';
import type { ChatConversation, Circle, User, UserConversation, DirectMessage, UserDirectMessage, Post } from '../types';
import { Icon } from './Icon';
import type { View } from '../App';

const timeFormat = (date: Date): string => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

interface ChatConversationPageProps {
    conversation: ChatConversation | UserConversation;
    conversationType: 'circle' | 'user';
    currentUser: User;
    allUsers: User[];
    allPosts: Post[];
    circles: Circle[];
    navigate: (view: View) => void;
    onBack: () => void;
    onSendCircleMessage?: (chatId: string, content: string, replyToMessageId?: string) => void;
    onSendUserMessage?: (receiverId: string, content: string, replyToMessageId?: string, replyToStory?: { storyId: string; circleName: string; }) => void;
    onAcceptRequest?: (conversationId: string) => void;
    onDeclineRequest?: (conversationId: string) => void;
    onBlockUser?: (userIdToBlock: string) => void;
    onViewProfile?: (userId: string) => void;
    onMarkAsRead?: (conversationId: string) => void;
}

export const ChatConversationPage: React.FC<ChatConversationPageProps> = (props) => {
    const { conversation, conversationType, currentUser, allUsers, allPosts, circles, navigate, onBack, onViewProfile, onMarkAsRead } = props;
    const [newMessage, setNewMessage] = useState('');
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState<DirectMessage | UserDirectMessage | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [conversation.messages]);

    useEffect(() => {
        onMarkAsRead?.(conversation.id);
    }, [conversation.id, onMarkAsRead]);

    const scrollToMessage = (messageId: string) => {
        const element = messageRefs.current.get(messageId);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element?.classList.add('bg-brand-primary/20');
        window.setTimeout(() => {
            element?.classList.remove('bg-brand-primary/20');
        }, 1500);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        const replyToId = replyingTo ? replyingTo.id : undefined;

        if (conversationType === 'circle' && props.onSendCircleMessage) {
            props.onSendCircleMessage(conversation.id, newMessage, replyToId);
        } else if (conversationType === 'user' && props.onSendUserMessage) {
            const receiverId = (conversation as UserConversation).participants.find(p => p !== currentUser.id)!;
            props.onSendUserMessage(receiverId, newMessage, replyToId);
        }
        setNewMessage('');
        setReplyingTo(null);
    };

    const isUserChat = conversationType === 'user';
    const userConvo = isUserChat ? (conversation as UserConversation) : null;
    const isRequest = userConvo?.isRequest || false;
    const otherUserId = userConvo ? userConvo.participants.find(p => p !== currentUser.id)! : null;
    const otherUser = otherUserId ? allUsers.find(u => u.id === otherUserId) : null;

    const getDisplayData = () => {
        if (isUserChat && otherUser) {
            return { name: otherUser.name, logo: otherUser.picture || `https://picsum.photos/seed/${otherUser.id}/100` };
        }
        // Circle Chat Logic
        const convo = conversation as ChatConversation;
        if (convo.type === 'Group') return { name: convo.name || 'Group Chat', logo: 'https://picsum.photos/seed/group/100' };
        const otherP = convo.participants.find(p => !currentUser.memberships.includes(p.circleId)) || convo.participants[0];
        const otherC = circles.find(c => c.id === otherP.circleId);
        return { name: otherC?.name || 'Unknown', logo: otherC?.logo || '' };
    };

    const displayData = getDisplayData();
    const sortedMessages = [...conversation.messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const handleHeaderClick = () => {
        if (isUserChat && otherUserId && onViewProfile) {
            onViewProfile(otherUserId);
        }
    }

    return (
        <div className="flex flex-col h-full bg-brand-bg">
            <header className={`p-4 flex items-center gap-3 sticky top-0 bg-brand-surface/80 backdrop-blur-sm z-10 border-b border-brand-border h-16 ${isUserChat ? 'cursor-pointer' : ''}`} onClick={handleHeaderClick}>
                <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="p-1"><Icon name="back" /></button>
                <img src={displayData.logo} alt={displayData.name} className="w-10 h-10 rounded-full" />
                <h1 className="text-lg font-bold flex-1 truncate">{displayData.name}</h1>
                {isUserChat && !isRequest && otherUserId && props.onBlockUser && (
                     <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(p => !p); }} className="p-1 text-brand-text-secondary hover:text-brand-text-primary"><Icon name="more" /></button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-brand-surface rounded-md shadow-lg z-20 border border-brand-border" onMouseLeave={() => setMenuOpen(false)}>
                                <button onClick={() => props.onBlockUser!(otherUserId)} className="w-full text-left px-4 py-2 text-sm text-brand-danger hover:bg-brand-danger/20 flex items-center gap-2 transition-colors">
                                    <Icon name="user-block" className="w-4 h-4" /> Block User
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {sortedMessages.map((msg, index) => {
                     const repliedToMessage = (msg as DirectMessage | UserDirectMessage).replyToMessageId
                        ? sortedMessages.find(m => m.id === (msg as DirectMessage | UserDirectMessage).replyToMessageId)
                        : null;
                    
                    const sharedPostId = (msg as UserDirectMessage | DirectMessage).sharedPostId;
                    if (sharedPostId) {
                        const post = allPosts.find(p => p.id === sharedPostId);
                        if (post) {
                            const isCurrentUser = isUserChat 
                                ? (msg as UserDirectMessage).senderId === currentUser.id 
                                : (msg as DirectMessage).senderMemberId === currentUser.id;
                            return <SharedPostBubble key={msg.id} post={post} isCurrentUser={isCurrentUser} navigate={navigate} />;
                        }
                    }

                    if (msg.content) {
                        if (isUserChat) {
                            const isCurrentUser = (msg as UserDirectMessage).senderId === currentUser.id;
                            return (
                                <div key={msg.id} ref={el => { messageRefs.current.set(msg.id, el); }} className="transition-colors duration-1000">
                                    <SwipeableMessage isCurrentUser={isCurrentUser} onReply={() => setReplyingTo(msg)}>
                                        <UserMessageBubble isCurrentUser={isCurrentUser} message={msg as UserDirectMessage} repliedToMessage={repliedToMessage} allUsers={allUsers} currentUser={currentUser} onScrollToMessage={scrollToMessage}/>
                                    </SwipeableMessage>
                                </div>
                            );
                        } else {
                            const directMsg = msg as DirectMessage;
                            const prevMsg = sortedMessages[index - 1] as DirectMessage | undefined;
                            const isCurrentUserCircle = directMsg.senderMemberId === currentUser.id;
                            const senderCircle = circles.find(c => c.id === directMsg.senderCircleId);
                            const showAuthor = !isCurrentUserCircle && (!prevMsg || prevMsg.senderMemberId !== directMsg.senderMemberId);
                             return (
                                <div key={msg.id} ref={el => { messageRefs.current.set(msg.id, el); }} className="transition-colors duration-1000">
                                    <SwipeableMessage isCurrentUser={isCurrentUserCircle} onReply={() => setReplyingTo(msg)}>
                                        <CircleMessageBubble isCurrentUserCircle={isCurrentUserCircle} message={directMsg} senderCircleLogo={senderCircle?.logo} showAuthor={showAuthor} repliedToMessage={repliedToMessage} circles={circles} currentUser={currentUser} onScrollToMessage={scrollToMessage} />
                                    </SwipeableMessage>
                                </div>
                            );
                        }
                    }
                    return null;
                })}
                <div ref={messagesEndRef} />
            </div>

            {isRequest ? (
                <RequestFooter conversationId={conversation.id} onAccept={props.onAcceptRequest!} onDecline={props.onDeclineRequest!} onBlock={() => props.onBlockUser!(otherUserId!)} />
            ) : (
                <MessageInput value={newMessage} onChange={setNewMessage} onSubmit={handleSubmit} replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)} allUsers={allUsers} circles={circles} currentUser={currentUser} />
            )}
        </div>
    );
};


const QuotedMessage = ({ message, onScrollToMessage, allUsers, circles, currentUser }: { message: DirectMessage | UserDirectMessage, onScrollToMessage: (id: string) => void, allUsers: User[], circles: Circle[], currentUser: User }) => {
    let authorName = "You";
    let content = message.content || "Shared a post";

    if ('senderId' in message) { // UserDirectMessage
        if (message.senderId !== currentUser.id) {
            authorName = allUsers.find(u => u.id === message.senderId)?.name || 'User';
        }
    } else { // DirectMessage
        if (message.senderMemberId !== currentUser.id) {
            authorName = message.senderMemberNickname;
        }
    }

    return (
        <div onClick={() => onScrollToMessage(message.id)} className="bg-brand-bg rounded-lg p-2 border-l-2 border-brand-primary cursor-pointer mb-1">
            <p className="font-bold text-xs text-brand-primary">{authorName}</p>
            <p className="text-sm text-brand-text-secondary line-clamp-1">{content}</p>
        </div>
    );
};

const SharedPostBubble: React.FC<{post: Post; isCurrentUser: boolean; navigate: (v: View) => void}> = ({ post, isCurrentUser, navigate }) => {
    return (
        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
            <div
                onClick={() => navigate({ type: 'CIRCLE', id: post.circleId })}
                className={`p-2 rounded-2xl w-full max-w-xs md:max-w-[280px] cursor-pointer
                ${isCurrentUser ? 'bg-brand-secondary rounded-br-lg' : 'bg-brand-surface rounded-bl-lg border border-brand-border'}`
                }>
                <div className="p-2 bg-brand-bg/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <img src={post.circleLogo} alt={post.circleName} className="w-6 h-6 rounded-full"/>
                        <p className={`font-bold text-xs truncate ${isCurrentUser ? 'text-white/90' : 'text-brand-text-secondary'}`}>{post.circleName}</p>
                    </div>
                    {post.imageUrl && <img src={post.imageUrl} alt="Post content" className="rounded-md w-full object-cover max-h-48 mb-2 border border-brand-border/20" />}
                    <p className={`text-sm line-clamp-3 ${isCurrentUser ? 'text-white' : 'text-brand-text-primary'}`}>{post.content}</p>
                    <p className={`text-xs mt-1 ${isCurrentUser ? 'text-white/70' : 'text-brand-text-secondary'}`}>Posted by {post.authorNickname}</p>
                </div>
            </div>
        </div>
    );
}

const UserMessageBubble = ({ message, isCurrentUser, repliedToMessage, allUsers, currentUser, onScrollToMessage }: { message: UserDirectMessage, isCurrentUser: boolean, repliedToMessage: any, allUsers: User[], currentUser: User, onScrollToMessage: (id: string) => void }) => (
    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div className={`p-3 rounded-2xl max-w-xs md:max-w-md ${isCurrentUser ? 'bg-brand-primary text-white rounded-br-lg' : 'bg-brand-surface rounded-bl-lg border border-brand-border'}`}>
            {message.replyToStory && (
                <div className="bg-brand-bg rounded-lg p-2 border-l-2 border-brand-accent mb-2">
                    <p className="font-bold text-xs text-brand-accent flex items-center gap-1.5">
                        <Icon name="story-add" className="w-4 h-4" />
                        Replied to a story
                    </p>
                    <p className="text-sm text-brand-text-secondary line-clamp-1">in {message.replyToStory.circleName}</p>
                </div>
            )}
            {repliedToMessage && !message.replyToStory && <QuotedMessage message={repliedToMessage} onScrollToMessage={onScrollToMessage} allUsers={allUsers} circles={[]} currentUser={currentUser}/>}
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className="text-xs text-brand-text-secondary mt-1 px-2">{timeFormat(message.timestamp)}</p>
    </div>
);

const CircleMessageBubble = ({ message, isCurrentUserCircle, senderCircleLogo, showAuthor, repliedToMessage, circles, currentUser, onScrollToMessage }: { message: DirectMessage, isCurrentUserCircle: boolean, senderCircleLogo?: string, showAuthor: boolean, repliedToMessage: any, circles: Circle[], currentUser: User, onScrollToMessage: (id: string) => void }) => (
    <div className={`flex flex-col ${isCurrentUserCircle ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-end gap-2 max-w-xs md:max-w-md ${isCurrentUserCircle ? 'flex-row-reverse' : 'flex-row'}`}>
            {!isCurrentUserCircle && <img src={senderCircleLogo} className="w-6 h-6 rounded-full mb-1" />}
            <div className={`p-3 rounded-2xl ${isCurrentUserCircle ? 'bg-brand-primary text-white rounded-br-lg' : 'bg-brand-surface rounded-bl-lg border border-brand-border'}`}>
                {showAuthor && <p className="text-xs font-bold text-brand-accent mb-1">{message.senderMemberNickname}</p>}
                {repliedToMessage && <QuotedMessage message={repliedToMessage} onScrollToMessage={onScrollToMessage} allUsers={[]} circles={circles} currentUser={currentUser}/>}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
        <p className={`text-xs text-brand-text-secondary mt-1 px-2 ${isCurrentUserCircle ? '' : 'ml-8'}`}>{timeFormat(message.timestamp)}</p>
    </div>
);

const SwipeableMessage: React.FC<{ children: React.ReactNode, onReply: () => void, isCurrentUser: boolean }> = ({ children, onReply, isCurrentUser }) => {
    const [dragX, setDragX] = useState(0);
    const ref = useRef({ isDragging: false, startX: 0 });
    const swipeThreshold = 60;

    const handlePointerDown = (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('a, button')) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        ref.current.isDragging = true;
        ref.current.startX = e.clientX;
    };
    
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!ref.current.isDragging) return;
        let dx = e.clientX - ref.current.startX;
        if ((isCurrentUser && dx > 0) || (!isCurrentUser && dx < 0)) dx = 0;
        dx = Math.max(-swipeThreshold - 20, Math.min(swipeThreshold + 20, dx));
        setDragX(dx);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!ref.current.isDragging) return;
        ref.current.isDragging = false;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        if (Math.abs(dragX) > swipeThreshold) onReply();
        setDragX(0);
    };

    return (
        <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} className="relative select-none">
            <div className="absolute inset-y-0 flex items-center" style={{ [isCurrentUser ? 'right' : 'left']: '100%', opacity: Math.min(1, Math.abs(dragX) / swipeThreshold) }}>
                <Icon name="comment" className="w-5 h-5 text-brand-text-secondary mx-2" />
            </div>
            <div style={{ transform: `translateX(${dragX}px)` }} className={!ref.current.isDragging ? "transition-transform duration-200" : ""}>
                {children}
            </div>
        </div>
    );
};


const MessageInput = ({ value, onChange, onSubmit, replyingTo, onCancelReply, allUsers, circles, currentUser }: { value: string, onChange: (val: string) => void, onSubmit: (e: React.FormEvent) => void, replyingTo: any, onCancelReply: () => void, allUsers: User[], circles: Circle[], currentUser: User }) => (
    <footer className="p-4 border-t border-brand-border bg-brand-surface">
        {replyingTo && (
            <div className="relative mb-2">
                 <QuotedMessage message={replyingTo} onScrollToMessage={() => {}} allUsers={allUsers} circles={circles} currentUser={currentUser} />
                <button onClick={onCancelReply} className="absolute top-1 right-1 p-1 bg-brand-border rounded-full text-brand-text-secondary hover:text-white"><Icon name="close" className="w-3 h-3"/></button>
            </div>
        )}
        <form onSubmit={onSubmit} className="flex gap-3 items-center">
            <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="Type a message..." className="flex-1 bg-brand-bg border border-brand-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm text-brand-text-primary" />
            <button type="submit" disabled={!value.trim()} className="bg-brand-primary text-white rounded-full p-2 h-10 w-10 flex-shrink-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-secondary transition-colors">
                <Icon name="send" className="w-5 h-5" />
            </button>
        </form>
    </footer>
);

const RequestFooter = ({ conversationId, onAccept, onDecline, onBlock }: { conversationId: string, onAccept: (id: string) => void, onDecline: (id: string) => void, onBlock: () => void }) => (
    <footer className="p-4 border-t border-brand-border bg-brand-surface text-center">
        <p className="text-xs text-brand-text-secondary mb-3">Accept message to add this user as a friend. They won't know you've seen it until you accept.</p>
        <div className="flex justify-center gap-3">
            <button onClick={() => onBlock()} className="font-semibold text-sm text-brand-danger hover:underline">Block</button>
            <button onClick={() => onDecline(conversationId)} className="font-semibold text-sm text-brand-danger hover:underline">Decline</button>
            <button onClick={() => onAccept(conversationId)} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-secondary transition-colors">Accept</button>
        </div>
    </footer>
);