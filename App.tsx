import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Circle, User, Post, Member, Comment, ChatMessage, Story, DirectMessage, ChatConversation, UserConversation, Notification, Highlight, StorySuggestion } from './types';
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
// FIX: Use v8 compat firebase instance and helpers.
import { auth, db, googleProvider, seedDatabase, Timestamp, FieldValue } from './firebase';
// FIX: Correctly import firebase to get the User type.
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

export const App: React.FC = () => {
    // FIX: Use firebase.User as the type for the auth user from Firebase.
    const [authUser, setAuthUser] = useState<firebase.User | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
    const [authRedirectError, setAuthRedirectError] = useState<string | null>(null);
    // FIX: Use firebase.User as the type for the auth user from Firebase.
    const [postGoogleSignUpUser, setPostGoogleSignUpUser] = useState<firebase.User | null>(null);
    const [firestoreError, setFirestoreError] = useState<string | null>(null);

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

    const onBack = useCallback(() => {
        setHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }, []);
    
    const onViewProfile = useCallback((userId: string) => {
        navigate({ type: 'USER_PROFILE', userId });
    }, [navigate]);

    // --- FIREBASE DATA LISTENERS ---
    useEffect(() => {
        // Seed database with mock data if it's empty
        seedDatabase();

        const handleError = (error: Error, collectionName: string) => {
            console.error(`Firestore '${collectionName}' listener error:`, error);
            if (error.message.toLowerCase().includes('unavailable') || error.message.toLowerCase().includes('failed to get document')) {
                 setFirestoreError(
                    "The application could not connect to your database. This usually happens for one of two reasons:\n\n**1. The Firestore Database isn't created yet.**\n- Go to your Firebase Console -> Firestore Database.\n- If you see a **'Create database'** button, click it.\n- Start in **Test mode** (this also sets the correct security rules for now).\n- Choose a location and click **Enable**.\n\n**2. Your Security Rules have expired.** (If you've already created the database)\n- Go to the **Rules** tab in the Firestore section.\n- Replace the content with the development rules below and click **Publish**.\n\n```\nrules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}\n```\n**Warning**: These rules are for development only and make your database public. Secure your data before production.\n\nAfter fixing the issue, please **refresh the application**."
                 );
            } else {
                 setFirestoreError(`An error occurred while fetching data from Firestore (${collectionName}): ${error.message}`);
            }
        };

        const createListener = (collectionName: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
            // FIX: Use v8 compat syntax for onSnapshot listener.
            return db.collection(collectionName).onSnapshot((snapshot) => {
                const items: any[] = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Convert Firestore Timestamps to JS Dates recursively
                    const convertTimestamps = (obj: any): any => {
                        if (obj === null || typeof obj !== 'object') {
                            return obj;
                        }
                        if (obj instanceof Timestamp) {
                            return obj.toDate();
                        }
                        if (Array.isArray(obj)) {
                            return obj.map(convertTimestamps);
                        }
                        const newObj: { [key: string]: any } = {};
                        for (const key in obj) {
                            newObj[key] = convertTimestamps(obj[key]);
                        }
                        return newObj;
                    };
                    items.push({ id: doc.id, ...convertTimestamps(data) });
                });
                setter(items);
            }, (error) => handleError(error, collectionName));
        };

        const listeners = [
            createListener('users', setUsers),
            createListener('circles', setCircles),
            createListener('posts', setAllPosts),
            createListener('conversations', setConversations),
            createListener('userConversations', setUserConversations),
            createListener('notifications', setNotifications),
        ];
        return () => listeners.forEach(unsubscribe => unsubscribe());
    }, []);

    // --- FIREBASE AUTH ---
    useEffect(() => {
        let userDocListener: (() => void) | undefined;
        // FIX: Use v8 compat auth.onAuthStateChanged method.
        const authListener = auth.onAuthStateChanged(user => {
            if (userDocListener) userDocListener(); // Cleanup previous listener

            setIsLoading(true);
            if (user) {
                setAuthUser(user);
                // FIX: Use v8 compat syntax for document onSnapshot listener.
                userDocListener = db.collection('users').doc(user.uid).onSnapshot(docSnap => {
                    if (docSnap.exists) {
                        setCurrentUser({ id: docSnap.id, ...docSnap.data() } as User);
                        setPostGoogleSignUpUser(null); // Profile exists, we are not in a pending sign-up state.
                    } else {
                        setCurrentUser(null);
                        // This is a new user or an account where the DB entry was deleted.
                        // Check if they used Google to sign in.
                        if (user.providerData.some(p => p?.providerId === 'google.com')) {
                            // Trigger the profile completion flow.
                            setPostGoogleSignUpUser(user);
                        }
                    }
                    setIsLoading(false);
                });
            } else {
                // No user is signed in
                setAuthUser(null);
                setCurrentUser(null);
                setPostGoogleSignUpUser(null);
                setIsLoading(false);
            }
        });

        return () => {
            authListener();
            if (userDocListener) userDocListener();
        };
    }, []); // This should only run once to set up the listeners.
    

    const handleLogin = async (email: string, password: string): Promise<string | null> => {
        try {
            // FIX: Use v8 compat auth.signInWithEmailAndPassword method.
            await auth.signInWithEmailAndPassword(email, password);
            return null;
        } catch (error: any) {
            return error.message;
        }
    };
    
    const handleSignUp = async (name: string, username: string, email: string, password: string, birthDate: string): Promise<string | null> => {
        try {
            // FIX: Use v8 compat syntax for query.
            const usernameQuery = db.collection('users').where('username', '==', username);
            const usernameSnapshot = await usernameQuery.get();
            if (!usernameSnapshot.empty) {
                return "Username is already taken. Please choose another one.";
            }
            // FIX: Use v8 compat auth.createUserWithEmailAndPassword method.
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            if (cred.user) {
                const newUser: User = {
                    id: cred.user.uid, name, username, email, birthDate, bio: '', memberships: [], friends: [], friendRequestsSent: [], friendRequestsReceived: [], blockedUsers: [], mutedUsers: [], isPrivate: false, savedPosts: [], interestedTags: [], notInterestedTags: [], hiddenCircleIds: [], hasCompletedOnboarding: false,
                };
                // FIX: Use v8 compat syntax for set.
                await db.collection('users').doc(cred.user.uid).set(newUser);
            }
            return null;
        } catch (error: any) {
             if (error.code === 'auth/email-already-in-use') return 'This email is already in use. Please try logging in.';
             if (error.code === 'auth/weak-password') return 'Password should be at least 6 characters.';
             return error.message;
        }
    };

    const handleGoogleSignIn = async (): Promise<void> => {
        try {
            // FIX: Use v8 compat auth.signInWithPopup method.
            await auth.signInWithPopup(googleProvider);
        } catch (error: any) {
            console.error("Google sign in popup error:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                return;
            }
            if (error.code === 'auth/operation-not-supported-in-this-environment') {
                throw new Error("Google Sign-In is not supported in this environment. Please try another sign-in method.");
            }
            throw error;
        }
    };

    const handleCompleteGoogleSignUp = async (name: string, username: string, birthDate: string): Promise<string | null> => {
        if (!postGoogleSignUpUser) return "An unexpected error occurred. Please try again.";
        try {
            // FIX: Use v8 compat syntax for query.
            const usernameQuery = db.collection('users').where('username', '==', username);
            const usernameSnapshot = await usernameQuery.get();
            if (!usernameSnapshot.empty) {
                return "Username is already taken. Please choose another one.";
            }

            const user = postGoogleSignUpUser;
            const newUser: User = {
                id: user.uid, name, username,
                email: user.email!, bio: '', birthDate,
                memberships: [], isGoogleAccount: true,
                picture: user.photoURL || `https://picsum.photos/seed/${user.uid}/100`,
                friends: [], friendRequestsSent: [], friendRequestsReceived: [],
                blockedUsers: [], mutedUsers: [], isPrivate: false,
                savedPosts: [], interestedTags: [], notInterestedTags: [],
                hiddenCircleIds: [], hasCompletedOnboarding: false,
            };
            // FIX: Use v8 compat syntax for set.
            await db.collection('users').doc(user.uid).set(newUser);
            return null;
        } catch (error: any) {
            return error.message;
        }
    };
    
    const handleLogout = async () => {
        // FIX: Use v8 compat auth.signOut method.
        await auth.signOut();
        setCurrentUser(null);
        setHistory([{ type: 'HOME' }]);
    };

    const handleFinishOnboarding = () => {
        if (!currentUser) return;
        // FIX: Use v8 compat syntax for update.
        db.collection('users').doc(currentUser.id).update({ hasCompletedOnboarding: true });
    };


    // --- DATA MANIPULATION (Firestore) ---
    const handleCreateCircle = async (circleData: Omit<Circle, 'id' | 'members' | 'posts' | 'chatMessages' | 'stories'>) => {
        if (!currentUser) return;
        // FIX: Use v8 compat syntax for creating a new document reference and setting data.
        const newCircleRef = db.collection('circles').doc();
        const newCircle: Circle = {
            ...circleData,
            id: newCircleRef.id,
            members: [{ id: currentUser.id, nickname: currentUser.name, tagId: `#${Math.random().toString(36).substring(2, 7).toUpperCase()}`, role: Role.Host, loyaltyPoints: 0, chatAccess: ChatAccess.Full }],
            posts: [], chatMessages: [], stories: [],
        };
        await newCircleRef.set(newCircle);
        // FIX: Use v8 compat syntax for update with arrayUnion.
        await db.collection('users').doc(currentUser.id).update({
            memberships: FieldValue.arrayUnion(newCircle.id)
        });
        setCreateCircleModalOpen(false);
        navigate({ type: 'CIRCLE', id: newCircle.id });
    };

    const handleJoinCircle = (circleId: string) => {
        if (!currentUser) return;
        const newMember: Member = {
            id: currentUser.id, nickname: currentUser.name, tagId: `#${Math.random().toString(36).substring(2, 7).toUpperCase()}`, role: Role.Contributor, loyaltyPoints: 0, chatAccess: ChatAccess.Full,
        };
        // FIX: Use v8 compat syntax for update with arrayUnion.
        db.collection('circles').doc(circleId).update({
            members: FieldValue.arrayUnion(newMember)
        });
        db.collection('users').doc(currentUser.id).update({
            memberships: FieldValue.arrayUnion(circleId)
        });
    };

    const handleRequestToJoinCircle = (circleId: string) => {
        if (!currentUser) return;
        // FIX: Use v8 compat syntax for update with arrayUnion.
        db.collection('circles').doc(circleId).update({
            joinRequests: FieldValue.arrayUnion(currentUser.id)
        });
    };

    const handleLeaveCircle = (circleId: string) => {
        if (!currentUser) return;
        const circle = circles.find(c => c.id === circleId);
        if(!circle) return;
        const updatedMembers = circle.members.filter(m => m.id !== currentUser.id);
        // FIX: Use v8 compat syntax for update and arrayRemove.
        db.collection('circles').doc(circleId).update({ members: updatedMembers });
        db.collection('users').doc(currentUser.id).update({
            memberships: FieldValue.arrayRemove(circleId)
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

        // FIX: Use v8 compat syntax for creating a new document reference and setting data.
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
            posts: FieldValue.arrayUnion(newPost.id)
        });
        setCreatePostForCircleId(null);
    };
    
    const handleToggleLike = (postId: string) => {
        if (!currentUser) return;
        // FIX: Use v8 compat syntax for document reference and transaction.
        const postRef = db.collection('posts').doc(postId);
        db.runTransaction(async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists) return;
            const data = postDoc.data() as Post;
            const isLiked = data.likedBy.includes(currentUser.id);
            // FIX: Use v8 compat FieldValue for array operations.
            const newLikedBy = isLiked ? FieldValue.arrayRemove(currentUser.id) : FieldValue.arrayUnion(currentUser.id);
            const newReactions = isLiked ? data.reactions - 1 : data.reactions + 1;
            transaction.update(postRef, { likedBy: newLikedBy, reactions: newReactions });
        });
    };

    const handleToggleSavePost = (postId: string) => {
        if (!currentUser) return;
        const userRef = db.collection('users').doc(currentUser.id);
        const isSaved = currentUser.savedPosts.includes(postId);
        // FIX: Use v8 compat FieldValue for array operations.
        userRef.update({ savedPosts: isSaved ? FieldValue.arrayRemove(postId) : FieldValue.arrayUnion(postId) });
    };

    const handleDeletePost = async (postId: string) => {
        if (!currentUser) return;
        const post = allPosts.find(p => p.id === postId);
        if (!post) return;
        
        if (window.confirm('Are you sure you want to delete this post?')) {
            // FIX: Use v8 compat syntax for delete and update.
            await db.collection('posts').doc(postId).delete();
            await db.collection('circles').doc(post.circleId).update({
                posts: FieldValue.arrayRemove(postId)
            });
        }
    };
    
    const handleHideCircle = (circleId: string) => {
        if (!currentUser) return;
        // FIX: Use v8 compat syntax for update with arrayUnion.
        db.collection('users').doc(currentUser.id).update({
            hiddenCircleIds: FieldValue.arrayUnion(circleId)
        });
    };

    const handleMarkInterested = (postId: string) => {
        if (!currentUser) return;
        const post = allPosts.find(p => p.id === postId);
        const circle = circles.find(c => c.id === post?.circleId);
        if (!circle) return;

        // FIX: Use v8 compat syntax for update with arrayUnion/arrayRemove.
        db.collection('users').doc(currentUser.id).update({
            interestedTags: FieldValue.arrayUnion(...circle.tags),
            notInterestedTags: FieldValue.arrayRemove(...circle.tags)
        });
    };
    
    const handleMarkNotInterested = (postId: string) => {
        if (!currentUser) return;
        const post = allPosts.find(p => p.id === postId);
        const circle = circles.find(c => c.id === post?.circleId);
        if (!circle) return;

        // FIX: Use v8 compat syntax for update with arrayUnion/arrayRemove.
        db.collection('users').doc(currentUser.id).update({
            notInterestedTags: FieldValue.arrayUnion(...circle.tags),
            interestedTags: FieldValue.arrayRemove(...circle.tags)
        });
    };

    const handleSuggestForStory = (postId: string, circleId: string) => {
        if (!currentUser) return;
        const suggestion: StorySuggestion = {
            id: `ss-${Date.now()}`,
            postId,
            suggesterUserId: currentUser.id,
            timestamp: new Date()
        };
        // FIX: Use v8 compat syntax for update with arrayUnion.
        db.collection('circles').doc(circleId).update({
            storySuggestions: FieldValue.arrayUnion(suggestion)
        });
    };

    const handleApproveRequest = (circleId: string, userId: string) => {
        if (!currentUser) return;
        const userToApprove = users.find(u => u.id === userId);
        if (!userToApprove) return;
        
        const newMember: Member = {
            id: userId, nickname: userToApprove.name,
            tagId: `#${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            role: Role.Contributor, loyaltyPoints: 0, chatAccess: ChatAccess.Full,
        };

        // FIX: Use v8 compat syntax for update with arrayUnion/arrayRemove.
        db.collection('circles').doc(circleId).update({
            members: FieldValue.arrayUnion(newMember),
            joinRequests: FieldValue.arrayRemove(userId)
        });
        db.collection('users').doc(userId).update({
            memberships: FieldValue.arrayUnion(circleId)
        });
    };

    const handleDenyRequest = (circleId: string, userId: string) => {
        if (!currentUser) return;
        // FIX: Use v8 compat syntax for update with arrayRemove.
        db.collection('circles').doc(circleId).update({
            joinRequests: FieldValue.arrayRemove(userId)
        });
    };

    const handleDeleteCircle = async (circleId: string) => {
        if (!currentUser) return;
        const circle = circles.find(c => c.id === circleId);
        if (!circle) return;
    
        if (window.confirm(`Are you sure you want to delete "${circle.name}"? This action cannot be undone.`)) {
            // FIX: Use v8 compat syntax for batch writes.
            const batch = db.batch();
            batch.delete(db.collection('circles').doc(circleId));
            circle.members.forEach(member => {
                batch.update(db.collection('users').doc(member.id), {
                    memberships: FieldValue.arrayRemove(circleId)
                });
            });
            circle.posts.forEach(postId => {
                batch.delete(db.collection('posts').doc(postId));
            });
            await batch.commit();
    
            if (currentView.type === 'CIRCLE' && currentView.id === circleId) {
                navigate({ type: 'HOME' });
            }
        }
    };
    
    const handleRequestPromotion = (circleId: string) => {
        if (!currentUser) return;
        // FIX: Use v8 compat syntax for update with arrayUnion.
        db.collection('circles').doc(circleId).update({
            promotionRequests: FieldValue.arrayUnion(currentUser.id)
        });
    };

    const handleRequestChatAccess = (circleId: string) => {
        if (!currentUser) return;
        // FIX: Use v8 compat syntax for update with arrayUnion.
        db.collection('circles').doc(circleId).update({
            chatAccessRequests: FieldValue.arrayUnion(currentUser.id)
        });
    };

    const handleApprovePromotion = async (circleId: string, userId: string) => {
        // FIX: Use v8 compat syntax for getting and updating a document.
        const circleRef = db.collection('circles').doc(circleId);
        const docSnap = await circleRef.get();
        if (!docSnap.exists) return;
        const circle = docSnap.data() as Circle;
        const updatedMembers = circle.members.map(m => m.id === userId ? { ...m, role: Role.Contributor } : m);
        circleRef.update({
            members: updatedMembers,
            promotionRequests: FieldValue.arrayRemove(userId)
        });
    };

    const handleDenyPromotion = (circleId: string, userId: string) => {
        // FIX: Use v8 compat syntax for update with arrayRemove.
        db.collection('circles').doc(circleId).update({
            promotionRequests: FieldValue.arrayRemove(userId)
        });
    };

    const handleApproveChatAccess = async (circleId: string, userId: string, accessLevel: ChatAccess) => {
        // FIX: Use v8 compat syntax for getting and updating a document.
        const circleRef = db.collection('circles').doc(circleId);
        const docSnap = await circleRef.get();
        if (!docSnap.exists) return;
        const circle = docSnap.data() as Circle;
        const updatedMembers = circle.members.map(m => m.id === userId ? { ...m, chatAccess: accessLevel } : m);
        circleRef.update({
            members: updatedMembers,
            chatAccessRequests: FieldValue.arrayRemove(userId)
        });
    };

    const handleDenyChatAccess = (circleId: string, userId: string) => {
        // FIX: Use v8 compat syntax for update with arrayRemove.
        db.collection('circles').doc(circleId).update({
            chatAccessRequests: FieldValue.arrayRemove(userId)
        });
    };

    const handleSendFriendRequest = (receiverId: string) => {
        if (!currentUser) return;
        // FIX: Use v8 compat syntax for update with arrayUnion.
        db.collection('users').doc(currentUser.id).update({
            friendRequestsSent: FieldValue.arrayUnion(receiverId)
        });
        db.collection('users').doc(receiverId).update({
            friendRequestsReceived: FieldValue.arrayUnion(currentUser.id)
        });
    };

    const handleAcceptFriendRequest = (senderId: string) => {
        if (!currentUser) return;
        // FIX: Use v8 compat syntax for update with arrayUnion/arrayRemove.
        db.collection('users').doc(currentUser.id).update({
            friends: FieldValue.arrayUnion(senderId),
            friendRequestsReceived: FieldValue.arrayRemove(senderId)
        });
        db.collection('users').doc(senderId).update({
            friends: FieldValue.arrayUnion(currentUser.id),
            friendRequestsSent: FieldValue.arrayRemove(senderId)
        });
    };

    const handleDeclineFriendRequest = (senderId: string) => {
        if (!currentUser) return;
        // FIX: Use v8 compat syntax for update with arrayRemove.
        db.collection('users').doc(currentUser.id).update({
            friendRequestsReceived: FieldValue.arrayRemove(senderId)
        });
        db.collection('users').doc(senderId).update({
            friendRequestsSent: FieldValue.arrayRemove(senderId)
        });
    };
    
    const handleNotificationAction = (notificationId: string, result: 'handled' | 'denied') => {
        // FIX: Use v8 compat syntax for update.
        db.collection('notifications').doc(notificationId).update({
            actionState: result,
            isRead: true
        });
    };

    const handleDismissStorySuggestion = async (circleId: string, postId: string) => {
        // FIX: Use v8 compat syntax for getting and updating a document.
        const circleRef = db.collection('circles').doc(circleId);
        const docSnap = await circleRef.get();
        if (!docSnap.exists) return;
        const circle = docSnap.data() as Circle;
        const updatedSuggestions = (circle.storySuggestions || []).filter(s => s.postId !== postId);
        circleRef.update({ storySuggestions: updatedSuggestions });
    };

    const handleCreateStoryFromSuggestion = (circleId: string, postId: string) => {
        const post = allPosts.find(p => p.id === postId);
        if (post) {
            setSharingPost(post);
            setCreateStoryModalOpen(true);
        }
        handleDismissStorySuggestion(circleId, postId);
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
        // FIX: Use v8 compat syntax for update with arrayUnion.
        db.collection('posts').doc(postId).update({
            comments: FieldValue.arrayUnion(newComment)
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
        // FIX: Use v8 compat syntax for update with arrayUnion.
        db.collection('circles').doc(circleId).update({
            chatMessages: FieldValue.arrayUnion(newMessage)
        });
    };

    const handleStoryViewed = (storyId: string) => {
        if (!currentUser) return;
        const circle = circles.find(c => c.stories.some(s => s.id === storyId));
        if (!circle) return;
        const updatedStories = circle.stories.map(s => 
            s.id === storyId ? { ...s, viewedBy: [...new Set([...s.viewedBy, currentUser.id])] } : s
        );
        // FIX: Use v8 compat syntax for update.
        db.collection('circles').doc(circle.id).update({ stories: updatedStories });
    };

    const handleCreateStory = (circleId: string, storyData: NewStoryData) => {
        if (!currentUser) return;
        const newStory: Story = {
            id: `story-${Date.now()}`, authorMemberId: currentUser.id,
            timestamp: new Date(), viewedBy: [currentUser.id], reactions: [], ...storyData,
        };
        // FIX: Use v8 compat syntax for update with arrayUnion.
        db.collection('circles').doc(circleId).update({
            stories: FieldValue.arrayUnion(newStory)
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
        if (splashScreen && !appLoadedRef.current && !isLoading) {
            appLoadedRef.current = true;
            window.setTimeout(() => {
                splashScreen.classList.add('fade-out');
                window.setTimeout(() => splashScreen.classList.add('hidden'), 500);
            }, 500);
        }
    }, [isLoading]);
    
    if (firestoreError) {
        const messageParts = firestoreError.split('```');
        return (
            <div className="fixed inset-0 bg-brand-bg z-[9999] flex items-center justify-center p-4 text-brand-text-primary">
                <div className="bg-brand-surface border border-brand-danger rounded-lg p-6 max-w-2xl w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <Icon name="user-block" className="w-8 h-8 text-brand-danger" />
                        <h1 className="text-2xl font-bold text-brand-danger">Firestore Connection Failed</h1>
                    </div>
                    <div className="space-y-3 text-sm">
                         {messageParts.map((part, index) => {
                            if (index % 2 === 1) { // This is a code block
                                return <pre key={index} className="bg-brand-bg p-3 rounded-md text-xs text-brand-text-secondary whitespace-pre-wrap font-mono">{part.trim()}</pre>;
                            }
                            // This is regular text, split by newlines to create paragraphs
                            return part.trim().split('\n').map((line, lineIndex) => (
                               <p key={`${index}-${lineIndex}`} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            ));
                         })}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 w-full bg-brand-primary text-white font-bold py-2.5 px-4 rounded-md hover:bg-brand-secondary transition-colors"
                    >
                        Refresh Application
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
      return null;
    }
    
    if (!currentUser) {
        return <AuthPage 
            onLogin={handleLogin} 
            onSignUp={handleSignUp} 
            onGoogleSignIn={handleGoogleSignIn} 
            initialError={authRedirectError}
            postGoogleSignUpUser={postGoogleSignUpUser}
            onCompleteGoogleSignUp={handleCompleteGoogleSignUp}
        />;
    }

    if (!currentUser.hasCompletedOnboarding) {
        if (circles.length === 0) {
            return (
                <div className="bg-brand-bg min-h-screen font-sans text-brand-text-primary flex justify-center items-center p-2 md:p-4">
                    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-brand-surface rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-brand-border">
                        <header className="p-4 border-b border-brand-border text-center flex-shrink-0">
                            <h1 className="text-2xl font-bold">Welcome, {currentUser.name}!</h1>
                            <p className="text-brand-text-secondary mt-1">Finding circles for you to join...</p>
                        </header>
                        <div className="flex-1 flex items-center justify-center">
                            <Icon name="refresh" className="w-12 h-12 text-brand-text-secondary animate-spin" />
                        </div>
                        <footer className="p-4 border-t border-brand-border flex-shrink-0">
                             <button 
                                disabled={true}
                                className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue (0 joined)
                            </button>
                        </footer>
                    </div>
                </div>
            );
        }
        return <OnboardingPage 
            currentUser={currentUser} 
            circles={circles.filter(c => c.type === CircleType.Public)}
            // FIX: Use v8 compat syntax for update with arrayUnion/arrayRemove.
            onJoinCircle={(circleId) => db.collection('users').doc(currentUser.id).update({memberships: FieldValue.arrayUnion(circleId)})}
            onLeaveCircle={(circleId) => db.collection('users').doc(currentUser.id).update({memberships: FieldValue.arrayRemove(circleId)})}
            onFinish={handleFinishOnboarding} 
        />
    }

    const renderPage = () => {
        const pageProps = { currentUser, circles, allUsers: users, navigate, onBack, onViewProfile: (userId: string) => navigate({ type: 'USER_PROFILE', userId }),};
        switch (currentView.type) {
            case 'HOME':
                return <HomePage {...pageProps} myCircles={myCircles} allPosts={allPosts} circlesWithActiveStories={myCirclesWithActiveStories} onToggleLike={handleToggleLike} onOpenComments={setCommentingPostId} onLeaveCircle={handleLeaveCircle} onDeletePost={handleDeletePost} onViewStory={(circleId) => setViewingStoryState({ circles: myCirclesWithActiveStories, initialCircleId: circleId })} onOpenCreateStory={() => setCreateStoryModalOpen(true)} onOpenChats={() => navigate({type: 'CHATS'})} onToggleSavePost={handleToggleSavePost} onSharePost={handleSharePost} unreadNotificationsCount={0} onOpenNotifications={() => navigate({ type: 'NOTIFICATIONS' })} hasUnreadChats={false} onHideCircle={handleHideCircle} onMarkInterested={handleMarkInterested} onMarkNotInterested={handleMarkNotInterested} onSuggestForStory={handleSuggestForStory} />;
            case 'EXPLORE':
                return <ExplorePage {...pageProps} exploreFeed={allPosts.map(p => p as any)} onJoinCircle={handleJoinCircle} onLeaveCircle={handleLeaveCircle} onRequestToJoinCircle={handleRequestToJoinCircle} onToggleLike={handleToggleLike} onOpenComments={setCommentingPostId} onToggleSavePost={handleToggleSavePost} onSharePost={handleSharePost} onRefresh={() => {}} onHideCircle={handleHideCircle} onMarkInterested={handleMarkInterested} onMarkNotInterested={handleMarkNotInterested} onSuggestForStory={handleSuggestForStory} />;
            case 'CIRCLES':
                return <CirclesPage {...pageProps} onLeaveCircle={handleLeaveCircle} />;
            case 'ACCOUNT':
                return <AccountPage {...pageProps} onLogout={handleLogout} onEditProfile={() => setEditProfileModalOpen(true)} />;
            case 'CIRCLE':
                const circle = circles.find(c => c.id === currentView.id);
                if (!circle) return <div>Circle not found</div>;
                return <CirclePage {...pageProps} circle={circle} allPosts={allPosts} onToggleLike={handleToggleLike} onOpenComments={setCommentingPostId} onJoin={handleJoinCircle} onRequestToJoin={handleRequestToJoinCircle} onApproveRequest={handleApproveRequest} onDenyRequest={handleDenyRequest} onLeave={handleLeaveCircle} onSendMessage={(content) => handleSendMessageInCircle(circle.id, content)} onOpenEditCircle={setEditingCircleId} onOpenManageMembers={setManagingMembersCircleId} onDeleteCircle={handleDeleteCircle} onDeletePost={handleDeletePost} onTabChange={setActiveCircleTab} onToggleSavePost={handleToggleSavePost} onSharePost={handleSharePost} onRequestPromotion={handleRequestPromotion} onRequestChatAccess={handleRequestChatAccess} onApprovePromotion={handleApprovePromotion} onDenyPromotion={handleDenyPromotion} onApproveChatAccess={handleApproveChatAccess} onDenyChatAccess={handleDenyChatAccess} onHideCircle={handleHideCircle} onMarkInterested={handleMarkInterested} onMarkNotInterested={handleMarkNotInterested} onSuggestForStory={handleSuggestForStory} onOpenHighlightViewer={() => {}} onOpenEditHighlight={() => {}} onOpenCreatePostModal={setCreatePostForCircleId} />;
             case 'CHATS':
                return <ChatListPage {...pageProps} circleConversations={conversations} userConversations={userConversations} activeTab={activeChatListTab} onTabChange={setActiveChatListTab} unreadCircleCount={0} unreadFriendCount={0} unreadRequestCount={0} onMarkRequestsAsRead={() => {}} />;
            case 'CONVERSATION':
                const isUserConvo = currentView.id.startsWith('uconvo-');
                const conversation = isUserConvo ? userConversations.find(c => c.id === currentView.id) : conversations.find(c => c.id === currentView.id);
                if (!conversation) return <div>Conversation not found.</div>;
                return <ChatConversationPage {...pageProps} conversation={conversation} conversationType={isUserConvo ? 'user' : 'circle'} allPosts={allPosts} onSendCircleMessage={() => {}} onSendUserMessage={() => {}} onAcceptRequest={() => {}} onDeclineRequest={() => {}} onBlockUser={() => {}} onMarkAsRead={() => {}} />;
            case 'FRIENDS':
                 return <FriendsPage {...pageProps} onSendFriendRequest={handleSendFriendRequest} onAcceptFriendRequest={handleAcceptFriendRequest} onDeclineFriendRequest={handleDeclineFriendRequest} />;
            case 'USER_CIRCLES':
                const owner = users.find(u => u.id === currentView.listOwnerId);
                if (!owner) return <div>User not found.</div>;
                return <UserCirclesPage {...pageProps} listOwner={owner} listType={currentView.listType} />;
            case 'SETTINGS':
                return <SettingsPage {...pageProps} onLogout={handleLogout} onToggleAccountPrivacy={() => {}} theme={theme} onThemeChange={setTheme} />;
            case 'BLOCKED_USERS':
                return <BlockedUsersPage {...pageProps} onUnblockUser={() => {}} />;
            case 'SAVED_POSTS':
                return <SavedPostsPage {...pageProps} allPosts={allPosts} onToggleLike={handleToggleLike} onOpenComments={setCommentingPostId} onToggleSavePost={handleToggleSavePost} onDeletePost={handleDeletePost} onLeaveCircle={handleLeaveCircle} onSharePost={handleSharePost} onMarkInterested={handleMarkInterested} onMarkNotInterested={handleMarkNotInterested} onHideCircle={handleHideCircle} onSuggestForStory={handleSuggestForStory} />;
            case 'USER_PROFILE':
                return <UserProfilePage {...pageProps} targetUserId={currentView.userId} onSendFriendRequest={handleSendFriendRequest} onNavigateToChat={() => {}} />;
            case 'NOTIFICATIONS':
                return <NotificationPage {...pageProps} notifications={notifications} allPosts={allPosts} onAcceptFriendRequest={handleAcceptFriendRequest} onDeclineFriendRequest={handleDeclineFriendRequest} onApproveCircleRequest={handleApproveRequest} onDenyCircleRequest={handleDenyRequest} onApprovePromotion={handleApprovePromotion} onDenyPromotion={handleDenyPromotion} onApproveChatAccess={handleApproveChatAccess} onDenyChatAccess={handleDenyChatAccess} onCreateStoryFromSuggestion={handleCreateStoryFromSuggestion} onDismissStorySuggestion={handleDismissStorySuggestion} onHandleNotificationAction={handleNotificationAction} unreadRequestCount={0} unreadActivityCount={0} onMarkAsRead={()=>{}} />;
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
            {commentingPostId && <CommentModal post={allPosts.find(p => p.id === commentingPostId)!} onClose={() => setCommentingPostId(null)} onAddComment={handleAddComment} currentUser={currentUser} circles={circles} allUsers={users} onViewProfile={(userId) => navigate({ type: 'USER_PROFILE', userId })} />}
            {/* FIX: Use v8 compat syntax for update. */}
            {isEditProfileModalOpen && <EditProfileModal currentUser={currentUser} onClose={() => setEditProfileModalOpen(false)} onSave={(data) => db.collection('users').doc(currentUser.id).update(data).then(() => setEditProfileModalOpen(false))} />}
            {editingCircleId && <EditCircleModal circle={circles.find(c => c.id === editingCircleId)!} onClose={() => setEditingCircleId(null)} onSave={(id, data) => db.collection('circles').doc(id).update(data).then(() => setEditingCircleId(null))} />}
            {managingMembersCircleId && <ManageMembersModal circle={circles.find(c => c.id === managingMembersCircleId)!} currentUserRole={circles.find(c => c.id === managingMembersCircleId)!.members.find(m => m.id === currentUser.id)!.role} onClose={() => setManagingMembersCircleId(null)} onUpdateRole={(cId, mId, nR) => {}} onRemoveMember={(cId, mId) => {}} />}
            {viewingStoryState && <StoryViewerModal circles={viewingStoryState.circles} initialCircleId={viewingStoryState.initialCircleId} currentUser={currentUser} allPosts={allPosts} onClose={() => setViewingStoryState(null)} onStoryViewed={handleStoryViewed} onAddReaction={(sId, e) => {}} onSendReply={(sId, cId, t) => {}} navigate={navigate} onDeleteStory={() => {}} onMuteUser={() => {}} onOpenAddToHighlightModal={() => {}} />}
            {isCreateStoryModalOpen && <CreateStoryModal circles={myCircles} allPosts={allPosts} sharedPost={sharingPost} onClose={() => { setCreateStoryModalOpen(false); setSharingPost(null); }} onCreate={handleCreateStory} />}
            {sharingPost && <ShareModal post={sharingPost} currentUser={currentUser} userConversations={userConversations} circleConversations={conversations} circles={circles} allUsers={users} canCreateStory={true} onClose={() => setSharingPost(null)} onShareToChat={() => {}} onSharePostToStory={() => { setCreateStoryModalOpen(true); }} onCopyLink={() => {}} onNativeShare={() => {}} navigate={navigate} onViewProfile={onViewProfile} shareFeedback={shareFeedback} />}
            {addToHighlightItem && <AddToHighlightModal item={addToHighlightItem} circle={circles.find(c => c.id === addToHighlightItem.circleId)!} onClose={() => setAddToHighlightItem(null)} onAddToHighlight={() => {}} />}
            {editingHighlight && <EditHighlightModal circle={editingHighlight.circle} highlight={editingHighlight.highlight} onClose={() => setEditingHighlight(null)} onSave={() => {}} />}
        </div>
    );
};