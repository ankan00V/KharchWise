import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

import KharchwiseLogo from '../components/KharchwiseLogo';

type TabType = 'signin' | 'demo';

export const Login = () => {
  const [activeTab, setActiveTab] = useState<TabType>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const demoAccounts = [
    { name: 'Aisha', email: 'aisha@example.com', role: 'Frequent Traveler' },
    { name: 'Rohan', email: 'rohan@example.com', role: 'Group Organizer' },
    { name: 'Priya', email: 'priya@example.com', role: 'Budget Tracker' },
    { name: 'Meera', email: 'meera@example.com', role: 'Event Planner' },
    { name: 'Sam', email: 'sam@example.com', role: 'Casual User' },
  ];

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: { email: demoEmail, password: 'demo123' }
      });
      
      login(data.token, data.user);
      navigate('/groups');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      
      login(data.token, data.user);
      navigate('/groups');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      
      {/* Animated background ambient glows */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1000px] pointer-events-none -z-10"
        style={{ background: 'radial-gradient(circle, rgba(60,227,112,0.04) 0%, rgba(60,227,112,0.01) 40%, rgba(7,7,9,0) 70%)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        className="absolute top-1/4 right-1/4 w-[800px] h-[800px] pointer-events-none -z-10 float-animation"
        style={{
          background: 'radial-gradient(circle, rgba(178,141,255,0.03) 0%, rgba(178,141,255,0.01) 40%, rgba(7,7,9,0) 70%)'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        className="max-w-lg w-full"
      >
        <div className="relative group/card w-full">
          {/* Animated gradient border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-white/15 to-transparent rounded-[24px] opacity-100 group-hover/card:opacity-100 transition duration-500" />
          
          <div className="relative bg-[#0A0A0A]/80 backdrop-blur-3xl rounded-[24px] p-8 sm:p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden">
            
            {/* Subtle inner radial glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[100px] bg-[#3CE370]/10 blur-[50px] pointer-events-none" />

            <div className="flex flex-col items-center relative z-10">
              <KharchwiseLogo size="lg" />
              <div className="mt-6 text-center space-y-2">
                <h2 className="text-[28px] font-sans font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight">
                  Welcome back
                </h2>
                <p className="text-[14px] font-sans text-[#888888]">
                  {activeTab === 'signin' 
                    ? 'Enter your credentials to continue' 
                    : 'Explore with a demo account'}
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mt-8 relative z-10">
              <div className="flex gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-[14px] backdrop-blur-sm">
                <button
                  onClick={() => setActiveTab('signin')}
                  className={`flex-1 relative py-2.5 px-4 rounded-[10px] font-sans font-medium text-[14px] transition-all duration-300 ${
                    activeTab === 'signin'
                      ? 'text-white'
                      : 'text-[#888888] hover:text-white/80'
                  }`}
                >
                  {activeTab === 'signin' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white/[0.08] border border-white/10 rounded-[10px] shadow-lg"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">Sign In</span>
                </button>
                <button
                  onClick={() => setActiveTab('demo')}
                  className={`flex-1 relative py-2.5 px-4 rounded-[10px] font-sans font-medium text-[14px] transition-all duration-300 ${
                    activeTab === 'demo'
                      ? 'text-white'
                      : 'text-[#888888] hover:text-white/80'
                  }`}
                >
                  {activeTab === 'demo' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white/[0.08] border border-white/10 rounded-[10px] shadow-lg"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">Try Demo</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-8 relative z-10">
              <AnimatePresence mode="wait">
                {activeTab === 'signin' ? (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <form className="space-y-5" onSubmit={handleSubmit}>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] px-4 py-3 rounded-[12px] font-sans flex items-center gap-3 shadow-inner"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {error}
                        </motion.div>
                      )}
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[13px] font-medium text-[#888888] mb-1.5 ml-1">Email address</label>
                          <input
                            type="email"
                            required
                            className="w-full bg-[#111111] border border-white/5 rounded-[12px] px-4 py-3.5 font-sans text-[15px] text-white placeholder-white/20 focus:outline-none focus:border-[#3CE370]/50 focus:ring-1 focus:ring-[#3CE370]/50 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-[#888888] mb-1.5 ml-1">Password</label>
                          <input
                            type="password"
                            required
                            className="w-full bg-[#111111] border border-white/5 rounded-[12px] px-4 py-3.5 font-sans text-[15px] text-white placeholder-white/20 focus:outline-none focus:border-[#3CE370]/50 focus:ring-1 focus:ring-[#3CE370]/50 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="group relative w-full flex items-center justify-center gap-2 bg-white text-black py-[14px] px-4 rounded-[12px] font-sans font-semibold text-[15px] transition-all duration-300 hover:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                        >
                          <div className="absolute inset-0 w-full h-full -translate-x-full group-hover:animate-[shimmer-sweep_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
                          {loading ? (
                            <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          ) : (
                            <>
                              Sign In
                              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="demo"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-5">
                      {/* Info Banner */}
                      <div className="bg-gradient-to-br from-[#3CE370]/10 to-[#B28DFF]/10 border border-white/10 rounded-[14px] p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#3CE370]/20 flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-5 h-5 text-[#3CE370]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[15px] font-semibold text-white mb-1">Try Before You Sign Up</h3>
                            <p className="text-[13px] text-[#A1A1AA] leading-relaxed">
                              Explore Kharchwise with pre-configured demo accounts. Experience real expense tracking, group management, and settlements.
                            </p>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] px-4 py-3 rounded-[12px] font-sans flex items-center gap-3 shadow-inner"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {error}
                        </motion.div>
                      )}

                      {/* Demo Accounts Grid */}
                      <div className="space-y-3">
                        {demoAccounts.map((acc, index) => (
                          <motion.button
                            key={acc.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            type="button"
                            onClick={() => handleDemoLogin(acc.email)}
                            disabled={loading}
                            className="group w-full flex items-center gap-4 p-4 rounded-[12px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3CE370]/20 to-[#B28DFF]/20 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                              <span className="text-[18px] font-bold text-white">
                                {acc.name.charAt(0)}
                              </span>
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 text-left">
                              <div className="text-[15px] font-semibold text-white group-hover:text-[#3CE370] transition-colors">
                                {acc.name}
                              </div>
                              <div className="text-[13px] text-[#888888] mt-0.5">
                                {acc.role}
                              </div>
                            </div>

                            {/* Arrow */}
                            <svg 
                              className="w-5 h-5 text-[#888888] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-[#888888] text-[14px] font-sans relative z-10">
              New to Kharchwise?{' '}
              <button 
                onClick={() => navigate('/signup')} 
                className="text-white hover:text-[#3CE370] transition-colors font-medium ml-1 outline-none focus-visible:underline"
              >
                Create an account
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


