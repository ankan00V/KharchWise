import { BalanceEngine } from '../src/services/balanceEngine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const balanceEngine = new BalanceEngine();

async function main() {
  const users = await prisma.user.findMany();
  const rohan = users.find(u => u.canonical_name.toLowerCase() === 'rohan');
  const sam = users.find(u => u.canonical_name.toLowerCase() === 'sam');
  const meera = users.find(u => u.canonical_name.toLowerCase() === 'meera');
  
  const group = await prisma.group.findFirst();
  
  if (!rohan || !sam || !meera || !group) throw new Error("Missing data");

  const rohanBalance = await balanceEngine.getIndividualBalanceSummary(group.id, rohan.id);
  const samBalance = await balanceEngine.getIndividualBalanceSummary(group.id, sam.id);
  const meeraBalance = await balanceEngine.getIndividualBalanceSummary(group.id, meera.id);

  console.log("Rohan Balance:", JSON.stringify(rohanBalance, null, 2));
  console.log("Sam Balance:", JSON.stringify(samBalance, null, 2));
  console.log("Meera Balance:", JSON.stringify(meeraBalance, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
