import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../components/ui/Card';
import { api } from '../api';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';

interface SpendingData {
  month: string;
  amount: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  change?: number;
  positive?: boolean;
}

const StatCard = ({ icon: Icon, label, value, change, positive }: StatCardProps) => (
  <Card variant="glass" padding="lg" className="relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon className="w-full h-full" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[12px] font-sans font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-[1px]">{label}</span>
        <Icon className="w-5 h-5 text-[rgba(255,255,255,0.3)]" />
      </div>
      <div className="text-[40px] font-sans font-bold text-white tracking-tight leading-none mb-2">
        ₹{value.toLocaleString()}
      </div>
      {change !== undefined && (
        <div className={`flex items-center text-[14px] font-sans font-semibold ${positive ? 'text-[#3CE370]' : 'text-[#FF4A00]'}`}>
          {positive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {Math.abs(change).toFixed(1)}% vs last month
        </div>
      )}
    </div>
  </Card>
);

const categorizeExpense = (description: string): string => {
  const desc = description.toLowerCase();
  if (desc.includes('food') || desc.includes('restaurant') || desc.includes('dinner') || desc.includes('lunch')) return 'Food & Dining';
  if (desc.includes('uber') || desc.includes('taxi') || desc.includes('flight') || desc.includes('travel')) return 'Travel & Transport';
  if (desc.includes('rent') || desc.includes('electricity') || desc.includes('water') || desc.includes('utility')) return 'Housing & Utilities';
  if (desc.includes('movie') || desc.includes('game') || desc.includes('entertainment')) return 'Entertainment';
  if (desc.includes('shopping') || desc.includes('clothes') || desc.includes('amazon')) return 'Shopping';
  return 'Other';
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Food & Dining': '#FF6B6B',
    'Travel & Transport': '#4ECDC4',
    'Housing & Utilities': '#95E1D3',
    'Entertainment': '#F38181',
    'Shopping': '#AA96DA',
    'Other': '#FCBAD3'
  };
  return colors[category] || '#999';
};

const calculateMonthlySpending = (expenses: Array<{ date: string; amount: string }>): SpendingData[] => {
  const monthMap: Record<string, number> = {};
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  // Initialize last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = months[date.getMonth()];
    monthMap[key] = 0;
  }

  // Aggregate expenses
  expenses.forEach((exp: { date: string; amount: string }) => {
    const date = new Date(exp.date);
    const monthKey = months[date.getMonth()];
    if (monthKey in monthMap) {
      monthMap[monthKey] += parseFloat(exp.amount);
    }
  });

  return Object.entries(monthMap).map(([month, amount]) => ({
    month,
    amount: Math.round(amount)
  }));
};

export const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [monthlyChange, setMonthlyChange] = useState(0);
  const [youAreOwed, setYouAreOwed] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [spendingTrend, setSpendingTrend] = useState<SpendingData[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryData[]>([]);
  const [activeGroups, setActiveGroups] = useState(0);

  const fetchAnalytics = async () => {
    try {
      // Fetch all groups and their expenses
      const groups = await api('/api/groups');
      const activeGroupsList = groups.filter((g: { membership: { left_at: string | null } }) => !g.membership.left_at);
      setActiveGroups(activeGroupsList.length);

      // Aggregate data from all groups
      let totalOwed = 0;
      let totalOwing = 0;
      let allExpenses: Array<{ description: string; amount: string; date: string }> = [];
      const categoryMap: Record<string, number> = {};

      for (const group of activeGroupsList) {
        const [balances, expenses] = await Promise.all([
          api(`/api/groups/${group.id}/balances/me`),
          api(`/api/groups/${group.id}/expenses`)
        ]);

        totalOwed += balances.totalOwedToUser || 0;
        totalOwing += balances.totalUserOwes || 0;
        allExpenses = [...allExpenses, ...expenses];

        // Categorize expenses (mock categories for now)
        expenses.forEach((exp: { description: string; amount: string }) => {
          const category = categorizeExpense(exp.description);
          categoryMap[category] = (categoryMap[category] || 0) + parseFloat(exp.amount);
        });
      }

      setYouAreOwed(totalOwed);
      setYouOwe(totalOwing);

      // Calculate spending trend (last 6 months)
      const monthlyData = calculateMonthlySpending(allExpenses);
      setSpendingTrend(monthlyData);

      // Calculate this month's total
      const thisMonth = monthlyData[monthlyData.length - 1]?.amount || 0;
      const lastMonth = monthlyData[monthlyData.length - 2]?.amount || 0;
      setTotalSpent(thisMonth);
      
      if (lastMonth > 0) {
        const change = ((thisMonth - lastMonth) / lastMonth) * 100;
        setMonthlyChange(change);
      }

      // Prepare category data
      const categories: CategoryData[] = Object.entries(categoryMap)
        .map(([name, value]) => ({
          name,
          value,
          color: getCategoryColor(name)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setCategoryBreakdown(categories);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="w-full space-y-8">
        <div className="skeleton h-[120px] rounded-[24px]"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-[160px] rounded-[24px]"></div>
          ))}
        </div>
        <div className="skeleton h-[400px] rounded-[24px]"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12 relative">
      {/* Ambient gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none -z-10 blur-[120px] opacity-20"
           style={{ background: 'radial-gradient(circle, rgba(60,227,112,0.15) 0%, rgba(7,7,9,0) 70%)' }} />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-[64px] sm:text-[80px] font-sans font-bold text-white tracking-tight leading-[1] mb-4">
          Insights
        </h1>
        <p className="text-[20px] text-[rgba(255,255,255,0.65)] font-sans max-w-2xl">
          Your financial health at a glance. Track spending trends, category breakdowns, and overall balances.
        </p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <StatCard
          icon={DollarSign}
          label="Total Spent (This Month)"
          value={totalSpent}
          change={monthlyChange}
          positive={monthlyChange < 0}
        />
        <StatCard
          icon={TrendingUp}
          label="You Are Owed"
          value={youAreOwed}
          positive={true}
        />
        <StatCard
          icon={TrendingDown}
          label="You Owe"
          value={youOwe}
          positive={false}
        />
      </motion.div>

      {/* Spending Trends Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card variant="glass" padding="lg">
          <div className="mb-8">
            <h2 className="text-[32px] font-sans font-bold text-white tracking-tight mb-2">Spending Trends</h2>
            <p className="text-[16px] text-[rgba(255,255,255,0.5)] font-sans">Your total expenses over the last 6 months</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={spendingTrend}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3CE370" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3CE370" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(255,255,255,0.3)"
                style={{ fontSize: '12px', fontFamily: 'Inter' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)"
                style={{ fontSize: '12px', fontFamily: 'Inter' }}
                tickFormatter={(value: number) => `₹${(value/1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#121214', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontFamily: 'Inter'
                }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#3CE370" 
                strokeWidth={3}
                dot={{ fill: '#3CE370', r: 6 }}
                activeDot={{ r: 8 }}
                fill="url(#colorAmount)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Pie Chart */}
        <Card variant="glass" padding="lg">
          <div className="mb-8">
            <h2 className="text-[32px] font-sans font-bold text-white tracking-tight mb-2">Top Categories</h2>
            <p className="text-[16px] text-[rgba(255,255,255,0.5)] font-sans">Where your money goes</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#121214', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontFamily: 'Inter'
                }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Spent']}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Category List */}
        <Card variant="glass" padding="lg">
          <div className="mb-8">
            <h2 className="text-[32px] font-sans font-bold text-white tracking-tight mb-2">Category Details</h2>
            <p className="text-[16px] text-[rgba(255,255,255,0.5)] font-sans">Breakdown by spending category</p>
          </div>
          <div className="space-y-4">
            {categoryBreakdown.map((category, index) => {
              const total = categoryBreakdown.reduce((sum, c) => sum + c.value, 0);
              const percentage = (category.value / total) * 100;
              
              return (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-[16px] font-sans font-semibold text-white">{category.name}</span>
                    </div>
                    <span className="text-[18px] font-sans font-bold text-white">₹{category.value.toLocaleString()}</span>
                  </div>
                  <div className="relative h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: "easeOut" }}
                      className="absolute top-0 left-0 h-full rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  </div>
                  <div className="mt-1 text-[12px] font-sans text-[rgba(255,255,255,0.5)]">
                    {percentage.toFixed(1)}% of total spending
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Additional Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card variant="glass" padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] font-sans font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-[1px] mb-2">
                Active Groups
              </div>
              <div className="text-[48px] font-sans font-bold text-white tracking-tight">
                {activeGroups}
              </div>
              <div className="text-[14px] font-sans text-[rgba(255,255,255,0.5)] mt-2">
                Across 3 active groups
              </div>
            </div>
            <Users className="w-16 h-16 text-[rgba(255,255,255,0.1)]" />
          </div>
        </Card>

        <Card variant="glass" padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] font-sans font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-[1px] mb-2">
                Net Balance
              </div>
              <div className={`text-[48px] font-sans font-bold tracking-tight ${youAreOwed - youOwe >= 0 ? 'text-[#3CE370]' : 'text-[#FF4A00]'}`}>
                ₹{Math.abs(youAreOwed - youOwe).toLocaleString()}
              </div>
              <div className="text-[14px] font-sans text-[rgba(255,255,255,0.5)] mt-2">
                {youAreOwed - youOwe >= 0 ? 'You are owed overall' : 'You owe overall'}
              </div>
            </div>
            <DollarSign className="w-16 h-16 text-[rgba(255,255,255,0.1)]" />
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

// Made with Bob
