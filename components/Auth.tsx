import React, { useState } from 'react';
import { ShieldCheckIcon } from './icons';
import { supabase } from '../supabaseClient'; // Ensure this path is correct

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(''); // Now empty by default
  const [password, setPassword] = useState(''); // Now empty by default

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    setLoading(true);
    
    // Real Supabase Authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      onLogin();
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Check your email for the confirmation link!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen text-white font-sans antialiased flex items-center justify-center p-4 animate-fade-in-down">
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gray-900/60 backdrop-blur-lg border border-lime-400/20 rounded-3xl shadow-2xl shadow-lime-500/10 p-12">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white tracking-wide">Money Buddy</h1>
            <p className="text-gray-400 mt-2 text-lg">Your Production Wealth Manager</p>
          </div>

          <div className="space-y-6">
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold py-4 rounded-xl shadow-lg shadow-lime-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
            
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full bg-transparent border border-gray-700 hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition-all"
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
