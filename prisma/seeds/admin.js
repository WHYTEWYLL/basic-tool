async function seedAdmin(prisma) {
  console.log('Start seeding admin user...');

  const wallet = '0x030ef66fFDf3A29Ad5D7fE42ffE56D06e27e7FcB';
  const admin = await prisma.adminUser.upsert({
    where: { walletAddress: wallet },
    update: {},
    create: {
      walletAddress: wallet,
      name: 'Super Admin',
      nonce: 'seed',
      nonceExpiresAt: new Date(Date.now() + 3600 * 1000),
      isSuperAdmin: true,
    },
  });
  
  const wallet2 = '0x26B25EBA1f09E58Fc39b572F34a2b8A06A8b3Ec6';
  const admin2 = await prisma.adminUser.upsert({
    where: { walletAddress: wallet2 },
    update: {},
    create: {
      walletAddress: wallet2,
      name: 'Admin Gastón',
      nonce: 'seed',
      nonceExpiresAt: new Date(Date.now() + 3600 * 1000),
      isSuperAdmin: true,
    },
  });

  const wallet3 = '0x0b0f208d51aa1728ca932691ade8d8d1e216da35';
  const admin3 = await prisma.adminUser.upsert({
    where: { walletAddress: wallet3 },
    update: {},
    create: {
      walletAddress: wallet3,
      name: 'Admin David',
      nonce: 'seed',
      nonceExpiresAt: new Date(Date.now() + 3600 * 1000),
      isSuperAdmin: true,
    },
  });

  const entities = ['BYEBYEBITES_CONFIG', 'TRASHDASH_CONFIG', 'BITEGRAM_CONFIG'];
  for (const entity of entities) {
      await prisma.adminPermission.upsert({
        where: { userId_entity: { userId: admin.id, entity } },
        update: { role: 'READ_WRITE' },
        create: { userId: admin.id, entity, role: 'READ_WRITE' },
      });
      await prisma.adminPermission.upsert({
        where: { userId_entity: { userId: admin2.id, entity } },
        update: { role: 'READ_WRITE' },
        create: { userId: admin2.id, entity, role: 'READ_WRITE' },
      });
      await prisma.adminPermission.upsert({
        where: { userId_entity: { userId: admin3.id, entity } },
        update: { role: 'READ_WRITE' },
        create: { userId: admin3.id, entity, role: 'READ_WRITE' },
      });
  }
}

module.exports = seedAdmin;
