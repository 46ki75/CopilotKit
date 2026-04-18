import { useContext } from "@builder.io/qwik";
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
