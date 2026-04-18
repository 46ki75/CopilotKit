import { describe, it, expect } from "vitest";

/**
 * Verify that the non-component public symbols are correctly exported
 * from their individual modules.
 *
 * Note: Qwik components use the `$()` optimizer which requires the Qwik
 * build pipeline. We cannot import `component$`-based modules in plain
 * Vitest, so we test the hook and context modules individually here.
 */
describe("@copilotkit/qwik module exports", () => {
  // ---- Context ----
  it("should export CopilotKitContextId from context module", async () => {
    const mod = await import("../context/copilot-context");
    expect(mod.CopilotKitContextId).toBeDefined();
  });

  // ---- Hooks ----
  it("should export useCopilotContext from hooks module", async () => {
    const mod = await import("../hooks/use-copilot-context");
    expect(mod.useCopilotContext).toBeDefined();
    expect(typeof mod.useCopilotContext).toBe("function");
  });

  it("should export requireCore from hooks module", async () => {
    const mod = await import("../hooks/use-copilot-context");
    expect(mod.requireCore).toBeDefined();
    expect(typeof mod.requireCore).toBe("function");
  });

  it("should export useCopilotReadable from hooks module", async () => {
    const mod = await import("../hooks/use-copilot-readable");
    expect(mod.useCopilotReadable).toBeDefined();
    expect(typeof mod.useCopilotReadable).toBe("function");
  });

  it("should export useCopilotAction from hooks module", async () => {
    const mod = await import("../hooks/use-copilot-action");
    expect(mod.useCopilotAction).toBeDefined();
    expect(typeof mod.useCopilotAction).toBe("function");
  });

  it("should export useCopilotChat from hooks module", async () => {
    const mod = await import("../hooks/use-copilot-chat");
    expect(mod.useCopilotChat).toBeDefined();
    expect(typeof mod.useCopilotChat).toBe("function");
  });

  // ---- Barrel re-exports (hooks index) ----
  it("should re-export all hooks from hooks/index", async () => {
    const mod = await import("../hooks/index");
    expect(mod.useCopilotContext).toBeDefined();
    expect(mod.requireCore).toBeDefined();
    expect(mod.useCopilotReadable).toBeDefined();
    expect(mod.useCopilotAction).toBeDefined();
    expect(mod.useCopilotChat).toBeDefined();
  });

  // ---- Barrel re-exports (context index) ----
  it("should re-export CopilotKitContextId from context/index", async () => {
    const mod = await import("../context/index");
    expect(mod.CopilotKitContextId).toBeDefined();
  });
});
