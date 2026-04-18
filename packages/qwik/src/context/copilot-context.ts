import {
  createContextId,
  type Signal,
} from "@builder.io/qwik";
import type { CopilotKitCore } from "@copilotkit/core";

/**
 * Configuration options for the CopilotKit Qwik provider.
 */
export interface CopilotKitConfig {
  /**
   * The endpoint for the Copilot Runtime instance.
   */
  runtimeUrl?: string;

  /**
   * Additional headers to be sent with the request.
   */
  headers?: Record<string, string>;

  /**
   * Indicates whether the user agent should send or receive cookies from the
   * other domain in the case of cross-origin requests.
   */
  credentials?: RequestCredentials;

  /**
   * Custom properties to be sent with the request.
   */
  properties?: Record<string, unknown>;
}

/**
 * The context value provided by the CopilotKit provider.
 */
export interface CopilotKitContextValue {
  core: CopilotKitCore;
  isLoading: Signal<boolean>;
}

/**
 * Qwik context ID for CopilotKit.
 */
export const CopilotKitContextId =
  createContextId<CopilotKitContextValue>("copilotkit.context");
