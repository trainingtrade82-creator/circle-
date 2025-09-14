import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Circle, Story, User, StoryElement, TextElement, Post, PostElement } from '../types';
import { StoryType, Role } from '../types';
import { Icon } from './Icon';
import type { View } from '../App';

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};

interface StoryViewerModalProps {
    circles: (Circle & { originalCircleId?: string })[];
    initialCircleId: string;
    currentUser: User;
    allPosts: Post[];
    onClose: () => void;
    onStoryViewed: (storyId: string) => void;
    onAddReaction: (storyId: string, emoji: string) => void;
    onSendReply: (storyId: string, circleId: string, text: string) => void;
    onOpenAddToHighlightModal?: (item: { type: 'story', id: string, circleId: string }) => void;
    onDeleteStory?: (storyId: string) => void;
    onMuteUser?: (userId: string) => void;
    onDeleteHighlight?: (circleId: string, highlightId: string) => void;
    navigate: (view: View) => void;
}

const PostStoryElement: React.FC<{post: Post}> = ({ post }) => (
    <div className="w-full h-full bg-brand-surface/80 backdrop-blur-sm rounded-xl p-3 flex flex-col text-white border border-white/20 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
            <img src={post.circleLogo} alt={post.circleName} className="w-6 h-6 rounded-full" />
            <p className="font-bold text-xs truncate">{post.circleName}</p>
        </div>
        <p className="text-sm line-clamp-4 flex-1">{post.content}</p>
        <p className="text-xs mt-1 text-white/70">Posted by {post.authorNickname}</p>
    </div>
);


const StoryContent = ({ story, allPosts }: { story: Story, allPosts: Post[] }) => {
    const sortedElements = useMemo(() => [...story.elements].sort((a, b) => a.zIndex - b.zIndex), [story.elements]);

    return (
        <div className="absolute inset-0 w-full h-full bg-black pointer-events-none">
            {/* Background */}
            {story.mediaType === StoryType.Image && story.mediaUrl && (
                <img src={story.mediaUrl} alt="Story background" className="w-full h-full object-contain" />
            )}
            {story.mediaType === StoryType.Text && story.gradientBackground && (
                <div className={`w-full h-full ${story.gradientBackground}`} />
            )}

            {/* Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {sortedElements.map(element => {
                    const elementStyle: React.CSSProperties = {
                        position: 'absolute',
                        left: `${element.x}%`,
                        top: `${element.y}%`,
                        width: `${element.width}px`,
                        height: element.type === 'text' ? 'auto' : `${element.height}px`,
                        transform: `translate(-50%, -50%) scale(${element.scale}) rotate(${element.rotation}deg)`,
                        zIndex: element.zIndex,
                    };

                    if (element.type === 'text') {
                        return (
                             <div key={element.id} style={elementStyle}>
                                <p style={{
                                    color: element.color,
                                    backgroundColor: element.backgroundColor,
                                    textAlign: element.textAlign,
                                    whiteSpace: 'pre-wrap',
                                    padding: element.backgroundColor !== 'rgba(0,0,0,0.0)' ? '0.25em 0.5em' : '0',
                                    borderRadius: element.backgroundColor !== 'rgba(0,0,0,0.0)' ? '0.25em' : '0',
                                    fontSize: '2rem', // Base font size
                                    fontWeight: element.fontWeight || 'normal',
                                    lineHeight: '1.2',
                                    textDecoration: element.isUnderlined ? 'underline' : 'none',
                                }}>
                                    {element.content}
                                </p>
                            </div>
                        )
                    }
                    if (element.type === 'image') {
                        return (
                            <div key={element.id} style={elementStyle}>
                                <img src={element.content} alt="Story element" className="w-full h-full object-contain" />
                            </div>
                        )
                    }
                    if (element.type === 'post') {
                        const post = allPosts.find(p => p.id === (element as PostElement).postId);
                        if (!post) return null;
                        return (
                             <div key={element.id} style={elementStyle}>
                                <PostStoryElement post={post} />
                            </div>
                        )
                    }
                    return null;
                })}
            </div>
        </div>
    );
};

export const StoryViewerModal: React.FC<StoryViewerModalProps> = (props) => {
    const { circles, initialCircleId, currentUser, allPosts, onClose, onStoryViewed, onAddReaction, onSendReply, onOpenAddToHighlightModal, onDeleteStory, onMuteUser, onDeleteHighlight, navigate } = props;
    const [currentCircleIndex, setCurrentCircleIndex] = useState(0);
    const [storyIndices, setStoryIndices] = useState<{[key: string]: number}>({});
    const [isPaused, setIsPaused] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replySent, setReplySent] = useState(false);
    const [lastReacted, setLastReacted] = useState(false);
    const [rainingEmojis, setRainingEmojis] = useState<{ key: number; emoji: string; x: number; duration: number; delay: number; }[]>([]);
    const [isMenuOpen, setMenuOpen] = useState(false);

    const interactionRef = useRef({
        startX: 0,
        startY: 0,
        isDragging: false,
        longPressTimer: null as number | null,
    });

    useEffect(() => {
        const initialIndex = circles.findIndex(c => c.id === initialCircleId);
        setCurrentCircleIndex(initialIndex >= 0 ? initialIndex : 0);

        const initialStoryIndices: {[key: string]: number} = {};
        circles.forEach(circle => {
            const firstUnreadIndex = circle.stories.findIndex(s => !s.viewedBy.includes(currentUser.id));
            initialStoryIndices[circle.id] = firstUnreadIndex >= 0 ? firstUnreadIndex : 0;
        });
        setStoryIndices(initialStoryIndices);

    }, [circles, initialCircleId, currentUser.id]);

    const activeCircle = circles[currentCircleIndex];
    const currentStoryIndex = activeCircle ? storyIndices[activeCircle.id] ?? 0 : 0;
    const activeStory = activeCircle?.stories[currentStoryIndex];
    const authorMember = activeCircle?.members.find(m => m.id === activeStory?.authorMemberId);
    const storyAuthorRole = authorMember?.role;
    const isMyStory = activeStory?.authorMemberId === currentUser.id;
    const currentUserMember = activeCircle?.members.find(m => m.id === currentUser.id);
    const userRole = currentUserMember?.role;
    
    const isHighlightView = activeCircle?.id.startsWith('highlight-');
    const originalCircleId = isHighlightView ? activeCircle.originalCircleId : activeCircle?.id;
    
    const canAddToHighlight = onOpenAddToHighlightModal && userRole && [Role.Host, Role.Moderator].includes(userRole) && !isHighlightView;
    
    const isAuthor = activeStory?.authorMemberId === currentUser.id;
    const isHost = userRole === Role.Host;
    const isModerator = userRole === Role.Moderator;

    let canDeleteStory = false;
    if (storyAuthorRole === Role.Host) {
        canDeleteStory = isAuthor;
    } else {
        const isModeratorDeletingLowerRole = isModerator && (storyAuthorRole === Role.Contributor || storyAuthorRole === Role.Viewer);
        canDeleteStory = onDeleteStory && (isAuthor || isHost || isModeratorDeletingLowerRole);
    }


    const currentUserReaction = useMemo(() => 
        activeStory?.reactions.find(r => r.memberId === currentUser.id),
    [activeStory, currentUser.id]);

    useEffect(() => {
        if (activeStory && !activeStory.viewedBy.includes(currentUser.id)) {
            onStoryViewed(activeStory.id);
        }
    }, [activeStory, onStoryViewed, currentUser.id]);
    
    const goToNextStory = () => {
        if (!activeCircle) return;
        setMenuOpen(false);
        if (currentStoryIndex < activeCircle.stories.length - 1) {
            setStoryIndices(prev => ({...prev, [activeCircle.id]: (prev[activeCircle.id] ?? 0) + 1}));
        } else {
            goToNextCircle();
        }
    };
    
    const goToPrevStory = () => {
        if (!activeCircle) return;
        setMenuOpen(false);
        if (currentStoryIndex > 0) {
            setStoryIndices(prev => ({...prev, [activeCircle.id]: (prev[activeCircle.id] ?? 0) - 1}));
        } else {
            goToPrevCircle();
        }
    };

    const goToNextCircle = () => {
        if (currentCircleIndex < circles.length - 1) {
            setCurrentCircleIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const goToPrevCircle = () => {
        if (currentCircleIndex > 0) {
            setCurrentCircleIndex(prev => prev - 1);
        }
    };
    
    useEffect(() => {
        if (!isPaused && activeStory && !lastReacted) {
            const storyDuration = activeStory.duration * 1000;
            const timer = window.setTimeout(goToNextStory, storyDuration);
            return () => window.clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStoryIndex, currentCircleIndex, isPaused, activeStory, lastReacted]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, input, form, a')) {
            return;
        }
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        interactionRef.current.startX = e.clientX;
        interactionRef.current.startY = e.clientY;
        interactionRef.current.isDragging = false;

        interactionRef.current.longPressTimer = window.setTimeout(() => {
            setIsPaused(true);
            interactionRef.current.longPressTimer = null;
        }, 200);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
        
        const dx = e.clientX - interactionRef.current.startX;
        const dy = e.clientY - interactionRef.current.startY;

        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            interactionRef.current.isDragging = true;
            if (interactionRef.current.longPressTimer) {
                window.clearTimeout(interactionRef.current.longPressTimer);
                interactionRef.current.longPressTimer = null;
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

        if (interactionRef.current.longPressTimer) {
            // Short press / tap
            window.clearTimeout(interactionRef.current.longPressTimer);
            interactionRef.current.longPressTimer = null;
            
            const rect = e.currentTarget.getBoundingClientRect();
            const tapX = e.clientX - rect.left; // Get tap position relative to the element

            if (tapX < rect.width / 3) {
                goToPrevStory();
            } else {
                goToNextStory();
            }
        } else {
            // Long press or swipe
            setIsPaused(false); // Unpause on release

            if (interactionRef.current.isDragging) {
                const dx = e.clientX - interactionRef.current.startX;
                const swipeThreshold = 75;
                if (Math.abs(dx) > swipeThreshold) {
                    if (dx > 0) {
                        goToPrevCircle();
                    } else {
                        goToNextCircle();
                    }
                }
            }
        }
    };
    
    const handleReactionClick = (emoji: string) => {
        if (!activeStory) return;
        onAddReaction(activeStory.id, emoji);
        setLastReacted(true);
        window.setTimeout(() => setLastReacted(false), 500);

        const newEmojis = Array.from({ length: 20 }).map(() => ({
            key: Math.random(),
            emoji,
            x: Math.random() * 100,
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.5,
        }));
        setRainingEmojis(newEmojis);
        window.setTimeout(() => setRainingEmojis([]), 4000); // Clear after longest possible animation
    };

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyText.trim() && activeStory && activeCircle) {
            const circleIdForReply = activeCircle.originalCircleId || activeCircle.id;
            onSendReply(activeStory.id, circleIdForReply, replyText);
            setReplyText('');
            setReplySent(true);
            setIsPaused(true); // Keep story paused
            window.setTimeout(() => {
                setReplySent(false);
                setIsPaused(false); // Unpause after message fades
            }, 2500);
        }
    };

    const handleCircleClick = () => {
        if (originalCircleId) {
            navigate({ type: 'CIRCLE', id: originalCircleId });
            onClose();
        }
    };

    if (!activeCircle || !activeStory) return null;

    const roleDisplay: Record<Role, { text: string; bg: string }> = {
        [Role.Host]: { text: "text-white", bg: "bg-red-500" },
        [Role.Moderator]: { text: "text-white", bg: "bg-blue-500" },
        [Role.Contributor]: { text: "text-white", bg: "bg-green-500" },
        [Role.Viewer]: { text: "text-white", bg: "bg-gray-500" },
    };
    
    return (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <div 
                className="relative w-full max-w-md h-full md:h-[90vh] md:max-h-[800px] bg-brand-bg rounded-none md:rounded-lg overflow-hidden shadow-2xl flex flex-col select-none touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onContextMenu={(e) => e.preventDefault()}
            >
                 {/* Emoji Rain */}
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-30">
                    {rainingEmojis.map(({ key, emoji, x, duration, delay }) => (
                        <span
                            key={key}
                            className="absolute text-3xl animate-fall"
                            style={{
                                left: `${x}%`,
                                animationDuration: `${duration}s`,
                                animationDelay: `${delay}s`,
                            }}
                        >
                            {emoji}
                        </span>
                    ))}
                </div>

                {/* Story Content */}
                <div className="flex-1 relative">
                    <StoryContent story={activeStory} allPosts={allPosts} />
                </div>

                {/* Overlay UI */}
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                    {/* Header */}
                    <header className="p-4 pt-6 bg-gradient-to-b from-black/50 to-transparent">
                        <div className="flex gap-1" key={activeCircle.id + currentStoryIndex}>
                             {activeCircle.stories.map((story, index) => (
                                <div key={story.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                   <div 
                                        className="h-full bg-white"
                                        style={{ 
                                            width: index < currentStoryIndex ? '100%' : '0%',
                                            animation: index === currentStoryIndex && !isPaused && !lastReacted ? `progress ${story.duration}s linear forwards` : 'none'
                                        }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-start justify-between mt-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button onClick={handleCircleClick} className="pointer-events-auto flex-shrink-0">
                                    <img src={activeCircle.logo} alt={activeCircle.name} className="w-10 h-10 rounded-full object-cover" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleCircleClick} className="font-bold text-white text-base truncate pointer-events-auto hover:underline text-left">
                                            {activeCircle.name}
                                        </button>
                                        <div className="relative pointer-events-auto">
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (!isMenuOpen) setIsPaused(true);
                                                    setMenuOpen(p => !p); 
                                                }} 
                                                className="p-1 text-white"
                                            >
                                                <Icon name="more" className="w-6 h-6" />
                                            </button>
                                            {isMenuOpen && (
                                                <div className="absolute left-0 mt-2 w-56 bg-brand-surface rounded-md shadow-lg z-30 border border-brand-border text-white py-1">
                                                    {canAddToHighlight && (
                                                        <button 
                                                            onClick={() => {
                                                                if (originalCircleId) {
                                                                    onOpenAddToHighlightModal({ type: 'story', id: activeStory.id, circleId: originalCircleId });
                                                                }
                                                                setMenuOpen(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-brand-bg flex items-center gap-3"
                                                        >
                                                            <Icon name="sparkles" className="w-4 h-4 text-brand-primary" /> Add to Highlight
                                                        </button>
                                                    )}
                                                    {canDeleteStory && (
                                                        <button 
                                                            onClick={() => { onDeleteStory?.(activeStory.id); setMenuOpen(false); }}
                                                            className="w-full text-left px-4 py-2 text-sm text-brand-danger hover:bg-brand-danger/20 flex items-center gap-3"
                                                        >
                                                            <Icon name="trash" className="w-4 h-4" /> Delete Story
                                                        </button>
                                                    )}
                                                    {isHighlightView && userRole && [Role.Host, Role.Moderator].includes(userRole) && onDeleteHighlight && (
                                                         <button 
                                                            onClick={() => {
                                                                const highlightId = activeCircle.id.replace('highlight-', '');
                                                                if (originalCircleId && highlightId) {
                                                                    onDeleteHighlight(originalCircleId, highlightId);
                                                                }
                                                                setMenuOpen(false);
                                                             }}
                                                            className="w-full text-left px-4 py-2 text-sm text-brand-danger hover:bg-brand-danger/20 flex items-center gap-3"
                                                        >
                                                            <Icon name="trash" className="w-4 h-4" /> Delete Highlight
                                                        </button>
                                                    )}
                                                    {!isMyStory && (
                                                        <>
                                                            {(canAddToHighlight || canDeleteStory || isHighlightView) && <div className="h-px bg-brand-border my-1" />}
                                                            <button 
                                                                onClick={() => { alert('Story reported (not implemented).'); setMenuOpen(false); }}
                                                                className="w-full text-left px-4 py-2 text-sm text-brand-danger hover:bg-brand-danger/20 flex items-center gap-3"
                                                            >
                                                                <Icon name="user-block" className="w-4 h-4" /> Report Story
                                                            </button>
                                                            {onMuteUser && authorMember && (
                                                                <button 
                                                                    onClick={() => { 
                                                                        onMuteUser(authorMember.id); 
                                                                        alert(`Stories from ${authorMember.nickname} will now be hidden.`); 
                                                                        setMenuOpen(false); 
                                                                        onClose(); // Close viewer as their stories will disappear
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-brand-bg flex items-center gap-3"
                                                                >
                                                                    <Icon name="eye-off" className="w-4 h-4" /> Mute {authorMember.nickname}
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-xs text-gray-300">by {authorMember?.nickname || 'Unknown Author'}</p>
                                        {authorMember && <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${roleDisplay[authorMember.role].bg} ${roleDisplay[authorMember.role].text}`}>{authorMember.role}</span>}
                                        <p className="text-xs text-gray-300">· {timeAgo(new Date(activeStory.timestamp))}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    <div className="flex-1"></div>

                    {/* Footer */}
                    <footer className="p-4 pb-6 bg-gradient-to-t from-black/50 to-transparent pointer-events-auto">
                        {!isMyStory && (
                            <div className="flex justify-between items-center mb-4">
                               <div className="flex justify-center gap-4 flex-1">
                                   {['❤️', '😂', '😮', '🔥'].map(emoji => (
                                       <button 
                                        key={emoji} 
                                        onClick={() => handleReactionClick(emoji)}
                                        className={`text-3xl p-1 rounded-full transition-all duration-300 ${currentUserReaction?.emoji === emoji ? 'bg-white/30 scale-110' : ''} ${lastReacted && currentUserReaction?.emoji === emoji ? 'scale-150' : 'hover:scale-125'}`}
                                       >
                                        {emoji}
                                       </button>
                                   ))}
                               </div>
                               {activeStory.reactions.length > 0 && (
                                   <div className="text-white text-xs font-semibold bg-black/30 px-2 py-1 rounded-full">
                                        {activeStory.reactions[0].emoji} {activeStory.reactions.length}
                                   </div>
                               )}
                            </div>
                        )}
                        {!isMyStory && (
                            replySent ? (
                                <div className="text-center text-white font-semibold h-10 flex items-center justify-center">Reply Sent!</div>
                            ) : (
                                <form onSubmit={handleReplySubmit} className="flex gap-2">
                                     <input 
                                        type="text"
                                        placeholder="Send a reply..."
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        onFocus={() => setIsPaused(true)}
                                        onBlur={(e) => {
                                            if (!e.target.value.trim() && !replySent) {
                                                setIsPaused(false);
                                            }
                                        }}
                                        className="flex-1 bg-white/20 border border-white/30 rounded-full px-4 py-2 text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white text-sm"
                                    />
                                    <button type="submit" disabled={!replyText.trim()} className="text-white disabled:opacity-50">
                                        <Icon name="send" />
                                    </button>
                                </form>
                            )
                        )}
                    </footer>
                </div>

                 {/* Top-right buttons container */}
                <div className="absolute top-4 right-4 z-20 pointer-events-auto">
                    <button onClick={onClose} className="text-white">
                        <Icon name="close" className="w-8 h-8" />
                    </button>
                </div>
            </div>
            
            <style>{`
                @keyframes progress { from { width: 0%; } to { width: 100%; } }
                @keyframes fall {
                    0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                }
                .animate-fall {
                    animation-name: fall;
                    animation-timing-function: ease-in;
                    will-change: transform, opacity;
                }
            `}</style>
        </div>
    );
};