import { useContext, useSignal, useTask$ } from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";
import type { FrontendToolHandlerContext } from "@copilotkit/core";
import { CopilotKitContextId } from "../context/copilot-context";

/**
 * Configuration for a v2 frontend tool.
 */
export interface FrontendToolConfig<
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
   * The handler function invoked when the LLM calls the tool.
   * Use a Qwik QRL (`$()`) to ensure it is serializable.
   */
  handler?: QRL<
    (args: T, context: FrontendToolHandlerContext) => Promise<unknown> | unknown
  >;

  /**
   * When `false`, the tool is hidden from the LLM without being unregistered.
   * Defaults to `true`.
   */
  available?: boolean;

  /**
   * Optionally restrict this tool to a specific agent ID.
   * When omitted, the tool is available to all agents.
   */
  agentId?: string;
}

/**
 * Registers a typed v2 frontend tool that can be called by the AI Copilot.
 * This is the Qwik equivalent of `useFrontendTool` from `@copilotkit/react-core`.
 *
 * Unlike the v1 `useCopilotAction`, `useFrontendTool` maps directly to the
 * `FrontendTool` type used by `@copilotkit/core` and supports per-agent
 * scoping via `agentId`.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$, $ } from "@builder.io/qwik";
 * import { useFrontendTool } from "@copilotkit/qwik";
 *
 * export const MyComponent = component$(() => {
 *   useFrontendTool({
 *     name: "showAlert",
 *     description: "Display an alert message to the user.",
 *     handler: $(async ({ message }) => {
 *       alert(message as string);
 *     }),
 *   });
 *
 *   return <div>...</div>;
 * });
 * ```
 */
export function useFrontendTool<
  T extends Record<string, unknown> = Record<string, unknown>,
>(tool: FrontendToolConfig<T>): void {
  const ctx = useContext(CopilotKitContextId);
  const registered = useSignal(false);

  useTask$(({ track, cleanup }) => {
    track(() => tool.name);
    track(() => tool.description);
    track(() => tool.available);
    track(() => tool.agentId);
    track(() => tool.handler);
    track(() => ctx.coreRef.value);

    const core = ctx.coreRef.value;
    if (!core) return;

    const { name, description, handler, available, agentId } = tool;

    if (available === false) {
      if (registered.value) {
        core.removeTool(name, agentId);
        registered.value = false;
      }
      return;
    }

    // Remove existing registration before re-adding (handles updates).
    if (registered.value) {
      core.removeTool(name, agentId);
    }

    core.addTool({
      name,
      description,
      agentId,
      available: available ?? true,
      handler: handler
        ? async (args: T, context: FrontendToolHandlerContext) =>
            handler(args, context)
        : undefined,
    });
    registered.value = true;

    cleanup(() => {
      if (registered.value && ctx.coreRef.value) {
        ctx.coreRef.value.removeTool(name, agentId);
        registered.value = false;
      }
    });
  });
}
