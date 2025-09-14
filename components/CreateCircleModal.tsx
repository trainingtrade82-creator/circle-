import React, { useState, useRef } from 'react';
import type { Circle } from '../types';
import { CircleType } from '../types';
import { Icon } from './Icon';

interface CreateCircleModalProps {
    onClose: () => void;
    onCreate: (circleData: Omit<Circle, 'id' | 'members' | 'posts' | 'chatMessages' | 'stories'>) => void;
}

export const CreateCircleModal: React.FC<CreateCircleModalProps> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [tags, setTags] = useState('');
    const [type, setType] = useState<CircleType>(CircleType.Public);
    const [logo, setLogo] = useState<string | null>(null);
    const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerateLogo = () => {
        setIsGeneratingLogo(true);
        // Simulate AI generation
        window.setTimeout(() => {
            setLogo(`https://picsum.photos/seed/${Date.now()}/200`);
            setIsGeneratingLogo(false);
        }, 1500);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!logo) {
            alert("Please select a logo for your circle.");
            return;
        }
        onCreate({
            name,
            bio,
            logo,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
            type,
        });
    };
    
    const isSubmitDisabled = !name.trim() || !bio.trim() || !logo || isGeneratingLogo;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-surface rounded-lg shadow-xl w-full max-w-md p-6 relative" >
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-text-primary text-2xl">&times;</button>
                <h2 className="text-xl font-bold mb-6 text-brand-text-primary text-center">Create a New Circle</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-brand-bg border-2 border-dashed border-brand-border flex items-center justify-center overflow-hidden">
                            {logo ? (
                                <img src={logo} alt="Circle logo preview" className="w-full h-full object-cover" />
                            ) : (
                                <Icon name="image" className="w-10 h-10 text-brand-text-secondary" />
                            )}
                        </div>
                        <div className="flex gap-2">
                             <button type="button" onClick={handleGenerateLogo} className="text-sm bg-brand-secondary text-white font-semibold py-1.5 px-3 rounded-md hover:bg-brand-primary transition-colors flex items-center gap-2 disabled:opacity-50" disabled={isGeneratingLogo}>
                                <Icon name="sparkles" className="w-4 h-4" />
                                {isGeneratingLogo ? 'Generating...' : 'Generate with AI'}
                            </button>
                            <button type="button" onClick={handleUploadClick} className="text-sm bg-brand-surface border border-brand-border font-semibold py-1.5 px-3 rounded-md hover:bg-brand-border/20 transition-colors text-brand-text-primary flex items-center gap-2">
                                <Icon name="upload" className="w-4 h-4" />
                                Upload
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary mb-1">Circle Name</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary text-brand-text-primary" required />
                    </div>
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-brand-text-secondary mb-1">Short Bio</label>
                        <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary text-brand-text-primary" rows={2} required />
                    </div>
                     <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-brand-text-secondary mb-1">Tags (comma-separated)</label>
                        <input type="text" id="tags" value={tags} onChange={e => setTags(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary text-brand-text-primary" placeholder="e.g. Gaming, Art, Music" />
                    </div>
                    <div>
                         <span className="block text-sm font-medium text-brand-text-secondary mb-2">Circle Type</span>
                         <div className="grid grid-cols-2 gap-2 bg-brand-bg p-1 rounded-md border border-brand-border">
                            <button
                                type="button"
                                onClick={() => setType(CircleType.Public)}
                                className={`px-4 py-2 text-sm font-semibold rounded ${type === CircleType.Public ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-surface' } transition-colors flex items-center justify-center gap-2`}
                            >
                                <Icon name="explore" className="w-5 h-5" /> Public
                            </button>
                            <button
                                type="button"
                                onClick={() => setType(CircleType.Private)}
                                className={`px-4 py-2 text-sm font-semibold rounded ${type === CircleType.Private ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-surface' } transition-colors flex items-center justify-center gap-2`}
                            >
                                <Icon name="lock" className="w-5 h-5" /> Private
                            </button>
                         </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isSubmitDisabled}
                        className="w-full bg-brand-accent text-white font-bold py-2.5 px-4 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        Create Circle
                    </button>
                </form>
            </div>
        </div>
    );
};