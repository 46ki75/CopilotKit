import type { Parameter } from "@copilotkit/shared";

/**
 * The availability of a frontend action.
 */
export type FrontendActionAvailability = "enabled" | "disabled";

/**
 * Represents a frontend action that can be called by the AI Copilot.
 */
export interface FrontendAction<T extends Parameter[] | [] = []> {
  /**
   * The name of the action.
   */
  name: string;

  /**
   * A description of what the action does.
   */
  description?: string;

  /**
   * The parameters of the action.
   */
  parameters?: T;

  /**
   * The handler function that is called when the action is executed.
   */
  handler: (args: Record<string, unknown>) => Promise<unknown> | unknown;

  /**
   * Whether the action is available.
   */
  available?: FrontendActionAvailability;
}
