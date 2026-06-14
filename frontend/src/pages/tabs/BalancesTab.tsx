import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api';

export const BalancesTab = () => {
  const { id, group } = useOutletContext<any>();
  const { user } = useAuth();
  const [groupBalances, setGroupBalances] = useState<any[]>([]);
  const [mySummary, setMySummary] = useState<any>(null);
  const [myBreakdown, setMyBreakdown] = useState<any[]>([]);
  const [quarantinedCount, setQuarantinedCount] = useState(0);
  const [expandedBreakdown, setExpandedBreakdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // Settlement state
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  const fetchBalances = useCallback(async () => {
    try {
      const [groupData, myData, breakdownData, expensesData] = await Promise.all([
        api(`/api/groups/${id}/balances`),
        api(`/api/groups/${id}/balances/me`),
        api(`/api/groups/${id}/balances/me/breakdown`),
        api(`/api/groups/${id}/expenses`)
      ]);

      setGroupBalances(groupData.balances);
      setMySummary(myData);
      setMyBreakdown(breakdownData.breakdown);

      let qCount = 0;
      for (const exp of expensesData) {
        const isQuarantined = !exp.paid_by_id || exp.deleted_at || (exp.anomalies && exp.anomalies.some((a: any) => a.status === 'PENDING_APPROVAL'));
        if (isQuarantined) {
          const involvesMe = exp.paid_by_id === user?.id || exp.splits?.some((s: any) => s.user_id === user?.id);
          if (involvesMe) qCount++;
        }
      }
      setQuarantinedCount(qCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    if (id) fetchBalances();
  }, [id, fetchBalances]);

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

  if (loading) return <div className="text-gray-500 py-8 flex justify-center">Calculating balances...</div>;

  const myNet = mySummary ? mySummary.totalOwedToUser - mySummary.totalUserOwes : 0;
  let runningTotal = 0;

  return (
    <div className="space-y-8">
      {quarantinedCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-md flex items-start">
          <span className="text-orange-500 mr-3 mt-0.5">⚠️</span>
          <p className="text-sm text-orange-800">
            <span className="font-bold">{quarantinedCount} expenses</span> involving you are quarantined due to anomalies. They are excluded from these balances.
          </p>
        </div>
      )}

      {/* Hero Balance Section */}
      <Card className="text-center">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Total Balance</h2>
        
        {myNet > 0 ? (
          <div className="text-3xl font-bold text-[#5bc5a7] mb-2">You are owed ₹{Math.abs(myNet).toFixed(2)}</div>
        ) : myNet < 0 ? (
          <div className="text-3xl font-bold text-[#ff652f] mb-2">You owe ₹{Math.abs(myNet).toFixed(2)}</div>
        ) : (
          <div className="text-3xl font-bold text-gray-800 mb-2">You are settled up</div>
        )}

        <div className="mt-6 flex justify-center space-x-4">
          <Button variant="secondary" onClick={() => setExpandedBreakdown(!expandedBreakdown)}>
            {expandedBreakdown ? 'Hide Breakdown' : 'Show Math'}
          </Button>
          <Button variant="primary" onClick={() => setShowSettleModal(true)}>
            Settle Up
          </Button>
        </div>

        {expandedBreakdown && (
          <div className="mt-8 text-left border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Itemized Ledger Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Effect</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Running Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myBreakdown.map((item) => {
                    runningTotal += item.netEffect;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap font-mono">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium font-mono text-right whitespace-nowrap ${item.netEffect >= 0 ? 'text-[#5bc5a7]' : 'text-[#ff652f]'}`}>
                          {item.netEffect > 0 ? '+' : ''}{Number(item.netEffect).toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium font-mono text-right whitespace-nowrap ${runningTotal >= 0 ? 'text-[#5bc5a7]' : 'text-[#ff652f]'}`}>
                          {Number(runningTotal).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Group Balances */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Who Owes Whom</h2>
        
        {groupBalances.length === 0 ? (
          <Card className="text-center text-gray-500">
            No outstanding balances in the group.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {groupBalances.map((b, i) => {
              const isMeOwes = b.fromUserId === user?.id;
              const isOwedToMe = b.toUserId === user?.id;
              
              const borderClass = isMeOwes ? 'border-[#ff652f]' : isOwedToMe ? 'border-[#5bc5a7]' : 'border-gray-200';
              const textClass = isMeOwes ? 'text-[#ff652f]' : isOwedToMe ? 'text-[#5bc5a7]' : 'text-gray-800';

              return (
                <Card key={i} padding="sm" className={`flex items-center justify-between border-l-4 ${borderClass}`}>
                  <div className="text-sm text-gray-600">
                    <span className={`font-medium ${isMeOwes ? 'text-gray-900' : ''}`}>
                      {isMeOwes ? 'You' : userMap[b.fromUserId] || `User ${b.fromUserId}`}
                    </span>
                    <span className="mx-1">owe</span>
                    <span className={`font-medium ${isOwedToMe ? 'text-gray-900' : ''}`}>
                      {isOwedToMe ? 'You' : userMap[b.toUserId] || `User ${b.toUserId}`}
                    </span>
                  </div>
                  <div className={`font-medium ${textClass}`}>
                    ₹{Number(b.amount).toFixed(2)}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {showSettleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Settle Up</h2>
            <form onSubmit={handleSettleUp}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pay to</label>
                  <select
                    required
                    value={settleTo}
                    onChange={(e) => setSettleTo(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  >
                    <option value="">Select a member...</option>
                    {group.memberships.filter((m: any) => m.user.id !== user?.id).map((m: any) => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button type="button" variant="secondary" onClick={() => setShowSettleModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Record Payment</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
};
