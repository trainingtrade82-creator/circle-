import React, { useState } from 'react';
import type { Post, Comment, User, Circle } from '../types';
import { CircleType, Role } from '../types';
import { Icon } from './Icon';

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

interface CommentModalProps {
    post: Post;
    onClose: () => void;
    onAddComment: (postId: string, content: string) => void;
    currentUser: User;
    circles: Circle[];
    allUsers: User[];
    onViewProfile: (userId: string) => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ post, onClose, onAddComment, currentUser, circles, allUsers, onViewProfile }) => {
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        onAddComment(post.id, newComment);
        setNewComment('');
    };
    
    const circle = circles.find(c => c.id === post.circleId);
    const currentUserMemberInfo = circle?.members.find(m => m.id === currentUser.id);
    
    const isPublicCircle = circle?.type === CircleType.Public;
    // Allow commenting if the circle is public, or if the user has permissions in a private circle.
    const canComment = isPublicCircle || (!!currentUserMemberInfo && currentUserMemberInfo.role !== Role.Viewer);
    // Use member nickname if available, otherwise use the user's global name.
    const currentUserNickname = currentUserMemberInfo?.nickname || currentUser.name;


    return (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end justify-center z-50 p-0 md:p-4" onClick={onClose}>
            <div className="bg-brand-surface rounded-t-2xl md:rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-center p-4 border-b border-brand-border flex-shrink-0 relative">
                    <h2 className="text-lg font-bold text-brand-text-primary">Comments</h2>
                    <button onClick={onClose} className="absolute top-1/2 right-4 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary text-2xl font-light">&times;</button>
                </header>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {post.comments.length === 0 ? (
                        <p className="text-center text-brand-text-secondary py-8">No comments yet. Be the first!</p>
                    ) : (
                        [...post.comments].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(comment => {
                             const author = allUsers.find(u => u.id === comment.authorId);
                             return (
                                <div key={comment.id} className="flex gap-3">
                                    <button onClick={() => onViewProfile(comment.authorId)} className="flex-shrink-0">
                                        {author?.picture ? (
                                            <img src={author.picture} alt={comment.authorNickname} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-sm font-bold text-brand-primary">
                                                {comment.authorNickname.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </button>
                                    <div className="bg-brand-bg rounded-lg p-2 flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <button onClick={() => onViewProfile(comment.authorId)} className="font-bold text-sm text-brand-text-primary hover:underline">{comment.authorNickname}</button>
                                            <p className="text-xs text-brand-text-secondary">{timeAgo(comment.timestamp)}</p>
                                        </div>
                                        <p className="text-sm mt-1 whitespace-pre-wrap text-brand-text-primary">{comment.content}</p>
                                    </div>
                                </div>
                             )
                        })
                    )}
                </div>
                
                <footer className="p-4 border-t border-brand-border flex-shrink-0 bg-brand-surface">
                    {canComment ? (
                        <form onSubmit={handleSubmit} className="flex gap-3 items-center">
                             {currentUser.picture ? (
                                <img src={currentUser.picture} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                             ) : (
                                 <div className="w-8 h-8 rounded-full bg-brand-secondary/20 flex-shrink-0 flex items-center justify-center text-sm font-bold text-brand-secondary">
                                     {currentUser.name.charAt(0).toUpperCase()}
                                 </div>
                             )}
                            <input
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder={`Comment as ${currentUserNickname}...`}
                                className="flex-1 bg-brand-bg border border-brand-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm text-brand-text-primary"
                            />
                            <button type="submit" disabled={!newComment.trim()} className="bg-brand-primary text-white rounded-full p-2 h-10 w-10 flex-shrink-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-secondary transition-colors">
                                <Icon name="send" className="w-5 h-5"/>
                            </button>
                        </form>
                    ) : (
                        <div className="text-center text-sm text-brand-text-secondary">
                            {currentUserMemberInfo ? 'Viewer role cannot comment in private circles.' : `You must be a member of this private circle to comment.`}
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};