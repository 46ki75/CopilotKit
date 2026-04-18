import { describe, it, expect } from "vitest";
import type {
  CopilotKitConfig,
} from "../context/copilot-context";
import type { DocumentPointer } from "../types/document-pointer";
import type {
  FrontendAction,
  FrontendActionAvailability,
} from "../types/frontend-action";
import type { UseCopilotReadableOptions } from "../hooks/use-copilot-readable";
import type {
  UseCopilotChatOptions,
} from "../hooks/use-copilot-chat";
import type { CopilotChatProps } from "../components/copilot-chat";
import type {
  InterruptEvent,
  InterruptHandlerProps,
  InterruptRenderProps,
} from "../types/interrupt";
import type { SandboxFunction } from "../types/sandbox-function";
import type {
  CopilotChatLabels,
} from "../context/copilot-chat-configuration-context";

/**
 * Type-level tests that verify exported interfaces compile correctly.
 * These tests act as a compile-time contract: if any interface changes
 * in a breaking way the tests will fail to compile.
 */
describe("Type interfaces", () => {
  it("CopilotKitConfig should accept valid config", () => {
    const config: CopilotKitConfig = {
      runtimeUrl: "https://example.com",
      headers: { Authorization: "Bearer token" },
      credentials: "include",
      properties: { userId: "123" },
    };
    expect(config.runtimeUrl).toBe("https://example.com");
  });

  it("CopilotKitConfig should accept minimal config", () => {
    const config: CopilotKitConfig = {};
    expect(config).toBeDefined();
  });

  it("DocumentPointer should enforce required fields", () => {
    const doc: DocumentPointer = {
      id: "doc-1",
      name: "My Document",
      getContents: async () => "contents",
    };
    expect(doc.id).toBe("doc-1");
    expect(doc.name).toBe("My Document");
    expect(typeof doc.getContents).toBe("function");
  });

  it("DocumentPointer should accept optional fields", () => {
    const doc: DocumentPointer = {
      id: "doc-2",
      name: "Another Document",
      sourceApplication: "my-app",
      iconImageUri: "https://example.com/icon.png",
      getContents: async () => "content",
    };
    expect(doc.sourceApplication).toBe("my-app");
    expect(doc.iconImageUri).toBe("https://example.com/icon.png");
  });

  it("FrontendActionAvailability should only allow valid values", () => {
    const enabled: FrontendActionAvailability = "enabled";
    const disabled: FrontendActionAvailability = "disabled";
    expect(enabled).toBe("enabled");
    expect(disabled).toBe("disabled");
  });

  it("FrontendAction should accept valid action definition", () => {
    const action: FrontendAction = {
      name: "test-action",
      description: "A test action",
      handler: async () => "result",
      available: "enabled",
    };
    expect(action.name).toBe("test-action");
    expect(typeof action.handler).toBe("function");
  });

  it("FrontendAction should accept minimal definition", () => {
    const action: FrontendAction = {
      name: "minimal",
      handler: () => {},
    };
    expect(action.name).toBe("minimal");
  });

  it("UseCopilotReadableOptions should enforce required fields", () => {
    const options: UseCopilotReadableOptions = {
      description: "Employee list",
      value: [{ name: "Alice" }],
    };
    expect(options.description).toBe("Employee list");
  });

  it("UseCopilotReadableOptions should accept optional convert", () => {
    const options: UseCopilotReadableOptions = {
      description: "Data",
      value: 42,
      available: "disabled",
      convert: (desc, val) => `${desc}: ${String(val)}`,
    };
    expect(options.available).toBe("disabled");
    expect(typeof options.convert).toBe("function");
  });

  it("UseCopilotChatOptions should accept empty options", () => {
    const options: UseCopilotChatOptions = {};
    expect(options).toBeDefined();
  });

  it("UseCopilotChatOptions should accept agent option", () => {
    const options: UseCopilotChatOptions = { agent: "my-agent" };
    expect(options.agent).toBe("my-agent");
  });

  it("CopilotChatProps should accept valid props", () => {
    const props: CopilotChatProps = {
      instructions: "Be helpful",
      placeholder: "Type here...",
      submitLabel: "Go",
      initialMessages: [
        { role: "assistant", content: "Hello!" },
        { role: "user", content: "Hi" },
      ],
    };
    expect(props.instructions).toBe("Be helpful");
    expect(props.initialMessages).toHaveLength(2);
  });

  it("CopilotChatProps should accept minimal props", () => {
    const props: CopilotChatProps = {};
    expect(props).toBeDefined();
  });

  // ---- Interrupt types ----
  it("InterruptEvent should enforce required fields", () => {
    const event: InterruptEvent<string> = {
      name: "on_interrupt",
      value: "approval needed",
    };
    expect(event.name).toBe("on_interrupt");
    expect(event.value).toBe("approval needed");
  });

  it("InterruptHandlerProps should include event and resolve", () => {
    const props: InterruptHandlerProps<{ question: string }> = {
      event: { name: "on_interrupt", value: { question: "Approve?" } },
      resolve: () => {},
    };
    expect(props.event.name).toBe("on_interrupt");
    expect(typeof props.resolve).toBe("function");
  });

  it("InterruptRenderProps should include event, result, and resolve", () => {
    const props: InterruptRenderProps<string, { label: string }> = {
      event: { name: "on_interrupt", value: "test" },
      result: { label: "Test" },
      resolve: () => {},
    };
    expect(props.event.value).toBe("test");
    expect(props.result.label).toBe("Test");
    expect(typeof props.resolve).toBe("function");
  });

  // ---- v2 types ----
  it("SandboxFunction should enforce required fields", () => {
    const fn: SandboxFunction = {
      name: "calculate",
      description: "Calculates a result",
      parameters: {} as any,
      handler: async () => 42,
    };
    expect(fn.name).toBe("calculate");
    expect(fn.description).toBe("Calculates a result");
    expect(typeof fn.handler).toBe("function");
  });

  it("CopilotChatLabels should have expected keys", () => {
    const labels: Partial<CopilotChatLabels> = {
      chatInputPlaceholder: "Ask me anything...",
      modalHeaderTitle: "My Chat",
    };
    expect(labels.chatInputPlaceholder).toBe("Ask me anything...");
    expect(labels.modalHeaderTitle).toBe("My Chat");
  });
});
