// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function LoginForm({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) onAuthSuccess(data.user);
    } catch (err) {
      setLoginError(err.message || 'Invalid login details');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center font-sans px-4">
      <div className="bg-white p-8 rounded-3xl border border-[#e8e8ed] shadow-sm max-w-sm w-full">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-[#1d1d1f]">Logistics Hub</h2>
          <p className="text-xs text-[#86868b] mt-1">Sign in with your corporate account</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1 px-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#d2d2d7] focus:bg-white px-4 py-2.5 rounded-xl text-xs outline-none transition-all text-[#1d1d1f]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1 px-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#d2d2d7] focus:bg-white px-4 py-2.5 rounded-xl text-xs outline-none transition-all text-[#1d1d1f]"
            />
          </div>

          {loginError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-2 rounded-xl text-[11px] font-medium leading-normal">
              {loginError}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loginLoading}
            className="w-full bg-[#0071e3] hover:bg-[#0077ed] disabled:bg-[#0071e3]/50 text-white font-medium py-2.5 rounded-xl text-xs transition-all tracking-tight shadow-sm mt-2"
          >
            {loginLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}