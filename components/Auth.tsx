import React, { useState } from 'react';
import { ShieldCheckIcon } from './icons';

interface AuthProps {
    onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('demo@moneybuddy.app');
    const [password, setPassword] = useState('demo123');

    const handleLogin = () => {
        if (!email || !password) {
            alert('Please enter email and password');
            return;
        }
        if (email !== 'demo@moneybuddy.app' || password !== 'demo123') {
            alert('Invalid credentials. Use demo@moneybuddy.app and demo123');
            return;
        }
        setLoading(true);
        // Simulate login
        setTimeout(() => {
            onLogin();
        }, 1000);
    };

    return (
        <div className="min-h-screen text-white font-sans antialiased flex items-center justify-center p-4 animate-fade-in-down">
             <div className="relative z-10 w-full max-w-md">
                <div className="bg-gray-900/60 backdrop-blur-lg border border-lime-400/20 rounded-3xl shadow-2xl shadow-lime-500/10 p-12 hover:scale-105 transition-transform duration-300 hover:shadow-3xl">
                    <div className="text-center mb-8">
                        <img src="/logo.png" alt="App Logo" className="w-32 h-32 mx-auto mb-4" />
                        <h1 className="text-5xl font-bold text-white tracking-wide">
                            Money Buddy
                        </h1>
                        <p className="text-2xl text-lime-300/80 font-mono">Geo Safe</p>
                        <p className="text-lg font-semibold tracking-wide" style={{ background: 'linear-gradient(to right, #a3e635, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Protecting Your Finances in Every Location</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                                required
                            />
                        </div>
                        <button 
                            onClick={handleLogin}
                            disabled={loading} 
                            className="w-full bg-lime-500 hover:bg-lime-400 text-purple-900 font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-lime-500/20 flex items-center justify-center space-x-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                             <ShieldCheckIcon className="w-6 h-6" />
                            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Auth;
