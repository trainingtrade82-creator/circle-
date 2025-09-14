export enum Role {
  Host = 'Host',
  Moderator = 'Moderator',
  Contributor = 'Contributor',
  Viewer = 'Viewer',
}

export enum CircleType {
  Public = 'Public',
  Private = 'Private',
}

export enum ChatAccess {
  None = 'None',
  ReadOnly = 'ReadOnly',
  Full = 'Full',
}

export interface Member {
  id: string; 
  nickname: string;
  tagId: string;
  role: Role;
  loyaltyPoints: number;
  chatAccess: ChatAccess;
}

export interface Comment {
  id: string;
  authorId: string;
  authorNickname: string;
  content: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorNickname: string;
  content: string;
  timestamp: Date;
}

export interface Post {
  id: string;
  authorMemberId: string;
  authorNickname: string;
  circleId: string;
  circleName: string;
  circleLogo: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  timestamp: Date;
  reactions: number;
  comments: Comment[];
  likedBy: string[];
}


export enum StoryType {
  Image = 'image',
  Text = 'text',
}

export interface StoryReaction {
  emoji: string;
  memberId: string;
}

// Element-based story structure for rich editing
interface BaseStoryElement {
  id: string;
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // intrinsic width in px
  height: number; // intrinsic height in px
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface TextElement extends BaseStoryElement {
  type: 'text';
  content: string;
  color: string;
  backgroundColor: string; // For text highlight
  textAlign: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  fontFamily?: string; // Future use
  isUnderlined?: boolean;
}

export interface ImageElement extends BaseStoryElement {
  type: 'image';
  content: string; // data URL for the image
}

export interface PostElement extends BaseStoryElement {
    type: 'post';
    postId: string;
}

export type StoryElement = TextElement | ImageElement | PostElement;


export interface Story {
  id:string;
  authorMemberId: string;
  timestamp: Date;
  viewedBy: string[];
  duration: number; // Duration in seconds
  
  mediaType: StoryType;
  mediaUrl?: string; // For background image/video
  gradientBackground?: string; // For background of text-only stories
  elements: StoryElement[]; // All visual elements like text, stickers
  
  reactions: StoryReaction[];
}

export interface HighlightItem {
  id: string;
  type: 'story';
  entityId: string; // storyId
  timestamp: Date;
}

export interface Highlight {
  id: string;
  name: string;
  coverImage: string;
  items: HighlightItem[];
}

export interface StorySuggestion {
  id: string;
  postId: string;
  suggesterUserId: string;
  timestamp: Date;
}


export interface Circle {
  id: string;
  name: string;
  logo: string;
  bio: string;
  tags: string[];
  type: CircleType;
  members: Member[];
  posts: string[];
  chatMessages: ChatMessage[];
  stories: Story[];
  highlights?: Highlight[];
  storySuggestions?: StorySuggestion[];
  joinRequests?: string[];
  promotionRequests?: string[];
  chatAccessRequests?: string[];
}

export interface User {
  id:string;
  name: string;
  username: string;
  email: string;
  bio: string;
  birthDate: string;
  memberships: string[]; // array of circleIds
  isGoogleAccount?: boolean;
  picture?: string; // To store Google profile picture URL
  friends: string[];
  friendRequestsSent: string[];
  friendRequestsReceived: string[];
  blockedUsers: string[];
  mutedUsers: string[];
  isPrivate: boolean;
  savedPosts: string[];
  interestedTags: string[];
  notInterestedTags: string[];
  hiddenCircleIds: string[];
  hasCompletedOnboarding?: boolean;
}

export enum ActiveCircleTab {
  Feed = 'Feed',
  Members = 'Members',
  Chat = 'Chat',
  Settings = 'Settings',
}

// Circle Chat Types (Groups)
export interface DirectMessage {
  id: string;
  chatId: string;
  senderCircleId: string;
  senderMemberId: string; 
  senderMemberNickname: string;
  content?: string;
  sharedPostId?: string;
  timestamp: Date;
  replyToMessageId?: string;
}

export enum ChatConversationType {
  OneToOne = 'OneToOne',
  Group = 'Group',
}

export interface ChatParticipant {
  circleId: string;
}

export interface ChatConversation {
  id: string;
  type: ChatConversationType;
  participants: ChatParticipant[];
  messages: DirectMessage[];
  name?: string; // For group chats
}

// New User-to-User Chat Types
export interface UserDirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  sharedPostId?: string;
  timestamp: Date;
  replyToMessageId?: string;
  replyToStory?: {
    storyId: string;
    circleName: string;
  };
}

export interface UserConversation {
  id: string;
  participants: [string, string]; // Tuple of two user IDs
  messages: UserDirectMessage[];
  isRequest: boolean;
}

// Notification Types
export enum NotificationType {
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  CIRCLE_JOIN_REQUEST = 'CIRCLE_JOIN_REQUEST',
  POST_LIKE = 'POST_LIKE',
  POST_COMMENT = 'POST_COMMENT',
  FRIEND_ACCEPT = 'FRIEND_ACCEPT',
  CIRCLE_REQUEST_APPROVED = 'CIRCLE_REQUEST_APPROVED',
  CIRCLE_PROMOTION_REQUEST = 'CIRCLE_PROMOTION_REQUEST',
  CIRCLE_CHAT_ACCESS_REQUEST = 'CIRCLE_CHAT_ACCESS_REQUEST',
  PROMOTION_APPROVED = 'PROMOTION_APPROVED',
  CHAT_ACCESS_GRANTED = 'CHAT_ACCESS_GRANTED',
  STORY_REACTION = 'STORY_REACTION',
  POST_SHARED_TO_STORY = 'POST_SHARED_TO_STORY',
  STORY_SUGGESTION = 'STORY_SUGGESTION',
}

export interface Notification {
  id: string;
  type: NotificationType;
  recipientUserId: string;
  actorUserId: string;
  entityId: string; // post id, circle id, user id etc.
  timestamp: Date;
  isRead: boolean;
  message?: string; // For comments
  actionState?: 'handled' | 'denied';
}