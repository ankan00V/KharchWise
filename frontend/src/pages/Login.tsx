import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

import KharchwiseLogo from '../components/KharchwiseLogo';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
        className="max-w-md w-full"
      >
        <Card variant="glass" padding="lg" className="space-y-8 border border-[rgba(255,255,255,0.1)] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center">
            <KharchwiseLogo size="lg" />
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#FF4A00]/10 border border-[#FF4A00]/30 text-[#FF4A00] text-[14px] p-4 rounded-[12px] font-sans"
              >
                {error}
              </motion.div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-2 text-[14px]">Email address</label>
                <input
                  type="email"
                  required
                  className="w-full border border-[rgba(255,255,255,0.2)] rounded-[16px] p-4 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] focus:ring-2 focus:ring-[#3CE370]/30 bg-[#121214] text-white transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:border-[rgba(255,255,255,0.3)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-2 text-[14px]">Password</label>
                <input
                  type="password"
                  required
                  className="w-full border border-[rgba(255,255,255,0.2)] rounded-[16px] p-4 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] focus:ring-2 focus:ring-[#3CE370]/30 bg-[#121214] text-white transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:border-[rgba(255,255,255,0.3)]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full py-[16px] text-[18px]"
                isLoading={loading}
              >
                Log in
              </Button>
            </div>
          </form>
          <div className="text-center mt-6">
          <div className="text-center mt-6 text-[rgba(255,255,255,0.5)] text-[14px] font-sans">
            Only pre-registered users can log in.
          </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
