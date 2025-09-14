import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, User } from '../types';
import { Icon } from './Icon';

const timeFormat = (date: Date): string => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface ChatViewProps {
    messages: ChatMessage[];
    currentUser: User;
    onSendMessage: (content: string) => void;
    canSendMessage: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({ messages, currentUser, onSendMessage, canSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // A slight delay ensures the DOM has updated before scrolling
        window.setTimeout(scrollToBottom, 100);
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        onSendMessage(newMessage);
        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-full bg-brand-bg">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                    const isCurrentUser = msg.authorId === currentUser.id;
                    const showAuthor = index === 0 || messages[index - 1].authorId !== msg.authorId;

                    return (
                        <div key={msg.id} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-end gap-2 max-w-xs md:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`p-3 rounded-2xl ${isCurrentUser ? 'bg-brand-primary text-white rounded-br-lg' : 'bg-brand-surface rounded-bl-lg border border-brand-border'}`}>
                                    {showAuthor && !isCurrentUser && <p className="text-xs font-bold text-brand-accent mb-1">{msg.authorNickname}</p>}
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                             <p className={`text-xs text-brand-text-secondary mt-1 px-2`}>{timeFormat(msg.timestamp)}</p>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <footer className="p-4 border-t border-brand-border bg-brand-surface">
                {canSendMessage ? (
                    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-brand-bg border border-brand-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm text-brand-text-primary"
                        />
                        <button type="submit" disabled={!newMessage.trim()} className="bg-brand-primary text-white rounded-full p-2 h-10 w-10 flex-shrink-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-secondary transition-colors">
                            <Icon name="send" className="w-5 h-5"/>
                        </button>
                    </form>
                ) : (
                    <div className="text-center text-sm text-brand-text-secondary py-2">
                        You have read-only access to this chat.
                    </div>
                )}
            </footer>
        </div>
    );
};