import React, { useMemo } from 'react';
import type { User, Post, Circle } from '../types';
import { Icon } from './Icon';
import { PostCard } from './PostCard';
import type { View } from '../App';


interface SavedPostsPageProps {
    currentUser: User;
    allPosts: Post[];
    circles: Circle[];
    navigate: (view: View) => void;
    onBack: () => void;
    onToggleLike: (postId: string) => void;
    onOpenComments: (postId: string) => void;
    onToggleSavePost: (postId: string) => void;
    onDeletePost: (postId: string) => void;
    onLeaveCircle: (circleId: string) => void;
    onSharePost: (postId: string) => void;
    onViewProfile: (userId: string) => void;
    onMarkInterested: (postId: string) => void;
    onMarkNotInterested: (postId: string) => void;
    onHideCircle: (circleId: string) => void;
    onSuggestForStory: (postId: string, circleId: string) => void;
}

export const SavedPostsPage: React.FC<SavedPostsPageProps> = ({ currentUser, allPosts, circles, navigate, onBack, onViewProfile, ...postCardProps }) => {
    const savedPosts = useMemo(() => 
        allPosts
            .filter(p => currentUser.savedPosts.includes(p.id))
            .sort((a,b) => currentUser.savedPosts.indexOf(b.id) - currentUser.savedPosts.indexOf(a.id))
    , [allPosts, currentUser.savedPosts]);

     return (
         <div className="flex flex-col h-full">
            <header className="p-4 flex items-center sticky top-0 bg-brand-surface/80 backdrop-blur-sm z-10 border-b border-brand-border h-16">
                <button onClick={onBack} className="p-1"><Icon name="back" /></button>
                <h1 className="text-xl font-bold text-center flex-1">Saved Content</h1>
                <div className="w-8"></div>
            </header>
            <div className="flex-1 overflow-y-auto">
                 {savedPosts.length > 0 ? (
                    savedPosts.map(post => {
                        const circle = circles.find(c => c.id === post.circleId);
                        const isMember = currentUser.memberships.includes(post.circleId);
                        const memberInfo = isMember ? circle?.members.find(m => m.id === currentUser.id) : undefined;
                        const postAuthorMember = circle?.members.find(m => m.id === post.authorMemberId);
                        const isMarkedInterested = circle?.tags.some(tag => currentUser.interestedTags.includes(tag));
                        const isMarkedNotInterested = circle?.tags.some(tag => currentUser.notInterestedTags.includes(tag));
                        const isSuggestedForStory = circle?.storySuggestions?.some(s => s.postId === post.id);
                        return (
                            <PostCard
                                key={post.id}
                                post={post}
                                {...postCardProps}
                                onCircleClick={() => navigate({ type: 'CIRCLE', id: post.circleId })}
                                isHighlighted={false}
                                showCircleInfo={true}
                                isMemberOfCircle={isMember}
                                currentUserId={currentUser.id}
                                circleType={circle?.type}
                                userRole={memberInfo?.role}
                                postAuthorRole={postAuthorMember?.role}
                                isSaved={true}
                                onViewProfile={onViewProfile}
                                isMarkedInterested={isMarkedInterested}
                                isMarkedNotInterested={isMarkedNotInterested}
                                isSuggestedForStory={isSuggestedForStory}
                            />
                        );
                    })
                ) : (
                    <div className="text-center p-10 mt-10">
                        <Icon name="bookmark" className="w-16 h-16 mx-auto text-brand-text-secondary/50" />
                        <h2 className="mt-4 text-xl font-bold">No Saved Content</h2>
                        <p className="text-brand-text-secondary mt-2">Tap the bookmark icon on posts to save them for later.</p>
                    </div>
                )}
            </div>
        </div>
    );
};