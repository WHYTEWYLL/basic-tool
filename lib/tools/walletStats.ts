import { z } from "zod";
import { Tool } from "ai";
import { PrismaClient as PrismaClient } from ".prisma/client";

const prisma = new PrismaClient();

// Define the enum values as a const for zod and reuse
const userContextValues = [
  "B3TRBUDDY",
  "BYEBYEBITES",
  "BITEGRAM",
  "TRASHDASH",
] as const;
type UserContext = (typeof userContextValues)[number];

const ecosystemInfo = {
  BITEGRAM: {
    description:
      "An app where users share pictures of their meals to promote sustainable eating habits and earn rewards.",
    trackedMetrics: [
      "biteGramSubmissions",
      "biteGramCurrentLevel",
      "biteGramCurrentStreak",
      "totalB3trEarned",
      "totalCo2Impact",
      "totalGasImpact",
    ],
  },
  TRASHDASH: {
    description:
      "An app that gamifies cleaning up litter. Users take pictures of trash they've collected to earn rewards and track their environmental impact.",
    trackedMetrics: [
      "trashDashSubmissions",
      "trashDashCurrentLevel",
      "trashDashCurrentStreak",
      "totalPlasticImpact",
      "totalTurtlesImpact",
      "totalTreesSavedImpact",
    ],
  },
  BYEBYEBITES: {
    description:
      "An app designed to reduce food waste by helping users track food inventory, find recipes for expiring items, and complete challenges.",
    trackedMetrics: [
      "byeByeBitesSubmissions",
      "byeByeBitesCurrentStreak",
      "byeByeBitesChallengesCompleted",
      "totalB3trEarned",
      "totalCarbonSavedImpact",
    ],
  },
};

// A type guard to check for Decimal-like objects
function isDecimal(value: any): value is { toFixed: () => string } {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.toFixed === "function"
  );
}

// Helper function to check for BigInt
function isBigInt(value: any): value is bigint {
  return typeof value === "bigint";
}

// Helper function to serialize data safely (handles BigInt, Decimal, etc.)
function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (isBigInt(data)) {
    return data.toString();
  }

  if (isDecimal(data)) {
    return formatDecimal(data);
  }

  if (Array.isArray(data)) {
    return data.map(serializeData);
  }

  if (typeof data === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeData(value);
    }
    return result;
  }

  return data;
}

// Helper function to format decimal values
function formatDecimal(value: any): string {
  if (isDecimal(value)) {
    const num = parseFloat(value.toFixed());
    return num.toLocaleString();
  }
  return String(value);
}

// Helper function to generate SQL based on user query
function generateSQLFromQuery(
  userQuery: string,
  userId?: string
): { sql: string; type: "user" | "aggregate" | "general" } {
  const query = userQuery.toLowerCase();

  // Check for pineapple - return all data
  if (query.includes("pineapple")) {
    return {
      sql: `SELECT * FROM "UserContextStats" ORDER BY "createdAt" DESC LIMIT 50`,
      type: "aggregate",
    };
  }

  // Check if user is asking about specific user data
  if (
    userId &&
    (query.includes("my") ||
      query.includes("user") ||
      query.includes("wallet") ||
      query.includes("address"))
  ) {
    return {
      sql: `SELECT * FROM "UserContextStats" WHERE "userId" = '${userId}' ORDER BY "createdAt" DESC LIMIT 10`,
      type: "user",
    };
  }

  // Check if user is asking about specific app
  if (query.includes("bitegram") || query.includes("bitegram")) {
    return {
      sql: `SELECT 
        COUNT(*) as total_users,
        SUM("biteGramSubmissions") as total_submissions,
        AVG("biteGramCurrentLevel") as avg_level,
        AVG("biteGramCurrentStreak") as avg_streak,
        SUM("totalB3trEarned") as total_b3tr_earned,
        SUM("totalCo2Impact") as total_co2_impact
      FROM "UserContextStats" 
      WHERE "context" = 'BITEGRAM' OR "biteGramSubmissions" > 0`,
      type: "aggregate",
    };
  }

  if (query.includes("trashdash") || query.includes("trash dash")) {
    return {
      sql: `SELECT 
        COUNT(*) as total_users,
        SUM("trashDashSubmissions") as total_submissions,
        AVG("trashDashCurrentLevel") as avg_level,
        AVG("trashDashCurrentStreak") as avg_streak,
        SUM("totalPlasticImpact") as total_plastic_impact,
        SUM("totalTurtlesImpact") as total_turtles_impact,
        SUM("totalTreesSavedImpact") as total_trees_saved
      FROM "UserContextStats" 
      WHERE "context" = 'TRASHDASH' OR "trashDashSubmissions" > 0`,
      type: "aggregate",
    };
  }

  if (query.includes("byebyebites") || query.includes("bye bye bites")) {
    return {
      sql: `SELECT 
        COUNT(*) as total_users,
        SUM("byeByeBitesSubmissions") as total_submissions,
        AVG("byeByeBitesCurrentStreak") as avg_streak,
        SUM("byeByeBitesChallengesCompleted") as total_challenges,
        SUM("totalCarbonSavedImpact") as total_carbon_saved
      FROM "UserContextStats" 
      WHERE "context" = 'BYEBYEBITES' OR "byeByeBitesSubmissions" > 0`,
      type: "aggregate",
    };
  }

  // Check if user is asking about environmental impact
  if (
    query.includes("impact") ||
    query.includes("environment") ||
    query.includes("sustainability")
  ) {
    return {
      sql: `SELECT 
        SUM("totalCo2Impact") as total_co2_impact,
        SUM("totalCarbonSavedImpact") as total_carbon_saved,
        SUM("totalPlasticImpact") as total_plastic_impact,
        SUM("totalTurtlesImpact") as total_turtles_impact,
        SUM("totalTreesSavedImpact") as total_trees_saved,
        SUM("totalGasImpact") as total_gas_impact
      FROM "UserContextStats"`,
      type: "aggregate",
    };
  }

  // Check if user is asking about rewards/earnings
  if (
    query.includes("reward") ||
    query.includes("earn") ||
    query.includes("b3tr")
  ) {
    return {
      sql: `SELECT 
        SUM("totalB3trEarned") as total_b3tr_earned,
        COUNT(*) as total_users,
        AVG("totalB3trEarned") as avg_b3tr_per_user
      FROM "UserContextStats"`,
      type: "aggregate",
    };
  }

  // Check if user is asking about submissions/activity
  if (
    query.includes("submission") ||
    query.includes("activity") ||
    query.includes("total")
  ) {
    return {
      sql: `SELECT 
        SUM("totalSubmissions") as total_submissions,
        SUM("trashDashSubmissions") as trashdash_submissions,
        SUM("biteGramSubmissions") as bitegram_submissions,
        SUM("byeByeBitesSubmissions") as byebyebites_submissions,
        COUNT(*) as total_users
      FROM "UserContextStats"`,
      type: "aggregate",
    };
  }

  // Default to general ecosystem info
  return {
    sql: "",
    type: "general",
  };
}

export const walletStats: Tool = {
  description:
    "A dynamic tool for retrieving statistics about VeChain/VeBetter ecosystem. It can fetch user-specific stats (if userId provided) or general ecosystem data based on the user's query. The tool intelligently generates SQL queries based on what the user is asking about.",
  parameters: z.object({
    userQuery: z
      .string()
      .describe(
        "The user's question or query that determines what data to retrieve"
      ),
    userId: z
      .string()
      .uuid()
      .optional()
      .describe(
        "The UUID of the user to look up (e.g., '36d6253f-5561-4dfb-af60-a292eb44f86c'). If omitted, returns general ecosystem data."
      ),
  }),
  async execute({ userQuery, userId }) {
    try {
      // Generate SQL based on the user's query
      const { sql, type } = generateSQLFromQuery(userQuery, userId);

      if (type === "general") {
        return {
          type: "ecosystem_info",
          data: ecosystemInfo,
          message: "Here's information about the VeBetter ecosystem apps:",
        };
      }

      // Execute the generated SQL query
      const result = await prisma.$queryRawUnsafe(sql);

      // Log the raw result with BigInt handling
      console.log(
        "🔍 Raw query result:",
        JSON.stringify(
          result,
          (key, value) => {
            if (typeof value === "bigint") {
              return value.toString();
            }
            return value;
          },
          2
        )
      );

      // Format the results
      let formattedResult;
      if (Array.isArray(result) && result.length > 0) {
        const data = result[0];
        formattedResult = serializeData(data);
      } else {
        formattedResult = serializeData(result);
      }

      return {
        type: type,
        query: userQuery,
        data: formattedResult,
        message: `Retrieved data for: ${userQuery}`,
      };
    } catch (error) {
      console.error("❌ SQL query failed:", error);

      // Fallback to general ecosystem info
      return {
        type: "ecosystem_info",
        data: ecosystemInfo,
        message:
          "I couldn't retrieve the specific data you requested, but here's general information about the VeBetter ecosystem:",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
