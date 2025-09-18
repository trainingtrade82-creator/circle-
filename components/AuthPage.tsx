import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
// FIX: Correctly import firebase to get the User type.
import firebase from 'firebase/compat/app';

interface AuthPageProps {
    onLogin: (email: string, password: string) => Promise<string | null>;
    onSignUp: (name: string, username: string, email: string, password: string, birthDate: string) => Promise<string | null>;
    onGoogleSignIn: () => Promise<void>;
    initialError?: string | null;
    // FIX: Use firebase.User as the type for the auth user from Firebase.
    postGoogleSignUpUser: firebase.User | null;
    onCompleteGoogleSignUp: (name: string, username: string, birthDate: string) => Promise<string | null>;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignUp, onGoogleSignIn, initialError, postGoogleSignUpUser, onCompleteGoogleSignUp }) => {
    const [view, setView] = useState<'landing' | 'login' | 'signup' | 'google-signup'>('landing');
    const [signUpStep, setSignUpStep] = useState(1);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [error, setError] = useState<string | null>(initialError || null);
    const [isGoogleLoading, setGoogleLoading] = useState(false);

    useEffect(() => {
        if (initialError) {
            setError(initialError);
        }
    }, [initialError]);
    
    useEffect(() => {
        if (postGoogleSignUpUser) {
            setName(postGoogleSignUpUser.displayName || '');
            setEmail(postGoogleSignUpUser.email || '');
            setView('google-signup');
        } else if (view === 'google-signup') {
            // This handles the case where the sign-up process is cancelled or completed elsewhere,
            // preventing the user from being stuck on this view.
            setView('landing');
        }
    }, [postGoogleSignUpUser, view]);

    const performAgeCheck = () => {
        if (!birthDate) {
            setError('Please enter your birth date.');
            return false;
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
            return false;
        }
        return true;
    };


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
                if (!performAgeCheck()) return;
                
                const result = await onSignUp(name, username.startsWith('@') ? username : `@${username}`, email, password, birthDate);
                if (result) {
                    setError(result);
                    if (result.toLowerCase().includes('username') || result.toLowerCase().includes('email')) {
                        setSignUpStep(1);
                    }
                }
            }
        } else if (view === 'google-signup') {
            if (!performAgeCheck()) return;

            const result = await onCompleteGoogleSignUp(name, username.startsWith('@') ? username : `@${username}`, birthDate);
            if (result) setError(result);
        }
    };
    
    const handleGoogleSignInClick = async () => {
        setError(null);
        setGoogleLoading(true);
        try {
            await onGoogleSignIn();
            // signInWithRedirect will navigate away, so setGoogleLoading(false) might not be reached
            // if successful. It's mainly for catching the immediate error.
        } catch (error: any) {
            setError(error.message);
            setGoogleLoading(false);
        }
    };

    const changeView = (newView: 'landing' | 'login' | 'signup' | 'google-signup') => {
        setError(null);
        setName('');
        setUsername('');
        setEmail('');
        setPassword('');
        setBirthDate('');
        setSignUpStep(1);
        setView(newView);
    };
    
    const renderContent = () => {
        switch (view) {
            case 'landing':
                return (
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
            case 'login':
            case 'signup':
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

                            {(view === 'login' || (view === 'signup' && signUpStep === 1)) && (
                                <>
                                    <div className="relative my-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-brand-border"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-brand-surface text-brand-text-secondary">OR</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleGoogleSignInClick}
                                        disabled={isGoogleLoading}
                                        className="w-full border border-brand-border rounded-md py-2.5 px-4 hover:bg-brand-bg/50 transition-colors flex items-center justify-center gap-3 disabled:opacity-70"
                                    >
                                        {isGoogleLoading ? (
                                            <Icon name="refresh" className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Icon name="google" className="w-5 h-5" />
                                        )}
                                        <span className="text-sm font-semibold">{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                );
            case 'google-signup':
                return (
                     <>
                        <h1 className="text-2xl font-bold text-center mb-4">Complete Your Profile</h1>
                        <p className="text-brand-text-secondary text-center mb-4 text-sm">Just a few more details to get started.</p>
                        <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="bg-brand-danger/20 text-brand-danger text-sm font-semibold p-3 rounded-md text-center">
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="name-google" className="block text-sm font-medium text-brand-text-secondary mb-1">Name</label>
                                    <input type="text" id="name-google" value={name} onChange={e => setName(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                                </div>
                                <div>
                                    <label htmlFor="username-google" className="block text-sm font-medium text-brand-text-secondary mb-1">Username</label>
                                    <input type="text" id="username-google" value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" required placeholder="@username" />
                                </div>
                                <div>
                                    <label htmlFor="birthDate-google" className="block text-sm font-medium text-brand-text-secondary mb-1">Date of Birth</label>
                                    <input type="date" id="birthDate-google" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                                    <p className="text-xs text-brand-text-secondary mt-1">You must be at least 13 years old.</p>
                                </div>
                                <button 
                                    type="submit"
                                    className="w-full bg-brand-primary text-white font-bold py-2.5 px-4 rounded-md hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Complete Sign Up
                                </button>
                            </form>
                        </div>
                    </>
                );
        }
    };


    return (
        <div className="bg-brand-bg min-h-screen font-sans text-brand-text-primary flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {renderContent()}
            </div>
        </div>
    );
};