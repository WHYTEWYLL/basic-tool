const { PrismaClient, Prisma, UserContext } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

/**
 * Compute and upsert stats for given user.
 * @param {import('@prisma/client').User} user
 */
async function computeStatsForUser(user) {
  const context = user.context;

  // Fetch submissions for user in this context with related data
  const submissions = await prisma.submission.findMany({
    where: { userId: user.id, context },
    include: {
      trashDash: true,
      biteGram: true,
      byeByeBites: true,
    },
  });

  // Submission counts
  const totalSubmissions = submissions.length;
  let trashDashSubmissions = 0;
  let biteGramSubmissions = 0;
  let byeByeBitesSubmissions = 0;

  // Rewards and impact accumulators
  let totalB3trEarned = 0;
  let totalCo2Impact = 0;
  let totalGasImpact = 0;
  let totalPlasticImpact = 0;
  let totalLightbulbImpact = 0;
  let totalShowerImpact = 0;
  let totalTurtlesImpact = 0;
  let totalTvHoursImpact = 0;
  let totalGardenFertilizedImpact = 0;
  let totalTreesSavedImpact = 0;
  let totalCarbonSavedImpact = 0;

  // Reduce submissions data
  for (const submission of submissions) {
    totalB3trEarned += Number(submission.b3trAmount || 0);

    if (submission.trashDash) {
      trashDashSubmissions += 1;
      const t = submission.trashDash;
      totalCo2Impact += Number(t.impactCo2 || 0);
      totalTurtlesImpact += Number(t.impactTurtles || 0);
      totalTvHoursImpact += Number(t.impactTvHours || 0);
      totalGardenFertilizedImpact += Number(t.impactGardenFertilized || 0);
      totalTreesSavedImpact += Number(t.impactTreesSaved || 0);
    }

    if (submission.biteGram) {
      biteGramSubmissions += 1;
      const b = submission.biteGram;
      totalCo2Impact += Number(b.impactCo2 || 0);
      totalGasImpact += Number(b.impactGas || 0);
      totalLightbulbImpact += Number(b.impactLightbulbs || 0);
      totalShowerImpact += Number(b.impactShowers || 0);
    }

    if (submission.byeByeBites) {
      byeByeBitesSubmissions += 1;
      const bbb = submission.byeByeBites;
      totalCarbonSavedImpact += Number(bbb.impactCarbonSaved || 0);
      totalGasImpact += Number(bbb.impactGasSaved || 0);
      totalPlasticImpact += Number(bbb.impactPlasticSaved || 0);
    }
  }

  // Level progress (specific to context)
  const levelProgress = await prisma.userLevelProgress.findFirst({
    where: { userId: user.id, context },
    orderBy: { updatedAt: 'desc' },
  });
  const currentLevel = levelProgress?.currentLevel || 0;

  // Streak progress
  const streakProgress = await prisma.userStreakProgress.findFirst({
    where: { userId: user.id, context },
    orderBy: { updatedAt: 'desc' },
  });
  const currentStreak = streakProgress?.streakCount || 0;

  // ByeByeBites-specific challenge completion
  const challengesCompleted = context === UserContext.BYEBYEBITES
    ? await prisma.userChallengeProgress.count({
        where: { userId: user.id, context, isCompleted: true },
      })
    : 0;

  // Map to schema-specific fields
  const data = {
    userId: user.id,
    context,
    totalSubmissions,
    trashDashSubmissions,
    biteGramSubmissions,
    byeByeBitesSubmissions,

    // Progress
    trashDashCurrentLevel: context === UserContext.TRASHDASH ? currentLevel : 0,
    biteGramCurrentLevel: context === UserContext.BITEGRAM ? currentLevel : 0,
    trashDashCurrentStreak: context === UserContext.TRASHDASH ? currentStreak : 0,
    biteGramCurrentStreak: context === UserContext.BITEGRAM ? currentStreak : 0,
    byeByeBitesCurrentStreak: context === UserContext.BYEBYEBITES ? currentStreak : 0,
    byeByeBitesChallengesCompleted: challengesCompleted,

    // Rewards & impact
    totalB3trEarned: new Prisma.Decimal(totalB3trEarned.toString()),
    totalCo2Impact: new Prisma.Decimal(totalCo2Impact.toString()),
    totalGasImpact: new Prisma.Decimal(totalGasImpact.toString()),
    totalPlasticImpact: new Prisma.Decimal(totalPlasticImpact.toString()),
    totalLightbulbImpact: new Prisma.Decimal(totalLightbulbImpact.toString()),
    totalShowerImpact: new Prisma.Decimal(totalShowerImpact.toString()),
    totalTurtlesImpact: new Prisma.Decimal(totalTurtlesImpact.toString()),
    totalTvHoursImpact: new Prisma.Decimal(totalTvHoursImpact.toString()),
    totalGardenFertilizedImpact: new Prisma.Decimal(totalGardenFertilizedImpact.toString()),
    totalTreesSavedImpact: new Prisma.Decimal(totalTreesSavedImpact.toString()),
    totalCarbonSavedImpact: new Prisma.Decimal(totalCarbonSavedImpact.toString()),

    // Temporal
    lastSubmissionAt: submissions.reduce((acc, s) => (acc > s.createdAt ? acc : s.createdAt), new Date(0)),
  };

  await prisma.userContextStats.upsert({
    where: {
      userId_context: {
        userId: user.id,
        context,
      },
    },
    update: data,
    create: data,
  });

  console.log(`Populated stats for user ${user.id} (${context})`);
  return data;
}

async function main() {
  try {
    // Pick a single random user across all contexts
    const totalUsers = await prisma.user.count();
    if (totalUsers === 0) {
      console.log('No users found in database');
      return;
    }

    const randomSkip = Math.floor(Math.random() * totalUsers);
    const seedUser = await prisma.user.findFirst({ skip: randomSkip });

    if (!seedUser) {
      console.log('Could not fetch random user');
      return;
    }

    console.log(`Selected vechainAddress ${seedUser.vechainAddress} as seed`);

    // Fetch all user records that share the same vechainAddress (different contexts)
    const relatedUsers = await prisma.user.findMany({
      where: { vechainAddress: seedUser.vechainAddress },
    });

    const aggregated = {
      totalSubmissions: 0,
      trashDashSubmissions: 0,
      biteGramSubmissions: 0,
      byeByeBitesSubmissions: 0,

      trashDashCurrentLevel: 0,
      biteGramCurrentLevel: 0,
      trashDashCurrentStreak: 0,
      biteGramCurrentStreak: 0,
      byeByeBitesCurrentStreak: 0,
      byeByeBitesChallengesCompleted: 0,

      totalB3trEarned: 0,
      totalCo2Impact: 0,
      totalGasImpact: 0,
      totalPlasticImpact: 0,
      totalLightbulbImpact: 0,
      totalShowerImpact: 0,
      totalTurtlesImpact: 0,
      totalTvHoursImpact: 0,
      totalGardenFertilizedImpact: 0,
      totalTreesSavedImpact: 0,
      totalCarbonSavedImpact: 0,

      lastSubmissionAt: new Date(0),
    };

    for (const user of relatedUsers) {
      // computeStatsForUser now returns the data object used
      const data = await computeStatsForUser(user);

      // Sum totals
      for (const key of Object.keys(aggregated)) {
        if (key === 'lastSubmissionAt') {
          aggregated.lastSubmissionAt = aggregated.lastSubmissionAt > data.lastSubmissionAt ? aggregated.lastSubmissionAt : data.lastSubmissionAt;
        } else {
          aggregated[key] += Number(data[key] || 0);
        }
      }
    }

    // Insert aggregated row (context null) under the first user's id (arbitrary)
    const aggData = {
      userId: seedUser.id,
      context: null,
      ...aggregated,

      // Convert numeric sums to Decimal where needed
      totalB3trEarned: new Prisma.Decimal(aggregated.totalB3trEarned.toString()),
      totalCo2Impact: new Prisma.Decimal(aggregated.totalCo2Impact.toString()),
      totalGasImpact: new Prisma.Decimal(aggregated.totalGasImpact.toString()),
      totalPlasticImpact: new Prisma.Decimal(aggregated.totalPlasticImpact.toString()),
      totalLightbulbImpact: new Prisma.Decimal(aggregated.totalLightbulbImpact.toString()),
      totalShowerImpact: new Prisma.Decimal(aggregated.totalShowerImpact.toString()),
      totalTurtlesImpact: new Prisma.Decimal(aggregated.totalTurtlesImpact.toString()),
      totalTvHoursImpact: new Prisma.Decimal(aggregated.totalTvHoursImpact.toString()),
      totalGardenFertilizedImpact: new Prisma.Decimal(aggregated.totalGardenFertilizedImpact.toString()),
      totalTreesSavedImpact: new Prisma.Decimal(aggregated.totalTreesSavedImpact.toString()),
      totalCarbonSavedImpact: new Prisma.Decimal(aggregated.totalCarbonSavedImpact.toString()),
    };

    // Find existing record with null context
    const existingRecord = await prisma.userContextStats.findFirst({
      where: {
        userId: seedUser.id,
        context: null,
      },
    });

    if (existingRecord) {
      // Update existing record
      await prisma.userContextStats.update({
        where: {
          id: existingRecord.id,
        },
        data: aggData,
      });
    } else {
      // Create new record
      await prisma.userContextStats.create({
        data: aggData,
      });
    }

    console.log('✅ UserContextStats population completed (including aggregated row)');
  } catch (error) {
    console.error('❌ Error populating UserContextStats:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 
