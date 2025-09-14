import React, { useState, useMemo, useRef } from 'react';
import type { Circle, User, Post } from '../types';
import type { View } from '../App';
import { Icon } from './Icon';
import { CircleCard } from './CircleCard';
import { PostCard } from './PostCard';
import { SuggestedCircleCard } from './SuggestedCircleCard';

interface ExplorePageProps {
    circles: Circle[];
    exploreFeed: (Post | { type: 'SUGGESTION_CAROUSEL'; circles: Circle[] })[];
    navigate: (view: View) => void;
    currentUser: User;
    onJoinCircle: (circleId: string) => void;
    onLeaveCircle: (circleId: string) => void;
    onRequestToJoinCircle: (circleId: string) => void;
    onToggleLike: (postId: string) => void;
    onOpenComments: (postId: string) => void;
    onToggleSavePost: (postId: string) => void;
    onSharePost: (postId: string) => void;
    onViewProfile: (userId: string) => void;
    onRefresh: () => void;
    onHideCircle: (circleId: string) => void;
    onMarkInterested: (postId: string) => void;
    onMarkNotInterested: (postId: string) => void;
    onSuggestForStory: (postId: string, circleId: string) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ circles, exploreFeed, navigate, currentUser, onJoinCircle, onLeaveCircle, onRequestToJoinCircle, onToggleLike, onOpenComments, onToggleSavePost, onSharePost, onViewProfile, onRefresh, onHideCircle, onMarkInterested, onMarkNotInterested, onSuggestForStory }) => {
    const [searchQuery, setSearchQuery] = useState('');
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
            setPullDistance(distance);
        }
    };

    const handleTouchEnd = () => {
        if (pullStartY === null || isRefreshing) return;
        setPullStartY(null);

        if (pullDistance > PULL_THRESHOLD) {
            setIsRefreshing(true);
            onRefresh();
            window.setTimeout(() => {
                setIsRefreshing(false);
            }, 1200);
        }
        setPullDistance(0);
    };


    const filteredCircles = useMemo(() => searchQuery
        ? circles.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : [], [searchQuery, circles]);


    return (
    <div className="flex flex-col h-full">
        <header className="p-4 sticky top-0 bg-brand-surface/80 backdrop-blur-sm z-10 border-b border-brand-border flex-shrink-0">
            <h1 className="text-2xl font-bold text-center mb-4">Explore</h1>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search for circles or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="search" className="w-5 h-5 text-brand-text-secondary" />
                </div>
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
                className="h-full overflow-y-auto pb-16 md:pb-0"
                ref={scrollRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {searchQuery ? (
                    <div className="p-4 space-y-4">
                        {filteredCircles.length > 0 ? (
                            filteredCircles.map(circle => (
                                <CircleCard
                                    key={circle.id}
                                    circle={circle}
                                    onSelect={() => navigate({ type: 'CIRCLE', id: circle.id })}
                                    currentUser={currentUser}
                                    onJoin={onJoinCircle}
                                    onLeave={onLeaveCircle}
                                    onRequestToJoin={onRequestToJoinCircle}
                                />
                            ))
                        ) : (
                            <p className="text-center text-brand-text-secondary py-8">No circles found for "{searchQuery}".</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-0">
                        {exploreFeed.map((item, index) => {
                            if ('type' in item && item.type === 'SUGGESTION_CAROUSEL') {
                                return (
                                    <div className="py-4 my-2 bg-brand-bg/50" key={`suggestion-carousel-${index}`}>
                                        <p className="text-sm font-bold text-brand-text-secondary mb-3 px-4">Suggested for you</p>
                                        <div className="flex gap-4 overflow-x-auto pb-2 -mb-2 px-4">
                                            {item.circles.map(circle => (
                                                <SuggestedCircleCard
                                                    key={circle.id}
                                                    circle={circle}
                                                    onSelect={() => navigate({ type: 'CIRCLE', id: circle.id })}
                                                />
                                            ))}
                                            <div className="flex-shrink-0 w-1"></div>
                                        </div>
                                    </div>
                                );
                            }
                            const post = item as Post;
                            const circle = circles.find(c => c.id === post.circleId);
                            const isMember = currentUser.memberships.includes(post.circleId);
                            const memberInfo = circle?.members.find(m => m.id === currentUser.id);
                            const postAuthorMember = circle?.members.find(m => m.id === post.authorMemberId);
                            const isMarkedInterested = circle?.tags.some(tag => currentUser.interestedTags.includes(tag));
                            const isMarkedNotInterested = circle?.tags.some(tag => currentUser.notInterestedTags.includes(tag));
                            const isSuggestedForStory = circle?.storySuggestions?.some(s => s.postId === post.id);
                            return (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onCircleClick={() => navigate({ type: 'CIRCLE', id: post.circleId })}
                                    isHighlighted={false}
                                    showCircleInfo={true}
                                    isMemberOfCircle={isMember}
                                    onToggleLike={onToggleLike}
                                    onOpenComments={onOpenComments}
                                    currentUserId={currentUser.id}
                                    circleType={circle?.type}
                                    userRole={memberInfo?.role}
                                    postAuthorRole={postAuthorMember?.role}
                                    hasRequestedToJoin={circle?.joinRequests?.includes(currentUser.id)}
                                    onJoinCircle={onJoinCircle}
                                    onLeaveCircle={onLeaveCircle}
                                    onRequestToJoinCircle={onRequestToJoinCircle}
                                    isSaved={currentUser.savedPosts.includes(post.id)}
                                    onToggleSavePost={onToggleSavePost}
                                    onSharePost={onSharePost}
                                    onViewProfile={onViewProfile}
                                    onHideCircle={onHideCircle}
                                    onMarkInterested={onMarkInterested}
                                    onMarkNotInterested={onMarkNotInterested}
                                    onSuggestForStory={onSuggestForStory}
                                    isSuggestedForStory={isSuggestedForStory}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    </div>
    );
};