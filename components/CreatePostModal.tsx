import React, { useState, useRef, useEffect } from 'react';
import type { Circle } from '../types';
import { Icon } from './Icon';

export type NewPostData = {
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
}

type AttachmentType = 'image' | 'video' | 'audio' | null;

interface CreatePostModalProps {
    circle: Circle;
    onClose: () => void;
    onCreate: (postData: NewPostData) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ circle, onClose, onCreate }) => {
    const [content, setContent] = useState('');
    const [attachment, setAttachment] = useState<{ url: string; data: string; type: AttachmentType; name: string } | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    // Clean up blob URL on unmount or when attachment changes
    useEffect(() => {
        return () => {
            if (attachment?.url.startsWith('blob:')) {
                URL.revokeObjectURL(attachment.url);
            }
        };
    }, [attachment]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !attachment) return;

        const postData: NewPostData = { content };
        if (attachment) {
            switch (attachment.type) {
                case 'image':
                    postData.imageUrl = attachment.data;
                    break;
                case 'video':
                    postData.videoUrl = 'placeholder.mp4';
                    break;
                case 'audio':
                    postData.audioUrl = 'placeholder.mp3';
                    break;
            }
        }
        onCreate(postData);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: AttachmentType) => {
        const file = event.target.files?.[0];
        if (file && type) {
            // Revoke old URL if it exists to prevent memory leaks
            if (attachment?.url.startsWith('blob:')) {
                URL.revokeObjectURL(attachment.url);
            }
            const newUrl = URL.createObjectURL(file);

            if (type === 'image') {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAttachment({ url: newUrl, data: reader.result as string, type, name: file.name });
                };
                reader.readAsDataURL(file);
            } else {
                setAttachment({ url: newUrl, data: '', type, name: file.name });
            }
        }
        // Reset the input value so the same file can be selected again if needed
        if(event.target) {
            event.target.value = '';
        }
    };

    const removeAttachment = () => {
        if (attachment?.url.startsWith('blob:')) {
            URL.revokeObjectURL(attachment.url);
        }
        setAttachment(null);
    };

    const attachmentColor = (type: AttachmentType) => attachment?.type === type ? 'text-brand-primary' : 'text-brand-text-secondary';
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
            <div className="bg-brand-surface rounded-t-2xl md:rounded-lg shadow-xl w-full max-w-md relative" >
                <header className="flex items-center justify-between p-4 border-b border-brand-border">
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary text-2xl font-light">&times;</button>
                    <h2 className="text-lg font-bold text-brand-text-primary">New Post</h2>
                    <button 
                        onClick={handleSubmit} 
                        className="bg-brand-primary text-white font-bold py-1.5 px-4 rounded-full hover:bg-brand-secondary transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!content.trim() && !attachment}
                    >
                        Post
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="flex gap-3">
                        <img src={circle.logo} alt={circle.name} className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                            <p className="font-bold text-brand-text-primary">{circle.name}</p>
                            <textarea 
                                placeholder="What's on your mind?"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="w-full bg-transparent focus:outline-none text-brand-text-primary placeholder:text-brand-text-secondary resize-none mt-2 text-lg" 
                                rows={5} 
                            />
                        </div>
                    </div>
                    {attachment && (
                        <div className="ml-12 mt-4 relative p-3 bg-brand-bg border border-brand-border rounded-lg">
                           {attachment.type === 'image' && (
                                <img src={attachment.url} alt="Attachment preview" className="rounded-lg w-full object-cover max-h-48" />
                            )}
                            {(attachment.type === 'video' || attachment.type === 'audio') && (
                                <div className="text-sm text-brand-text-secondary">
                                    <p className="font-semibold capitalize">{attachment.type} Attached:</p>
                                    <p className="truncate">{attachment.name}</p>
                                </div>
                            )}
                            <button 
                                type="button" 
                                onClick={removeAttachment} 
                                className="absolute -top-2 -right-2 bg-brand-border text-brand-text-primary rounded-full h-6 w-6 flex items-center justify-center font-bold text-sm hover:bg-brand-danger"
                                aria-label="Remove attachment"
                            >
                                &times;
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-4 mt-4 pl-12">
                        <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} className="hidden" accept="image/*" />
                        <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} className="hidden" accept="video/*" />
                        <input type="file" ref={audioInputRef} onChange={(e) => handleFileChange(e, 'audio')} className="hidden" accept="audio/*" />

                        <button type="button" onClick={() => imageInputRef.current?.click()} className={`${attachmentColor('image')} hover:text-brand-primary transition-colors`}>
                            <Icon name="image" />
                        </button>
                        <button type="button" onClick={() => videoInputRef.current?.click()} className={`${attachmentColor('video')} hover:text-brand-primary transition-colors`}>
                             <Icon name="video" />
                        </button>
                        <button type="button" onClick={() => audioInputRef.current?.click()} className={`${attachmentColor('audio')} hover:text-brand-primary transition-colors`}>
                             <Icon name="microphone" />
                        </button>
                     </div>
                </form>
            </div>
        </div>
    );
};