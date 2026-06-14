import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import KharchwiseLogo from './KharchwiseLogo';
import { Button } from './ui/Button';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-max min-w-[320px] max-w-[800px]">
        <motion.nav 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
          className="bg-[rgba(7,7,9,0.5)] backdrop-blur-3xl border border-[rgba(60,227,112,0.1)] rounded-full pl-5 pr-3 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(60,227,112,0.1),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_0_1px_rgba(255,255,255,0.02)] flex items-center justify-between gap-12"
        >
          <Link to="/groups" className="flex items-center no-underline hover:opacity-80 transition-opacity">
            <KharchwiseLogo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/groups" className="text-[rgba(255,255,255,0.8)] font-sans font-semibold text-[14px] hover:text-[#3CE370] transition-colors no-underline">
                  Home
                </Link>
                <div className="w-[1px] h-[14px] bg-[rgba(255,255,255,0.2)] mx-1"></div>
                <Link to="/analytics" className="text-[rgba(255,255,255,0.8)] font-sans font-semibold text-[14px] hover:text-[#3CE370] transition-colors no-underline">
                  Analytics
                </Link>
                <div className="w-[1px] h-[14px] bg-[rgba(255,255,255,0.2)] mx-1"></div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="!px-4 !py-2 !text-[14px] text-[rgba(255,255,255,0.6)] hover:text-[#FF4A00] hover:bg-[#FF4A00]/10 rounded-full"
                >
                  <LogOut className="h-[14px] w-[14px] mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" className="bg-[#3CE370] shadow-[0_4px_16px_rgba(60,227,112,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_6px_24px_rgba(60,227,112,0.3),inset_0_1px_0_rgba(255,255,255,0.6)] rounded-full px-6 py-2.5 font-sans font-semibold text-[14px] text-[#070709] hover:bg-[#32c962] transition-all no-underline active:scale-95">
                Log in
              </Link>
            )}
          </div>
        </motion.nav>
      </div>

      {user && (
        <div className="fixed top-6 right-6 lg:right-12 z-50">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
            className="flex items-center gap-3 bg-[rgba(7,7,9,0.5)] backdrop-blur-3xl border border-[rgba(255,255,255,0.08)] rounded-full p-1.5 pr-4 shadow-[0_16px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)]"
          >
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3CE370&color=070709&bold=true`} 
              alt={user.name} 
              className="w-8 h-8 rounded-full"
            />
            <span className="text-[rgba(255,255,255,0.9)] font-sans font-semibold text-[14px] tracking-wide">{user.name}</span>
          </motion.div>
        </div>
      )}
    </>
  );
};
