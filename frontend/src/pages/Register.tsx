import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api';

import KharchwiseLogo from '../components/KharchwiseLogo';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: { name, email, password }
      });
      
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none -z-10"
           style={{ background: 'radial-gradient(circle, rgba(60,227,112,0.06) 0%, rgba(7,7,9,0) 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="max-w-md w-full"
      >
        <Card variant="glass" padding="lg" className="space-y-8 border border-[rgba(255,255,255,0.1)] shadow-2xl">
          <div className="flex flex-col items-center">
            <KharchwiseLogo size="lg" />
            <h2 className="mt-6 text-center text-[24px] font-sans font-bold text-white tracking-tight">
              Introduce yourself
            </h2>
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
                <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-2 text-[14px]">Hi there! My name is</label>
                <input
                  type="text"
                  required
                  className="w-full border border-[rgba(255,255,255,0.2)] rounded-[16px] p-4 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white transition-colors shadow-inner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-2 text-[14px]">Here's my email address:</label>
                <input
                  type="email"
                  required
                  className="w-full border border-[rgba(255,255,255,0.2)] rounded-[16px] p-4 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white transition-colors shadow-inner"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-2 text-[14px]">And here's my password:</label>
                <input
                  type="password"
                  required
                  className="w-full border border-[rgba(255,255,255,0.2)] rounded-[16px] p-4 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white transition-colors shadow-inner"
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
                disabled={loading}
              >
                {loading ? 'Signing up...' : 'Sign me up!'}
              </Button>
            </div>
          </form>
          <div className="text-center mt-6">
            <Link to="/login" className="text-[rgba(255,255,255,0.5)] hover:text-white text-[16px] font-sans transition-all hover:underline">
              Already have an account?
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
