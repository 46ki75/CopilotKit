import { createContextId } from '@builder.io/qwik';
import type { NoSerialize, Signal } from '@builder.io/qwik';
import type {
  CopilotKitCore,
  CopilotKitCoreErrorCode,
  CopilotRuntimeTransport,
} from "@copilotkit/core";
import type { AbstractAgent } from "@ag-ui/client";

/**
 * Configuration options for the CopilotKit Qwik provider.
 */
export interface CopilotKitConfig {
  /**
   * The endpoint for the Copilot Runtime instance.
   */
  runtimeUrl?: string;

  /**
   * Transport style for the CopilotRuntime endpoint.
   * Defaults to "auto".
   */
  runtimeTransport?: CopilotRuntimeTransport;

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

  /**
   * The Copilot Cloud public API key.
   */
  publicApiKey?: string;

  /**
   * Agents for local development without a CopilotRuntime endpoint.
   * Use only in development; production requires a CopilotRuntime.
   */
  agents__unsafe_dev_only?: Record<string, AbstractAgent>;

  /**
   * Error handler called when CopilotKit encounters an error.
   */
  onError?: (event: {
    error: Error;
    code: CopilotKitCoreErrorCode;
    context: Record<string, unknown>;
  }) => void | Promise<void>;
}

/**
 * The context value provided by the CopilotKit provider.
 *
 * `coreRef` is wrapped in `NoSerialize` because `CopilotKitCore` is a
 * non-serializable class instance that is only available on the client.
 */
export interface CopilotKitContextValue {
  coreRef: Signal<NoSerialize<CopilotKitCore> | undefined>;
  isLoading: Signal<boolean>;
}

/**
 * Qwik context ID for CopilotKit.
 */
export const CopilotKitContextId =
  createContextId<CopilotKitContextValue>("copilotkit.context");
