export type SystemPrompt = string;

export type SystemPromptWithArgs<T extends Record<string, unknown>> = (args: T) => SystemPrompt;

export type VeHelperSystemPromptArgs = {
  relevantContent?: string;
  [key: string]: unknown;
};