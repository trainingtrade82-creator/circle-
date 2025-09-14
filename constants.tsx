import type { Circle, Post, User, Member, Comment, ChatMessage, Story, ChatConversation, DirectMessage, UserConversation, UserDirectMessage, Notification } from './types';
import { CircleType, Role, StoryType, ChatConversationType, NotificationType, ChatAccess } from './types';

const generateTagId = () => `#${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

// MOCK USERS & MEMBERS
export const MOCK_USER_ID_1 = 'user-1'; 
export const MOCK_USER_ID_2 = 'user-2';
export const MOCK_USER_ID_3 = 'user-3';
export const MOCK_USER_ID_4 = 'user-4-google';
export const MOCK_USER_ID_5 = 'user-5-google';

export const MOCK_USERS: User[] = [
  {
    id: MOCK_USER_ID_1,
    name: 'Pixel Pioneer',
    username: '@pixelpioneer',
    email: 'pixel@example.com',
    // FIX: Removed `password` property which does not exist on the User type.
    bio: 'Shaping tomorrow\'s technology, one pixel at a time.',
    // FIX: Added missing birthDate property.
    birthDate: '1990-05-15',
    memberships: ['c1', 'c3', 'c2'],
    friends: [MOCK_USER_ID_2],
    friendRequestsSent: [],
    friendRequestsReceived: [MOCK_USER_ID_3],
    blockedUsers: [],
    mutedUsers: [],
    isPrivate: false,
    savedPosts: ['p3'],
    interestedTags: [],
    notInterestedTags: [],
    hiddenCircleIds: [],
  },
  {
    id: MOCK_USER_ID_2,
    name: 'Synth Wave',
    username: '@synthwave',
    email: 'synth@example.com',
    // FIX: Removed `password` property which does not exist on the User type.
    bio: 'Riding the waves of digital sound.',
    // FIX: Added missing birthDate property.
    birthDate: '1992-08-22',
    memberships: ['c1', 'c2'],
    friends: [MOCK_USER_ID_1],
    friendRequestsSent: [],
    friendRequestsReceived: [],
    blockedUsers: [],
    mutedUsers: [],
    isPrivate: false,
    savedPosts: [],
    interestedTags: [],
    notInterestedTags: [],
    hiddenCircleIds: [],
  },
  {
    id: MOCK_USER_ID_3,
    name: 'Code Ninja',
    username: '@codeninja',
    email: 'ninja@example.com',
    // FIX: Removed `password` property which does not exist on the User type.
    bio: 'Mastering the art of silent, efficient code.',
    // FIX: Added missing birthDate property.
    birthDate: '1988-11-01',
    memberships: ['c1', 'c2'],
    friends: [],
    friendRequestsSent: [MOCK_USER_ID_1],
    friendRequestsReceived: [],
    blockedUsers: [],
    mutedUsers: [],
    isPrivate: false,
    savedPosts: [],
    interestedTags: [],
    notInterestedTags: [],
    hiddenCircleIds: [],
  },
  {
    id: MOCK_USER_ID_4,
    name: 'Jane Doe',
    username: '@janedoe',
    email: 'jane.doe@google.com',
    bio: 'Exploring new horizons.',
    // FIX: Added missing birthDate property.
    birthDate: '1995-03-10',
    memberships: ['c1'],
    isGoogleAccount: true,
    picture: 'https://picsum.photos/seed/jane/100',
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
  },
  {
    id: MOCK_USER_ID_5,
    name: 'John Smith',
    username: '@johnsmith',
    email: 'john.smith@google.com',
    bio: 'Just trying things out!',
    // FIX: Added missing birthDate property.
    birthDate: '1998-07-20',
    memberships: [],
    isGoogleAccount: true,
    picture: 'https://picsum.photos/seed/john/100',
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
  },
];

const member1: Member = { id: MOCK_USER_ID_1, nickname: 'PixelPioneer', tagId: generateTagId(), role: Role.Host, loyaltyPoints: 1250, chatAccess: ChatAccess.Full };
const member2: Member = { id: MOCK_USER_ID_2, nickname: 'SynthWave', tagId: generateTagId(), role: Role.Contributor, loyaltyPoints: 800, chatAccess: ChatAccess.Full };
const member3: Member = { id: MOCK_USER_ID_3, nickname: 'CodeNinja', tagId: generateTagId(), role: Role.Moderator, loyaltyPoints: 1100, chatAccess: ChatAccess.Full };
const member4: Member = { id: MOCK_USER_ID_1, nickname: 'Bookworm', tagId: generateTagId(), role: Role.Host, loyaltyPoints: 950, chatAccess: ChatAccess.Full };
const member5: Member = { id: MOCK_USER_ID_3, nickname: 'Chef', tagId: generateTagId(), role: Role.Host, loyaltyPoints: 1500, chatAccess: ChatAccess.Full };
const viewerMember: Member = { id: MOCK_USER_ID_4, nickname: 'JustWatching', tagId: generateTagId(), role: Role.Viewer, loyaltyPoints: 10, chatAccess: ChatAccess.None };


// MOCK POSTS
const postsCircle1: Post[] = [
  { id: 'p1', authorMemberId: member1.id, authorNickname: member1.nickname, circleId: 'c1', circleName: 'Future Forge', circleLogo: 'https://picsum.photos/seed/tech/100', content: 'Just prototyped a new VR interface. The future of interaction is here!', imageUrl: 'https://picsum.photos/seed/vr/400/300', timestamp: new Date(Date.now() - 3600000), reactions: 1, comments: [{id: 'c-p1-1', authorId: MOCK_USER_ID_2, authorNickname: 'SynthWave', content: 'This is absolutely mind-blowing! Can\'t wait to see more.', timestamp: new Date(Date.now() - 3500000)}], likedBy: [MOCK_USER_ID_1] },
  { id: 'p2', authorMemberId: member2.id, authorNickname: member2.nickname, circleId: 'c1', circleName: 'Future Forge', circleLogo: 'https://picsum.photos/seed/tech/100', content: 'Exploring the ethics of AI in creative fields. What are your thoughts?', timestamp: new Date(Date.now() - 7200000), reactions: 75, comments: [], likedBy: [] },
  { id: 'p7-video', authorMemberId: member3.id, authorNickname: member3.nickname, circleId: 'c1', circleName: 'Future Forge', circleLogo: 'https://picsum.photos/seed/tech/100', content: 'Check out this demo of our new physics engine!', videoUrl: 'placeholder.mp4', timestamp: new Date(Date.now() - 9200000), reactions: 150, comments: [], likedBy: [] },

];

const postsCircle2: Post[] = [
    { id: 'p3', authorMemberId: member4.id, authorNickname: member4.nickname, circleId: 'c2', circleName: 'Silent Readers', circleLogo: 'https://picsum.photos/seed/books/100', content: 'Finished "Project Hail Mary" and I am absolutely speechless. A must-read for sci-fi lovers!', imageUrl: 'https://picsum.photos/seed/scifi/400/300', timestamp: new Date(Date.now() - 86400000), reactions: 250, comments: [], likedBy: [] },
];

const postsCircle3: Post[] = [
    { id: 'p4', authorMemberId: member5.id, authorNickname: member5.nickname, circleId: 'c3', circleName: 'Global Gastronomy', circleLogo: 'https://picsum.photos/seed/food/100', content: 'Perfected my ramen broth recipe this weekend. The secret is a 12-hour simmer!', imageUrl: 'https://picsum.photos/seed/ramen/400/300', timestamp: new Date(Date.now() - 172800000), reactions: 480, comments: [], likedBy: [] },
    { id: 'p8-audio', authorMemberId: member1.id, authorNickname: 'PixelPioneer', circleId: 'c3', circleName: 'Global Gastronomy', circleLogo: 'https://picsum.photos/seed/food/100', content: 'Podcast Ep. 5: The history of Sourdough. Give it a listen!', audioUrl: 'placeholder.mp3', timestamp: new Date(Date.now() - 272800000), reactions: 95, comments: [], likedBy: [] },

];

const postsCircle4: Post[] = [
    { id: 'p5', authorMemberId: 'user-x', authorNickname: 'Wanderer', circleId: 'c4', circleName: 'Urban Explorers', circleLogo: 'https://picsum.photos/seed/city/100', content: 'Discovered this hidden alleyway art in downtown today.', imageUrl: 'https://picsum.photos/seed/graffiti/400/300', timestamp: new Date(Date.now() - 43200000), reactions: 190, comments: [], likedBy: [] },
];

const postsCircle5: Post[] = [
    { id: 'p6', authorMemberId: 'user-y', authorNickname: 'Stargazer', circleId: 'c5', circleName: 'Cosmic Minds', circleLogo: 'https://picsum.photos/seed/space/100', content: 'The James Webb Telescope continues to amaze. Look at this shot of the Pillars of Creation!', imageUrl: 'https://picsum.photos/seed/galaxy/400/300', timestamp: new Date(Date.now() - 64800000), reactions: 890, comments: [], likedBy: [] },
];

// MOCK CHAT MESSAGES
const chatMessagesCircle1: ChatMessage[] = [
    { id: 'chat1-1', authorId: MOCK_USER_ID_1, authorNickname: 'PixelPioneer', content: 'Welcome to the Future Forge chat!', timestamp: new Date(Date.now() - 5000000) },
    { id: 'chat1-2', authorId: MOCK_USER_ID_2, authorNickname: 'SynthWave', content: 'Hey everyone! Excited to be here.', timestamp: new Date(Date.now() - 4000000) },
    { id: 'chat1-3', authorId: MOCK_USER_ID_1, authorNickname: 'PixelPioneer', content: 'Anyone see the latest AI developments?', timestamp: new Date(Date.now() - 3000000) },
];

const chatMessagesCircle2: ChatMessage[] = [
    { id: 'chat2-1', authorId: 'user-2', authorNickname: 'SynthWave', content: 'What is everyone reading this week?', timestamp: new Date(Date.now() - 1000000) },
];

// MOCK STORIES
const storiesCircle1: Story[] = [
  { id: 's1-1', authorMemberId: member1.id, mediaType: StoryType.Image, mediaUrl: 'https://picsum.photos/seed/story-tech-1/540/960', timestamp: new Date(Date.now() - 30 * 3600000), viewedBy: [], duration: 7, reactions: [],
    elements: [{ id: 'el1', type: 'text', content: 'New project launching soon!', x: 50, y: 85, width: 300, height: 50, scale: 1, rotation: 0, color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.5)', textAlign: 'center', fontWeight: 'bold', zIndex: 1 }]
  },
  { id: 's1-2', authorMemberId: member3.id, mediaType: StoryType.Text, gradientBackground: 'bg-gradient-to-br from-blue-400 to-emerald-400', timestamp: new Date(Date.now() - 1 * 3600000), viewedBy: [], duration: 5, reactions: [],
    elements: [{ id: 'el2', type: 'text', content: 'AMA session this Friday. Get your questions ready!', x: 50, y: 50, width: 320, height: 100, scale: 1.2, rotation: -5, color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.0)', textAlign: 'center', fontWeight: 'bold', zIndex: 1 }]
  },
];

const storiesCircle3: Story[] = [
  { id: 's3-1', authorMemberId: member5.id, mediaType: StoryType.Image, mediaUrl: 'https://picsum.photos/seed/story-food-1/540/960', timestamp: new Date(Date.now() - 5 * 3600000), viewedBy: [MOCK_USER_ID_1], duration: 10, reactions: [{emoji: '❤️', memberId: MOCK_USER_ID_1}],
    elements: [{ id: 'el3', type: 'text', content: 'Delicious!', x: 50, y: 20, width: 200, height: 60, scale: 1, rotation: 0, color: '#FFFFFF', backgroundColor: 'rgba(239, 68, 68, 0.7)', textAlign: 'center', fontWeight: 'normal', zIndex: 1 }]
  },
];


// MOCK CIRCLES
export const MOCK_CIRCLES: Circle[] = [
  {
    id: 'c1',
    name: 'Future Forge',
    logo: 'https://picsum.photos/seed/tech/100',
    bio: 'A collective of developers, designers, and thinkers shaping tomorrow\'s technology.',
    tags: ['Tech', 'AI', 'Design', 'Innovation'],
    type: CircleType.Public,
    members: [member1, member2, member3, viewerMember],
    posts: postsCircle1.map(p => p.id),
    chatMessages: chatMessagesCircle1,
    stories: storiesCircle1,
    highlights: [
        {
            id: 'h1',
            name: 'Key Moments',
            coverImage: 'https://picsum.photos/seed/story-tech-1/540/960',
            items: [
                { id: 'hi1', type: 'story', entityId: 's1-1', timestamp: new Date(Date.now() - 30 * 3600000) },
                { id: 'hi2', type: 'story', entityId: 's1-2', timestamp: new Date(Date.now() - 3600000) },
            ],
        },
    ],
    storySuggestions: [
        { id: 'ss1', postId: 'p2', suggesterUserId: MOCK_USER_ID_2, timestamp: new Date(Date.now() - 100000) }
    ],
    promotionRequests: [MOCK_USER_ID_4],
    chatAccessRequests: [MOCK_USER_ID_4],
  },
  {
    id: 'c2',
    name: 'Silent Readers',
    logo: 'https://picsum.photos/seed/books/100',
    bio: 'A quiet corner for book lovers to share stories and recommendations.',
    tags: ['Books', 'Reading', 'Fiction', 'Literature'],
    type: CircleType.Private,
    members: [member4, member2, member3],
    posts: postsCircle2.map(p => p.id),
    chatMessages: chatMessagesCircle2,
    stories: [],
    joinRequests: [MOCK_USER_ID_5],
    promotionRequests: [],
    chatAccessRequests: [],
  },
  {
    id: 'c3',
    name: 'Global Gastronomy',
    logo: 'https://picsum.photos/seed/food/100',
    bio: 'Sharing recipes, techniques, and culinary adventures from around the world.',
    tags: ['Cooking', 'Food', 'Recipes', 'Culture'],
    type: CircleType.Public,
    members: [member5, member1],
    posts: postsCircle3.map(p => p.id),
    chatMessages: [],
    stories: storiesCircle3,
    promotionRequests: [],
    chatAccessRequests: [],
  },
  {
    id: 'c4',
    name: 'Urban Explorers',
    logo: 'https://picsum.photos/seed/city/100',
    bio: 'Discovering the hidden gems of urban landscapes.',
    tags: ['Urban', 'Art', 'Photography', 'Exploration'],
    type: CircleType.Public,
    members: [],
    posts: postsCircle4.map(p => p.id),
    chatMessages: [],
    stories: [],
    promotionRequests: [],
    chatAccessRequests: [],
  },
  {
    id: 'c5',
    name: 'Cosmic Minds',
    logo: 'https://picsum.photos/seed/space/100',
    bio: 'Discussing the mysteries of the universe, from black holes to dark matter.',
    tags: ['Space', 'Astronomy', 'Science', 'Cosmology'],
    type: CircleType.Public,
    members: [],
    posts: postsCircle5.map(p => p.id),
    chatMessages: [],
    stories: [],
    promotionRequests: [],
    chatAccessRequests: [],
  },
];

export const ALL_POSTS = [...postsCircle1, ...postsCircle2, ...postsCircle3, ...postsCircle4, ...postsCircle5].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());

// MOCK CIRCLE CHAT CONVERSATIONS
export const MOCK_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'convo-1',
    type: ChatConversationType.OneToOne,
    participants: [{ circleId: 'c1' }, { circleId: 'c3' }],
    messages: [
      { id: 'dm-1-1', chatId: 'convo-1', senderCircleId: 'c1', senderMemberId: MOCK_USER_ID_1, senderMemberNickname: 'PixelPioneer', content: 'Hey! Loved that ramen post. We should collaborate on a tech-food crossover project.', timestamp: new Date(Date.now() - 3 * 3600000) },
      { id: 'dm-1-2', chatId: 'convo-1', senderCircleId: 'c3', senderMemberId: MOCK_USER_ID_3, senderMemberNickname: 'Chef', content: 'Thanks! I\'m intrigued. What did you have in mind?', timestamp: new Date(Date.now() - 2 * 3600000) },
      { id: 'dm-1-3', chatId: 'convo-1', senderCircleId: 'c1', senderMemberId: MOCK_USER_ID_1, senderMemberNickname: 'PixelPioneer', content: 'Maybe an AI recipe generator? Or a VR cooking experience?', timestamp: new Date(Date.now() - 1 * 3600000) },
    ],
  },
  {
    id: 'convo-2',
    type: ChatConversationType.Group,
    name: 'Book Club & Techies',
    participants: [{ circleId: 'c1' }, { circleId: 'c2' }, { circleId: 'c5' }],
    messages: [
      { id: 'dm-2-1', chatId: 'convo-2', senderCircleId: 'c2', senderMemberId: MOCK_USER_ID_2, senderMemberNickname: 'SynthWave', content: 'Has anyone read "Klara and the Sun"? It feels relevant to both our circles.', timestamp: new Date(Date.now() - 10 * 3600000) },
      { id: 'dm-2-2', chatId: 'convo-2', senderCircleId: 'c1', senderMemberId: MOCK_USER_ID_3, senderMemberNickname: 'CodeNinja', content: 'On my list! The themes of AI consciousness are fascinating.', timestamp: new Date(Date.now() - 9 * 3600000) },
    ],
  },
];

// MOCK USER-TO-USER CONVERSATIONS
export const MOCK_USER_CONVERSATIONS: UserConversation[] = [
  // A conversation between two friends (user-1 and user-2)
  {
    id: 'uconvo-1',
    participants: [MOCK_USER_ID_1, MOCK_USER_ID_2],
    isRequest: false,
    messages: [
      { id: 'udm-1-1', conversationId: 'uconvo-1', senderId: MOCK_USER_ID_1, content: 'Hey, saw you in the Future Forge chat!', timestamp: new Date(Date.now() - 5 * 3600000) },
      { id: 'udm-1-2', conversationId: 'uconvo-1', senderId: MOCK_USER_ID_2, content: 'Yeah! Cool to connect directly.', timestamp: new Date(Date.now() - 4 * 3600000) },
    ]
  },
  // A message request from a stranger (user-4) to the current user (user-1)
  {
    id: 'uconvo-2',
    participants: [MOCK_USER_ID_4, MOCK_USER_ID_1],
    isRequest: true,
    messages: [
      { id: 'udm-2-1', conversationId: 'uconvo-2', senderId: MOCK_USER_ID_4, content: 'Hi! I saw you are the host of Future Forge. I have a question about joining.', timestamp: new Date(Date.now() - 1 * 3600000) }
    ]
  }
];

// MOCK NOTIFICATIONS
export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'notif-1',
        type: NotificationType.POST_LIKE,
        recipientUserId: MOCK_USER_ID_1,
        actorUserId: MOCK_USER_ID_2,
        entityId: 'p1', // Post ID
        timestamp: new Date(Date.now() - 1 * 3600000),
        isRead: true,
    },
    {
        id: 'notif-2',
        type: NotificationType.FRIEND_REQUEST,
        recipientUserId: MOCK_USER_ID_1,
        actorUserId: MOCK_USER_ID_3,
        entityId: MOCK_USER_ID_3, // User ID
        timestamp: new Date(Date.now() - 2 * 3600000),
        isRead: false,
    },
    {
        id: 'notif-3',
        type: NotificationType.POST_COMMENT,
        recipientUserId: MOCK_USER_ID_1,
        actorUserId: MOCK_USER_ID_2,
        entityId: 'p1', // Post ID
        message: 'This is absolutely mind-blowing!',
        timestamp: new Date(Date.now() - 3500000),
        isRead: false,
    },
    {
        id: 'notif-4',
        type: NotificationType.CIRCLE_JOIN_REQUEST,
        recipientUserId: MOCK_USER_ID_1, // Host of 'Silent Readers'
        actorUserId: MOCK_USER_ID_5,     // John Smith
        entityId: 'c2', // Circle ID for 'Silent Readers'
        timestamp: new Date(Date.now() - 4 * 3600000),
        isRead: false,
    },
    {
        id: 'notif-5',
        type: NotificationType.CIRCLE_PROMOTION_REQUEST,
        recipientUserId: MOCK_USER_ID_1, // Host of 'Future Forge'
        actorUserId: MOCK_USER_ID_4,     // Jane Doe (viewer)
        entityId: 'c1', // Circle ID for 'Future Forge'
        timestamp: new Date(Date.now() - 5 * 3600000),
        isRead: false,
    },
    {
        id: 'notif-6',
        type: NotificationType.CIRCLE_CHAT_ACCESS_REQUEST,
        recipientUserId: MOCK_USER_ID_3, // Moderator of 'Future Forge'
        actorUserId: MOCK_USER_ID_4,     // Jane Doe (viewer)
        entityId: 'c1', // Circle ID for 'Future Forge'
        timestamp: new Date(Date.now() - 6 * 3600000),
        isRead: true,
    },
    {
        id: 'notif-7',
        type: NotificationType.STORY_REACTION,
        recipientUserId: MOCK_USER_ID_1, // Host of Future Forge
        actorUserId: MOCK_USER_ID_2,     // SynthWave
        entityId: 's1-1', // Story ID in Future Forge
        message: '🔥',
        timestamp: new Date(Date.now() - 7 * 3600000),
        isRead: false,
    },
    {
        id: 'notif-8',
        type: NotificationType.POST_SHARED_TO_STORY,
        recipientUserId: MOCK_USER_ID_1, // Author of post p3
        actorUserId: MOCK_USER_ID_3,     // User who shared the story
        entityId: 'p3', // Post ID
        timestamp: new Date(Date.now() - 8 * 3600000),
        isRead: false,
    },
    {
        id: 'notif-9',
        type: NotificationType.STORY_SUGGESTION,
        recipientUserId: MOCK_USER_ID_1, // Host of Future Forge
        actorUserId: MOCK_USER_ID_2,     // SynthWave
        entityId: 'c1', // Circle ID
        message: 'p2', // Post ID
        timestamp: new Date(Date.now() - 9 * 3600000),
        isRead: false,
    }
];


export const roleColors: Record<Role, string> = {
    [Role.Host]: 'bg-red-500/20 text-red-400 border-red-500/50',
    [Role.Moderator]: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    [Role.Contributor]: 'bg-green-500/20 text-green-400 border-green-500/50',
    [Role.Viewer]: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
};