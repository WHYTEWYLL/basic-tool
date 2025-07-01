const bitegramConfigs = [
  {
    context: 'BITEGRAM',
    type: 'BASE_REWARD',
    payload: {
      baseReward: 0.5,
      passingScore: 70,
      maxDailySubmissions: 3,
    }
  },
  {
    context: 'BITEGRAM',
    type: 'LEVEL_REWARDS',
    payload: {
      levels: [
        { level: 1, name: 'Healthy Beginner', minSubmissions: 0, maxSubmissions: 20, multiplier: 1.0 },
        { level: 2, name: 'Balanced Eater', minSubmissions: 21, maxSubmissions: 50, multiplier: 1.2 },
        { level: 3, name: 'Nutrition Enthusiast', minSubmissions: 51, maxSubmissions: 100, multiplier: 1.5 },
        { level: 4, name: 'Plant Pro', minSubmissions: 101, maxSubmissions: 250, multiplier: 1.8 },
        { level: 5, name: 'Wellness Champ', minSubmissions: 251, maxSubmissions: null, multiplier: 2.0 }
      ]
    }
  },
  {
    context: 'BITEGRAM',
    type: 'STREAK_BONUSES',
    payload: {
      streakCountType: 'DAYS',
      bonuses: [
        { streakCount: 7, bonusPercent: 0.05 },
        { streakCount: 14, bonusPercent: 0.10 },
        { streakCount: 50, bonusPercent: 0.15 },
        { streakCount: 100, bonusPercent: 0.20 }
      ]
    }
  },
  {
    context: 'BITEGRAM',
    type: 'SUSTAINABILITY_METRICS',
    payload: {
      fruits_vegs: {
        co2KgPerMeal: 7,
        showersPerMeal: 1 / 21,
        gasCarsPerMeal: 1 / 54,
        lightbulbDaysPerMeal: 1 / 1.7,
        homeDaysPerMeal: 1 / 40
      },
      meat_fish: {
        co2KgPerMeal: 0.5,
        showersPerMeal: 0,
        gasCarsPerMeal: 0,
        lightbulbDaysPerMeal: 0,
        homeDaysPerMeal: 0
      }
    }
  },
  {
    context: 'BITEGRAM',
    type: 'REWARDS_LIMIT',
    payload: {
      maxSubmissionsPerWeek: 7,
      maxSubmissionsPerDay: null,
      maxFailedSubmissionsPerWeek: 12,
      failedSubmissionBlockDurationWeeks: 2
    }
  }
];

const byebyebitesConfigs = [
  {
    context: 'BYEBYEBITES',
    type: 'BASE_REWARD',
    payload: { baseReward: 1 }
  },
  {
    context: 'BYEBYEBITES',
    type: 'EXPIRY_MULTIPLIERS',
    payload: {
      ranges: [
        { minDays: 10, maxDays: null, multiplier: 0 },
        { minDays: 4, maxDays: 9, multiplier: 0.5 },
        { minDays: 2, maxDays: 3, multiplier: 1.0 },
        { minDays: 1, maxDays: 1, multiplier: 1.5 },
        { minDays: 0, maxDays: 0, multiplier: 2.0 }
      ]
    }
  },
  {
    context: 'BYEBYEBITES',
    type: 'STREAK_BONUSES',
    payload: {
      streakCountType: 'WEEKS',
      bonuses: [
        { streakCount: 2, bonusPercent: 0.05 },
        { streakCount: 3, bonusPercent: 0.10 },
        { streakCount: 5, bonusPercent: 0.15 },
        { streakCount: 10, bonusPercent: 0.20 }
      ]
    }
  },
  {
    context: 'BYEBYEBITES',
    type: 'SUSTAINABILITY_METRICS',
    payload: {
      categories: {
        plastic: { baseItems: 2, baseImpact: 1 },
        carbon:  { baseItems: 10, baseImpact: 1 },
        gas:     { baseItems: 5, baseImpact: 1 }
      },
      expiryImpactMultipliers: [
        { minDays: 10, maxDays: null, multiplier: 1 },
        { minDays: 4,  maxDays: 9,    multiplier: 1.1 },
        { minDays: 2,  maxDays: 3,    multiplier: 1.2 },
        { minDays: 1,  maxDays: 1,    multiplier: 1.3 },
        { minDays: 0,  maxDays: 0,    multiplier: 1.5 }
      ]
    }
  },
  {
    context: 'BYEBYEBITES',
    type: 'CHALLENGES',
    payload: {
      challenges: [
        { type: 'expiring_today',    items: 5,   reward: 5  },
        { type: 'expiring_today',    items: 10,  reward: 10 },
        { type: 'expiring_today',    items: 30,  reward: 20 },
        { type: 'expiring_today',    items: 50,  reward: 30 },
        { type: 'expiring_today',    items: 100, reward: 50 },
        { type: '1_day_before',      items: 5,   reward: 4  },
        { type: '1_day_before',      items: 10,  reward: 7  },
        { type: '1_day_before',      items: 30,  reward: 17 },
        { type: '1_day_before',      items: 50,  reward: 25 },
        { type: '1_day_before',      items: 100, reward: 40 },
        { type: '2_3_days_before',   items: 5,   reward: 3  },
        { type: '2_3_days_before',   items: 10,  reward: 5  },
        { type: '2_3_days_before',   items: 30,  reward: 15 },
        { type: '2_3_days_before',   items: 50,  reward: 20 },
        { type: '2_3_days_before',   items: 100, reward: 30 },
        { type: '4_9_days_before',   items: 5,   reward: 1  },
        { type: '4_9_days_before',   items: 10,  reward: 3  },
        { type: '4_9_days_before',   items: 30,  reward: 7  },
        { type: '4_9_days_before',   items: 50,  reward: 12 },
        { type: '4_9_days_before',   items: 100, reward: 20 }
      ]
    }
  },
  {
    context: 'BYEBYEBITES',
    type: 'REWARDS_LIMIT',
    payload: {
      maxSubmissionsPerWeek: 7,
      maxSubmissionsPerDay: null,
      maxFailedSubmissionsPerWeek: 12,
      failedSubmissionBlockDurationWeeks: 2
    }
  }
];

const trashdashConfigs = [
  {
    context: 'TRASHDASH',
    type: 'BASE_REWARD',
    payload: { baseReward: 1 }
  },
  {
    context: 'TRASHDASH',
    type: 'LEVEL_REWARDS',
    payload: {
      levels: [
        { level: 1, name: 'Recycling Rookie', minSubmissions: 0, maxSubmissions: 10, multiplier: 1.0 },
        { level: 2, name: 'Green Guardian', minSubmissions: 11, maxSubmissions: 25, multiplier: 1.2 },
        { level: 3, name: 'Eco Champion', minSubmissions: 26, maxSubmissions: 50, multiplier: 1.5 },
        { level: 4, name: 'Planet Protector', minSubmissions: 50, maxSubmissions: 100, multiplier: 2.0 },
        { level: 5, name: 'Zero Waste Warrior', minSubmissions: 100, maxSubmissions: null, multiplier: 2.5 }
      ]
    }
  },
  {
    context: 'TRASHDASH',
    type: 'STREAK_BONUSES',
    payload: {
      streakCountType: 'DAYS',
      bonuses: [
        { streakCount: 7, bonusPercent: 0.05 },
        { streakCount: 14, bonusPercent: 0.10 },
        { streakCount: 50, bonusPercent: 0.15 },
        { streakCount: 100, bonusPercent: 0.20 }
      ]
    }
  },
  {
    context: 'TRASHDASH',
    type: 'SUSTAINABILITY_METRICS',
    payload: {
      recyclable: {
        co2KgPerItem: 0.006,
        turtlesPerItem: 1 / 5,
        tvHoursPerItem: 3,
        treesPerItem: 1 / 4000
      },
      compost: {
        co2KgPerItem: 0.03,
        gardensPerItem: 1 / 30
      }
    }
  },
  {
    context: 'TRASHDASH',
    type: 'REWARDS_LIMIT',
    payload: {
      maxSubmissionsPerWeek: 7,
      maxSubmissionsPerDay: null,
      maxFailedSubmissionsPerWeek: 12,
      failedSubmissionBlockDurationWeeks: 2
    }
  }
];

const DEFAULT_REWARD_CONFIGS = {
  B3TRBUDDY: [], // No default configs for B3TRBUDDY context yet
  BITEGRAM: bitegramConfigs,
  TRASHDASH: trashdashConfigs,
  BYEBYEBITES: byebyebitesConfigs,
};

module.exports = {
  DEFAULT_REWARD_CONFIGS,
  defaultConfigs: DEFAULT_REWARD_CONFIGS
}; 