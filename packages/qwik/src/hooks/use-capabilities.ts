import { useComputed$ } from "@builder.io/qwik";
import type { AgentCapabilities } from "@ag-ui/client";
import { useAgent } from "./use-agent";

/**
 * Returns the capabilities declared by the given agent (or the default agent)
 * as a reactive Qwik signal. Capabilities are populated from the runtime
 * `/info` response at connection time. The signal value will be `undefined`
 * until the runtime handshake completes.
 *
 * This is the Qwik equivalent of the React `useCapabilities` hook from
 * `@copilotkit/react-core`.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$ } from "@builder.io/qwik";
 * import { CopilotKit, useCapabilities } from "@cloud.ikuma/copilotkit-qwik";
 *
 * export const MyComponent = component$(() => {
 *   const capabilities = useCapabilities();
 *
 *   return (
 *     <div>
 *       {capabilities.value ? (
 *         <p>Agent supports streaming: {String(capabilities.value.streaming)}</p>
 *       ) : (
 *         <p>Capabilities not yet available.</p>
 *       )}
 *     </div>
 *   );
 * });
 * ```
 *
 * @param agentId - Optional agent ID. If omitted, uses the default agent.
 * @returns A reactive signal containing the agent's capabilities, or
 *          `undefined` if the agent doesn't declare capabilities or has
 *          not yet connected.
 */
export function useCapabilities(agentId?: string) {
  const { agent } = useAgent({ agentId });

  const capabilities = useComputed$<AgentCapabilities | undefined>(() => {
    const a = agent.value;
    if (a && "capabilities" in a) {
      return (a as { capabilities?: AgentCapabilities }).capabilities;
    }
    return undefined;
  });

  return capabilities;
}
