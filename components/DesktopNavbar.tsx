import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import type { User } from '../types';
import type { View } from '../App';

interface DesktopNavbarProps {
    currentUser: User;
    activeView: string;
    onTabSelect: (view: View) => void;
    onOpenCreateCircleModal: () => void;
    onLogout: () => void;
}

export const DesktopNavbar: React.FC<DesktopNavbarProps> = ({ currentUser, activeView, onTabSelect, onOpenCreateCircleModal, onLogout }) => {
    const navItems = [
        { name: 'HOME', icon: 'home' as const, label: 'Home' },
        { name: 'EXPLORE', icon: 'explore' as const, label: 'Explore' },
        { name: 'CIRCLES', icon: 'members' as const, label: 'My Circles' },
        { name: 'NOTIFICATIONS', icon: 'bell' as const, label: 'Notifications' },
        { name: 'CHATS', icon: 'dm' as const, label: 'Messages' },
        { name: 'SAVED_POSTS', icon: 'bookmark' as const, label: 'Saved' },
        { name: 'ACCOUNT', icon: 'user' as const, label: 'Profile' },
    ];
    
    const [isUserMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="hidden md:flex flex-col justify-between w-[275px] px-2 h-screen sticky top-0 py-2">
            <div>
                <div className="p-3 text-2xl font-bold">
                    Circle<span className="text-brand-primary">+</span>
                </div>
                <nav className="mt-4">
                    <ul>
                        {navItems.map(item => (
                            <li key={item.name}>
                                <button
                                    onClick={() => onTabSelect({ type: item.name as any })}
                                    className={`flex items-center gap-4 w-full text-left p-3 my-1 rounded-full text-lg hover:bg-brand-surface transition-colors ${activeView === item.name ? 'font-bold' : ''}`}
                                >
                                    <Icon name={item.icon} className="w-7 h-7" />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <button
                    onClick={onOpenCreateCircleModal}
                    className="w-[90%] mt-4 bg-brand-primary text-white font-bold py-3 px-4 rounded-full hover:bg-brand-secondary transition-colors"
                >
                    Create Circle
                </button>
            </div>
            <div className="mb-4 relative" ref={userMenuRef}>
                 {isUserMenuOpen && (
                    <div className="absolute bottom-full mb-2 w-full bg-brand-bg rounded-lg shadow-lg border border-brand-border py-2 z-10">
                        <button onClick={() => { onTabSelect({type: 'SETTINGS'}); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-brand-surface flex items-center gap-3">
                            <Icon name="settings" className="w-5 h-5" /> Settings
                        </button>
                        <button onClick={() => { onLogout(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-brand-danger/20 flex items-center gap-3 text-brand-danger">
                            <Icon name="logout" className="w-5 h-5" /> Log out
                        </button>
                    </div>
                )}
                <button onClick={() => setUserMenuOpen(p => !p)} className="flex items-center w-full p-3 rounded-full hover:bg-brand-surface transition-colors">
                    <img src={currentUser.picture || `https://picsum.photos/seed/${currentUser.id}/100`} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1 ml-3 text-left">
                        <p className="font-bold text-sm">{currentUser.name}</p>
                        <p className="text-sm text-brand-text-secondary">{currentUser.username}</p>
                    </div>
                    <Icon name="more" className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};
