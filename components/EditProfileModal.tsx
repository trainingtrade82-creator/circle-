import React, { useState, useRef } from 'react';
import type { User } from '../types';
import { Icon } from './Icon';

interface EditProfileModalProps {
    currentUser: User;
    onClose: () => void;
    onSave: (updatedData: { name: string; bio: string; picture: string; }) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ currentUser, onClose, onSave }) => {
    const [name, setName] = useState(currentUser.name);
    const [bio, setBio] = useState(currentUser.bio);
    const [picture, setPicture] = useState(currentUser.picture || '');
    const [isChangingPicture, setIsChangingPicture] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: name.trim(),
            bio: bio.trim(),
            picture,
        });
    };

    const handleGenerateAIPicture = () => {
        setPicture(`https://picsum.photos/seed/${Date.now()}/100`);
        setIsChangingPicture(false);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // It's good practice to revoke the old URL to avoid memory leaks
            if (picture.startsWith('blob:')) {
                URL.revokeObjectURL(picture);
            }
            const newPictureUrl = URL.createObjectURL(file);
            setPicture(newPictureUrl);
            setIsChangingPicture(false);
        }
    };

    const isSaveDisabled = !name.trim() || !bio.trim();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-surface rounded-lg shadow-xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-text-primary text-2xl">&times;</button>
                <h2 className="text-xl font-bold mb-6 text-center">Edit Profile</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col items-center mb-6">
                        {picture ? (
                            <img src={picture} alt={name} className="w-24 h-24 rounded-full mb-3 object-cover" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-brand-primary/20 flex items-center justify-center mb-3">
                                <span className="text-4xl font-bold text-brand-primary">{name.charAt(0)}</span>
                            </div>
                        )}
                        {!isChangingPicture ? (
                            <button type="button" onClick={() => setIsChangingPicture(true)} className="text-sm text-brand-primary font-semibold hover:underline">
                                Change Picture
                            </button>
                        ) : (
                             <div className="flex flex-col gap-2 w-full max-w-xs text-sm">
                                <button type="button" onClick={handleGenerateAIPicture} className="w-full bg-brand-secondary text-white font-semibold py-1.5 px-3 rounded-md hover:bg-brand-primary transition-colors">
                                    Generate with AI
                                </button>
                                <button type="button" onClick={handleUploadClick} className="w-full bg-brand-surface border border-brand-border font-semibold py-1.5 px-3 rounded-md hover:bg-brand-border/20 transition-colors text-brand-text-primary">
                                    Upload from Device
                                </button>
                                <button type="button" onClick={() => setIsChangingPicture(false)} className="w-full text-brand-text-secondary mt-1 hover:underline text-xs">
                                    Cancel
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary mb-1">Name</label>
                        <input 
                            type="text" 
                            id="name" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary text-brand-text-primary" 
                            required 
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="bio" className="block text-sm font-medium text-brand-text-secondary mb-1">Bio</label>
                        <textarea 
                            id="bio" 
                            value={bio} 
                            onChange={e => setBio(e.target.value)} 
                            className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary text-brand-text-primary" 
                            rows={3} 
                            required 
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-brand-surface border border-brand-border text-brand-text-primary font-bold py-2 px-4 rounded-md hover:bg-brand-border/20 transition-colors">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSaveDisabled}
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