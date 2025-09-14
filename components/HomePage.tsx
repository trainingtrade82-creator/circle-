import React, { useState, useMemo, useRef } from 'react';
import type { Circle, User, Post } from '../types';
import type { View } from '../App';
import { Icon } from './Icon';
import { StoryBar } from './StoryBar';
import { PostCard } from './PostCard';

interface HomePageProps {
    myCircles: Circle[];
    currentUser: User;
    allPosts: Post[];
    circlesWithActiveStories: Circle[];
    circles: Circle[];
    navigate: (view: View) => void;
    onToggleLike: (postId: string) => void;
    onOpenComments: (postId: string) => void;
    onLeaveCircle: (circleId: string) => void;
    onDeletePost: (postId: string) => void;
    onViewStory: (circleId: string) => void;
    onOpenCreateStory: () => void;
    onOpenChats: () => void;
    onToggleSavePost: (postId: string) => void;
    onSharePost: (postId: string) => void;
    onViewProfile: (userId: string) => void;
    unreadNotificationsCount: number;
    onOpenNotifications: () => void;
    hasUnreadChats: boolean;
    onHideCircle: (circleId: string) => void;
    onMarkInterested: (postId: string) => void;
    onMarkNotInterested: (postId: string) => void;
    onSuggestForStory: (postId: string, circleId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ myCircles, currentUser, allPosts, circlesWithActiveStories, circles, navigate, onToggleLike, onOpenComments, onLeaveCircle, onDeletePost, onViewStory, onOpenCreateStory, onOpenChats, onToggleSavePost, onSharePost, onViewProfile, unreadNotificationsCount, onOpenNotifications, hasUnreadChats, ...postCardActions }) => {
    
    const [pullStartY, setPullStartY] = useState<number | null>(null);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const PULL_THRESHOLD = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (scrollRef.current && scrollRef.current.scrollTop === 0 && !isRefreshing) {
            setPullStartY(e.touches[0].clientY);
        } else {
            setPullStartY(null);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (pullStartY === null || isRefreshing) return;
        const currentY = e.touches[0].clientY;
        const distance = currentY - pullStartY;
        if (distance > 0) {
            // e.preventDefault(); // This can prevent scrolling altogether, use with caution
            setPullDistance(distance);
        }
    };

    const handleTouchEnd = () => {
        if (pullStartY === null || isRefreshing) return;

        setPullStartY(null);
        if (pullDistance > PULL_THRESHOLD) {
            setIsRefreshing(true);
            window.setTimeout(() => {
                setIsRefreshing(false);
            }, 1200); // Simulate network request
        }
        setPullDistance(0);
    };

    const canCreateStory = useMemo(() => {
        return myCircles.some(c => {
            const member = c.members.find(m => m.id === currentUser.id);
            return member && (member.role === 'Host' || member.role === 'Moderator');
        });
    }, [myCircles, currentUser.id]);

    const homeFeed = useMemo(() => {
        if (!myCircles || myCircles.length === 0) return [];
        const myPostIds = new Set(myCircles.flatMap(c => c.posts));
        return allPosts
            .filter(post => myPostIds.has(post.id))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [myCircles, allPosts, isRefreshing]);

    if (myCircles.length === 0) {
        return (
            <div className="flex-1 flex flex-col">
                <header className="p-4 flex justify-between items-center sticky top-0 bg-brand-surface/80 backdrop-blur-sm z-10 border-b border-brand-border h-16">
                    <h1 className="text-2xl font-bold">Circle<span className="text-brand-primary">+</span></h1>
                    <div className="flex items-center gap-4">
                        <button onClick={onOpenNotifications} className="relative p-1 text-brand-text-primary hover:text-brand-primary transition-colors">
                            <Icon name="bell" className="w-6 h-6" />
                            {unreadNotificationsCount > 0 && (
                                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-brand-danger ring-2 ring-brand-surface" />
                            )}
                        </button>
                        <button onClick={onOpenChats} className="relative p-1 text-brand-text-primary hover:text-brand-primary transition-colors">
                            <Icon name="dm" className="w-6 h-6" />
                            {hasUnreadChats && (
                                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-brand-danger ring-2 ring-brand-surface" />
                            )}
                        </button>
                    </div>
                </header>
                <div className="text-center p-10 mt-10 flex-1">
                    <Icon name="feed" className="w-16 h-16 mx-auto text-brand-text-secondary/50" />
                    <h2 className="mt-4 text-xl font-bold">Your Feed is Quiet</h2>
                    <p className="text-brand-text-secondary mt-2">Posts from circles you join will appear here.</p>
                    <button onClick={() => navigate({ type: 'EXPLORE' })} className="mt-6 bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-secondary transition-colors">
                        Explore Circles
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <header className="p-4 flex justify-between items-center flex-shrink-0 bg-brand-surface/80 backdrop-blur-sm z-10 border-b border-brand-border h-16">
                <h1 className="text-2xl font-bold">Circle<span className="text-brand-primary">+</span></h1>
                 <div className="flex items-center gap-4">
                    <button onClick={onOpenNotifications} className="relative p-1 text-brand-text-primary hover:text-brand-primary transition-colors">
                        <Icon name="bell" className="w-6 h-6" />
                        {unreadNotificationsCount > 0 && (
                             <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-brand-danger ring-2 ring-brand-surface" />
                        )}
                    </button>
                    <button onClick={onOpenChats} className="relative p-1 text-brand-text-primary hover:text-brand-primary transition-colors">
                        <Icon name="dm" className="w-6 h-6" />
                        {hasUnreadChats && (
                            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-brand-danger ring-2 ring-brand-surface" />
                        )}
                    </button>
                </div>
            </header>
            
            <div className="flex-1 overflow-hidden relative">
                <div
                    style={{
                        transform: `translateY(${isRefreshing ? 20 : Math.max(-50, pullDistance - 50)}px)`,
                        opacity: isRefreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1),
                    }}
                    className={`absolute top-0 left-0 right-0 flex justify-center items-center h-12 z-20 pt-2 transition-transform ${pullStartY === null && !isRefreshing ? 'duration-300' : ''}`}
                >
                    <Icon name="refresh" className={`w-6 h-6 text-brand-text-secondary ${isRefreshing ? 'animate-spin' : ''}`} />
                </div>
                
                <div 
                    ref={scrollRef} 
                    className="h-full overflow-y-auto pb-16 md:pb-0"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {(circlesWithActiveStories.length > 0 || canCreateStory) && (
                        <StoryBar
                            circles={circlesWithActiveStories}
                            canCreateStory={canCreateStory}
                            currentUserId={currentUser.id}
                            onViewStory={onViewStory}
                            onOpenCreateStory={onOpenCreateStory}
                        />
                    )}
                    {homeFeed.length > 0 ? (
                        <div className="space-y-0">
                            {homeFeed.map(post => {
                                const postCircle = myCircles.find(c => c.id === post.circleId);
                                if (!postCircle) return null;
                                const memberInfo = postCircle.members.find(m => m.id === currentUser.id);
                                const postAuthorMember = postCircle.members.find(m => m.id === post.authorMemberId);
                                const isMarkedInterested = postCircle.tags.some(tag => currentUser.interestedTags.includes(tag));
                                const isMarkedNotInterested = postCircle.tags.some(tag => currentUser.notInterestedTags.includes(tag));
                                const isSuggestedForStory = postCircle.storySuggestions?.some(s => s.postId === post.id);

                                return (
                                    <PostCard 
                                        key={post.id}
                                        post={post}
                                        onCircleClick={() => navigate({ type: 'CIRCLE', id: post.circleId })}
                                        isHighlighted={false}
                                        showCircleInfo={true}
                                        isMemberOfCircle={true}
                                        onToggleLike={onToggleLike}
                                        onOpenComments={onOpenComments}
                                        currentUserId={currentUser.id}
                                        circleType={postCircle.type}
                                        userRole={memberInfo?.role}
                                        postAuthorRole={postAuthorMember?.role}
                                        onLeaveCircle={onLeaveCircle}
                                        onDeletePost={onDeletePost}
                                        isSaved={currentUser.savedPosts.includes(post.id)}
                                        onToggleSavePost={onToggleSavePost}
                                        onSharePost={onSharePost}
                                        onViewProfile={onViewProfile}
                                        isMarkedInterested={isMarkedInterested}
                                        isMarkedNotInterested={isMarkedNotInterested}
                                        isSuggestedForStory={isSuggestedForStory}
                                        {...postCardActions}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center p-10 mt-10">
                            <Icon name="feed" className="w-16 h-16 mx-auto text-brand-text-secondary/50" />
                            <h2 className="mt-4 text-xl font-bold">Your Feed is Quiet</h2>
                            <p className="text-brand-text-secondary mt-2">No posts here yet. Start exploring or create a new circle!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};