const { PrismaClient } = require('@prisma/client');
const seedAssets = require('./seeds/assets');
const { seedRewardConfigs } = require('./seeds/rewardConfigs');
const seedAdmin = require('./seeds/admin');
const seedUserContextStats = require('./seeds/populateUserContextStats');

const prisma = new PrismaClient();

async function main() {
  try {
    // Run all seeders in sequence
    await seedAssets(prisma);
    await seedRewardConfigs(prisma);
    await seedAdmin(prisma);
    await seedUserContextStats(prisma);
    
    console.log('✅ Seeding finished');
  } catch (e) {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 