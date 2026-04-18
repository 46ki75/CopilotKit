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

  // ---- v2 API hooks ----
  it("should export useAgent from hooks module", async () => {
    const mod = await import("../hooks/use-agent");
    expect(mod.useAgent).toBeDefined();
    expect(typeof mod.useAgent).toBe("function");
  });

  it("should export useAgentContext from hooks module", async () => {
    const mod = await import("../hooks/use-agent-context");
    expect(mod.useAgentContext).toBeDefined();
    expect(typeof mod.useAgentContext).toBe("function");
  });

  it("should export useFrontendTool from hooks module", async () => {
    const mod = await import("../hooks/use-frontend-tool");
    expect(mod.useFrontendTool).toBeDefined();
    expect(typeof mod.useFrontendTool).toBe("function");
  });

  it("should export useCapabilities from hooks module", async () => {
    const mod = await import("../hooks/use-capabilities");
    expect(mod.useCapabilities).toBeDefined();
    expect(typeof mod.useCapabilities).toBe("function");
  });

  it("should export useSuggestions from hooks module", async () => {
    const mod = await import("../hooks/use-suggestions");
    expect(mod.useSuggestions).toBeDefined();
    expect(typeof mod.useSuggestions).toBe("function");
  });

  it("should export useConfigureSuggestions from hooks module", async () => {
    const mod = await import("../hooks/use-configure-suggestions");
    expect(mod.useConfigureSuggestions).toBeDefined();
    expect(typeof mod.useConfigureSuggestions).toBe("function");
  });

  it("should export useThreads from hooks module", async () => {
    const mod = await import("../hooks/use-threads");
    expect(mod.useThreads).toBeDefined();
    expect(typeof mod.useThreads).toBe("function");
  });

  it("should export useInterrupt from hooks module", async () => {
    const mod = await import("../hooks/use-interrupt");
    expect(mod.useInterrupt).toBeDefined();
    expect(typeof mod.useInterrupt).toBe("function");
  });

  it("should export useHumanInTheLoop from hooks module", async () => {
    const mod = await import("../hooks/use-human-in-the-loop");
    expect(mod.useHumanInTheLoop).toBeDefined();
    expect(typeof mod.useHumanInTheLoop).toBe("function");
  });

  it("should export useAttachments from hooks module", async () => {
    const mod = await import("../hooks/use-attachments");
    expect(mod.useAttachments).toBeDefined();
    expect(typeof mod.useAttachments).toBe("function");
  });

  // ---- Barrel re-exports (hooks index) ----
  it("should re-export all hooks from hooks/index", async () => {
    const mod = await import("../hooks/index");
    expect(mod.useCopilotContext).toBeDefined();
    expect(mod.requireCore).toBeDefined();
    expect(mod.useCopilotReadable).toBeDefined();
    expect(mod.useCopilotAction).toBeDefined();
    expect(mod.useCopilotChat).toBeDefined();
    // v2 API
    expect(mod.useAgent).toBeDefined();
    expect(mod.useAgentContext).toBeDefined();
    expect(mod.useFrontendTool).toBeDefined();
    expect(mod.useCapabilities).toBeDefined();
    expect(mod.useSuggestions).toBeDefined();
    expect(mod.useConfigureSuggestions).toBeDefined();
    expect(mod.useThreads).toBeDefined();
    expect(mod.useInterrupt).toBeDefined();
    expect(mod.useHumanInTheLoop).toBeDefined();
    expect(mod.useAttachments).toBeDefined();
  });

  // ---- Barrel re-exports (context index) ----
  it("should re-export CopilotKitContextId from context/index", async () => {
    const mod = await import("../context/index");
    expect(mod.CopilotKitContextId).toBeDefined();
  });
});
