import { UserContext, RewardConfigType } from "@prisma/client";

export interface DefaultRewardConfig {
  context: UserContext;
  type: RewardConfigType;
  payload: Record<string, unknown>;
}

// Import the data from the JavaScript version to maintain single source of truth
import { DEFAULT_REWARD_CONFIGS as rawConfigs } from "./reward-configs.js";

// Type-cast the imported configs to ensure type safety
export const DEFAULT_REWARD_CONFIGS: Record<
  UserContext,
  DefaultRewardConfig[]
> = rawConfigs;
