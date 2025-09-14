import React, { useState, useRef, PointerEvent, useEffect } from 'react';
import type { Circle, StoryElement, TextElement, ImageElement, PostElement, Post } from '../types';
import { StoryType } from '../types';
import { Icon } from './Icon';

export interface NewStoryData {
    mediaType: StoryType;
    duration: number;
    mediaUrl?: string;
    gradientBackground?: string;
    elements: StoryElement[];
}

interface CreateStoryModalProps {
    circles: Circle[];
    allPosts: Post[];
    sharedPost: Post | null;
    onClose: () => void;
    onCreate: (circleId: string, storyData: NewStoryData) => void;
}

type Step = 'SELECT_CIRCLE' | 'SELECT_BG' | 'EDITOR';

const textBackgrounds = [
    'bg-gradient-to-br from-purple-500 to-indigo-600',
    'bg-gradient-to-br from-green-400 to-blue-500',
    'bg-gradient-to-br from-pink-500 to-orange-400',
    'bg-gradient-to-br from-red-500 to-yellow-500',
    'bg-gradient-to-br from-gray-700 via-gray-900 to-black',
];

const textColors = ['#FFFFFF', '#000000', '#EF4444', '#F59E0B', '#84CC16', '#3B82F6', '#A855F7'];

const PostStoryElement: React.FC<{post: Post}> = ({ post }) => (
    <div className="w-full h-full bg-brand-surface/80 backdrop-blur-sm rounded-xl p-3 flex flex-col text-white border border-white/20 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
            <img src={post.circleLogo} alt={post.circleName} className="w-6 h-6 rounded-full" />
            <p className="font-bold text-xs truncate">{post.circleName}</p>
        </div>
        <p className="text-sm line-clamp-4 flex-1">{post.content}</p>
        <p className="text-xs mt-1 text-white/70">Posted by {post.authorNickname}</p>
    </div>
);

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ circles, allPosts, sharedPost, onClose, onCreate }) => {
    const [step, setStep] = useState<Step>(sharedPost ? 'SELECT_CIRCLE' : 'SELECT_CIRCLE');
    const [selectedCircleId, setSelectedCircleId] = useState<string>(circles[0]?.id || '');
    const [background, setBackground] = useState<{type: StoryType, value: string} | null>(null);

    const [elements, setElements] = useState<StoryElement[]>([]);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [duration, setDuration] = useState(15);
    const [isDurationPopoverOpen, setDurationPopoverOpen] = useState(false);
    
    const [interaction, setInteraction] = useState<{
        type: 'drag' | 'resize' | 'rotate';
        handle: 'tl' | 'tr' | 'bl' | 'br' | 'body';
        elementId: string;
        startX: number;
        startY: number;
        elementStart: StoryElement;
        canvasRect: DOMRect;
        elementCenter: { x: number; y: number };
    } | null>(null);

    const [isOverTrash, setIsOverTrash] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageElementInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (sharedPost) {
            // Automatically select a background and move to editor
            setBackground({ type: StoryType.Text, value: textBackgrounds[0] });
            const postElement: PostElement = {
                id: `post-${sharedPost.id}`,
                type: 'post',
                postId: sharedPost.id,
                x: 50,
                y: 50,
                width: 280,
                height: 180,
                scale: 1,
                rotation: 0,
                zIndex: 1,
            };
            setElements([postElement]);
            setSelectedElementId(postElement.id);
            setStep('EDITOR');
        }
    }, [sharedPost]);
    
    const selectedElement = elements.find(el => el.id === selectedElementId) as TextElement | ImageElement | PostElement | undefined;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBackground({ type: StoryType.Image, value: reader.result as string });
                setStep('EDITOR');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageElementFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const newElement: ImageElement = {
                        id: `el-${Date.now()}`,
                        type: 'image',
                        content: reader.result as string,
                        x: 50, y: 50, scale: 1, rotation: 0,
                        width: 200, 
                        height: 200 * (img.height / img.width),
                        zIndex: elements.length + 1,
                    };
                    setElements(prev => [...prev, newElement]);
                    setSelectedElementId(newElement.id);
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSelectGradient = (gradient: string) => {
        setBackground({ type: StoryType.Text, value: gradient });
        setStep('EDITOR');
    };
    
    const handleAddText = () => {
        const newElement: TextElement = {
            id: `el-${Date.now()}`,
            type: 'text',
            content: 'Your Text',
            x: 50, y: 50, scale: 1, rotation: 0,
            width: 250, height: 50,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0,0,0,0.0)',
            textAlign: 'center',
            fontWeight: 'normal',
            zIndex: elements.length + 1,
            isUnderlined: false,
        };
        setElements(prev => [...prev, newElement]);
        setSelectedElementId(newElement.id);
    };
    
    const handleUpdateElement = (updatedElement: StoryElement) => {
        setElements(prev => prev.map(el => el.id === updatedElement.id ? updatedElement : el));
    };
    
    const handleDoubleClick = (e: React.MouseEvent, elementId: string) => {
        e.stopPropagation();
        const element = elements.find(el => el.id === elementId);
        if (element && element.type === 'text') {
            const elNode = (e.currentTarget.querySelector(`[data-text-content="${elementId}"]`) as HTMLDivElement);
            if(elNode) {
                elNode.contentEditable = 'true';
                elNode.focus();
                
                const range = document.createRange();
                range.selectNodeContents(elNode);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);

                const handleBlur = () => {
                    elNode.contentEditable = 'false';
                    const newContent = elNode.innerText;
                    // Use a functional update to get the latest state
                    setElements(currentElements => currentElements.map(el => {
                        if (el.id === elementId && el.type === 'text') {
                            return { ...el, content: newContent };
                        }
                        return el;
                    }));
                    elNode.removeEventListener('blur', handleBlur);
                };
                elNode.addEventListener('blur', handleBlur);
            }
        }
    };


    const handlePointerDown = (e: PointerEvent<HTMLDivElement>, element: StoryElement, handle: 'tl' | 'tr' | 'bl' | 'br' | 'body') => {
        e.preventDefault();
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setSelectedElementId(element.id);
        
        if (!canvasRef.current) return;
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const elementNode = e.currentTarget.closest('[data-element-id]') as HTMLElement;
        const elementRect = elementNode.getBoundingClientRect();
        
        const elementCenter = {
            x: elementRect.left + elementRect.width / 2,
            y: elementRect.top + elementRect.height / 2,
        };

        let type: 'drag' | 'resize' | 'rotate' = 'drag';
        if (handle === 'tr') type = 'rotate';
        if (['tl', 'bl', 'br'].includes(handle)) type = 'resize';

        setInteraction({
            type,
            handle,
            elementId: element.id,
            startX: e.clientX,
            startY: e.clientY,
            elementStart: { ...element },
            canvasRect,
            elementCenter,
        });
    };

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (!interaction) return;
        e.preventDefault();
        e.stopPropagation();
        
        const { type, elementId, startX, startY, elementStart, canvasRect, elementCenter } = interaction;
        const element = elements.find(el => el.id === elementId);
        if (!element) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let updatedElement = { ...element };

        if (type === 'drag') {
            const newX = elementStart.x + (dx / canvasRect.width) * 100;
            const newY = elementStart.y + (dy / canvasRect.height) * 100;
            updatedElement.x = newX;
            updatedElement.y = newY;
        } else if (type === 'rotate') {
            const angle = Math.atan2(e.clientY - elementCenter.y, e.clientX - elementCenter.x) * (180 / Math.PI);
            const startAngle = Math.atan2(startY - elementCenter.y, startX - elementCenter.x) * (180 / Math.PI);
            updatedElement.rotation = elementStart.rotation + (angle - startAngle);
        } else if (type === 'resize') {
            const initialDist = Math.hypot(startX - elementCenter.x, startY - elementCenter.y);
            const currentDist = Math.hypot(e.clientX - elementCenter.x, e.clientY - elementCenter.y);
            if (initialDist > 0) {
                const newScale = elementStart.scale * (currentDist / initialDist);
                updatedElement.scale = Math.max(0.1, newScale);
            }
        }
        
        handleUpdateElement(updatedElement);
        
        const trashZoneY = window.innerHeight - 100;
        setIsOverTrash(e.clientY > trashZoneY);
    };

    const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
        if (!interaction) return;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);

        if (interaction.type === 'drag' && isOverTrash && selectedElementId) {
            setElements(prev => prev.filter(el => el.id !== selectedElementId));
            setSelectedElementId(null);
        }
        setInteraction(null);
        setIsOverTrash(false);
    };

    const changeZIndex = (direction: 'up' | 'down') => {
        if (!selectedElement) return;
        const maxZ = elements.length;
        if (direction === 'up' && selectedElement.zIndex < maxZ) {
            handleUpdateElement({...selectedElement, zIndex: selectedElement.zIndex + 1});
        }
        if (direction === 'down' && selectedElement.zIndex > 1) {
             handleUpdateElement({...selectedElement, zIndex: selectedElement.zIndex - 1});
        }
    };

    const handlePost = () => {
        if (!selectedCircleId || !background) return;
        const storyData: NewStoryData = {
            mediaType: background.type,
            duration,
            elements,
            ...(background.type === StoryType.Image ? { mediaUrl: background.value } : { gradientBackground: background.value }),
        };
        onCreate(selectedCircleId, storyData);
    };

    const renderSelectCircle = () => (
         <div className="w-full h-full bg-black p-4 flex flex-col justify-center items-center gap-6">
             <button onClick={onClose} className="absolute top-4 left-4 text-white z-10"><Icon name="close" className="w-7 h-7" /></button>
            <h2 className="text-xl font-bold text-white">Post Story to...</h2>
            <select
                id="circle-select"
                value={selectedCircleId}
                onChange={(e) => setSelectedCircleId(e.target.value)}
                className="w-full max-w-xs bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary text-brand-text-primary"
            >
                {circles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
             <button onClick={() => setStep('SELECT_BG')} disabled={!selectedCircleId} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-secondary disabled:opacity-50">
                Next
            </button>
         </div>
    );
    
    const renderSelectBg = () => (
         <div className="w-full h-full bg-black p-4 flex flex-col items-center">
             <header className="w-full flex justify-between items-center text-white z-10 mb-4">
                <button onClick={() => setStep('SELECT_CIRCLE')}><Icon name="back" className="w-7 h-7" /></button>
                <h2 className="font-bold text-lg">Choose a Background</h2>
                 <div className="w-7"></div>
            </header>
            <div className="flex-1 w-full grid grid-cols-2 gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="bg-brand-surface rounded-lg flex flex-col items-center justify-center text-brand-text-secondary hover:border-brand-primary border-2 border-transparent transition-colors">
                    <Icon name="upload" className="w-12 h-12" />
                    <p className="font-semibold mt-2">Upload Photo</p>
                </button>
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

                 <button onClick={() => handleSelectGradient(textBackgrounds[0])} className={`${textBackgrounds[0]} rounded-lg flex flex-col items-center justify-center text-white hover:border-white border-2 border-transparent transition-colors`}>
                     <Icon name="text" className="w-12 h-12" />
                     <p className="font-semibold mt-2">Text Story</p>
                 </button>
            </div>
             <div className="grid grid-cols-5 gap-2 mt-4 w-full max-w-xs">
                {textBackgrounds.map(bg => (
                    <button key={bg} onClick={() => handleSelectGradient(bg)} className={`w-12 h-12 rounded-full ${bg} border-2 border-white/50 hover:border-white`} />
                ))}
            </div>
        </div>
    );

    const renderEditor = () => {
        const isPostDisabled = background?.type === StoryType.Text && elements.every(el => el.type === 'text' && !el.content.trim());
        
        return (
            <div 
                className="w-full h-full bg-brand-bg flex flex-col touch-none" // touch-none is important for pointer events
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <header className="p-4 flex justify-between items-center text-white z-20">
                    <button onClick={onClose}><Icon name="close" className="w-7 h-7" /></button>
                    <div className="flex items-center gap-4">
                         <div className="relative">
                            <button 
                                onClick={() => setDurationPopoverOpen(p => !p)} 
                                className="flex items-center gap-1.5 text-white p-1.5 rounded-md bg-black/30 hover:bg-black/50 transition-colors"
                            >
                                <Icon name="clock" className="w-5 h-5" />
                                <span className="text-sm font-semibold">{duration}s</span>
                            </button>
                             {isDurationPopoverOpen && (
                                <div className="absolute top-full right-0 mt-2 bg-brand-surface border border-brand-border p-3 rounded-lg z-30 w-56 shadow-lg">
                                     <label className="block text-sm font-medium text-brand-text-secondary mb-1">Duration: <span className="font-bold text-brand-text-primary">{duration}s</span></label>
                                     <input 
                                        type="range" 
                                        min="5" 
                                        max="60" 
                                        value={duration} 
                                        onChange={e => setDuration(Number(e.target.value))} 
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>
                         <button onClick={() => imageElementInputRef.current?.click()}>
                            <Icon name="image" className="w-7 h-7" />
                        </button>
                         <input type="file" ref={imageElementInputRef} onChange={handleImageElementFileChange} className="hidden" accept="image/*" />
                        <button><Icon name="sticker" className="w-7 h-7 opacity-50 cursor-not-allowed" /></button>
                        <button onClick={handleAddText}><Icon name="draw" className="w-7 h-7" /></button>
                    </div>
                </header>

                 {selectedElement && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/50 p-2 rounded-lg flex items-center gap-2 z-20">
                        {selectedElement.type !== 'text' && (
                             <div className="flex bg-black/30 rounded">
                                <button onClick={() => changeZIndex('down')} className="p-1.5 text-white"><Icon name="layers" className="w-5 h-5 transform -scale-y-100" /></button>
                                <button onClick={() => changeZIndex('up')} className="p-1.5 text-white"><Icon name="layers" className="w-5 h-5" /></button>
                            </div>
                        )}
                        {selectedElement.type === 'text' && (
                            <>
                            <button
                                onClick={() => handleUpdateElement({ ...selectedElement, fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                                className={`p-1.5 rounded transition-colors ${selectedElement.fontWeight === 'bold' ? 'bg-white text-black' : 'text-white'}`}
                            >
                                <Icon name="bold" className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handleUpdateElement({ ...selectedElement, isUnderlined: !selectedElement.isUnderlined })}
                                className={`p-1.5 rounded transition-colors ${selectedElement.isUnderlined ? 'bg-white text-black' : 'text-white'}`}
                            >
                                <Icon name="underline" className="w-5 h-5" />
                            </button>
                            <div className="flex bg-black/30 rounded">
                                {(['left', 'center', 'right'] as const).map(align => (
                                    <button key={align} onClick={() => handleUpdateElement({...selectedElement, textAlign: align})} className={`p-1.5 ${selectedElement.textAlign === align ? 'text-brand-primary' : 'text-white'}`}>
                                        <Icon name={`align-${align}`} className="w-5 h-5" />
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => handleUpdateElement({...selectedElement, backgroundColor: selectedElement.backgroundColor === 'rgba(0,0,0,0.0)' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.0)'})} 
                                className={`p-1.5 rounded font-bold text-lg ${selectedElement.backgroundColor !== 'rgba(0,0,0,0.0)' ? 'bg-white text-black' : 'text-white border border-white'}`}
                            >A</button>
                            <div className="flex gap-1.5 items-center">
                                {textColors.map(color => (
                                    <button key={color} onClick={() => handleUpdateElement({...selectedElement as TextElement, color})} style={{backgroundColor: color}} className={`w-5 h-5 rounded-full border-2 ${selectedElement.color === color ? 'border-brand-primary' : 'border-white'}`} />
                                ))}
                            </div>
                            </>
                        )}
                    </div>
                )}
                <div 
                    className="flex-1 w-full aspect-[9/16] max-h-[65vh] mx-auto my-2 rounded-lg overflow-hidden relative bg-brand-bg"
                    onClick={() => { setSelectedElementId(null); setDurationPopoverOpen(false); }}
                    ref={canvasRef}
                >
                    {background?.type === StoryType.Image && <img src={background.value} alt="Preview" className="w-full h-full object-cover absolute inset-0" />}
                    {background?.type === StoryType.Text && <div className={`w-full h-full absolute inset-0 ${background.value}`} />}
                    
                    {elements.map(el => {
                        const isSelected = selectedElementId === el.id;
                        const handleStyle: React.CSSProperties = { transform: `scale(${1 / el.scale})`, transition: 'transform 0.1s' };
                        const textStyles: React.CSSProperties = el.type === 'text' ? { color: el.color, backgroundColor: el.backgroundColor, textAlign: el.textAlign, padding: el.backgroundColor !== 'rgba(0,0,0,0.0)' ? '0.25em 0.5em' : '0', borderRadius: el.backgroundColor !== 'rgba(0,0,0,0.0)' ? '0.25em' : '0', fontSize: '2rem', fontWeight: el.fontWeight || 'normal', lineHeight: 1.2, whiteSpace: 'pre-wrap', textDecoration: el.isUnderlined ? 'underline' : 'none' } : {};
                        
                        return (
                            <div
                                key={el.id}
                                data-element-id={el.id}
                                className="absolute cursor-grab active:cursor-grabbing"
                                style={{
                                    left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}px`, 
                                    height: el.type === 'text' ? 'auto' : `${el.height}px`,
                                    transform: `translate(-50%, -50%) scale(${el.scale}) rotate(${el.rotation}deg)`,
                                    zIndex: el.zIndex,
                                }}
                                onPointerDown={(e) => handlePointerDown(e, el, 'body')}
                                onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                                onDoubleClick={(e) => handleDoubleClick(e, el.id)}
                            >
                                <div className={`relative w-full h-full ${isSelected ? 'border-2 border-dashed border-white/70' : ''}`}>
                                    {el.type === 'text' && <div data-text-content={el.id} contentEditable={false} suppressContentEditableWarning style={textStyles} className="min-w-[50px] focus:outline-none">{el.content}</div>}
                                    {el.type === 'image' && <img src={el.content} alt="" className="w-full h-full object-contain pointer-events-none" />}
                                    {el.type === 'post' && (() => {
                                        const post = allPosts.find(p => p.id === el.postId);
                                        return post ? <PostStoryElement post={post} /> : null;
                                    })()}
                                    
                                    {isSelected && (
                                        <>
                                            <div onPointerDown={(e) => handlePointerDown(e, el, 'tl')} style={handleStyle} className="absolute -top-2 -left-2 w-5 h-5 bg-white rounded-full cursor-nwse-resize border-2 border-black" />
                                            <div onPointerDown={(e) => handlePointerDown(e, el, 'tr')} style={handleStyle} className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full cursor-alias border-2 border-black flex items-center justify-center">
                                                <Icon name="rotate" className="w-3 h-3 text-black"/>
                                            </div>
                                            <div onPointerDown={(e) => handlePointerDown(e, el, 'bl')} style={handleStyle} className="absolute -bottom-2 -left-2 w-5 h-5 bg-white rounded-full cursor-nesw-resize border-2 border-black" />
                                            <div onPointerDown={(e) => handlePointerDown(e, el, 'br')} style={handleStyle} className="absolute -bottom-2 -right-2 w-5 h-5 bg-white rounded-full cursor-nwse-resize border-2 border-black" />
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <footer className="p-4 flex flex-col gap-3 z-10">
                    <button onClick={handlePost} disabled={isPostDisabled} className="w-full bg-brand-primary text-white font-bold py-2.5 px-4 rounded-md hover:bg-brand-secondary disabled:opacity-50">Post Story</button>
                </footer>

                <div className={`absolute bottom-0 left-0 right-0 h-24 flex items-center justify-center transition-opacity duration-300 z-30 pointer-events-none ${interaction?.type === 'drag' ? 'opacity-100' : 'opacity-0'}`}>
                    <div className={`p-4 rounded-full transition-all duration-200 ${isOverTrash ? 'bg-brand-danger scale-125' : 'bg-black/50'}`}>
                        <Icon name="trash" className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>
        );
    };

    const renderCurrentStep = () => {
        switch(step) {
            case 'SELECT_CIRCLE': return renderSelectCircle();
            case 'SELECT_BG': return renderSelectBg();
            case 'EDITOR': return renderEditor();
        }
    }

    return (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <div className="bg-brand-surface w-full max-w-md h-full md:h-[800px] md:max-h-[90vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-brand-border relative">
                {renderCurrentStep()}
            </div>
        </div>
    );
};