import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const MembersTab = () => {
  const { group, id, refreshGroup } = useOutletContext<any>();
  const [newUserId, setNewUserId] = useState('');
  const [joinedAt, setJoinedAt] = useState('');
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const activeMembers = group.memberships.filter((m: any) => !m.left_at);
  const pastMembers = group.memberships.filter((m: any) => m.left_at);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await api(`/api/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/api/groups/${id}/members`, {
        method: 'POST',
        body: { userId: parseInt(newUserId), joined_at: joinedAt }
      });
      setNewUserId('');
      setJoinedAt('');
      refreshGroup();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm('Are you sure you want to remove this member? This does not touch past expenses.')) return;
    try {
      await api(`/api/groups/${id}/members/${userId}`, {
        method: 'PATCH'
      });
      refreshGroup();
    } catch (err: any) {
      alert(err.message);
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
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-[48px]">
      <div>
        <h2 className="text-[32px] font-sans font-bold text-white tracking-tight mb-6">Current Members</h2>
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-[16px]">
          {activeMembers.map((m: any) => (
            <motion.div variants={itemVariants} key={m.id}>
              <Card padding="md" variant="glass" className="flex justify-between items-center group">
                <div>
                  <p className="text-[24px] font-sans font-bold text-white tracking-tight leading-[1.3]">{m.user.name}</p>
                  <p className="text-[14px] font-sans text-[rgba(255,255,255,0.5)] mt-1">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleRemoveMember(m.user_id)}
                  className="text-[14px] font-sans font-semibold text-[#FF4A00] opacity-0 group-hover:opacity-100 transition-opacity hover:underline cursor-pointer bg-[rgba(255,74,0,0.1)] px-4 py-2 rounded-full"
                >
                  Remove
                </button>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {pastMembers.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="text-[24px] font-sans font-bold text-[rgba(255,255,255,0.7)] tracking-tight mb-6">Past Members</h2>
          <div className="space-y-[16px] opacity-60 grayscale">
            {pastMembers.map((m: any) => (
              <Card key={m.id} padding="md" variant="solid">
                <p className="text-[20px] font-sans font-bold text-[rgba(255,255,255,0.7)] tracking-tight leading-[1.3]">{m.user.name}</p>
                <div className="text-[13px] font-sans text-[rgba(255,255,255,0.5)] mt-2">
                  <span className="block">Joined {new Date(m.joined_at).toLocaleDateString()}</span>
                  <span className="block line-through text-[#FF4A00]">Left {new Date(m.left_at).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card padding="lg" variant="solid" className="border border-[rgba(255,255,255,0.1)]">
          <h3 className="text-[24px] font-sans font-bold text-white tracking-tight mb-6">Add Member</h3>
          <form onSubmit={handleAddMember} className="flex flex-wrap gap-[16px] items-end relative">
            <div className="relative flex-1 min-w-[200px]">
              <label className="block font-sans font-semibold text-[rgba(255,255,255,0.5)] mb-2 text-[14px]">Search User</label>
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                  setShowDropdown(true);
                }}
                placeholder="Name or email..."
                className="w-full border border-[rgba(255,255,255,0.2)] rounded-[12px] p-4 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white transition-colors"
              />
              <AnimatePresence>
                {showDropdown && searchResults.length > 0 && (
                  <motion.ul 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 mt-2 w-full bg-[#1A1A1D] shadow-[0_8px_32px_rgba(0,0,0,0.8)] max-h-60 rounded-[16px] py-2 overflow-auto font-sans border border-[rgba(255,255,255,0.1)]"
                  >
                    {searchResults.map(u => (
                      <li 
                        key={u.id} 
                        className="cursor-pointer select-none relative py-3 px-4 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                        onClick={() => {
                          setNewUserId(u.id.toString());
                          setSearchQuery(u.name);
                          setShowDropdown(false);
                        }}
                      >
                        <div className="font-semibold text-[16px] text-white">{u.name}</div>
                        <div className="text-[14px] text-[rgba(255,255,255,0.5)]">{u.email}</div>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
            <div className="min-w-[160px]">
              <label className="block font-sans font-semibold text-[rgba(255,255,255,0.5)] mb-2 text-[14px]">Joined At</label>
              <input
                type="date"
                required
                value={joinedAt}
                onChange={e => setJoinedAt(e.target.value)}
                className="w-full border border-[rgba(255,255,255,0.2)] rounded-[12px] p-4 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white [color-scheme:dark] transition-colors"
              />
            </div>
            <Button type="submit" variant="primary" className="mb-[2px] h-[56px]" disabled={!newUserId}>
              Add
            </Button>
          </form>
          {error && <p className="text-[#FF4A00] mt-4 text-[14px] font-sans bg-[rgba(255,74,0,0.1)] p-3 rounded-lg">{error}</p>}
        </Card>
      </motion.div>
    </div>
  );
};
