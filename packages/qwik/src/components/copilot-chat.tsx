import {
  component$,
  useContext,
  useSignal,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import { CopilotKitContextId } from "../context/copilot-context";

/**
 * Props for the CopilotChat component.
 */
export interface CopilotChatProps {
  /**
   * Instructions for the Copilot to follow.
   */
  instructions?: string;

  /**
   * Placeholder text for the chat input.
   */
  placeholder?: string;

  /**
   * Label text for the submit button.
   */
  submitLabel?: string;

  /**
   * Initial messages to display in the chat.
   */
  initialMessages?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * A basic chat UI component for interacting with the CopilotKit AI. This is
 * the Qwik equivalent of the React `CopilotChat` component.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$ } from "@builder.io/qwik";
 * import { CopilotKit, CopilotChat } from "@copilotkit/qwik";
 *
 * export default component$(() => {
 *   return (
 *     <CopilotKit runtimeUrl="/api/copilotkit">
 *       <CopilotChat
 *         instructions="You are a helpful assistant."
 *         placeholder="Type a message..."
 *       />
 *     </CopilotKit>
 *   );
 * });
 * ```
 */
export const CopilotChat = component$<CopilotChatProps>((props) => {
  const ctx = useContext(CopilotKitContextId);
  const messages = useSignal<ChatMessage[]>(props.initialMessages ?? []);
  const input = useSignal("");
  const isLoading = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => props.instructions);

    const core = ctx.coreRef.value;
    if (!core) return;

    if (props.instructions) {
      core.addContext({
        description: "System instructions",
        value: props.instructions,
      });
    }
  });

  const handleSubmit = $(async () => {
    const userMessage = input.value.trim();
    if (!userMessage || isLoading.value) return;

    messages.value = [
      ...messages.value,
      { role: "user" as const, content: userMessage },
    ];
    input.value = "";
    isLoading.value = true;

    try {
      const core = ctx.coreRef.value;
      if (!core) return;

      const agents = core.agents;
      const agentIds = Object.keys(agents);
      const firstAgentId = agentIds[0];

      if (firstAgentId !== undefined) {
        const agent = agents[firstAgentId];
        if (agent) {
          await core.runAgent({ agent });
        }
      }
    } finally {
      isLoading.value = false;
    }
  });

  return (
    <div
      data-copilotkit
      data-testid="copilot-chat"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          flex: "1",
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.value.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#999",
                textTransform: "capitalize",
              }}
            >
              {msg.role === "user" ? "You" : "Assistant"}
            </span>
            <p
              style={{
                margin: "0",
                padding: "8px 12px",
                borderRadius: "12px",
                maxWidth: "80%",
                background: msg.role === "user" ? "#333" : "#f0f0f0",
                color: msg.role === "user" ? "white" : "#333",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              {msg.content}
            </p>
          </div>
        ))}
        {isLoading.value && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: "11px", color: "#999" }}>Assistant</span>
            <p
              style={{
                margin: "0",
                padding: "8px 12px",
                borderRadius: "12px",
                background: "#f0f0f0",
                color: "#999",
                fontSize: "14px",
                fontStyle: "italic",
              }}
            >
              Thinking...
            </p>
          </div>
        )}
      </div>
      <form
        preventdefault:submit
        onSubmit$={handleSubmit}
        style={{
          display: "flex",
          gap: "8px",
          padding: "8px 12px",
          borderTop: "1px solid #e0e0e0",
          background: "white",
        }}
      >
        <input
          type="text"
          placeholder={props.placeholder ?? "Type a message..."}
          value={input.value}
          onInput$={$((e) => {
            input.value = (e.target as HTMLInputElement).value;
          })}
          style={{
            flex: "1",
            border: "1px solid #e0e0e0",
            borderRadius: "12px",
            padding: "8px 12px",
            fontSize: "14px",
            lineHeight: "1.5",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          type="submit"
          disabled={isLoading.value || !input.value.trim()}
          style={{
            background:
              isLoading.value || !input.value.trim() ? "#ccc" : "#333",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor:
              isLoading.value || !input.value.trim()
                ? "not-allowed"
                : "pointer",
            flexShrink: "0",
          }}
        >
          {props.submitLabel ?? "↑"}
        </button>
      </form>
    </div>
  );
});
