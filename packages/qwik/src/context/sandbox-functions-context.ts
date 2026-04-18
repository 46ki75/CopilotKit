import { createContextId, useContext } from "@builder.io/qwik";
import type { SandboxFunction } from "../types/sandbox-function";

export const SandboxFunctionsContextId = createContextId<
  readonly SandboxFunction[]
>("copilotkit.sandbox-functions");

/**
 * Hook to access the registered sandbox functions.
 * Returns an empty array if no provider is present.
 */
export function useSandboxFunctions(): readonly SandboxFunction[] {
  return useContext(SandboxFunctionsContextId, []);
}
