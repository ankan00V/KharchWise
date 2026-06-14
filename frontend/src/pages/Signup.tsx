import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

import KharchwiseLogo from '../components/KharchwiseLogo';

export const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Create the user
      await api('/api/auth/register', {
        method: 'POST',
        body: { name, email, password }
      });
      
      // Immediately log them in
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      
      login(data.token, data.user);
      navigate('/groups');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
        className="max-w-md w-full"
      >
        <div className="relative group/card w-full max-w-md">
          {/* Animated gradient border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-white/15 to-transparent rounded-[24px] opacity-100 group-hover/card:opacity-100 transition duration-500" />
          
          <div className="relative bg-[#0A0A0A]/80 backdrop-blur-3xl rounded-[24px] p-10 sm:p-12 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden">
            
            {/* Subtle inner radial glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[100px] bg-[#3CE370]/10 blur-[50px] pointer-events-none" />

            <div className="flex flex-col items-center relative z-10">
              <KharchwiseLogo size="lg" />
              <div className="mt-8 text-center space-y-2">
                <h2 className="text-[28px] font-sans font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight">
                  Create an account
                </h2>
                <p className="text-[14px] font-sans text-[#888888]">
                  Join Kharchwise to get started
                </p>
              </div>
            </div>

            <form className="mt-10 space-y-5 relative z-10" onSubmit={handleSubmit}>
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
                  <label className="block text-[13px] font-medium text-[#888888] mb-1.5 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#111111] border border-white/5 rounded-[12px] px-4 py-3.5 font-sans text-[15px] text-white placeholder-white/20 focus:outline-none focus:border-[#3CE370]/50 focus:ring-1 focus:ring-[#3CE370]/50 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
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
                    minLength={6}
                    className="w-full bg-[#111111] border border-white/5 rounded-[12px] px-4 py-3.5 font-sans text-[15px] text-white placeholder-white/20 focus:outline-none focus:border-[#3CE370]/50 focus:ring-1 focus:ring-[#3CE370]/50 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  
                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="mt-3 ml-1">
                      <div className="flex gap-1 mb-1.5 h-1">
                        {[1, 2, 3, 4].map((level) => {
                          let strength = 0;
                          if (password.length >= 6) strength += 1;
                          if (password.length >= 8) strength += 1;
                          if (/[A-Z]/.test(password) || /[0-9]/.test(password)) strength += 1;
                          if (/[^A-Za-z0-9]/.test(password) && password.length >= 8) strength += 1;
                          const activeStrength = Math.min(4, Math.max(1, strength));
                          
                          let bgColor = 'bg-white/10';
                          if (level <= activeStrength) {
                            if (activeStrength <= 1) bgColor = 'bg-[#FF4A00] shadow-[0_0_8px_rgba(255,74,0,0.4)]';
                            else if (activeStrength === 2) bgColor = 'bg-[#FFB000] shadow-[0_0_8px_rgba(255,176,0,0.4)]';
                            else if (activeStrength === 3) bgColor = 'bg-[#3CE370] shadow-[0_0_8px_rgba(60,227,112,0.4)]';
                            else bgColor = 'bg-[#15A744] shadow-[0_0_8px_rgba(21,167,68,0.4)]';
                          }
                          
                          return (
                            <div key={level} className={`flex-1 rounded-full transition-all duration-300 ${bgColor}`} />
                          );
                        })}
                      </div>
                      <div className="text-[11px] font-sans text-[#888888]">
                        Use 8+ chars with a mix of letters, numbers & symbols.
                      </div>
                    </div>
                  )}
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
                      Create Account
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="text-center mt-8 text-[#888888] text-[14px] font-sans relative z-10">
              Already have an account?{' '}
              <button 
                onClick={() => navigate('/login')} 
                className="text-white hover:text-[#3CE370] transition-colors font-medium ml-1 outline-none focus-visible:underline"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
