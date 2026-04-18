import { useContext, useSignal, useTask$ } from "@builder.io/qwik";
import { CopilotKitContextId } from "../context/copilot-context";

/**
 * Represents any value that can be serialized to JSON.
 */
export type JsonSerializable =
  | string
  | number
  | boolean
  | null
  | JsonSerializable[]
  | { [key: string]: JsonSerializable };

/**
 * Input for the useAgentContext hook.
 */
export interface AgentContextInput {
  /**
   * A human-readable description of what this context represents.
   */
  description: string;

  /**
   * The context value. Objects and arrays are automatically serialized to JSON.
   */
  value: JsonSerializable;

  /**
   * Whether this context entry is active. Set to "disabled" to temporarily
   * remove it from the agent context without unmounting the component.
   */
  available?: "enabled" | "disabled";
}

/**
 * Provides typed, JSON-serializable context to the CopilotKit agent.
 * This is the v2 equivalent of `useCopilotReadable` with a cleaner,
 * type-safe API. It is the Qwik counterpart of the React
 * `useAgentContext` hook from `@copilotkit/react-core`.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$, useSignal } from "@builder.io/qwik";
 * import { useAgentContext } from "@copilotkit/qwik";
 *
 * export const EmployeeList = component$(() => {
 *   const employees = useSignal([{ name: "Alice" }, { name: "Bob" }]);
 *
 *   useAgentContext({
 *     description: "List of employees in the current team",
 *     value: employees.value,
 *   });
 *
 *   return <div>...</div>;
 * });
 * ```
 */
export function useAgentContext(input: AgentContextInput): void {
  const ctx = useContext(CopilotKitContextId);
  const contextIdRef = useSignal<string | undefined>(undefined);

  useTask$(({ track, cleanup }) => {
    track(() => input.description);
    track(() => input.value);
    track(() => input.available);
    track(() => ctx.coreRef.value);

    const core = ctx.coreRef.value;
    if (!core) return;

    if (input.available === "disabled") {
      if (contextIdRef.value) {
        core.removeContext(contextIdRef.value);
        contextIdRef.value = undefined;
      }
      return;
    }

    const serialized =
      typeof input.value === "string"
        ? input.value
        : JSON.stringify(input.value);

    contextIdRef.value = core.addContext({
      description: input.description,
      value: serialized,
    });

    cleanup(() => {
      if (contextIdRef.value && ctx.coreRef.value) {
        ctx.coreRef.value.removeContext(contextIdRef.value);
        contextIdRef.value = undefined;
      }
    });
  });
}
