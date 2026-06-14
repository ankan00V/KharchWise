import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash password
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'password123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Create Users
  const usersData = [
    { name: 'Aisha', canonical_name: 'Aisha', email: 'aisha@example.com' },
    { name: 'Rohan', canonical_name: 'Rohan', email: 'rohan@example.com' },
    { name: 'Priya', canonical_name: 'Priya', email: 'priya@example.com' },
    { name: 'Meera', canonical_name: 'Meera', email: 'meera@example.com' },
    { name: 'Dev', canonical_name: 'Dev', email: 'dev@example.com' },
    { name: 'Sam', canonical_name: 'Sam', email: 'sam@example.com' },
    { name: 'Kabir', canonical_name: 'Kabir', email: 'kabir@example.com' },
  ];

  const userMap: Record<string, number> = {};

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        canonical_name: u.canonical_name,
        email: u.email,
        password_hash: passwordHash,
      },
    });
    userMap[user.canonical_name] = user.id;
  }

  // 2. Create Group
  const group = await prisma.group.create({
    data: {
      name: 'Flat 3B',
    },
  });

  // 3. Create GroupMemberships
  // DECISION POINT: Exclude Dev
  // WHY: Dev was a one-time trip guest, not a flatmate. His expenses/splits will be 
  // handled specially during import since he's not a persistent member but participated 
  // in real shared expenses. ExpenseSplit participation is independent of GroupMembership.
  const membershipsData = [
    {
      user_id: userMap['Aisha'],
      group_id: group.id,
      joined_at: new Date('2026-02-01T00:00:00Z'),
      left_at: null,
    },
    {
      user_id: userMap['Rohan'],
      group_id: group.id,
      joined_at: new Date('2026-02-01T00:00:00Z'),
      left_at: null,
    },
    {
      user_id: userMap['Priya'],
      group_id: group.id,
      joined_at: new Date('2026-02-01T00:00:00Z'),
      left_at: null,
    },
    {
      user_id: userMap['Meera'],
      group_id: group.id,
      joined_at: new Date('2026-02-01T00:00:00Z'),
      left_at: new Date('2026-03-31T23:59:59Z'), // moved out end of March
    },
    {
      user_id: userMap['Sam'],
      group_id: group.id,
      joined_at: new Date('2026-04-08T00:00:00Z'), // moved in April 8th
      left_at: null,
    },
  ];

  for (const m of membershipsData) {
    await prisma.groupMembership.create({
      data: {
        user_id: m.user_id as number,
        group_id: m.group_id,
        joined_at: m.joined_at,
        left_at: m.left_at
      },
    });
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
