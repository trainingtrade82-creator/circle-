import React from 'react';
import { Icon } from './Icon';

type ViewType = 'HOME' | 'EXPLORE' | 'CIRCLE' | 'CIRCLES' | 'ACCOUNT' | 'CHATS' | 'CONVERSATION' | 'FRIENDS' | 'USER_CIRCLES' | 'SETTINGS' | 'BLOCKED_USERS' | 'SAVED_POSTS' | 'USER_PROFILE' | 'NOTIFICATIONS';
interface NavbarProps {
    activeView: ViewType;
    onTabSelect: (view: { type: 'HOME' } | { type: 'EXPLORE' } | { type: 'CIRCLES' } | { type: 'ACCOUNT' }) => void;
    onOpenCreateCircleModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, onTabSelect, onOpenCreateCircleModal }) => {
    const navItems = [
        { name: 'HOME', icon: 'home' as const, label: 'Home' },
        { name: 'EXPLORE', icon: 'explore' as const, label: 'Explore' },
        { name: 'CREATE', icon: 'plus' as const, label: 'Create' },
        { name: 'CIRCLES', icon: 'members' as const, label: 'Circles' },
        { name: 'ACCOUNT', icon: 'user' as const, label: 'Account' }
    ];

    return (
        <div className="bg-brand-surface border-t border-brand-border h-16 flex justify-around items-center md:hidden">
            {navItems.map(item => {
                if (item.name === 'CREATE') {
                    return (
                        <button 
                            key={item.name} 
                            onClick={onOpenCreateCircleModal}
                            className="flex flex-col items-center justify-center text-xs w-20 transition-colors text-brand-text-secondary hover:text-brand-text-primary"
                        >
                            <Icon name={item.icon} className="w-6 h-6 mb-1" />
                            <span>{item.label}</span>
                        </button>
                    )
                }
                
                const isActive = activeView === item.name;
                return (
                    <button 
                        key={item.name} 
                        onClick={() => onTabSelect({ type: item.name as 'HOME' | 'EXPLORE' | 'CIRCLES' | 'ACCOUNT' })}
                        className={`flex flex-col items-center justify-center text-xs w-20 transition-colors ${isActive ? 'text-brand-primary' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
                    >
                        <Icon name={item.icon} className="w-6 h-6 mb-1" />
                        <span>{item.label}</span>
                    </button>
                )
            })}
        </div>
    );
};