import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ExpenseListItem } from '../../components/ui/ExpenseListItem';
import { api } from '../../api';

export const ExpensesTab = () => {
  const { id, group, refreshGroup } = useOutletContext<any>();
  const { user } = useAuth();
  
  const { data: expenses = [], isLoading: loading, mutate: fetchExpenses } = useSWR(id ? `/api/groups/${id}/expenses` : null, api);

  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Add Expense State
  const [showAddModal, setShowAddModal] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [payerId, setPayerId] = useState('');

  // Anomaly Resolution State
  const [selectedPayerIds, setSelectedPayerIds] = useState<Record<number, string>>({});

  const [splitType, setSplitType] = useState('EQUAL');
  const [splitValues, setSplitValues] = useState<Record<number, string>>({});

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !date || !payerId) return;

    const activeMembers = group.memberships.filter((m: any) => !m.left_at);
    
    const splits = activeMembers.map((m: any) => {
      let shareValue = 1;
      if (splitType !== 'EQUAL') {
        shareValue = parseFloat(splitValues[m.user.id] || '0');
      }
      return {
        user_id: m.user.id,
        share_value: shareValue
      };
    });

    try {
      await api(`/api/groups/${id}/expenses`, {
        method: 'POST',
        body: {
          description: desc,
          amount: parseFloat(amount),
          date: new Date(date).toISOString(),
          paid_by_id: parseInt(payerId),
          split_type: splitType,
          splits
        }
      });
      setShowAddModal(false);
      setDesc('');
      setAmount('');
      setDate('');
      setPayerId('');
      setSplitType('EQUAL');
      setSplitValues({});
      fetchExpenses();
    } catch (err: any) {
      console.error(err);
      alert('Error adding expense: ' + err.message);
    }
  };

  const handleResolveAnomaly = async (anomalyId: number, action: string, assignedPayerId?: string) => {
    try {
      await api(`/api/groups/${id}/anomalies/${anomalyId}/resolve`, {
        method: 'POST',
        body: { action, paid_by_id: assignedPayerId }
      });
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert('Error resolving anomaly');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  if (loading) return <div className="text-[rgba(255,255,255,0.5)] font-sans font-semibold py-8 flex justify-center">Loading expenses...</div>;

  return (
    <div className="space-y-[48px]">
      <div className="flex justify-between items-center bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] p-6 rounded-[24px]">
        <h2 className="text-[32px] font-sans font-bold text-white tracking-tight">Expenses</h2>
        <div className="flex space-x-2">
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            Add an expense
          </Button>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-[18px] text-[rgba(255,255,255,0.5)] font-sans font-semibold">
            No expenses recorded.
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-[rgba(255,255,255,0.05)]">
            {expenses.map((expense) => {
              const pendingAnomalies = expense.anomalies?.filter((a: any) => a.status === 'PENDING_APPROVAL') || [];
              const isMissingPayer = !expense.paid_by_id;
              const isSoftDeleted = !!expense.deleted_at;
              const isExpanded = expandedId === expense.id;

              return (
                <motion.div variants={itemVariants} key={expense.id} className={isSoftDeleted ? 'opacity-50' : ''}>
                  <ExpenseListItem 
                    expense={expense}
                    currentUserId={user?.id}
                    onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                  />

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-[rgba(255,255,255,0.02)] p-6 border-t border-[rgba(255,255,255,0.05)] overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[32px]">
                          <div>
                            <h4 className="font-sans font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-[0.5px] text-[12px] mb-4 border-b border-[rgba(255,255,255,0.1)] pb-2">Expense Details</h4>
                            {isSoftDeleted && (
                              <span className="inline-block bg-[rgba(255,74,0,0.2)] text-[#FF4A00] font-semibold text-[12px] px-3 py-1 rounded-full mb-4 border border-[rgba(255,74,0,0.3)]">Quarantined / Deleted</span>
                            )}
                            <p className="text-[16px] font-sans text-[rgba(255,255,255,0.7)] mb-2">Added by <span className="font-semibold text-white">{expense.creator?.name || 'System'}</span></p>
                            <p className="text-[16px] font-sans text-[rgba(255,255,255,0.7)]">Total: <span className="font-semibold text-white">₹{Number(expense.amount_inr || expense.amount).toFixed(2)}</span></p>
                          </div>
                          <div>
                            <h4 className="font-sans font-semibold text-[rgba(255,255,255,0.5)] uppercase tracking-[0.5px] text-[12px] mb-4 border-b border-[rgba(255,255,255,0.1)] pb-2">Split Breakdown</h4>
                            <ul className="space-y-3">
                              {expense.splits.map((split: any) => (
                                <li key={split.id} className="flex justify-between items-center text-[16px] font-sans">
                                  <span className="text-[rgba(255,255,255,0.7)]">{split.user?.name || `User ${split.user_id}`}</span>
                                  <span className="font-bold text-white">₹{Number(split.share_amount || split.amount).toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Anomaly Handling UI */}
                        {(isMissingPayer || pendingAnomalies.length > 0) && (
                          <div className="mt-8 bg-[rgba(255,74,0,0.1)] border border-[rgba(255,74,0,0.2)] p-6 rounded-[16px]">
                            {isMissingPayer && (
                              <div className="mb-4">
                                <p className="font-bold text-[#FF4A00] text-[18px] mb-4">Action Required: Assign Payer</p>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                  <select 
                                    value={selectedPayerIds[expense.id] || ''}
                                    onChange={(e) => setSelectedPayerIds({ ...selectedPayerIds, [expense.id]: e.target.value })}
                                    className="w-full sm:flex-1 border border-[rgba(255,255,255,0.2)] rounded-[12px] p-3 font-sans text-[16px] bg-[#121214] text-white focus:outline-none focus:border-[#3CE370]"
                                  >
                                    <option value="">Select payer...</option>
                                    {group.memberships.map((m: any) => (
                                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                                    ))}
                                  </select>
                                  <Button 
                                    variant="danger"
                                    className="w-full sm:w-auto shrink-0"
                                    onClick={() => {
                                      const selectedPayer = selectedPayerIds[expense.id];
                                      if (selectedPayer) {
                                        const anomaly = pendingAnomalies.find((a: any) => a.anomaly_type === 'MISSING_PAYER');
                                        if (anomaly) {
                                          handleResolveAnomaly(anomaly.id, 'ASSIGN_PAYER', selectedPayer);
                                        }
                                      }
                                    }}
                                  >
                                    Assign
                                  </Button>
                                </div>
                              </div>
                            )}

                            {pendingAnomalies.length > 0 && !isMissingPayer && (
                              <div>
                                <h4 className="font-bold text-[#FF4A00] text-[18px] mb-4">Pending Resolution</h4>
                                <ul className="space-y-6">
                                  {pendingAnomalies.map((a: any) => (
                                    <li key={a.id} className="text-[16px] font-sans">
                                      <strong className="text-white block mb-1">[{a.anomaly_type}]</strong>
                                      <span className="text-[rgba(255,255,255,0.7)] block mb-4">{a.description}</span>
                                      <div className="flex flex-wrap gap-3">
                                        <Button variant="danger" onClick={() => handleResolveAnomaly(a.id, 'CONFIRM_DUPLICATE')}>
                                          Confirm Duplicate
                                        </Button>
                                        <Button variant="outline" onClick={() => handleResolveAnomaly(a.id, 'KEEP_BOTH')}>
                                          Keep Expense
                                        </Button>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </Card>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddModal && (
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
              className="w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <Card>
                <h2 className="text-[32px] font-sans font-bold text-white tracking-tight leading-[1] mb-6">Add an expense</h2>
                <form onSubmit={handleAddExpense}>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-2 text-[14px]">Description</label>
                      <input type="text" required value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full border border-[rgba(255,255,255,0.2)] rounded-[12px] p-3 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white" />
                    </div>
                    <div>
                      <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-2 text-[14px]">Amount (₹)</label>
                      <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-[rgba(255,255,255,0.2)] rounded-[12px] p-3 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white" />
                    </div>
                    <div>
                      <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-2 text-[14px]">Date</label>
                      <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-[rgba(255,255,255,0.2)] rounded-[12px] p-3 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-2 text-[14px]">Paid By</label>
                      <select required value={payerId} onChange={(e) => setPayerId(e.target.value)} className="w-full border border-[rgba(255,255,255,0.2)] rounded-[12px] p-3 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white">
                        <option value="">Select payer...</option>
                        {group.memberships.filter((m: any) => !m.left_at).map((m: any) => (
                          <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-2 text-[14px]">Split Type</label>
                      <select value={splitType} onChange={(e) => setSplitType(e.target.value)} className="w-full border border-[rgba(255,255,255,0.2)] rounded-[12px] p-3 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white">
                        <option value="EQUAL">Equally</option>
                        <option value="PERCENTAGE">By Percentage</option>
                        <option value="EXACT">By Exact Amount</option>
                        <option value="SHARE">By Shares</option>
                      </select>
                    </div>
                    
                    {splitType !== 'EQUAL' && (
                      <div className="bg-[rgba(255,255,255,0.02)] p-4 rounded-[16px] border border-[rgba(255,255,255,0.05)]">
                        <label className="block font-sans font-semibold text-[rgba(255,255,255,0.7)] mb-4 text-[14px]">Split Details</label>
                        <div className="space-y-3">
                          {group.memberships.filter((m: any) => !m.left_at).map((m: any) => (
                            <div key={m.user.id} className="flex items-center justify-between">
                              <span className="text-[16px] font-sans font-semibold text-white">{m.user.name}</span>
                              <div className="flex items-center">
                                <input 
                                  type="number" 
                                  step="any"
                                  value={splitValues[m.user.id] || ''} 
                                  onChange={(e) => setSplitValues({...splitValues, [m.user.id]: e.target.value})}
                                  placeholder={splitType === 'PERCENTAGE' ? '%' : splitType === 'EXACT' ? '₹' : 'shares'}
                                  className="w-[100px] border border-[rgba(255,255,255,0.2)] rounded-[12px] p-2 font-sans text-[16px] focus:outline-none focus:border-[#3CE370] bg-[#121214] text-white text-right"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-8 flex justify-end space-x-3">
                    <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button type="submit" variant="primary">Save</Button>
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
