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

  // ---- v2 rendering hooks ----
  it("should export useRenderTool from hooks module", async () => {
    const mod = await import("../hooks/use-render-tool");
    expect(mod.useRenderTool).toBeDefined();
    expect(typeof mod.useRenderTool).toBe("function");
  });

  it("should export useRenderToolCall from hooks module", async () => {
    const mod = await import("../hooks/use-render-tool-call");
    expect(mod.useRenderToolCall).toBeDefined();
    expect(typeof mod.useRenderToolCall).toBe("function");
  });

  it("should export useDefaultRenderTool from hooks module", async () => {
    const mod = await import("../hooks/use-default-render-tool");
    expect(mod.useDefaultRenderTool).toBeDefined();
    expect(typeof mod.useDefaultRenderTool).toBe("function");
  });

  it("should export useComponent from hooks module", async () => {
    const mod = await import("../hooks/use-component");
    expect(mod.useComponent).toBeDefined();
    expect(typeof mod.useComponent).toBe("function");
  });

  it("should export useRenderCustomMessages from hooks module", async () => {
    const mod = await import("../hooks/use-render-custom-messages");
    expect(mod.useRenderCustomMessages).toBeDefined();
    expect(typeof mod.useRenderCustomMessages).toBe("function");
  });

  it("should export useRenderActivityMessage from hooks module", async () => {
    const mod = await import("../hooks/use-render-activity-message");
    expect(mod.useRenderActivityMessage).toBeDefined();
    expect(typeof mod.useRenderActivityMessage).toBe("function");
  });

  it("should export useKeyboardHeight from hooks module", async () => {
    const mod = await import("../hooks/use-keyboard-height");
    expect(mod.useKeyboardHeight).toBeDefined();
    expect(typeof mod.useKeyboardHeight).toBe("function");
  });

  // ---- v2 types ----
  it("should export defineToolCallRenderer from types module", async () => {
    const mod = await import("../types/define-tool-call-renderer");
    expect(mod.defineToolCallRenderer).toBeDefined();
    expect(typeof mod.defineToolCallRenderer).toBe("function");
  });

  // ---- v2 lib ----
  it("should export CopilotKitCoreQwik from lib module", async () => {
    const mod = await import("../lib/qwik-core");
    expect(mod.CopilotKitCoreQwik).toBeDefined();
    expect(typeof mod.CopilotKitCoreQwik).toBe("function");
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
    // v2 rendering hooks
    expect(mod.useRenderTool).toBeDefined();
    expect(mod.useRenderToolCall).toBeDefined();
    expect(mod.useDefaultRenderTool).toBeDefined();
    expect(mod.useComponent).toBeDefined();
    expect(mod.useRenderCustomMessages).toBeDefined();
    expect(mod.useRenderActivityMessage).toBeDefined();
    expect(mod.useKeyboardHeight).toBeDefined();
  });

  // ---- Barrel re-exports (context index) ----
  it("should re-export CopilotKitContextId from context/index", async () => {
    const mod = await import("../context/index");
    expect(mod.CopilotKitContextId).toBeDefined();
  });

  it("should re-export CopilotChatConfigurationContextId from context/index", async () => {
    const mod = await import("../context/index");
    expect(mod.CopilotChatConfigurationContextId).toBeDefined();
  });

  it("should re-export CopilotChatDefaultLabels from context/index", async () => {
    const mod = await import("../context/index");
    expect(mod.CopilotChatDefaultLabels).toBeDefined();
    expect(mod.CopilotChatDefaultLabels.chatInputPlaceholder).toBe(
      "Type a message...",
    );
  });

  it("should re-export SandboxFunctionsContextId from context/index", async () => {
    const mod = await import("../context/index");
    expect(mod.SandboxFunctionsContextId).toBeDefined();
  });

  it("should re-export useSandboxFunctions from context/index", async () => {
    const mod = await import("../context/index");
    expect(mod.useSandboxFunctions).toBeDefined();
    expect(typeof mod.useSandboxFunctions).toBe("function");
  });

  // ---- Barrel re-exports (types index) ----
  it("should re-export defineToolCallRenderer from types/index", async () => {
    const mod = await import("../types/index");
    expect(mod.defineToolCallRenderer).toBeDefined();
    expect(typeof mod.defineToolCallRenderer).toBe("function");
  });

  // ---- Barrel re-exports (lib index) ----
  it("should re-export CopilotKitCoreQwik from lib/index", async () => {
    const mod = await import("../lib/index");
    expect(mod.CopilotKitCoreQwik).toBeDefined();
  });

  it("should re-export processPartialHtml from lib/index", async () => {
    const mod = await import("../lib/index");
    expect(mod.processPartialHtml).toBeDefined();
    expect(typeof mod.processPartialHtml).toBe("function");
  });

  it("should re-export extractCompleteStyles from lib/index", async () => {
    const mod = await import("../lib/index");
    expect(mod.extractCompleteStyles).toBeDefined();
    expect(typeof mod.extractCompleteStyles).toBe("function");
  });

  // ---- processPartialHtml ----
  it("processPartialHtml should strip incomplete tags", async () => {
    const { processPartialHtml } = await import("../lib/processPartialHtml");
    const result = processPartialHtml('<div class="foo">hello <span class="ba');
    expect(result).toBe('<div class="foo">hello ');
  });

  it("processPartialHtml should extract body content", async () => {
    const { processPartialHtml } = await import("../lib/processPartialHtml");
    const result = processPartialHtml(
      "<html><head></head><body><p>content</p></body></html>",
    );
    expect(result).toContain("<p>content</p>");
  });

  it("extractCompleteStyles should extract style blocks", async () => {
    const { extractCompleteStyles } = await import("../lib/processPartialHtml");
    const result = extractCompleteStyles(
      "<style>body { color: red; }</style><div>content</div>",
    );
    expect(result).toContain("body { color: red; }");
  });

  // ---- MCP/OpenGenerativeUI exports ----
  // Note: MCPAppsActivityRenderer and OpenGenerativeUIRenderer use component$,
  // so they cannot be imported in plain Vitest without the Qwik build pipeline.
  // Their schemas and types are verified via tsc --noEmit and the build.

  it("should export processPartialHtml from lib/processPartialHtml", async () => {
    const mod = await import("../lib/processPartialHtml");
    expect(mod.processPartialHtml).toBeDefined();
    expect(typeof mod.processPartialHtml).toBe("function");
  });

  it("should export extractCompleteStyles from lib/processPartialHtml", async () => {
    const mod = await import("../lib/processPartialHtml");
    expect(mod.extractCompleteStyles).toBeDefined();
    expect(typeof mod.extractCompleteStyles).toBe("function");
  });
});
