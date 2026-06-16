import { useParams, Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { api } from '../api';

export const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const { data: group, error, mutate: refreshGroup } = useSWR(id ? `/api/groups/${id}` : null, api);

  if (!group && !error) return (
    <div className="w-full relative">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] pointer-events-none -z-10 blur-[120px] opacity-20"
           style={{ background: 'radial-gradient(circle, rgba(60,227,112,0.15) 0%, rgba(7,7,9,0) 70%)' }} />
      <div className="mb-[48px]">
        <div className="skeleton h-[20px] w-[140px] rounded-[8px] mb-6"></div>
        <div className="skeleton h-[64px] w-[400px] rounded-[16px]"></div>
      </div>
      <div className="mb-[48px]">
        <div className="skeleton h-[60px] w-[500px] rounded-[24px]"></div>
      </div>
    </div>
  );
  if (error) return <div className="p-8 flex justify-center font-sans text-red-500 font-semibold">Error loading group</div>;

  const tabs = [
    { name: 'Expenses', path: 'expenses' },
    { name: 'Balances', path: 'balances' },
    { name: 'Members', path: 'members' },
    { name: 'Import Data', path: 'import' }
  ];

  return (
    <div className="w-full relative">
      {/* Ambient gradient */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] pointer-events-none -z-10 blur-[120px] opacity-20"
           style={{ background: 'radial-gradient(circle, rgba(60,227,112,0.15) 0%, rgba(7,7,9,0) 70%)' }} />
      
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-[48px]"
      >
        <Link to="/groups" className="inline-flex items-center text-[rgba(255,255,255,0.5)] hover:text-[#3CE370] font-sans font-semibold mb-6 transition-all duration-300 group">
          <svg className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Groups
        </Link>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[48px] md:text-[64px] font-sans font-bold text-white tracking-tight leading-[1]"
        >
          {group.name}
        </motion.h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-[48px]"
      >
        <nav className="inline-flex bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-[24px] p-2 space-x-2 shadow-[0_8px_32px_rgba(0,0,0,0.3)]" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = location.pathname.includes(tab.path);
            return (
              <Link
                key={tab.name}
                to={tab.path}
                className="relative px-6 py-3 rounded-[16px] text-[16px] font-sans font-semibold transition-all duration-300 outline-none group"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.12)] rounded-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-[rgba(255,255,255,0.5)] group-hover:text-[rgba(255,255,255,0.9)]'}`}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </motion.div>

      <div className="pb-24">
        <Outlet context={{ group, id, refreshGroup }} />
      </div>
    </div>
  );
};
