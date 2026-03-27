import { PrismaClient } from './node_modules/@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const idsToDelete = [24, 28, 29, 30, 31, 32];
  
  for (const id of idsToDelete) {
    try {
      await prisma.user.delete({ where: { id } });
      console.log(`Deleted user ${id}`);
    } catch (e) {
      console.log(`Could not delete user ${id}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
