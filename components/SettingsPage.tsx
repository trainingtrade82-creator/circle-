import React from 'react';
import type { User } from '../types';
import { Icon } from './Icon';
import type { View, Theme } from '../App';

interface SettingsPageProps {
  currentUser: User;
  onLogout: () => void;
  onToggleAccountPrivacy: () => void;
  navigate: (view: View) => void;
  onBack: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, onLogout, onToggleAccountPrivacy, navigate, onBack, theme, onThemeChange }) => {
  const themeOptions: { key: Theme, label: string }[] = [
      { key: 'system', label: 'System' },
      { key: 'light', label: 'Light' },
      { key: 'dark', label: 'Dark' },
      { key: 'grey', label: 'Grey' },
      { key: 'blue', label: 'Blue' },
  ];
  
  return (
    <div className="flex flex-col h-full">
        <header className="p-4 flex items-center sticky top-0 bg-brand-surface/80 backdrop-blur-sm z-10 border-b border-brand-border h-16">
            <button onClick={onBack} className="p-1"><Icon name="back" /></button>
            <h1 className="text-xl font-bold text-center flex-1">Settings</h1>
            <div className="w-8"></div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
                <h3 className="font-bold text-lg mb-2">Appearance</h3>
                <div className="bg-brand-surface border border-brand-border/50 rounded-lg p-3">
                    <p className="text-sm text-brand-text-secondary mb-2">Choose your preferred theme.</p>
                    <div className="flex flex-wrap gap-2 bg-brand-bg p-1 rounded-md">
                        {themeOptions.map(option => (
                           <button
                                key={option.key}
                                onClick={() => onThemeChange(option.key)}
                                className={`flex-1 text-center px-3 py-2 text-sm font-semibold rounded transition-colors ${theme === option.key ? 'bg-brand-primary text-white' : 'text-brand-text-primary hover:bg-brand-surface'}`}
                           >
                               {option.label}
                           </button>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="bg-brand-bg border border-brand-border/50 rounded-lg p-3 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold">Private Account</h3>
                    <p className="text-xs text-brand-text-secondary">When your account is private, only people you approve can see your activity.</p>
                </div>
                <label htmlFor="privacy-toggle" className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="privacy-toggle" className="sr-only peer" checked={currentUser.isPrivate} onChange={onToggleAccountPrivacy} />
                    <div className="w-11 h-6 bg-gray-400 dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                </label>
            </div>
             <button onClick={() => navigate({ type: 'SAVED_POSTS' })} className="w-full text-left bg-brand-bg border border-brand-border/50 rounded-lg p-3 flex items-center justify-between hover:bg-brand-surface transition-colors">
                <div className="flex items-center gap-3">
                    <Icon name="bookmark" className="w-5 h-5 text-brand-text-secondary"/>
                    <span className="font-semibold">Saved Content</span>
                </div>
                <Icon name="back" className="w-5 h-5 transform rotate-180 text-brand-text-secondary" />
            </button>
            <button onClick={() => navigate({ type: 'BLOCKED_USERS' })} className="w-full text-left bg-brand-bg border border-brand-border/50 rounded-lg p-3 flex items-center justify-between hover:bg-brand-surface transition-colors">
                 <div className="flex items-center gap-3">
                    <Icon name="user-block" className="w-5 h-5 text-brand-text-secondary"/>
                    <span className="font-semibold">Blocked Accounts</span>
                </div>
                <Icon name="back" className="w-5 h-5 transform rotate-180 text-brand-text-secondary" />
            </button>
            <button onClick={onLogout} className="w-full text-left bg-brand-bg border border-brand-border/50 rounded-lg p-3 flex items-center justify-between hover:bg-brand-danger/20 transition-colors text-brand-danger font-semibold">
                Log Out
                <Icon name="logout" className="w-5 h-5" />
            </button>
        </div>
    </div>
  );
};