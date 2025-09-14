import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface AuthPageProps {
    onLogin: (email: string, password: string) => Promise<string | null>;
    onSignUp: (name: string, username: string, email: string, password: string, birthDate: string) => Promise<string | null>;
    onGoogleSignIn: () => void;
    initialError?: string | null;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignUp, onGoogleSignIn, initialError }) => {
    const [view, setView] = useState<'landing' | 'login' | 'signup'>('landing');
    const [signUpStep, setSignUpStep] = useState(1);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [error, setError] = useState<string | null>(initialError || null);

    useEffect(() => {
        if (initialError) {
            setError(initialError);
        }
    }, [initialError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (view === 'login') {
            const result = await onLogin(email, password);
            if (result) setError(result);
        } else if (view === 'signup') {
            if (signUpStep === 1) {
                if (username.includes(' ')) {
                    setError('Username cannot contain spaces.');
                    return;
                }
                setSignUpStep(2);
            } else {
                if (!birthDate) {
                    setError('Please enter your birth date.');
                    return;
                }
                const today = new Date();
                const birth = new Date(birthDate);
                let age = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                    age--;
                }
                if (age < 13) {
                    setError('You must be at least 13 years old to create an account.');
                    return;
                }
                
                const result = await onSignUp(name, username.startsWith('@') ? username : `@${username}`, email, password, birthDate);
                if (result) {
                    setError(result);
                    if (result.toLowerCase().includes('username') || result.toLowerCase().includes('email')) {
                        setSignUpStep(1);
                    }
                }
            }
        }
    };

    const changeView = (newView: 'landing' | 'login' | 'signup') => {
        setError(null);
        setName('');
        setUsername('');
        setEmail('');
        setPassword('');
        setBirthDate('');
        setSignUpStep(1);
        setView(newView);
    };

    const renderLanding = () => (
        <>
            <div className="mx-auto h-16 w-16 mb-4 flex items-center justify-center rounded-full bg-brand-primary/10 border border-brand-primary/30">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-brand-primary/20">
                    <span className="text-3xl font-bold text-brand-primary">+</span>
                </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">Welcome to Circle+</h1>
            <p className="text-brand-text-secondary text-center mb-6">Join the new social experience.</p>
            <div className="bg-brand-surface border border-brand-border rounded-lg p-6 space-y-4">
                 {error && (
                    <div className="bg-brand-danger/20 text-brand-danger text-sm font-semibold p-3 rounded-md text-center">
                        {error}
                    </div>
                )}
                <button
                    type="button"
                    onClick={onGoogleSignIn}
                    className="w-full border border-brand-border rounded-md py-2.5 px-4 hover:bg-brand-bg/50 transition-colors flex items-center justify-center gap-3"
                >
                    <Icon name="google" className="w-5 h-5" />
                    <span className="text-sm font-semibold">Continue with Google</span>
                </button>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-brand-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-brand-surface text-brand-text-secondary">OR</span>
                    </div>
                </div>
                <button 
                    onClick={() => changeView('signup')}
                    className="w-full bg-brand-primary text-white font-bold py-2.5 px-4 rounded-md hover:bg-brand-secondary transition-colors"
                >
                    Create Account
                </button>
                <button 
                    onClick={() => changeView('login')}
                    className="w-full bg-brand-surface border border-brand-border text-brand-text-primary font-bold py-2.5 px-4 rounded-md hover:bg-brand-bg/50 transition-colors"
                >
                    Log In
                </button>
            </div>
        </>
    );
    
    const renderForm = () => {
        const isLogin = view === 'login';

        return (
            <>
                <div className="flex items-center justify-center relative mb-4">
                    <button onClick={() => isLogin ? changeView('landing') : (signUpStep === 1 ? changeView('landing') : setSignUpStep(1))} className="absolute left-0 p-2 text-brand-text-secondary hover:text-brand-text-primary">
                        <Icon name="back" className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold text-center">
                        {isLogin ? 'Log In' : 'Create Account'}
                    </h1>
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-brand-danger/20 text-brand-danger text-sm font-semibold p-3 rounded-md text-center">
                                {error}
                            </div>
                        )}
                        {view === 'signup' && signUpStep === 1 && (
                            <>
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary mb-1">Name</label>
                                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                                </div>
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-brand-text-secondary mb-1">Username</label>
                                    <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" required placeholder="@username" />
                                </div>
                            </>
                        )}
                         {(view === 'login' || (view === 'signup' && signUpStep === 1)) && (
                            <>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-1">Email</label>
                                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary mb-1">Password</label>
                                    <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                                </div>
                            </>
                        )}
                        {view === 'signup' && signUpStep === 2 && (
                            <div>
                                <label htmlFor="birthDate" className="block text-sm font-medium text-brand-text-secondary mb-1">Date of Birth</label>
                                <input type="date" id="birthDate" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                                <p className="text-xs text-brand-text-secondary mt-1">You must be at least 13 years old.</p>
                            </div>
                        )}
                        <button 
                            type="submit"
                            className="w-full bg-brand-primary text-white font-bold py-2.5 px-4 rounded-md hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLogin ? 'Log In' : (signUpStep === 1 ? 'Next' : 'Create Account')}
                        </button>
                    </form>
                </div>
            </>
        );
    };

    return (
        <div className="bg-brand-bg min-h-screen font-sans text-brand-text-primary flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {view === 'landing' ? renderLanding() : renderForm()}
            </div>
        </div>
    );
};