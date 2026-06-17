import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { api } from '../api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Groups = () => {
  const { data: groups = [], isLoading: loading, mutate: fetchGroups } = useSWR<any[]>('/api/groups', api);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    setCreating(true);
    try {
      await api('/api/groups', {
        method: 'POST',
        body: { name: newGroupName }
      });
      setShowCreateModal(false);
      setNewGroupName('');
      fetchGroups();
    } catch (err) {
      console.error('Error creating group:', err);
      alert('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-[48px]">
          <div className="skeleton h-[80px] w-[400px] rounded-[16px] mb-6"></div>
          <div className="skeleton h-[24px] w-[500px] rounded-[12px] mb-8"></div>
          <div className="skeleton h-[48px] w-[180px] rounded-[16px]"></div>
        </div>
        <div className="space-y-[64px]">
          <div>
            <div className="skeleton h-[32px] w-[120px] rounded-[12px] mb-8"></div>
            <div className="grid gap-[24px] sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[rgba(255,255,255,0.03)] backdrop-blur-2xl border border-[rgba(255,255,255,0.08)] rounded-[24px] p-8 h-[200px]">
                  <div className="skeleton h-[32px] w-[70%] rounded-[12px] mb-4"></div>
                  <div className="skeleton h-[20px] w-[50%] rounded-[12px] mb-8"></div>
                  <div className="skeleton h-[14px] w-[40%] rounded-[12px]"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeGroups = groups.filter(g => !g.membership.left_at);
  const pastGroups = groups.filter(g => g.membership.left_at);

  return (
    <div className="w-full relative">
      {/* Ambient background gradient */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] pointer-events-none -z-10 opacity-30"
           style={{ background: 'radial-gradient(circle, rgba(60,227,112,0.06) 0%, rgba(60,227,112,0.01) 40%, rgba(7,7,9,0) 70%)' }} />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-[40px] gap-6"
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[56px] sm:text-[72px] font-sans font-bold tracking-tighter leading-[1] mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-[rgba(255,255,255,0.4)]"
          >
            Your Groups
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[rgba(255,255,255,0.5)] font-sans text-[18px] max-w-lg"
          >
            Manage your shared expenses and see who owes what.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full md:w-auto"
        >
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto !px-8 !py-4 !text-[16px] !rounded-[100px] shadow-[0_8px_32px_rgba(60,227,112,0.25)] hover:shadow-[0_12px_48px_rgba(60,227,112,0.35)] font-bold tracking-wide relative group overflow-hidden"
          >
            <span className="relative z-10">Start a new group</span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-[shimmer-sweep_2s_infinite] skew-x-[-20deg]" />
          </Button>
        </motion.div>
      </motion.div>

      <div className="space-y-[64px]">
        <div>
          <h2 className="text-[32px] font-sans font-bold text-white tracking-tight mb-8">
            Active
          </h2>
          {activeGroups.length === 0 ? (
            <Card variant="solid" className="text-center font-sans font-semibold text-[rgba(255,255,255,0.5)]">
              You don't belong to any active groups.
            </Card>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-3">
              {activeGroups.map((group) => (
                <motion.div
                  variants={itemVariants}
                  key={group.id}
                  className="w-full"
                >
                  <Link
                    to={`/groups/${group.id}`}
                    className="block focus:outline-none no-underline group"
                  >
                    <div className="w-full bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.03)] rounded-[24px] p-5 flex flex-col sm:flex-row sm:items-center gap-5 hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all duration-300 relative overflow-hidden cursor-pointer shadow-sm hover:shadow-xl">
                      
                      {/* Subtle gradient overlay on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                           style={{ background: 'radial-gradient(circle at top right, rgba(60,227,112,0.05) 0%, transparent 60%)' }} />

                      {/* Left: Icon & Name */}
                      <div className="flex items-center gap-5 flex-1 min-w-0 relative z-10">
                        <div className="w-[60px] h-[60px] shrink-0 rounded-[18px] bg-[#121214] border border-[rgba(255,255,255,0.05)] flex items-center justify-center text-[28px] shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                          {group.name.toLowerCase().includes('trip') || group.name.toLowerCase().includes('goa') ? '🌴' : 
                           group.name.toLowerCase().includes('flat') || group.name.toLowerCase().includes('home') ? '🏠' : 
                           group.name.toLowerCase().includes('dinner') || group.name.toLowerCase().includes('food') ? '🍕' : '👥'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[20px] font-sans font-bold text-white tracking-tight truncate group-hover:text-[#3CE370] transition-colors duration-300 mb-1.5">
                            {group.name}
                          </h3>
                          <div className="flex items-center gap-3 text-[13px] font-sans text-[rgba(255,255,255,0.4)]">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#3CE370] shadow-[0_0_8px_rgba(60,227,112,0.6)]"></span>
                              Active
                            </span>
                            <span className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.2)]"></span>
                            <span>Joined {new Date(group.membership.joined_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Dummy Stats & Arrow */}
                      <div className="flex items-center justify-between sm:justify-end gap-8 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-[rgba(255,255,255,0.05)] relative z-10">
                        
                        <div className="flex flex-col items-start sm:items-end">
                          <span className="text-[12px] font-bold text-[rgba(255,255,255,0.4)] mb-1 uppercase tracking-widest">Your Balance</span>
                          {group.netBalance === 0 ? (
                            <span className="text-[18px] font-bold text-white tracking-tight">Settled</span>
                          ) : group.netBalance > 0 ? (
                            <span className="text-[18px] font-bold text-[#3CE370] tracking-tight">+ ₹{group.netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          ) : (
                            <span className="text-[18px] font-bold text-[#FF5F56] tracking-tight">- ₹{Math.abs(group.netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          )}
                        </div>

                        <div className="w-10 h-10 shrink-0 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center text-[rgba(255,255,255,0.4)] group-hover:text-[#070709] group-hover:bg-[#3CE370] group-hover:border-[#3CE370] hover:scale-110 active:scale-95 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                          <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      </div>
                      
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {pastGroups.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h2 className="text-[32px] font-sans font-bold text-[rgba(255,255,255,0.7)] tracking-tight mb-8">
              Past
            </h2>
            <div className="grid gap-[24px] sm:grid-cols-2 lg:grid-cols-3 opacity-60 grayscale">
              {pastGroups.map((group) => (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="block focus:outline-none no-underline h-full"
                >
                  <Card padding="md" variant="solid" className="h-full">
                    <h3 className="text-[24px] font-sans font-bold text-white tracking-tight leading-[1.2]">{group.name}</h3>
                    <div className="text-[13px] font-sans text-[rgba(255,255,255,0.5)] mt-4">
                      <span className="block">Joined {new Date(group.membership.joined_at).toLocaleDateString()}</span>
                      <span className="block line-through text-[#FF4A00]">Left {new Date(group.membership.left_at!).toLocaleDateString()}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#070709]/80 flex items-center justify-center z-50 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full max-w-md"
            >
              <Card variant="glass">
                <h2 className="text-[40px] font-sans font-bold text-white tracking-tight leading-[1] mb-6">Create Group</h2>
                <form onSubmit={handleCreateGroup}>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-2 text-[14px]">Group Name</label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full border border-[rgba(255,255,255,0.2)] rounded-[12px] p-4 font-sans text-[18px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white"
                        placeholder="e.g. Goa Trip"
                      />
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end space-x-3">
                    <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={creating}>
                      Create
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
