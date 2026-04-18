import { useContext, useTask$, useSignal } from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";
import { CopilotKitContextId } from "../context/copilot-context";

/**
 * Options for the useCopilotAction hook.
 */
export interface UseCopilotActionOptions {
  /**
   * The name of the action.
   */
  name: string;
  /**
   * A description of what the action does.
   */
  description?: string;
  /**
   * The handler function that is called when the action is executed.
   * In Qwik, this should be a QRL for serialization.
   */
  handler: QRL<(args: Record<string, unknown>) => Promise<unknown> | unknown>;
  /**
   * Whether the action is available.
   */
  available?: "enabled" | "disabled";
}

/**
 * Registers a frontend action that can be called by the AI Copilot.
 * This is the Qwik equivalent of the React `useCopilotAction` hook.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$, $ } from "@builder.io/qwik";
 * import { useCopilotAction } from "@copilotkit/qwik";
 *
 * export const MyComponent = component$(() => {
 *   useCopilotAction({
 *     name: "sayHello",
 *     description: "Say hello to someone.",
 *     handler: $(async ({ name }) => {
 *       alert(`Hello, ${name}!`);
 *     }),
 *   });
 *
 *   return <div>...</div>;
 * });
 * ```
 */
export function useCopilotAction(options: UseCopilotActionOptions): void {
  const ctx = useContext(CopilotKitContextId);
  const registered = useSignal(false);

  useTask$(({ track, cleanup }) => {
    track(() => options.name);
    track(() => options.description);
    track(() => options.available);
    track(() => ctx.coreRef.value);

    const core = ctx.coreRef.value;
    if (!core) return;

    const toolName = options.name;

    if (options.available === "disabled") {
      if (registered.value) {
        core.removeTool(toolName);
        registered.value = false;
      }
      return;
    }

    core.addTool({
      name: toolName,
      description: options.description ?? "",
      handler: async (args: Record<string, unknown>) => {
        return options.handler(args);
      },
    });
    registered.value = true;

    cleanup(() => {
      if (registered.value && ctx.coreRef.value) {
        ctx.coreRef.value.removeTool(toolName);
        registered.value = false;
      }
    });
  });
}
