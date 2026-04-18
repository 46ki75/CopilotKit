import { useContext } from "@builder.io/qwik";
import type { CopilotKitCore } from "@copilotkit/core";
import { CopilotKitContextId } from "../context/copilot-context";
import type { CopilotKitContextValue } from "../context/copilot-context";

/**
 * Hook to access the CopilotKit context in Qwik components.
 *
 * Must be used within a `CopilotKit` component.
 *
 * @returns The CopilotKit context value containing the core instance and loading state.
 */
export function useCopilotContext(): CopilotKitContextValue {
  return useContext(CopilotKitContextId);
}

/**
 * Helper to get the CopilotKitCore instance from context, throwing if not yet
 * initialized (i.e., before the client-side `useVisibleTask$` has run).
 */
export function requireCore(ctx: CopilotKitContextValue): CopilotKitCore {
  const core = ctx.coreRef.value;
  if (!core) {
    throw new Error(
      "CopilotKitCore is not yet initialized. " +
        "Make sure this code runs on the client within a <CopilotKit> provider.",
    );
  }
  return core;
}
