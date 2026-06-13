import { PrismaClient } from '@prisma/client';
import { BalanceEngine } from '../services/balanceEngine';

const prisma = new PrismaClient();
const balanceEngine = new BalanceEngine();

beforeAll(async () => {
  // Clear tables
  await prisma.expenseSplit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.importAnomaly.deleteMany();
  await prisma.user.deleteMany();
  await prisma.group.deleteMany();

  // Seed basic data for tests
  const group = await prisma.group.create({ data: { name: 'Test Group' } });

  const usersData = [
    { name: 'Aisha', canonical_name: 'Aisha', email: 'aisha@test.com' },
    { name: 'Rohan', canonical_name: 'Rohan', email: 'rohan@test.com' },
    { name: 'Priya', canonical_name: 'Priya', email: 'priya@test.com' },
    { name: 'Meera', canonical_name: 'Meera', email: 'meera@test.com' },
    { name: 'Sam', canonical_name: 'Sam', email: 'sam@test.com' }
  ];

  const createdUsers = [];
  for (const u of usersData) {
    createdUsers.push(await prisma.user.create({ data: u }));
  }

  const uMap = createdUsers.reduce((acc, u) => { acc[u.name] = u; return acc; }, {} as Record<string, any>);

  // Memberships
  await prisma.groupMembership.createMany({
    data: [
      { user_id: uMap['Aisha'].id, group_id: group.id, joined_at: new Date('2026-02-01T00:00:00Z'), left_at: null },
      { user_id: uMap['Rohan'].id, group_id: group.id, joined_at: new Date('2026-02-01T00:00:00Z'), left_at: null },
      { user_id: uMap['Meera'].id, group_id: group.id, joined_at: new Date('2026-02-01T00:00:00Z'), left_at: new Date('2026-03-31T23:59:59Z') },
      { user_id: uMap['Sam'].id, group_id: group.id, joined_at: new Date('2026-04-15T00:00:00Z'), left_at: null },
    ]
  });

  // Create an expense paid by Rohan (100 INR), split equally between Rohan, Aisha, Meera (33.33 each)
  // Rohan paid 100. Aisha owes Rohan 33.33. Meera owes Rohan 33.33.
  const exp1 = await prisma.expense.create({
    data: {
      group_id: group.id,
      description: 'Test Expense 1',
      date: new Date('2026-02-15T12:00:00Z'),
      paid_by_id: uMap['Rohan'].id,
      amount: 100,
      currency: 'INR',
      amount_inr: 100,
      split_type: 'EQUAL',
      splits: {
        create: [
          { user_id: uMap['Rohan'].id, share_amount: 33.34 }, // payer's share
          { user_id: uMap['Aisha'].id, share_amount: 33.33 },
          { user_id: uMap['Meera'].id, share_amount: 33.33 }
        ]
      }
    }
  });

  // Create an expense paid by Aisha (60 INR), split between Aisha, Rohan (30 each)
  // Rohan owes Aisha 30.
  const exp2 = await prisma.expense.create({
    data: {
      group_id: group.id,
      description: 'Test Expense 2',
      date: new Date('2026-03-01T12:00:00Z'),
      paid_by_id: uMap['Aisha'].id,
      amount: 60,
      currency: 'INR',
      amount_inr: 60,
      split_type: 'EQUAL',
      splits: {
        create: [
          { user_id: uMap['Aisha'].id, share_amount: 30 },
          { user_id: uMap['Rohan'].id, share_amount: 30 }
        ]
      }
    }
  });

  // Settlement: Meera pays Rohan 10.
  // Meera originally owed Rohan 33.33. Now she owes 23.33.
  await prisma.settlement.create({
    data: {
      group_id: group.id,
      from_user_id: uMap['Meera'].id,
      to_user_id: uMap['Rohan'].id,
      amount: 10,
      date: new Date('2026-03-05T12:00:00Z')
    }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('BalanceEngine', () => {
  it('computes Rohan\'s balance correctly', async () => {
    const group = await prisma.group.findFirst();
    const rohan = await prisma.user.findUnique({ where: { email: 'rohan@test.com' } });
    
    if (!group || !rohan) throw new Error('Data missing');

    const rohanBalance = await balanceEngine.getIndividualBalanceSummary(group.id, rohan.id);

    // Hand-computed:
    // Aisha owes Rohan 3.33
    // Meera owes Rohan 23.33
    // Total owed to Rohan = 26.66
    expect(rohanBalance.totalOwedToUser).toBe(26.66);
    expect(rohanBalance.totalUserOwes).toBe(0);

    const aishaBreakdown = rohanBalance.breakdown.find(b => b.otherUserName === 'Aisha');
    expect(aishaBreakdown?.netAmount).toBe(3.33);

    const meeraBreakdown = rohanBalance.breakdown.find(b => b.otherUserName === 'Meera');
    expect(meeraBreakdown?.netAmount).toBe(23.33);
  });

  it('money conservation theorem check', async () => {
    const group = await prisma.group.findFirst();
    if (!group) throw new Error('Data missing');

    const users = await prisma.user.findMany();
    let totalSystemOwed = 0;
    let totalSystemOwes = 0;

    for (const u of users) {
      const b = await balanceEngine.getIndividualBalanceSummary(group.id, u.id);
      totalSystemOwed += b.totalOwedToUser;
      totalSystemOwes += b.totalUserOwes;
    }

    // Floating point math might be slightly off due to summing rounded numbers, but should be close
    expect(Math.abs(totalSystemOwed - totalSystemOwes)).toBeLessThan(0.05);
  });
});
