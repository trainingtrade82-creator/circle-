import React, { useState } from 'react';
import type { Circle, Highlight } from '../types';
import { Icon } from './Icon';

interface AddToHighlightModalProps {
    item: { type: 'story', id: string, circleId: string };
    circle: Circle;
    onClose: () => void;
    onAddToHighlight: (circleId: string, highlightId: string | 'new', newHighlightName?: string) => void;
}

export const AddToHighlightModal: React.FC<AddToHighlightModalProps> = ({ item, circle, onClose, onAddToHighlight }) => {
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newHighlightName, setNewHighlightName] = useState('');

    const handleCreateNew = (e: React.FormEvent) => {
        e.preventDefault();
        if (newHighlightName.trim()) {
            onAddToHighlight(circle.id, 'new', newHighlightName.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-surface rounded-lg shadow-xl w-full max-w-sm p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-text-primary text-2xl">&times;</button>
                <h2 className="text-xl font-bold mb-4 text-center">Add to Highlight</h2>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                    {(circle.highlights || []).map(highlight => (
                        <button
                            key={highlight.id}
                            onClick={() => onAddToHighlight(circle.id, highlight.id)}
                            className="w-full flex items-center gap-4 p-2 rounded-lg hover:bg-brand-bg transition-colors text-left"
                        >
                            <img src={highlight.coverImage} alt={highlight.name} className="w-12 h-12 rounded-md object-cover" />
                            <div>
                                <p className="font-semibold">{highlight.name}</p>
                                <p className="text-xs text-brand-text-secondary">{highlight.items.length} items</p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-brand-border">
                    {isCreatingNew ? (
                        <form onSubmit={handleCreateNew} className="space-y-3">
                             <input
                                type="text"
                                value={newHighlightName}
                                onChange={e => setNewHighlightName(e.target.value)}
                                placeholder="New highlight name..."
                                className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setIsCreatingNew(false)} className="flex-1 bg-brand-border text-brand-text-primary font-semibold py-2 px-3 rounded-md hover:bg-gray-600 transition-colors text-sm">Cancel</button>
                                <button type="submit" disabled={!newHighlightName.trim()} className="flex-1 bg-brand-primary text-white font-semibold py-2 px-3 rounded-md hover:bg-brand-secondary transition-colors disabled:opacity-50 text-sm">Create & Add</button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreatingNew(true)}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg hover:bg-brand-bg transition-colors border-2 border-dashed border-brand-border"
                        >
                            <Icon name="plus" className="w-5 h-5" />
                            <span className="font-semibold">Create New Highlight</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};