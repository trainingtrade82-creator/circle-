import React, { useState, useRef } from 'react';
import type { Circle, Highlight } from '../types';
import { Icon } from './Icon';

interface EditHighlightModalProps {
    circle: Circle;
    highlight: Highlight;
    onClose: () => void;
    onSave: (circleId: string, highlightId: string, updatedData: { name: string; coverImage: string; }) => void;
}

export const EditHighlightModal: React.FC<EditHighlightModalProps> = ({ circle, highlight, onClose, onSave }) => {
    const [name, setName] = useState(highlight.name);
    const [coverImage, setCoverImage] = useState(highlight.coverImage);
    const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerateLogo = () => {
        setIsGeneratingLogo(true);
        window.setTimeout(() => {
            setCoverImage(`https://picsum.photos/seed/${Date.now()}/200`);
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
                setCoverImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(circle.id, highlight.id, {
            name: name.trim(),
            coverImage,
        });
    };
    
    const isSubmitDisabled = !name.trim() || !coverImage || isGeneratingLogo;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-surface rounded-lg shadow-xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-text-primary text-2xl">&times;</button>
                <h2 className="text-xl font-bold mb-6 text-brand-text-primary text-center">Edit Highlight</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-brand-bg border-2 border-dashed border-brand-border flex items-center justify-center overflow-hidden">
                            {coverImage && (
                                <img src={coverImage} alt="Highlight cover preview" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex gap-2">
                             <button type="button" onClick={handleGenerateLogo} className="text-sm bg-brand-secondary text-white font-semibold py-1.5 px-3 rounded-md hover:bg-brand-primary transition-colors flex items-center gap-2 disabled:opacity-50" disabled={isGeneratingLogo}>
                                <Icon name="sparkles" className="w-4 h-4" />
                                {isGeneratingLogo ? 'Generating...' : 'Generate with AI'}
                            </button>
                            <button type="button" onClick={handleUploadClick} className="text-sm bg-brand-surface border border-brand-border font-semibold py-1.5 px-3 rounded-md hover:bg-gray-800/50 transition-colors text-brand-text-primary flex items-center gap-2">
                                <Icon name="upload" className="w-4 h-4" />
                                Upload
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="edit-highlight-name" className="block text-sm font-medium text-brand-text-secondary mb-1">Highlight Name</label>
                        <input type="text" id="edit-highlight-name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary text-brand-text-primary" required />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="bg-brand-border text-brand-text-primary font-bold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isSubmitDisabled}
                            className="bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};