import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api';

export const BalancesTab = () => {
  const { id, group } = useOutletContext<any>();
  const { user } = useAuth();
  
  const { data: groupData, mutate: mutateGroupBalances } = useSWR(id ? `/api/groups/${id}/balances` : null, api);
  const { data: myData, mutate: mutateMySummary } = useSWR(id ? `/api/groups/${id}/balances/me` : null, api);
  const { data: breakdownData, mutate: mutateMyBreakdown } = useSWR(id ? `/api/groups/${id}/balances/me/breakdown` : null, api);
  const { data: expensesData, mutate: mutateExpenses } = useSWR(id ? `/api/groups/${id}/expenses` : null, api);

  const fetchBalances = () => {
    mutateGroupBalances();
    mutateMySummary();
    mutateMyBreakdown();
    mutateExpenses();
  };

  const groupBalances = groupData?.balances || [];
  const mySummary = myData || null;
  const myBreakdown = breakdownData?.breakdown || [];
  const loading = !groupData || !myData || !breakdownData || !expensesData;

  const quarantinedCount = useMemo(() => {
    if (!expensesData) return 0;
    let qCount = 0;
    for (const exp of expensesData) {
      const isQuarantined = !exp.paid_by_id || exp.deleted_at || (exp.anomalies && exp.anomalies.some((a: any) => a.status === 'PENDING_APPROVAL'));
      if (isQuarantined) {
        const involvesMe = exp.paid_by_id === user?.id || exp.splits?.some((s: any) => s.user_id === user?.id);
        if (involvesMe) qCount++;
      }
    }
    return qCount;
  }, [expensesData, user?.id]);

  const [expandedBreakdown, setExpandedBreakdown] = useState(false);

  // Settlement state
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  const handleSettleUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/api/groups/${id}/settlements`, {
        method: 'POST',
        body: {
          toUserId: parseInt(settleTo),
          amount: parseFloat(settleAmount),
          date: new Date().toISOString()
        }
      });
      setShowSettleModal(false);
      setSettleTo('');
      setSettleAmount('');
      fetchBalances();
    } catch (err) {
      console.error(err);
      alert('Failed to record settlement');
    }
  };

  const userMap = useMemo(() => {
    if (!group?.memberships) return {};
    return Object.fromEntries(group.memberships.map((m: any) => [m.user.id, m.user.name]));
  }, [group?.memberships]);

  if (loading) return (
    <div className="space-y-[48px]">
      <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-2xl border border-[rgba(255,255,255,0.08)] rounded-[32px] p-8 lg:p-12 text-center">
        <div className="skeleton h-[16px] w-[120px] rounded-[6px] mx-auto mb-8"></div>
        <div className="skeleton h-[80px] w-[280px] sm:w-[360px] rounded-[24px] mx-auto mb-4"></div>
        <div className="skeleton h-[24px] w-[180px] rounded-[8px] mx-auto mb-8"></div>
        <div className="flex justify-center gap-4 mt-8">
          <div className="skeleton h-[48px] w-[140px] rounded-[16px]"></div>
          <div className="skeleton h-[48px] w-[120px] rounded-[16px]"></div>
        </div>
      </div>
      <div>
        <div className="skeleton h-[24px] w-[150px] rounded-[8px] mb-6"></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map(i => (
            <div key={i} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] p-6 rounded-[24px] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="skeleton w-[48px] h-[48px] rounded-full"></div>
                <div>
                  <div className="skeleton h-[20px] w-[120px] rounded-[6px] mb-2"></div>
                  <div className="skeleton h-[14px] w-[80px] rounded-[4px]"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const myNet = mySummary ? mySummary.totalOwedToUser - mySummary.totalUserOwes : 0;
  let runningTotal = 0;

  return (
    <div className="space-y-[48px]">
      {quarantinedCount > 0 && (
        <Card variant="solid" padding="md" className="flex items-start border-[#FF4A00]/30 bg-[#FF4A00]/5">
          <p className="text-[16px] font-sans font-medium text-[rgba(255,255,255,0.9)]">
            <span className="font-bold text-[#FF4A00]">{quarantinedCount} expenses</span> involving you are quarantined due to anomalies. They are excluded from these balances.
          </p>
        </Card>
      )}

      {/* Hero Balance Section */}
      <Card className="text-center">
        <h2 className="text-[12px] font-sans font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-[1px] mb-6">Total Balance</h2>
        
        {myNet > 0 ? (
          <div className="text-[64px] sm:text-[80px] font-sans font-bold text-[#3CE370] tracking-tight leading-[1] mb-8">₹{Math.abs(myNet).toFixed(2)}<br/><span className="text-[20px] text-[rgba(255,255,255,0.7)] tracking-normal">You are owed</span></div>
        ) : myNet < 0 ? (
          <div className="text-[64px] sm:text-[80px] font-sans font-bold text-[#FF4A00] tracking-tight leading-[1] mb-8">₹{Math.abs(myNet).toFixed(2)}<br/><span className="text-[20px] text-[rgba(255,255,255,0.7)] tracking-normal">You owe</span></div>
        ) : (
          <div className="text-[48px] font-sans font-bold text-white tracking-tight leading-[1] mb-8">You are settled up</div>
        )}

        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={() => setExpandedBreakdown(!expandedBreakdown)}>
            {expandedBreakdown ? 'Hide Breakdown' : 'Show Math'}
          </Button>
          <Button variant="primary" onClick={() => setShowSettleModal(true)}>
            Settle Up
          </Button>
        </div>

        <AnimatePresence>
          {expandedBreakdown && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-[48px] text-left border-t border-[rgba(255,255,255,0.05)] pt-8 overflow-hidden"
            >
              <h3 className="text-[24px] font-sans font-bold text-white tracking-tight mb-6">Itemized Ledger Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full font-sans">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.1)]">
                      <th className="px-4 py-4 text-left text-[12px] font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-[0.5px]">Date</th>
                      <th className="px-4 py-4 text-left text-[12px] font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-[0.5px]">Description</th>
                      <th className="px-4 py-4 text-right text-[12px] font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-[0.5px]">Net Effect</th>
                      <th className="px-4 py-4 text-right text-[12px] font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-[0.5px]">Running Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myBreakdown.map((item) => {
                      runningTotal += item.netEffect;
                      return (
                        <tr key={item.id} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                          <td className="px-4 py-4 text-[14px] text-[rgba(255,255,255,0.7)]">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-[16px] text-white font-semibold">
                            {item.description}
                          </td>
                          <td className={`px-4 py-4 text-[16px] font-semibold text-right whitespace-nowrap ${item.netEffect >= 0 ? 'text-[#3CE370]' : 'text-[#FF4A00]'}`}>
                            {item.netEffect > 0 ? '+' : ''}{Number(item.netEffect).toFixed(2)}
                          </td>
                          <td className={`px-4 py-4 text-[16px] font-bold text-right whitespace-nowrap ${runningTotal >= 0 ? 'text-[#3CE370]' : 'text-[#FF4A00]'}`}>
                            {Number(runningTotal).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Group Balances */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-[32px] font-sans font-bold text-white tracking-tight mb-6">Who Owes Whom</h2>
        
        {groupBalances.length === 0 ? (
          <Card variant="solid" className="text-center text-[16px] text-[rgba(255,255,255,0.5)] font-sans font-medium">
            No outstanding balances in the group.
          </Card>
        ) : (
          <div className="grid gap-[24px] sm:grid-cols-2">
            {groupBalances.map((b, i) => {
              const isMeOwes = b.fromUserId === user?.id;
              const isOwedToMe = b.toUserId === user?.id;
              
              return (
                <Card key={i} padding="md" variant={isMeOwes || isOwedToMe ? "glass" : "solid"} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-[16px] text-[rgba(255,255,255,0.7)] font-sans leading-[1.4] tracking-tight">
                    <span className={`font-semibold ${isMeOwes ? 'text-white' : ''}`}>
                      {isMeOwes ? 'You' : userMap[b.fromUserId] || `User ${b.fromUserId}`}
                    </span>
                    <span className="mx-2">owe</span>
                    <span className={`font-semibold ${isOwedToMe ? 'text-white' : ''}`}>
                      {isOwedToMe ? 'You' : userMap[b.toUserId] || `User ${b.toUserId}`}
                    </span>
                  </div>
                  <div className={`text-[24px] font-sans font-bold tracking-tight ${isOwedToMe ? 'text-[#3CE370]' : isMeOwes ? 'text-[#FF4A00]' : 'text-white'}`}>
                    ₹{Number(b.amount).toFixed(2)}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showSettleModal && (
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
              <Card>
                <h2 className="text-[32px] font-sans font-bold text-white tracking-tight leading-[1] mb-6">Settle Up</h2>
                <form onSubmit={handleSettleUp}>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-2 text-[14px]">Pay to</label>
                      <select
                        required
                        value={settleTo}
                        onChange={(e) => setSettleTo(e.target.value)}
                        className="w-full border border-[rgba(255,255,255,0.2)] rounded-[12px] p-4 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white"
                      >
                        <option value="">Select a member...</option>
                        {group.memberships.filter((m: any) => m.user.id !== user?.id).map((m: any) => (
                          <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-2 text-[14px]">Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={settleAmount}
                        onChange={(e) => setSettleAmount(e.target.value)}
                        className="w-full border border-[rgba(255,255,255,0.2)] rounded-[12px] p-4 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white"
                      />
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end space-x-3">
                    <Button type="button" variant="ghost" onClick={() => setShowSettleModal(false)}>Cancel</Button>
                    <Button type="submit" variant="primary">Record Payment</Button>
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
