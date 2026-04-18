import { useContext, useTask$, useSignal } from "@builder.io/qwik";
import { CopilotKitContextId } from "../context/copilot-context";

/**
 * Options for the useCopilotReadable hook.
 */
export interface UseCopilotReadableOptions {
  /**
   * The description of the information to be added to the Copilot context.
   */
  description: string;
  /**
   * The value to be added to the Copilot context. Object values are
   * automatically stringified.
   */
  value: unknown;
  /**
   * Whether the context is available to the Copilot.
   */
  available?: "enabled" | "disabled";
  /**
   * A custom conversion function to serialize the value to a string. If not
   * provided, the value will be serialized using `JSON.stringify`.
   */
  convert?: (description: string, value: unknown) => string;
}

/**
 * Adds the given information to the Copilot context to make it readable
 * by the Copilot. This is the Qwik equivalent of the React
 * `useCopilotReadable` hook.
 *
 * ## Usage
 *
 * ```tsx
 * import { useCopilotReadable } from "@copilotkit/qwik";
 *
 * export const MyComponent = component$(() => {
 *   const employees = useSignal([]);
 *
 *   useCopilotReadable({
 *     description: "The list of employees",
 *     value: employees.value,
 *   });
 *
 *   return <div>...</div>;
 * });
 * ```
 */
export function useCopilotReadable(
  options: UseCopilotReadableOptions,
): void {
  const ctx = useContext(CopilotKitContextId);
  const ctxIdRef = useSignal<string | undefined>(undefined);

  useTask$(({ track, cleanup }) => {
    track(() => options.description);
    track(() => options.value);
    track(() => options.available);
    track(() => options.convert);

    const core = ctx.core;

    if (options.available === "disabled") {
      if (ctxIdRef.value) {
        core.removeContext(ctxIdRef.value);
        ctxIdRef.value = undefined;
      }
      return;
    }

    const serialized = options.convert
      ? options.convert(options.description, options.value)
      : JSON.stringify(options.value);

    ctxIdRef.value = core.addContext({
      description: options.description,
      value: serialized,
    });

    cleanup(() => {
      if (ctxIdRef.value) {
        core.removeContext(ctxIdRef.value);
        ctxIdRef.value = undefined;
      }
    });
  });
}
