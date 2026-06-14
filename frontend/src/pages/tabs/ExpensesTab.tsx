import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ExpenseListItem } from '../../components/ui/ExpenseListItem';
import { api } from '../../api';

export const ExpensesTab = () => {
  const { id, group } = useOutletContext<any>();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Add Expense State
  const [showAddModal, setShowAddModal] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [payerId, setPayerId] = useState('');

  // Anomaly Resolution State
  const [selectedPayerIds, setSelectedPayerIds] = useState<Record<number, string>>({});

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await api(`/api/groups/${id}/expenses`);
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchExpenses();
  }, [id, fetchExpenses]);

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

  if (loading) return <div className="text-gray-500 py-8 flex justify-center">Loading expenses...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
        <h2 className="text-xl font-bold text-gray-800">Expenses</h2>
        <div className="flex space-x-2">
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            Add an expense
          </Button>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No expenses recorded.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {expenses.map((expense) => {
              const pendingAnomalies = expense.anomalies?.filter((a: any) => a.status === 'PENDING_APPROVAL') || [];

              const isMissingPayer = !expense.paid_by_id;
              const isSoftDeleted = !!expense.deleted_at;
              const isExpanded = expandedId === expense.id;

              return (
                <div key={expense.id} className={isSoftDeleted ? 'opacity-50' : ''}>
                  <ExpenseListItem 
                    expense={expense}
                    currentUserId={user?.id}
                    onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                  />

                  {isExpanded && (
                    <div className="bg-gray-50 p-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2 border-b pb-1 text-sm">Expense Details</h4>
                          {isSoftDeleted && (
                            <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mb-2">Quarantined / Deleted</span>
                          )}
                          <p className="text-sm text-gray-600 mb-1">Added by {expense.creator?.name || 'System'}</p>
                          <p className="text-sm text-gray-600">Total: ₹{parseFloat(expense.amount_inr || expense.amount).toFixed(2)}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2 border-b pb-1 text-sm">Split Breakdown</h4>
                          <ul className="space-y-1">
                            {expense.splits.map((split: any) => (
                              <li key={split.id} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{split.user?.name || `User ${split.user_id}`}</span>
                                <span className="font-medium text-gray-800">₹{parseFloat(split.share_amount || split.amount).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Anomaly Handling UI */}
                      {(isMissingPayer || pendingAnomalies.length > 0) && (
                        <div className="mt-4 bg-orange-50 border border-orange-200 p-4 rounded-md">
                          {isMissingPayer && (
                            <div className="mb-4">
                              <p className="font-medium text-orange-800 text-sm mb-2">Action Required: Assign Payer</p>
                              <div className="flex items-center space-x-2">
                                <select 
                                  value={selectedPayerIds[expense.id] || ''}
                                  onChange={(e) => setSelectedPayerIds({ ...selectedPayerIds, [expense.id]: e.target.value })}
                                  className="border border-gray-300 rounded-md p-2 text-sm flex-1"
                                >
                                  <option value="">Select payer...</option>
                                  {group.memberships.map((m: any) => (
                                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                                  ))}
                                </select>
                                <Button 
                                  variant="primary"
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
                              <h4 className="font-medium text-orange-800 text-sm mb-2">Pending Resolution</h4>
                              <ul className="space-y-3">
                                {pendingAnomalies.map((a: any) => (
                                  <li key={a.id} className="text-sm">
                                    <strong className="text-orange-900 block">[{a.anomaly_type}]</strong>
                                    <span className="text-orange-800 block mb-2">{a.description}</span>
                                    <div className="flex space-x-2">
                                      <Button variant="danger" onClick={() => handleResolveAnomaly(a.id, 'CONFIRM_DUPLICATE')}>
                                        Confirm Duplicate
                                      </Button>
                                      <Button variant="secondary" onClick={() => handleResolveAnomaly(a.id, 'KEEP_BOTH')}>
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add an expense</h2>
            <form onSubmit={handleAddExpense}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" required value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid By</label>
                  <select required value={payerId} onChange={(e) => setPayerId(e.target.value)} className="w-full border border-gray-300 rounded-md p-2">
                    <option value="">Select payer...</option>
                    {group.memberships.filter((m: any) => !m.left_at).map((m: any) => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Split Type</label>
                  <select value={splitType} onChange={(e) => setSplitType(e.target.value)} className="w-full border border-gray-300 rounded-md p-2">
                    <option value="EQUAL">Equally</option>
                    <option value="PERCENTAGE">By Percentage</option>
                    <option value="EXACT">By Exact Amount</option>
                    <option value="SHARE">By Shares</option>
                  </select>
                </div>
                
                {splitType !== 'EQUAL' && (
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Split Details</label>
                    <div className="space-y-2">
                      {group.memberships.filter((m: any) => !m.left_at).map((m: any) => (
                        <div key={m.user.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{m.user.name}</span>
                          <div className="flex items-center">
                            <input 
                              type="number" 
                              step="any"
                              value={splitValues[m.user.id] || ''} 
                              onChange={(e) => setSplitValues({...splitValues, [m.user.id]: e.target.value})}
                              placeholder={splitType === 'PERCENTAGE' ? '%' : splitType === 'EXACT' ? '₹' : 'shares'}
                              className="w-24 border border-gray-300 rounded-md p-1 text-sm text-right"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
