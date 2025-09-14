import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Circle, User, Post, Member, Comment, ChatMessage, Story, DirectMessage, ChatConversation, UserConversation, Notification, Highlight } from './types';
import { CircleType, Role, ActiveCircleTab, StoryType, ChatAccess } from './types';
import { Navbar } from './components/Navbar';
import { CreateCircleModal } from './components/CreateCircleModal';
import { CreatePostModal, NewPostData } from './components/CreatePostModal';
import { AuthPage } from './components/AuthPage';
import { Icon } from './components/Icon';
import { CommentModal } from './components/CommentModal';
import { EditProfileModal } from './components/EditProfileModal';
import { OnboardingPage } from './components/OnboardingPage';
import { EditCircleModal } from './components/EditCircleModal';
import { ManageMembersModal } from './components/ManageMembersModal';
import { StoryViewerModal } from './components/StoryViewerModal';
import { CreateStoryModal, NewStoryData } from './components/CreateStoryModal';
import { CirclesPage } from './components/CirclesPage';
import { AccountPage } from './components/AccountPage';
import { ChatListPage } from './components/ChatListPage';
import { ChatConversationPage } from './components/ChatConversationPage';
import { FriendsPage } from './components/FriendsPage';
import { UserCirclesPage } from './components/UserCirclesPage';
import { SettingsPage } from './components/SettingsPage';
import { BlockedUsersPage } from './components/BlockedUsersPage';
import { SavedPostsPage } from './components/SavedPostsPage';
import { ShareModal } from './components/ShareModal';
import { UserProfilePage } from './components/UserProfilePage';
import { NotificationPage } from './components/NotificationPage';
import { HomePage } from './components/HomePage';
import { ExplorePage } from './components/ExplorePage';
import { CirclePage } from './components/CirclePage';
import { AddToHighlightModal } from './components/AddToHighlightModal';
import { EditHighlightModal } from './components/EditHighlightModal';
import { DesktopNavbar } from './components/DesktopNavbar';
import { DesktopSidebar } from './components/DesktopSidebar';
import { auth, db, googleProvider, seedDatabase } from './firebase';
import firebase from 'firebase/compat/app';

export type View =
    | { type: 'HOME' }
    | { type: 'EXPLORE' }
    | { type: 'CIRCLES' }
    | { type: 'ACCOUNT' }
    | { type: 'CIRCLE'; id: string }
    | { type: 'CHATS' }
    | { type: 'CONVERSATION'; id: string }
    | { type: 'FRIENDS' }
    | { type: 'USER_CIRCLES'; listOwnerId: string; listType: 'joined' | 'created' }
    | { type: 'SETTINGS' }
    | { type: 'BLOCKED_USERS' }
    | { type: 'SAVED_POSTS' }
    | { type: 'USER_PROFILE'; userId: string }
    | { type: 'NOTIFICATIONS' };

const isStoryActive = (story: Story): boolean => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(story.timestamp) > twentyFourHoursAgo;
};

type ViewingStoryState = { circles: (Circle & { originalCircleId?: string })[], initialCircleId: string } | null;
export type Theme = 'light' | 'dark' | 'grey' | 'blue' | 'system';

const generateUniqueUsername = (name: string, allUsers: User[]): string => {
    const baseUsername = `@${name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '')}`;
    let username = baseUsername;
    let counter = 1;
    while (allUsers.some(u => u.username === username)) {
        username = `${baseUsername}${counter}`;
        counter++;
    }
    return username;
};

export const App: React.FC = () => {
    const [authUser, setAuthUser] = useState<firebase.User | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
    const [authRedirectError, setAuthRedirectError] = useState<string | null>(null);

    // --- All data state is now from Firestore ---
    const [circles, setCircles] = useState<Circle[]>([]);
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [userConversations, setUserConversations] = useState<UserConversation[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const [history, setHistory] = useState<View[]>([{ type: 'HOME' }]);

    // Modal States
    const [isCreateCircleModalOpen, setCreateCircleModalOpen] = useState(false);
    const [createPostForCircleId, setCreatePostForCircleId] = useState<string | null>(null);
    const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
    const [isEditProfileModalOpen, setEditProfileModalOpen] = useState(false);
    const [editingCircleId, setEditingCircleId] = useState<string | null>(null);
    const [managingMembersCircleId, setManagingMembersCircleId] = useState<string | null>(null);
    const [viewingStoryState, setViewingStoryState] = useState<ViewingStoryState>(null);
    const [isCreateStoryModalOpen, setCreateStoryModalOpen] = useState(false);
    const [sharingPost, setSharingPost] = useState<Post | null>(null);
    const [addToHighlightItem, setAddToHighlightItem] = useState<{ type: 'story', id: string, circleId: string } | null>(null);
    const [editingHighlight, setEditingHighlight] = useState<{ circle: Circle, highlight: Highlight } | null>(null);
    
    const [shareFeedback, setShareFeedback] = useState<string | null>(null);
    const [activeCircleTab, setActiveCircleTab] = useState<ActiveCircleTab | null>(null);
    const [activeChatListTab, setActiveChatListTab] = useState<'Circles' | 'Friends' | 'Requests'>('Circles');

    const appLoadedRef = useRef(false);

    // --- DERIVED STATE & DATA ---
    const myCircles = useMemo(() => circles.filter(c => currentUser?.memberships.includes(c.id)), [circles, currentUser]);
    
    const myCirclesWithActiveStories = useMemo(() => {
        return myCircles.map(circle => ({
            ...circle,
            stories: circle.stories.filter(isStoryActive)
        })).filter(circle => circle.stories.length > 0);
    }, [myCircles]);

    const currentView = history[history.length - 1];
    
    const navigate = useCallback((view: View) => {
        setHistory(prev => [...prev, view]);
    }, []);

    // FIX: Renamed `handleBack` to `onBack` to fix a scope error where `onBack` was used as a shorthand property in `pageProps` but was not defined.
    const onBack = useCallback(() => {
        setHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }, []);
    
    // --- FIREBASE DATA LISTENERS ---
    useEffect(() => {
        // Seed database with mock data if it's empty
        seedDatabase();

        const listeners = [
            db.collection('users').onSnapshot(snapshot => setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)))),
            db.collection('circles').onSnapshot(snapshot => setCircles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Circle)))),
            db.collection('posts').onSnapshot(snapshot => setAllPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: (doc.data().timestamp as firebase.firestore.Timestamp)?.toDate() } as Post)))),
            db.collection('conversations').onSnapshot(snapshot => setConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatConversation)))),
            db.collection('userConversations').onSnapshot(snapshot => setUserConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserConversation)))),
            db.collection('notifications').onSnapshot(snapshot => setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)))),
        ];
        return () => listeners.forEach(unsubscribe => unsubscribe());
    }, []);

    // --- FIREBASE AUTH ---
     useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setIsLoading(true);
            if (user) {
                setAuthUser(user);
                const userRef = db.collection('users').doc(user.uid);
                const doc = await userRef.get();
                if (doc.exists) {
                    setCurrentUser({ id: doc.id, ...doc.data() } as User);
                } else {
                    // This case handles a user that authenticated but doesn't have a user document yet.
                    // The redirect handler will create it.
                    console.log("Authenticated user has no user document yet.");
                }
            } else {
                setAuthUser(null);
                setCurrentUser(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        const processRedirect = async () => {
            try {
                const result = await auth.getRedirectResult();
                if (result && result.user) {
                    const user = result.user;
                    const userRef = db.collection('users').doc(user.uid);
                    const doc = await userRef.get();
                    if (!doc.exists) {
                        const usersSnapshot = await db.collection('users').get();
                        const allCurrentUsers = usersSnapshot.docs.map(d => d.data() as User);
                        
                        const newUser: User = {
                            id: user.uid,
                            name: user.displayName || 'Google User',
                            username: generateUniqueUsername(user.displayName || 'user', allCurrentUsers),
                            email: user.email!,
                            bio: '',
                            birthDate: '',
                            memberships: [],
                            isGoogleAccount: true,
                            picture: user.photoURL || `https://picsum.photos/seed/${user.uid}/100`,
                            friends: [],
                            friendRequestsSent: [],
                            friendRequestsReceived: [],
                            blockedUsers: [],
                            mutedUsers: [],
                            isPrivate: false,
                            savedPosts: [],
                            interestedTags: [],
                            notInterestedTags: [],
                            hiddenCircleIds: [],
                            hasCompletedOnboarding: false,
                        };
                        await userRef.set(newUser);
                    }
                }
            } catch (error: any) {
                console.error("Google sign in redirect error:", error);
                if (error.code === 'auth/operation-not-supported-in-this-environment') {
                    setAuthRedirectError("Google Sign-In is not supported in this browser environment. Please open the app in a new tab or try a different sign-in method.");
                } else {
                    setAuthRedirectError(`An error occurred during sign-in: ${error.message}`);
                }
            }
        };
        processRedirect();
    }, []);

    const handleLogin = async (email: string, password: string): Promise<string | null> => {
        try {
            await auth.signInWithEmailAndPassword(email, password);
            return null;
        } catch (error: any) {
            return error.message;
        }
    };
    
    const handleSignUp = async (name: string, username: string, email: string, password: string, birthDate: string): Promise<string | null> => {
        try {
            const usernameQuery = await db.collection('users').where('username', '==', username).get();
            if (!usernameQuery.empty) {
                return "Username is already taken. Please choose another one.";
            }
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            if (cred.user) {
                const newUser: User = {
                    id: cred.user.uid, name, username, email, birthDate, bio: '', memberships: [], friends: [], friendRequestsSent: [], friendRequestsReceived: [], blockedUsers: [], mutedUsers: [], isPrivate: false, savedPosts: [], interestedTags: [], notInterestedTags: [], hiddenCircleIds: [], hasCompletedOnboarding: false,
                };
                await db.collection('users').doc(cred.user.uid).set(newUser);
            }
            return null;
        } catch (error: any) {
             if (error.code === 'auth/email-already-in-use') return 'This email is already in use. Please try logging in.';
             if (error.code === 'auth/weak-password') return 'Password should be at least 6 characters.';
             return error.message;
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await auth.signInWithRedirect(googleProvider);
        } catch (error: any) {
            console.error("Google sign in error", error.message);
        }
    };
    
    const handleLogout = async () => {
        await auth.signOut();
        setCurrentUser(null);
        setHistory([{ type: 'HOME' }]);
    };

    const handleFinishOnboarding = () => {
        if (!currentUser) return;
        db.collection('users').doc(currentUser.id).update({ hasCompletedOnboarding: true });
    };


    // --- DATA MANIPULATION (Firestore) ---
    const handleCreateCircle = async (circleData: Omit<Circle, 'id' | 'members' | 'posts' | 'chatMessages' | 'stories'>) => {
        if (!currentUser) return;
        const newCircleRef = db.collection('circles').doc();
        const newCircle: Circle = {
            ...circleData,
            id: newCircleRef.id,
            members: [{ id: currentUser.id, nickname: currentUser.name, tagId: `#${Math.random().toString(36).substring(2, 7).toUpperCase()}`, role: Role.Host, loyaltyPoints: 0, chatAccess: ChatAccess.Full }],
            posts: [], chatMessages: [], stories: [],
        };
        await newCircleRef.set(newCircle);
        await db.collection('users').doc(currentUser.id).update({
            memberships: firebase.firestore.FieldValue.arrayUnion(newCircle.id)
        });
        setCreateCircleModalOpen(false);
        navigate({ type: 'CIRCLE', id: newCircle.id });
    };

    const handleJoinCircle = (circleId: string) => {
        if (!currentUser) return;
        const newMember: Member = {
            id: currentUser.id, nickname: currentUser.name, tagId: `#${Math.random().toString(36).substring(2, 7).toUpperCase()}`, role: Role.Contributor, loyaltyPoints: 0, chatAccess: ChatAccess.Full,
        };
        db.collection('circles').doc(circleId).update({
            members: firebase.firestore.FieldValue.arrayUnion(newMember)
        });
        db.collection('users').doc(currentUser.id).update({
            memberships: firebase.firestore.FieldValue.arrayUnion(circleId)
        });
    };

    const handleRequestToJoinCircle = (circleId: string) => {
        if (!currentUser) return;
        db.collection('circles').doc(circleId).update({
            joinRequests: firebase.firestore.FieldValue.arrayUnion(currentUser.id)
        });
    };

    const handleLeaveCircle = (circleId: string) => {
        if (!currentUser) return;
        const circle = circles.find(c => c.id === circleId);
        if(!circle) return;
        const updatedMembers = circle.members.filter(m => m.id !== currentUser.id);
        db.collection('circles').doc(circleId).update({ members: updatedMembers });
        db.collection('users').doc(currentUser.id).update({
            memberships: firebase.firestore.FieldValue.arrayRemove(circleId)
        });
        if (currentView.type === 'CIRCLE' && currentView.id === circleId) {
            navigate({ type: 'HOME' });
        }
    };

    const handleCreatePost = async (postData: NewPostData) => {
        if (!currentUser || !createPostForCircleId) return;
        const circle = circles.find(c => c.id === createPostForCircleId);
        const member = circle?.members.find(m => m.id === currentUser.id);
        if (!circle || !member) return;

        const newPostRef = db.collection('posts').doc();
        const newPost: Post = {
            ...postData,
            id: newPostRef.id,
            authorMemberId: currentUser.id, authorNickname: member.nickname,
            circleId: circle.id, circleName: circle.name, circleLogo: circle.logo,
            timestamp: new Date(), reactions: 0, comments: [], likedBy: [],
        };
        await newPostRef.set(newPost);
        await db.collection('circles').doc(createPostForCircleId).update({
            posts: firebase.firestore.FieldValue.arrayUnion(newPost.id)
        });
        setCreatePostForCircleId(null);
    };
    
    const handleToggleLike = (postId: string) => {
        if (!currentUser) return;
        const postRef = db.collection('posts').doc(postId);
        db.runTransaction(async (transaction) => {
            const doc = await transaction.get(postRef);
            if (!doc.exists) return;
            const data = doc.data() as Post;
            const isLiked = data.likedBy.includes(currentUser.id);
            const newLikedBy = isLiked ? data.likedBy.filter(id => id !== currentUser.id) : [...data.likedBy, currentUser.id];
            transaction.update(postRef, { likedBy: newLikedBy, reactions: newLikedBy.length });
        });
    };

    const handleAddComment = (postId: string, content: string) => {
        if (!currentUser) return;
        const post = allPosts.find(p => p.id === postId);
        if(!post) return;
        const circle = circles.find(c => c.id === post.circleId);
        const memberInfo = circle?.members.find(m => m.id === currentUser.id);
        const newComment: Comment = {
            id: `comment-${Date.now()}`, authorId: currentUser.id,
            authorNickname: memberInfo?.nickname || currentUser.name,
            content, timestamp: new Date(),
        };
        db.collection('posts').doc(postId).update({
            comments: firebase.firestore.FieldValue.arrayUnion(newComment)
        });
    };
    
    const handleSharePost = (postId: string) => {
        const post = allPosts.find(p => p.id === postId);
        if (post) setSharingPost(post);
    };

    const handleSendMessageInCircle = (circleId: string, content: string) => {
        if (!currentUser) return;
        const circle = circles.find(c => c.id === circleId);
        const member = circle?.members.find(m => m.id === currentUser.id);
        if (!circle || !member) return;
        const newMessage: ChatMessage = {
            id: `chatmsg-${Date.now()}`, authorId: currentUser.id,
            authorNickname: member.nickname, content: content, timestamp: new Date(),
        };
        db.collection('circles').doc(circleId).update({
            chatMessages: firebase.firestore.FieldValue.arrayUnion(newMessage)
        });
    };

    const handleStoryViewed = (storyId: string) => {
        if (!currentUser) return;
        const circle = circles.find(c => c.stories.some(s => s.id === storyId));
        if (!circle) return;
        const updatedStories = circle.stories.map(s => 
            s.id === storyId ? { ...s, viewedBy: [...new Set([...s.viewedBy, currentUser.id])] } : s
        );
        db.collection('circles').doc(circle.id).update({ stories: updatedStories });
    };

    const handleCreateStory = (circleId: string, storyData: NewStoryData) => {
        if (!currentUser) return;
        const newStory: Story = {
            id: `story-${Date.now()}`, authorMemberId: currentUser.id,
            timestamp: new Date(), viewedBy: [currentUser.id], reactions: [], ...storyData,
        };
        db.collection('circles').doc(circleId).update({
            stories: firebase.firestore.FieldValue.arrayUnion(newStory)
        });
        setCreateStoryModalOpen(false);
        setSharingPost(null);
    };

    useEffect(() => {
        localStorage.setItem('theme', theme);
        const docEl = document.documentElement;
        docEl.classList.remove('dark', 'grey', 'blue');
        if (theme === 'system') {
            if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) docEl.classList.add('dark');
        } else if (theme !== 'light') {
            docEl.classList.add(theme);
        }
    }, [theme]);

    useEffect(() => {
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen && !appLoadedRef.current) {
            appLoadedRef.current = true;
            window.setTimeout(() => {
                splashScreen.classList.add('fade-out');
                window.setTimeout(() => splashScreen.classList.add('hidden'), 500);
            }, 500);
        }
    }, []);

    if (isLoading) {
      return null;
    }
    
    if (!currentUser) {
        return <AuthPage onLogin={handleLogin} onSignUp={handleSignUp} onGoogleSignIn={handleGoogleSignIn} initialError={authRedirectError} />;
    }

    if (!currentUser.hasCompletedOnboarding) {
        return <OnboardingPage 
            currentUser={currentUser} 
            circles={circles.filter(c => c.type === CircleType.Public)}
            onJoinCircle={(circleId) => db.collection('users').doc(currentUser.id).update({memberships: firebase.firestore.FieldValue.arrayUnion(circleId)})}
            onLeaveCircle={(circleId) => db.collection('users').doc(currentUser.id).update({memberships: firebase.firestore.FieldValue.arrayRemove(circleId)})}
            onFinish={handleFinishOnboarding} 
        />
    }

    const renderPage = () => {
        const pageProps = { currentUser, circles, allUsers: users, navigate, onBack, onViewProfile: (userId: string) => navigate({ type: 'USER_PROFILE', userId }),};
        switch (currentView.type) {
            case 'HOME':
                return <HomePage {...pageProps} myCircles={myCircles} allPosts={allPosts} circlesWithActiveStories={myCirclesWithActiveStories} onToggleLike={handleToggleLike} onOpenComments={setCommentingPostId} onLeaveCircle={handleLeaveCircle} onDeletePost={()=>{}} onViewStory={(circleId) => setViewingStoryState({ circles: myCirclesWithActiveStories, initialCircleId: circleId })} onOpenCreateStory={() => setCreateStoryModalOpen(true)} onOpenChats={() => navigate({type: 'CHATS'})} onToggleSavePost={(postId) => {}} onSharePost={handleSharePost} unreadNotificationsCount={0} onOpenNotifications={() => navigate({ type: 'NOTIFICATIONS' })} hasUnreadChats={false} onHideCircle={() => {}} onMarkInterested={() => {}} onMarkNotInterested={() => {}} onSuggestForStory={() => {}} />;
            case 'EXPLORE':
                return <ExplorePage {...pageProps} exploreFeed={allPosts.map(p => p as any)} onJoinCircle={handleJoinCircle} onLeaveCircle={handleLeaveCircle} onRequestToJoinCircle={handleRequestToJoinCircle} onToggleLike={handleToggleLike} onOpenComments={setCommentingPostId} onToggleSavePost={()=>{}} onSharePost={handleSharePost} onRefresh={() => {}} onHideCircle={() => {}} onMarkInterested={() => {}} onMarkNotInterested={() => {}} onSuggestForStory={() => {}} />;
            case 'CIRCLES':
                return <CirclesPage {...pageProps} onLeaveCircle={handleLeaveCircle} />;
            case 'ACCOUNT':
                return <AccountPage {...pageProps} onLogout={handleLogout} onEditProfile={() => setEditProfileModalOpen(true)} />;
            case 'CIRCLE':
                const circle = circles.find(c => c.id === currentView.id);
                if (!circle) return <div>Circle not found</div>;
                return <CirclePage {...pageProps} circle={circle} allPosts={allPosts} onToggleLike={handleToggleLike} onOpenComments={setCommentingPostId} onJoin={()=>{}} onRequestToJoin={()=>{}} onApproveRequest={()=>{}} onDenyRequest={()=>{}} onLeave={handleLeaveCircle} onSendMessage={(content) => handleSendMessageInCircle(circle.id, content)} onOpenEditCircle={setEditingCircleId} onOpenManageMembers={setManagingMembersCircleId} onDeleteCircle={()=>{}} onDeletePost={()=>{}} onTabChange={setActiveCircleTab} onToggleSavePost={()=>{}} onSharePost={handleSharePost} onRequestPromotion={()=>{}} onRequestChatAccess={()=>{}} onApprovePromotion={()=>{}} onDenyPromotion={()=>{}} onApproveChatAccess={()=>{}} onDenyChatAccess={()=>{}} onHideCircle={() => {}} onMarkInterested={() => {}} onMarkNotInterested={() => {}} onSuggestForStory={() => {}} onOpenHighlightViewer={() => {}} onOpenEditHighlight={() => {}} onOpenCreatePostModal={setCreatePostForCircleId} />;
             case 'CHATS':
                return <ChatListPage {...pageProps} circleConversations={conversations} userConversations={userConversations} activeTab={activeChatListTab} onTabChange={setActiveChatListTab} unreadCircleCount={0} unreadFriendCount={0} unreadRequestCount={0} onMarkRequestsAsRead={() => {}} />;
            case 'CONVERSATION':
                const isUserConvo = currentView.id.startsWith('uconvo-');
                const conversation = isUserConvo ? userConversations.find(c => c.id === currentView.id) : conversations.find(c => c.id === currentView.id);
                if (!conversation) return <div>Conversation not found.</div>;
                return <ChatConversationPage {...pageProps} conversation={conversation} conversationType={isUserConvo ? 'user' : 'circle'} allPosts={allPosts} onSendCircleMessage={() => {}} onSendUserMessage={() => {}} onAcceptRequest={() => {}} onDeclineRequest={() => {}} onBlockUser={() => {}} onMarkAsRead={() => {}} />;
            case 'FRIENDS':
                 return <FriendsPage {...pageProps} onSendFriendRequest={() => {}} onAcceptFriendRequest={() => {}} onDeclineFriendRequest={() => {}} />;
            case 'USER_CIRCLES':
                const owner = users.find(u => u.id === currentView.listOwnerId);
                if (!owner) return <div>User not found.</div>;
                return <UserCirclesPage {...pageProps} listOwner={owner} listType={currentView.listType} />;
            case 'SETTINGS':
                return <SettingsPage {...pageProps} onLogout={handleLogout} onToggleAccountPrivacy={() => {}} theme={theme} onThemeChange={setTheme} />;
            case 'BLOCKED_USERS':
                return <BlockedUsersPage {...pageProps} onUnblockUser={() => {}} />;
            case 'SAVED_POSTS':
                return <SavedPostsPage {...pageProps} allPosts={allPosts} onToggleLike={handleToggleLike} onOpenComments={setCommentingPostId} onToggleSavePost={()=>{}} onDeletePost={()=>{}} onLeaveCircle={handleLeaveCircle} onSharePost={handleSharePost} onMarkInterested={() => {}} onMarkNotInterested={() => {}} onHideCircle={() => {}} onSuggestForStory={() => {}} />;
            case 'USER_PROFILE':
                return <UserProfilePage {...pageProps} targetUserId={currentView.userId} onSendFriendRequest={() => {}} onNavigateToChat={() => {}} />;
            case 'NOTIFICATIONS':
                return <NotificationPage {...pageProps} notifications={notifications} allPosts={allPosts} onAcceptFriendRequest={()=>{}} onDeclineFriendRequest={()=>{}} onApproveCircleRequest={()=>{}} onDenyCircleRequest={()=>{}} onApprovePromotion={()=>{}} onDenyPromotion={()=>{}} onApproveChatAccess={()=>{}} onDenyChatAccess={()=>{}} onCreateStoryFromSuggestion={()=>{}} onDismissStorySuggestion={()=>{}} onHandleNotificationAction={()=>{}} unreadRequestCount={0} unreadActivityCount={0} onMarkAsRead={()=>{}} />;
            default: return <div>Not implemented</div>;
        }
    };
    
    return (
         <div className="bg-brand-bg min-h-screen font-sans text-brand-text-primary">
            <div className="flex justify-center w-full max-w-screen-xl mx-auto">
                <DesktopNavbar currentUser={currentUser} activeView={currentView.type} onTabSelect={navigate} onOpenCreateCircleModal={() => setCreateCircleModalOpen(true)} onLogout={handleLogout} />
                <div className="w-full md:max-w-[600px] border-x border-brand-border flex-grow min-h-screen">
                    <main className="h-full w-full flex flex-col">{renderPage()}</main>
                </div>
                <DesktopSidebar currentUser={currentUser} circles={circles} navigate={navigate} onJoinCircle={handleJoinCircle} onLeaveCircle={handleLeaveCircle} onRequestToJoinCircle={handleRequestToJoinCircle} />
            </div>
            
            {!['CIRCLE', 'CHATS', 'CONVERSATION', 'FRIENDS', 'USER_CIRCLES', 'SETTINGS', 'BLOCKED_USERS', 'SAVED_POSTS', 'USER_PROFILE', 'NOTIFICATIONS'].includes(currentView.type) && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
                    <Navbar activeView={currentView.type} onTabSelect={navigate} onOpenCreateCircleModal={() => setCreateCircleModalOpen(true)} />
                </div>
            )}

            {isCreateCircleModalOpen && <CreateCircleModal onClose={() => setCreateCircleModalOpen(false)} onCreate={handleCreateCircle} />}
            {createPostForCircleId && <CreatePostModal circle={circles.find(c => c.id === createPostForCircleId)!} onClose={() => setCreatePostForCircleId(null)} onCreate={handleCreatePost} />}
            {commentingPostId && <CommentModal post={allPosts.find(p => p.id === commentingPostId)!} onClose={() => setCommentingPostId(null)} onAddComment={handleAddComment} currentUser={currentUser} circles={circles} allUsers={users} onViewProfile={(userId) => navigate({type: 'USER_PROFILE', userId})} />}
            {isEditProfileModalOpen && <EditProfileModal currentUser={currentUser} onClose={() => setEditProfileModalOpen(false)} onSave={() => {}} />}
            {editingCircleId && <EditCircleModal circle={circles.find(c => c.id === editingCircleId)!} onClose={() => setEditingCircleId(null)} onSave={() => {}} />}
            {managingMembersCircleId && <ManageMembersModal circle={circles.find(c => c.id === managingMembersCircleId)!} currentUserRole={myCircles.find(c => c.id === managingMembersCircleId)?.members.find(m => m.id === currentUser.id)?.role || Role.Viewer} onClose={() => setManagingMembersCircleId(null)} onUpdateRole={() => {}} onRemoveMember={() => {}} />}
            {viewingStoryState && <StoryViewerModal {...viewingStoryState} currentUser={currentUser} allPosts={allPosts} onClose={() => setViewingStoryState(null)} onStoryViewed={handleStoryViewed} onAddReaction={()=>{}} onSendReply={()=>{}} navigate={navigate} />}
            {isCreateStoryModalOpen && <CreateStoryModal circles={myCircles} allPosts={allPosts} sharedPost={sharingPost} onClose={() => { setCreateStoryModalOpen(false); setSharingPost(null); }} onCreate={handleCreateStory} />}
            {sharingPost && !isCreateStoryModalOpen && <ShareModal post={sharingPost} currentUser={currentUser} userConversations={userConversations} circleConversations={conversations} circles={circles} allUsers={users} canCreateStory={true} onClose={() => setSharingPost(null)} onShareToChat={()=>{}} onSharePostToStory={() => setCreateStoryModalOpen(true)} onCopyLink={()=>{}} onNativeShare={()=>{}} navigate={navigate} onViewProfile={(userId) => navigate({type: 'USER_PROFILE', userId})} shareFeedback={shareFeedback} />}
            {addToHighlightItem && <AddToHighlightModal item={addToHighlightItem} circle={circles.find(c => c.id === addToHighlightItem.circleId)!} onClose={() => setAddToHighlightItem(null)} onAddToHighlight={() => {}} />}
            {editingHighlight && <EditHighlightModal circle={editingHighlight.circle} highlight={editingHighlight.highlight} onClose={() => setEditingHighlight(null)} onSave={() => {}} />}
        </div>
    );
};