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
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-max min-w-[280px]">
        <motion.nav 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
          className={`h-[52px] bg-[#0A0A0C]/60 backdrop-blur-[40px] saturate-[1.2] border border-white/[0.08] rounded-full shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.06)] flex items-center gap-8 ${user ? 'pl-5 pr-2 justify-between' : 'px-4 justify-center'}`}
        >
          {user && (
            <div className="flex items-center">
              <KharchwiseLogo size="sm" />
            </div>
          )}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/groups" className="text-[rgba(255,255,255,0.6)] font-sans font-medium text-[14px] hover:text-white transition-colors no-underline">
                  Home
                </Link>
                <div className="w-[1px] h-[12px] bg-[rgba(255,255,255,0.1)] mx-2"></div>
                <Link to="/analytics" className="text-[rgba(255,255,255,0.6)] font-sans font-medium text-[14px] hover:text-white transition-colors no-underline">
                  Analytics
                </Link>
                <div className="w-[1px] h-[12px] bg-[rgba(255,255,255,0.1)] mx-2"></div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="!px-3 !py-1.5 !text-[14px] font-medium text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-white/5 rounded-full transition-all"
                >
                  <LogOut className="h-[14px] w-[14px] mr-1.5" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[rgba(255,255,255,0.6)] font-sans font-medium text-[14px] hover:text-white transition-colors no-underline px-2">
                  Log in
                </Link>
                <Link to="/signup" className="bg-white hover:bg-[#EAEAEA] text-[#0A0A0C] px-5 py-1.5 rounded-full font-sans font-bold text-[13px] transition-all duration-300 no-underline active:scale-95 shadow-[0_4px_16px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.15)] flex items-center justify-center h-[36px]">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </motion.nav>
      </div>

      {user && (
        <div className="fixed top-6 right-6 lg:right-12 z-50">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.2 }}
            className="flex items-center gap-3 bg-[#0A0A0C]/60 backdrop-blur-[40px] saturate-[1.2] border border-white/[0.08] rounded-full p-1.5 pr-4 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.06)]"
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

      {!user && (
        <div className="fixed top-8 left-8 lg:left-12 z-50">
          <div className="flex items-center">
            <KharchwiseLogo size="lg" />
          </div>
        </div>
      )}
    </>
  );
};
