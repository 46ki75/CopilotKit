import { useContext, useSignal } from "@builder.io/qwik";
import { CopilotKitContextId } from "../context/copilot-context";

/**
 * Return type for the useCopilotChat hook.
 */
export interface UseCopilotChatReturn {
  /**
   * Whether the chat is currently generating a response.
   */
  isLoading: boolean;

  /**
   * Stop the current message generation process.
   */
  stopGeneration: () => void;

  /**
   * Clear all messages and reset the chat state.
   */
  reset: () => void;
}

/**
 * Options for the useCopilotChat hook.
 */
export interface UseCopilotChatOptions {
  /**
   * The ID of the agent to use.
   */
  agent?: string;
}

/**
 * A lightweight hook for headless chat interactions in Qwik. This is the
 * Qwik equivalent of the React `useCopilotChat` hook.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$ } from "@builder.io/qwik";
 * import { useCopilotChat } from "@copilotkit/qwik";
 *
 * export const MyComponent = component$(() => {
 *   const { isLoading, stopGeneration, reset } = useCopilotChat();
 *
 *   return (
 *     <div>
 *       <p>{isLoading ? "Generating..." : "Idle"}</p>
 *       <button onClick$={() => stopGeneration()}>Stop</button>
 *       <button onClick$={() => reset()}>Reset</button>
 *     </div>
 *   );
 * });
 * ```
 */
export function useCopilotChat(
  _options: UseCopilotChatOptions = {},
): UseCopilotChatReturn {
  const ctx = useContext(CopilotKitContextId);
  const isLoading = useSignal(false);

  return {
    get isLoading() {
      return isLoading.value;
    },
    stopGeneration: () => {
      const agents = ctx.core.agents;
      for (const agent of Object.values(agents)) {
        ctx.core.stopAgent({ agent });
      }
    },
    reset: () => {
      const agents = ctx.core.agents;
      for (const agent of Object.values(agents)) {
        ctx.core.stopAgent({ agent });
      }
    },
  };
}
