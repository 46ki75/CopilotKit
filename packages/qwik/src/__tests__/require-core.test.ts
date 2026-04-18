import { describe, it, expect } from "vitest";
import { requireCore } from "../hooks/use-copilot-context";
import type { CopilotKitContextValue } from "../context/copilot-context";
import type { Signal } from "@builder.io/qwik";

/**
 * Creates a minimal mock of `CopilotKitContextValue` for unit-testing
 * `requireCore`. We only need the `coreRef` signal shape.
 */
function createMockContext(
  coreValue: unknown,
): CopilotKitContextValue {
  return {
    coreRef: { value: coreValue } as Signal<any>,
    isLoading: { value: false } as Signal<boolean>,
  };
}

describe("requireCore", () => {
  it("should return the core instance when it is defined", () => {
    const fakeCore = { addContext: () => {}, removeContext: () => {} };
    const ctx = createMockContext(fakeCore);
    const result = requireCore(ctx);
    expect(result).toBe(fakeCore);
  });

  it("should throw when coreRef.value is undefined", () => {
    const ctx = createMockContext(undefined);
    expect(() => requireCore(ctx)).toThrow(
      "CopilotKitCore is not yet initialized",
    );
  });

  it("should throw when coreRef.value is null", () => {
    const ctx = createMockContext(null);
    expect(() => requireCore(ctx)).toThrow(
      "CopilotKitCore is not yet initialized",
    );
  });

  it("should include guidance about <CopilotKit> provider in the error", () => {
    const ctx = createMockContext(undefined);
    expect(() => requireCore(ctx)).toThrow("<CopilotKit> provider");
  });
});
