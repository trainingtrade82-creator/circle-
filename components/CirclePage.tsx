import React, { useState, useEffect, useMemo } from 'react';
import type { Circle, User, Post, Member, Highlight } from '../types';
import { CircleType, Role, ActiveCircleTab, ChatAccess } from '../types';
import { Icon } from './Icon';
import type { View } from '../App';
import { MemberView } from './MemberView';
import { ChatView } from './ChatView';
import { SettingsView } from './SettingsView';
import { PostCard } from './PostCard';

interface CirclePageProps {
    circle: Circle;
    currentUser: User;
    allUsers: User[];
    allPosts: Post[];
    navigate: (view: View) => void;
    onBack: () => void;
    onToggleLike: (postId: string) => void;
    onOpenComments: (postId: string) => void;
    onJoin: (circleId: string) => void;
    onRequestToJoin: (circleId: string) => void;
    onApproveRequest: (circleId: string, userId: string) => void;
    onDenyRequest: (circleId: string, userId: string) => void;
    onLeave: (circleId: string) => void;
    onSendMessage: (content: string) => void;
    onOpenEditCircle: (circleId: string) => void;
    onOpenManageMembers: (circleId: string) => void;
    onDeleteCircle: (circleId: string) => void;
    onDeletePost: (postId: string) => void;
    onTabChange: (tab: ActiveCircleTab | null) => void;
    onToggleSavePost: (postId: string) => void;
    onSharePost: (postId: string) => void;
    onViewProfile: (userId: string) => void;
    onRequestPromotion: (circleId: string) => void;
    onRequestChatAccess: (circleId: string) => void;
    onApprovePromotion: (circleId: string, userId: string) => void;
    onDenyPromotion: (circleId: string, userId: string) => void;
    onApproveChatAccess: (circleId: string, userId: string, accessLevel: ChatAccess) => void;
    onDenyChatAccess: (circleId: string, userId: string) => void;
    onHideCircle: (circleId: string) => void;
    onMarkInterested: (postId: string) => void;
    onMarkNotInterested: (postId: string) => void;
    onSuggestForStory: (postId: string, circleId: string) => void;
    onOpenHighlightViewer: (circle: Circle, highlight: Highlight) => void;
    onOpenEditHighlight: (circle: Circle, highlight: Highlight) => void;
    onOpenCreatePostModal: (circleId: string) => void;
}

const HighlightsRow: React.FC<{
    highlights: Highlight[];
    userRole?: Role;
    onViewHighlight: (highlight: Highlight) => void;
    onOpenEditHighlight: (highlight: Highlight) => void;
}> = ({ highlights, userRole, onViewHighlight, onOpenEditHighlight }) => (
    <div className="px-4 pt-2 pb-4 border-b border-brand-border">
        <div className="flex gap-4 overflow-x-auto">
            {highlights.map(h => (
                <div key={h.id} className="flex-shrink-0 w-20 text-center group relative">
                    <button onClick={() => onViewHighlight(h)} className="w-full">
                        <img src={h.coverImage} alt={h.name} className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-brand-border group-hover:border-brand-primary transition-colors" />
                        <p className="text-xs font-semibold mt-2 truncate">{h.name}</p>
                    </button>
                    {(userRole === Role.Host || userRole === Role.Moderator) && (
                        <button 
                            onClick={() => onOpenEditHighlight(h)}
                            className="absolute top-0 right-2 bg-brand-surface/80 rounded-full p-1 text-white hover:bg-brand-primary transition-colors"
                            aria-label={`Edit highlight ${h.name}`}
                        >
                            <Icon name="settings" className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    </div>
);

export const CirclePage: React.FC<CirclePageProps> = (props) => {
    const { 
        circle, currentUser, allUsers, allPosts, navigate, onBack, onOpenComments, onJoin, onRequestToJoin, onApproveRequest, onDenyRequest, 
        onLeave, onSendMessage, onOpenEditCircle, onOpenManageMembers, onDeleteCircle, onTabChange, onViewProfile,
        onRequestPromotion, onRequestChatAccess, onApprovePromotion, onDenyPromotion, onApproveChatAccess, onDenyChatAccess,
        onOpenHighlightViewer, onOpenEditHighlight, onOpenCreatePostModal,
        ...postCardActions 
    } = props;
    const [activeTab, setActiveTab] = useState<ActiveCircleTab>(ActiveCircleTab.Feed);
    
    useEffect(() => {
        onTabChange(activeTab);
        return () => {
            onTabChange(null);
        };
    }, [activeTab, onTabChange]);

    const isMember = currentUser.memberships.includes(circle.id);
    const currentUserMemberInfo = isMember ? circle.members.find(m => m.id === currentUser.id) : undefined;
    const userRole = currentUserMemberInfo?.role;

    const circlePosts = useMemo(() => {
        return allPosts
            .filter(post => circle.posts.includes(post.id))
            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [allPosts, circle.posts]);

    if (!isMember && circle.type === CircleType.Private) {
        const hasRequested = circle.joinRequests?.includes(currentUser.id);
        return (
             <div className="h-full flex flex-col bg-brand-bg">
                <div className="flex-1 overflow-y-auto">
                     <header className="p-4 flex items-start gap-4 bg-brand-surface border-b border-brand-border">
                        <button onClick={onBack} className="mt-2 p-1">
                            <Icon name="back" />
                        </button>
                        <img src={circle.logo} alt={`${circle.name} logo`} className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                            <h1 className="text-xl font-bold">{circle.name}</h1>
                            <p className="text-sm text-brand-text-secondary">{circle.type} Circle · {circle.members.length} members</p>
                        </div>
                    </header>
                    <div className="bg-brand-surface">
                        <div className="p-4 border-b border-brand-border">
                            <p className="text-sm">{circle.bio}</p>
                        </div>
                    </div>
                    <div className="p-8 text-center">
                        <Icon name="lock" className="mx-auto h-12 w-12 text-brand-text-secondary" />
                        <h3 className="mt-4 text-lg font-semibold">This Circle is Private</h3>
                        <p className="mt-2 text-sm text-brand-text-secondary">Only members can see and participate in this circle.</p>
                        
                         <button 
                            onClick={() => onRequestToJoin(circle.id)} 
                            disabled={hasRequested}
                            className="mt-6 bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-secondary transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                         >
                            {hasRequested ? 'Request Sent' : 'Request to Join'}
                         </button>
                    </div>
                </div>
            </div>
        );
    }
    
    const tabs: {name: ActiveCircleTab, icon: string}[] = [
        { name: ActiveCircleTab.Feed, icon: "feed" },
        { name: ActiveCircleTab.Members, icon: "members" },
    ];
    
    if (isMember) {
        tabs.push({ name: ActiveCircleTab.Chat, icon: "comment" });
    }
    
    if (isMember && (userRole === Role.Host || userRole === Role.Moderator)) {
        tabs.push({ name: ActiveCircleTab.Settings, icon: "settings" });
    }

    const canPost = isMember && userRole !== Role.Viewer;

    const renderTabContent = () => {
      switch (activeTab) {
          case ActiveCircleTab.Feed:
              const hasRequestedPromotion = circle.promotionRequests?.includes(currentUser.id);
              return (
                <div className="flex flex-col relative pb-24 bg-brand-surface">
                  {userRole === Role.Viewer && (
                     <div className="p-3 m-4 bg-brand-secondary/20 border border-brand-secondary/50 rounded-lg text-center">
                        <p className="text-sm text-brand-text-primary">You are a Viewer. You can see content but not post.</p>
                        <button 
                            onClick={() => onRequestPromotion(circle.id)}
                            disabled={hasRequestedPromotion}
                            className="mt-2 text-sm bg-brand-primary text-white font-semibold py-1.5 px-3 rounded-md hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {hasRequestedPromotion ? 'Request Sent' : 'Request to be a Contributor'}
                        </button>
                     </div>
                  )}
                  {circlePosts.length > 0 ? (
                      circlePosts.map(post => {
                          const postAuthorMember = circle.members.find(m => m.id === post.authorMemberId);
                          const isMarkedInterested = circle.tags.some(tag => currentUser.interestedTags.includes(tag));
                          const isMarkedNotInterested = circle.tags.some(tag => currentUser.notInterestedTags.includes(tag));
                          const isSuggestedForStory = circle.storySuggestions?.some(s => s.postId === post.id);
                          return (
                              <PostCard 
                                  key={post.id} 
                                  post={post} 
                                  onCircleClick={() => {}}
                                  isHighlighted={false}
                                  showCircleInfo={false}
                                  isMemberOfCircle={isMember}
                                  onOpenComments={onOpenComments}
                                  currentUserId={currentUser.id}
                                  userRole={userRole}
                                  postAuthorRole={postAuthorMember?.role}
                                  isSaved={currentUser.savedPosts.includes(post.id)}
                                  onViewProfile={onViewProfile}
                                  onLeaveCircle={onLeave}
                                  isMarkedInterested={isMarkedInterested}
                                  isMarkedNotInterested={isMarkedNotInterested}
                                  isSuggestedForStory={isSuggestedForStory}
                                  {...postCardActions}
                              />
                          );
                      })
                  ) : (
                    <div className="text-center p-10 mt-10">
                        <Icon name="feed" className="w-16 h-16 mx-auto text-brand-text-secondary/50" />
                        <h2 className="mt-4 text-xl font-bold">This Circle is Quiet</h2>
                        <p className="text-brand-text-secondary mt-2">No posts have been made here yet.</p>
                        {userRole !== Role.Viewer && (
                             <p className="text-brand-text-secondary mt-4 text-sm">Be the first to share something!</p>
                        )}
                    </div>
                  )}
              </div>
              );
          case ActiveCircleTab.Members:
              return <MemberView members={circle.members} onViewProfile={onViewProfile} />;
          case ActiveCircleTab.Chat:
              if (!isMember || !currentUserMemberInfo) return null;
              if (currentUserMemberInfo.role === Role.Viewer && currentUserMemberInfo.chatAccess === ChatAccess.None) {
                  const hasRequestedAccess = circle.chatAccessRequests?.includes(currentUser.id);
                  return (
                      <div className="p-8 text-center">
                          <Icon name="comment" className="mx-auto h-12 w-12 text-brand-text-secondary" />
                          <h3 className="mt-4 text-lg font-semibold">Chat Access Required</h3>
                          <p className="mt-2 text-sm text-brand-text-secondary">As a Viewer, you need to request access to join the chat.</p>
                          <button 
                              onClick={() => onRequestChatAccess(circle.id)}
                              disabled={hasRequestedAccess}
                              className="mt-6 bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-secondary transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                          >
                              {hasRequestedAccess ? 'Request Sent' : 'Request Chat Access'}
                          </button>
                      </div>
                  );
              }
              return <ChatView
                        messages={circle.chatMessages}
                        currentUser={currentUser}
                        onSendMessage={onSendMessage}
                        canSendMessage={currentUserMemberInfo.chatAccess === ChatAccess.Full}
                    />;
          case ActiveCircleTab.Settings:
              if (!isMember || (userRole !== Role.Host && userRole !== Role.Moderator)) return null;
              return <SettingsView 
                          circle={circle} 
                          allUsers={allUsers}
                          onApprove={onApproveRequest} 
                          onDeny={onDenyRequest}
                          onOpenEditCircle={onOpenEditCircle}
                          onOpenManageMembers={onOpenManageMembers}
                          onDeleteCircle={onDeleteCircle}
                          onApprovePromotion={onApprovePromotion}
                          onDenyPromotion={onDenyPromotion}
                          onApproveChatAccess={onApproveChatAccess}
                          onDenyChatAccess={onDenyChatAccess}
                      />;
          default:
              return null;
      }
    }

    return (
        <div className="h-full flex flex-col bg-brand-bg relative">
             <div className="flex-1 overflow-y-auto">
                {/* PART 1: Non-sticky header stuff */}
                <header className="p-4 flex items-start gap-4 bg-brand-surface border-b border-brand-border">
                    <button onClick={onBack} className="mt-2 p-1">
                        <Icon name="back" />
                    </button>
                    <img src={circle.logo} alt={`${circle.name} logo`} className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">{circle.name}</h1>
                        <p className="text-sm text-brand-text-secondary">{circle.type} Circle · {circle.members.length} members</p>
                    </div>
                    {!isMember && circle.type === CircleType.Public ? (
                        <button onClick={() => onJoin(circle.id)} className="mt-2 px-4 py-1.5 rounded-full font-semibold text-sm transition-colors bg-brand-primary text-white hover:bg-brand-secondary">
                            Join
                        </button>
                    ) : <div className="w-8 h-8" />}
                </header>

                {/* PART 2: Info that is conditionally shown for FEED tab ONLY */}
                {activeTab === ActiveCircleTab.Feed && (
                    <div className="bg-brand-surface">
                        <div className="p-4 border-b border-brand-border">
                            <p className="text-sm">{circle.bio}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {circle.tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 text-xs bg-brand-bg rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>

                        {circle.highlights && circle.highlights.length > 0 && (
                             <HighlightsRow 
                                highlights={circle.highlights} 
                                userRole={userRole}
                                onViewHighlight={(highlight) => onOpenHighlightViewer(circle, highlight)}
                                onOpenEditHighlight={(highlight) => onOpenEditHighlight(circle, highlight)}
                            />
                        )}
                    </div>
                )}
                
                {/* PART 3: Sticky Tab Bar */}
                <div className="sticky top-0 bg-brand-surface/80 backdrop-blur-sm z-10">
                    <nav className="border-b border-t border-brand-border px-2 flex">
                        {tabs.map(tab => (
                            <button key={tab.name} onClick={() => setActiveTab(tab.name)} className={`flex-1 group inline-flex items-center justify-center py-3 border-b-2 font-medium text-sm transition-all
                                ${activeTab === tab.name 
                                    ? 'border-brand-primary text-brand-primary' 
                                    : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'}`
                                }
                            >
                                <Icon name={tab.icon as any} className="mr-2 h-5 w-5" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* PART 4: Tab Content */}
                <div className={activeTab !== ActiveCircleTab.Feed ? 'bg-brand-bg' : ''}>
                    {renderTabContent()}
                </div>
            </div>
             {activeTab === ActiveCircleTab.Feed && canPost && (
                <button
                    onClick={() => onOpenCreatePostModal(circle.id)}
                    className="absolute bottom-6 right-4 bg-brand-primary text-white rounded-full p-4 shadow-lg hover:bg-brand-secondary transition-colors z-20 animate-fade-in"
                    aria-label="Create new post"
                >
                    <Icon name="plus" className="w-6 h-6" />
                </button>
             )}
        </div>
    );
};