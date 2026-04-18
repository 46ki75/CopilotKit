import { useContext, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { QRL, Signal } from "@builder.io/qwik";
import type { FrontendToolHandlerContext } from "@copilotkit/core";
import { CopilotKitContextId } from "../context/copilot-context";

/**
 * Configuration for a human-in-the-loop tool.
 */
export interface HumanInTheLoopConfig<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * The name of the tool.
   */
  name: string;

  /**
   * A description of what the tool does. Shown to the LLM.
   */
  description?: string;

  /**
   * Optionally restrict this tool to a specific agent ID.
   */
  agentId?: string;
}

/**
 * Return value from the useHumanInTheLoop hook.
 */
export interface UseHumanInTheLoopReturn<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * Reactive signal indicating whether the tool is currently waiting
   * for a human response.
   */
  isWaiting: Signal<boolean>;

  /**
   * Reactive signal containing the current tool call arguments when
   * a human response is pending, or `null` otherwise.
   */
  args: Signal<T | null>;

  /**
   * Call this function to provide the human response and resume the
   * agent execution. Calling this when `isWaiting` is `false` is a
   * no-op.
   */
  respond: (result: unknown) => void;
}

/**
 * Registers a human-in-the-loop tool that pauses agent execution until a
 * human provides a response. This is the Qwik equivalent of the React
 * `useHumanInTheLoop` hook from `@copilotkit/react-core`.
 *
 * Unlike the React version which renders a React component, the Qwik
 * version exposes reactive signals (`isWaiting`, `args`) and a `respond`
 * callback so you can build your approval UI declaratively.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$ } from "@builder.io/qwik";
 * import { useHumanInTheLoop } from "@cloud.ikuma/copilotkit-qwik";
 *
 * export const ApprovalUI = component$(() => {
 *   const { isWaiting, args, respond } = useHumanInTheLoop({
 *     name: "approveAction",
 *     description: "Ask the user for approval before proceeding.",
 *   });
 *
 *   return (
 *     <div>
 *       {isWaiting.value && (
 *         <div>
 *           <p>Approve action: {JSON.stringify(args.value)}</p>
 *           <button onClick$={() => respond({ approved: true })}>
 *             Approve
 *           </button>
 *           <button onClick$={() => respond({ approved: false })}>
 *             Reject
 *           </button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * });
 * ```
 */
export function useHumanInTheLoop<
  T extends Record<string, unknown> = Record<string, unknown>,
>(config: HumanInTheLoopConfig<T>): UseHumanInTheLoopReturn<T> {
  const ctx = useContext(CopilotKitContextId);
  const registered = useSignal(false);
  const isWaitingSig = useSignal(false);
  const argsSig = useSignal<T | null>(null);
  const resolveRef = useSignal<((result: unknown) => void) | null>(null);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => config.name);
    track(() => config.description);
    track(() => config.agentId);
    track(() => ctx.coreRef.value);

    const core = ctx.coreRef.value;
    if (!core) return;

    const { name, description, agentId } = config;

    // Remove existing registration before re-adding (handles updates).
    if (registered.value) {
      core.removeTool(name, agentId);
    }

    core.addTool({
      name,
      description,
      agentId,
      available: true,
      handler: async (args: T, _context: FrontendToolHandlerContext) => {
        argsSig.value = args;
        isWaitingSig.value = true;

        return new Promise((resolve) => {
          resolveRef.value = resolve;
        });
      },
    });
    registered.value = true;

    cleanup(() => {
      if (registered.value && ctx.coreRef.value) {
        ctx.coreRef.value.removeTool(name, agentId);
        registered.value = false;
      }
      // Clean up any pending promise
      if (resolveRef.value) {
        resolveRef.value(null);
        resolveRef.value = null;
      }
      isWaitingSig.value = false;
      argsSig.value = null;
    });
  });

  return {
    isWaiting: isWaitingSig,
    args: argsSig,
    respond: (result: unknown) => {
      if (resolveRef.value) {
        resolveRef.value(result);
        resolveRef.value = null;
        isWaitingSig.value = false;
        argsSig.value = null;
      }
    },
  };
}
