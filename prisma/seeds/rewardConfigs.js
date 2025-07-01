const { DEFAULT_REWARD_CONFIGS } = require('../../src/constants/reward-configs.js');

// Export the configs for external use
const defaultConfigs = DEFAULT_REWARD_CONFIGS;

async function seedRewardConfigs(prisma) {
  console.log('Start seeding RewardConfigs...');
  
  for (const [context, configs] of Object.entries(DEFAULT_REWARD_CONFIGS)) {
    if (configs.length === 0) {
      console.log(`No configs to seed for context: ${context}`);
      continue;
    }
    
    console.log(`Start seeding RewardConfig for ${context}...`);
    for (const cfg of configs) {
      const result = await prisma.rewardConfig.upsert({
        where: { context_type: { context: cfg.context, type: cfg.type } },
        update: { payload: cfg.payload },
        create: cfg
      });
      console.log(`Upserted RewardConfig: ${result.context}/${result.type}`);
    }
  }
}

module.exports = {
  seedRewardConfigs,
  defaultConfigs,
};
