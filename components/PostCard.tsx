import React, { useState, useRef, useEffect } from 'react';
import type { Post } from '../types';
import { CircleType, Role } from '../types';
import { Icon } from './Icon';

interface PostCardProps {
    post: Post;
    isHighlighted: boolean;
    showCircleInfo: boolean;
    onCircleClick: () => void;
    isMemberOfCircle: boolean;
    onToggleLike: (postId: string) => void;
    onOpenComments: (postId: string) => void;
    currentUserId: string;
    circleType?: CircleType;
    hasRequestedToJoin?: boolean;
    userRole?: Role;
    postAuthorRole?: Role;
    onJoinCircle?: (circleId: string) => void;
    onLeaveCircle?: (circleId: string) => void;
    onRequestToJoinCircle?: (circleId: string) => void;
    onDeletePost?: (postId: string) => void;
    isSaved: boolean;
    onToggleSavePost: (postId: string) => void;
    onSharePost?: (postId: string) => void;
    onViewProfile?: (userId: string) => void;
    onHideCircle?: (circleId: string) => void;
    onMarkInterested?: (postId: string) => void;
    onMarkNotInterested?: (postId: string) => void;
    isMarkedInterested?: boolean;
    isMarkedNotInterested?: boolean;
    onSuggestForStory?: (postId: string, circleId: string) => void;
    isSuggestedForStory?: boolean;
}

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
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

export const PostCard: React.FC<PostCardProps> = (props) => {
    const { 
        post, isHighlighted, showCircleInfo, onCircleClick, isMemberOfCircle, 
        onToggleLike, onOpenComments, currentUserId, circleType, hasRequestedToJoin,
        userRole, postAuthorRole, onJoinCircle, onLeaveCircle, onRequestToJoinCircle, onDeletePost,
        isSaved, onToggleSavePost, onSharePost, onViewProfile,
        onHideCircle, onMarkInterested, onMarkNotInterested,
        isMarkedInterested, isMarkedNotInterested,
        onSuggestForStory, isSuggestedForStory
    } = props;
    
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [feedback, setFeedback] = useState<'interested' | 'not_interested' | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const cardClasses = `
        bg-brand-surface border-b border-brand-border p-4
        ${isHighlighted ? 'border-l-4 border-l-brand-accent' : ''}
    `;

    const isLiked = post.likedBy.includes(currentUserId);
    
    const isAuthor = post.authorMemberId === currentUserId;
    const isHost = userRole === Role.Host;
    const isModerator = userRole === Role.Moderator;

    let canDelete;
    if (postAuthorRole === Role.Host) {
        canDelete = isAuthor;
    } else {
        const isModeratorDeletingLowerRole = isModerator && (postAuthorRole === Role.Contributor || postAuthorRole === Role.Viewer);
        canDelete = onDeletePost && (isAuthor || isHost || isModeratorDeletingLowerRole);
    }
    
    const canLeave = onLeaveCircle && isMemberOfCircle && userRole !== Role.Host;

    const handleMarkInterestedClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onMarkInterested?.(post.id);
        setFeedback('interested');
        window.setTimeout(() => {
            setFeedback(null);
            setMenuOpen(false);
        }, 1200);
    };
    
    const handleMarkNotInterestedClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onMarkNotInterested?.(post.id);
        setFeedback('not_interested');
        window.setTimeout(() => {
            setFeedback(null);
            setMenuOpen(false);
        }, 1200);
    };


    const renderJoinButton = () => {
        if (!isMemberOfCircle && showCircleInfo) {
            const baseButtonClasses = "px-3 py-1 rounded-full font-semibold text-xs transition-colors flex-shrink-0 ml-2";
            if (circleType === CircleType.Public && onJoinCircle) {
                return (
                    <button onClick={(e) => { e.stopPropagation(); onJoinCircle(post.circleId); }} className={`${baseButtonClasses} bg-brand-primary text-white hover:bg-brand-secondary`}>
                        Join
                    </button>
                );
            }
            if (circleType === CircleType.Private && onRequestToJoinCircle) {
                if (hasRequestedToJoin) {
                    return (
                        <button disabled className={`${baseButtonClasses} bg-brand-surface border border-brand-border text-brand-text-secondary cursor-not-allowed`}>
                            Requested
                        </button>
                    );
                }
                return (
                    <button onClick={(e) => { e.stopPropagation(); onRequestToJoinCircle(post.circleId); }} className={`${baseButtonClasses} bg-brand-primary text-white hover:bg-brand-secondary`}>
                        Request
                    </button>
                );
            }
        }
        return null;
    };
    
    const renderPostMenu = () => {
        const hasMenuOptions = onToggleSavePost || onHideCircle || onMarkInterested || onMarkNotInterested || canLeave || canDelete || onSuggestForStory;

        if (hasMenuOptions) {
            return (
                 <div className="relative">
                    <button
                        ref={buttonRef}
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(p => !p); }}
                        className="text-brand-text-secondary hover:text-brand-text-primary p-2 rounded-full transition-colors hover:bg-brand-bg"
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen}
                        aria-label="Post options"
                    >
                        <Icon name="more" className="w-5 h-5" />
                    </button>
                    <div 
                        ref={menuRef}
                        className={`absolute right-0 mt-2 w-56 bg-brand-bg rounded-md shadow-lg z-20 border border-brand-border origin-top-right transition-all duration-150 ease-out ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                        role="menu"
                        aria-orientation="vertical"
                    >
                        <div className="py-1" role="none">
                             {isMemberOfCircle && userRole && ![Role.Host, Role.Moderator].includes(userRole) && onSuggestForStory && (
                                <button onClick={(e) => { e.stopPropagation(); onSuggestForStory(post.id, post.circleId); setMenuOpen(false); }} disabled={isSuggestedForStory} className="w-full text-left px-4 py-2 text-sm text-brand-text-primary hover:bg-brand-surface flex items-center gap-3 transition-colors disabled:opacity-50">
                                    <Icon name="story-add" className="w-4 h-4" /> {isSuggestedForStory ? 'Suggested for Story' : 'Suggest for Story'}
                                </button>
                            )}

                            <button onClick={(e) => { e.stopPropagation(); onToggleSavePost(post.id); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-brand-text-primary hover:bg-brand-surface flex items-center gap-3 transition-colors" role="menuitem">
                                <Icon name={isSaved ? 'bookmark-filled' : 'bookmark'} className={`w-4 h-4 ${isSaved ? 'text-brand-primary' : ''}`} /> {isSaved ? 'Unsave Post' : 'Save Post'}
                            </button>

                             {onMarkInterested && (
                                <button
                                    onClick={handleMarkInterestedClick}
                                    disabled={!!feedback || isMarkedInterested}
                                    className="w-full text-left px-4 py-2 text-sm text-brand-text-primary hover:bg-brand-surface flex items-center gap-3 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                    role="menuitem"
                                >
                                    {feedback === 'interested' ? (
                                        <>
                                            <Icon name="sparkles" className="w-4 h-4 text-brand-accent" />
                                            <span>Preferences updated!</span>
                                        </>
                                    ) : isMarkedInterested ? (
                                        <>
                                            <Icon name="thumb-up" className="w-4 h-4 text-brand-primary" />
                                            <span className="text-brand-primary">Showing more like this</span>
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="thumb-up" className="w-4 h-4" />
                                            <span>Show more like this</span>
                                        </>
                                    )}
                                </button>
                            )}
                             {onMarkNotInterested && (
                                 <button
                                    onClick={handleMarkNotInterestedClick}
                                    disabled={!!feedback || isMarkedNotInterested}
                                    className="w-full text-left px-4 py-2 text-sm text-brand-text-primary hover:bg-brand-surface flex items-center gap-3 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                    role="menuitem"
                                >
                                    {feedback === 'not_interested' ? (
                                        <>
                                            <Icon name="sparkles" className="w-4 h-4 text-brand-accent" />
                                            <span>Preferences updated!</span>
                                        </>
                                    ) : isMarkedNotInterested ? (
                                        <>
                                            <Icon name="thumb-down" className="w-4 h-4 text-brand-primary" />
                                            <span className="text-brand-primary">Showing less like this</span>
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="thumb-down" className="w-4 h-4" />
                                            <span>Show less like this</span>
                                        </>
                                    )}
                                </button>
                            )}
                             {onHideCircle && (
                                <button onClick={(e) => { e.stopPropagation(); onHideCircle(post.circleId); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-brand-text-primary hover:bg-brand-surface flex items-center gap-3 transition-colors" role="menuitem">
                                    <Icon name="eye-off" className="w-4 h-4" /> Don't recommend this circle
                                </button>
                            )}

                            {(canLeave || canDelete) && <div className="h-px bg-brand-border my-1" role="separator" />}

                            {canLeave && (
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to leave "${post.circleName}"?`)) {
                                        onLeaveCircle?.(post.circleId);
                                    }
                                    setMenuOpen(false);
                                }} className="w-full text-left px-4 py-2 text-sm text-brand-danger hover:bg-brand-danger/20 flex items-center gap-3 transition-colors" role="menuitem">
                                    <Icon name="logout" className="w-4 h-4" /> Leave Circle
                                </button>
                            )}
                            {canDelete && (
                                <button onClick={(e) => { e.stopPropagation(); onDeletePost?.(post.id); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-brand-danger hover:bg-brand-danger/20 flex items-center gap-3 transition-colors" role="menuitem">
                                   <Icon name="trash" className="w-4 h-4" /> Delete Post
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return <div className="w-8 h-8" />; // Placeholder to keep alignment
    };


    return (
        <div className={cardClasses}>
            <div className="flex items-start justify-between mb-3">
                 <div className="flex items-start gap-3 flex-1 min-w-0">
                    {showCircleInfo && 
                        <img 
                            src={post.circleLogo} 
                            alt={`${post.circleName} logo`} 
                            className="w-10 h-10 rounded-full cursor-pointer"
                            onClick={onCircleClick}
                        />
                    }
                     <div className="pt-px flex-1 min-w-0">
                        {showCircleInfo &&
                             <div className="flex items-center">
                                <p 
                                    className="font-bold cursor-pointer hover:underline truncate"
                                    onClick={onCircleClick}
                                >
                                  {post.circleName}
                                </p>
                                {renderJoinButton()}
                            </div>
                        }
                        <p className="text-sm text-brand-text-secondary">
                            Posted by <button onClick={() => onViewProfile?.(post.authorMemberId)} className="font-semibold text-brand-text-secondary hover:underline">{post.authorNickname}</button> · {timeAgo(new Date(post.timestamp))}
                        </p>
                     </div>
                </div>
                {renderPostMenu()}
            </div>

            <p className="mb-3 whitespace-pre-wrap">{post.content}</p>

            {post.imageUrl && (
                <img src={post.imageUrl} alt="Post content" className="rounded-lg w-full object-cover max-h-96 mb-3 border border-brand-border" />
            )}
            
            {post.videoUrl && (
                 <video 
                    src={post.videoUrl} 
                    controls 
                    className="rounded-lg w-full object-cover max-h-96 mb-3 border border-brand-border bg-black"
                />
            )}
            
            {post.audioUrl && (
                <audio 
                    src={post.audioUrl} 
                    controls 
                    className="w-full mb-3"
                />
            )}

            <div className="flex items-center justify-between text-brand-text-secondary">
                <div className="flex items-center gap-5">
                    <button 
                        className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-brand-danger' : 'text-brand-text-secondary hover:text-brand-danger'}`}
                        onClick={() => onToggleLike(post.id)}
                        aria-pressed={isLiked}
                    >
                        <Icon name={isLiked ? 'heart-filled' : 'heart'} className="w-5 h-5" />
                        <span className="text-sm">{post.reactions}</span>
                    </button>
                    <button 
                        className="flex items-center gap-2 hover:text-brand-primary transition-colors"
                        onClick={() => onOpenComments(post.id)}
                    >
                        <Icon name="comment" className="w-5 h-5" />
                        <span className="text-sm">{post.comments.length}</span>
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => onSharePost?.(post.id)}
                        className="flex items-center gap-2 hover:text-brand-accent transition-colors"
                        aria-label="Share post"
                    >
                        <Icon name="share" className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};