import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }
    if (data.user) onLogin();
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert('Check your email for the confirmation link!');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* THIS SECTION BELOW RESTORES THE SHADING, BLUR, AND BOX UI */}
        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          
          <img src="/monkey.png" alt="Money Buddy Logo" className="w-32 h-32 mx-auto mb-6 object-contain" />
          
          <h1 className="text-4xl font-bold text-white mb-2">Money Buddy</h1>
          <p className="text-gray-200 mb-8 opacity-80">Your Production Wealth Manager</p>
          
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
            
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-lime-500 text-black font-bold py-3 rounded-xl hover:bg-lime-400 transition-all shadow-lg active:scale-95"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            
            <button
              onClick={handleSignUp}
              className="w-full text-gray-200 hover:text-white text-sm transition-colors mt-2"
            >
              Don't have an account? Create one
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
